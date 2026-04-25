import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ─── GET — list projects shared with a team ───────────────────────────────────

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const teamId = new URL(req.url).searchParams.get('teamId')
  if (!teamId) return NextResponse.json({ error: 'teamId requis' }, { status: 400 })

  // Verify the caller is a member of this team
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) return NextResponse.json({ error: 'Non membre de cette équipe' }, { status: 403 })

  // Fetch team_projects with project details
  const { data: rows, error } = await supabase
    .from('team_projects')
    .select('id, created_at, project_id, shared_by')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!rows || rows.length === 0) return NextResponse.json({ projects: [] })

  const projectIds = rows.map(r => r.project_id as string)
  const sharerIds  = [...new Set(rows.map(r => r.shared_by as string))]

  // Fetch projects
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, client, location, offer_deadline, status, outcome, task_states, user_id')
    .in('id', projectIds)

  // Fetch latest scores
  const { data: scores } = await supabase
    .from('project_scores')
    .select('project_id, total_score, verdict, created_at')
    .in('project_id', projectIds)
    .order('created_at', { ascending: false })

  // Keep only the latest score per project
  const latestScore: Record<string, { total_score: number; verdict: string }> = {}
  for (const s of scores ?? []) {
    if (!latestScore[s.project_id as string]) {
      latestScore[s.project_id as string] = { total_score: s.total_score as number, verdict: s.verdict as string }
    }
  }

  // Fetch sharer profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', sharerIds)

  const profileMap: Record<string, { full_name: string | null; email: string }> = {}
  for (const p of profiles ?? []) {
    profileMap[p.id] = { full_name: p.full_name, email: p.email }
  }

  // Check which projects the current user is already a member of
  const { data: myMemberships } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', user.id)
    .in('project_id', projectIds)

  const myMemberSet = new Set((myMemberships ?? []).map(m => m.project_id as string))

  const projectMap = Object.fromEntries((projects ?? []).map(p => [p.id, p]))

  const result = rows.map(row => {
    const proj    = projectMap[row.project_id as string]
    const sharer  = profileMap[row.shared_by as string]
    const ts      = (proj?.task_states ?? {}) as { pipeline_stage?: string }
    const score   = latestScore[row.project_id as string] ?? null
    const isOwner = proj?.user_id === user.id
    const isMember = myMemberSet.has(row.project_id as string)

    return {
      team_project_id: row.id,
      shared_at:       row.created_at,
      sharer_name:     sharer?.full_name ?? sharer?.email ?? 'Inconnu',
      is_owner:        isOwner,
      is_member:       isMember,
      project: proj ? {
        id:             proj.id,
        name:           proj.name,
        client:         proj.client,
        location:       proj.location,
        offer_deadline: proj.offer_deadline,
        status:         proj.status,
        outcome:        proj.outcome,
        pipeline_stage: ts.pipeline_stage ?? null,
      } : null,
      score,
    }
  }).filter(r => r.project !== null)

  return NextResponse.json({ projects: result })
}

// ─── POST — share a project with a team ──────────────────────────────────────

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { teamId, projectId } = await req.json() as { teamId: string; projectId: string }
  if (!teamId)    return NextResponse.json({ error: 'teamId requis' }, { status: 400 })
  if (!projectId) return NextResponse.json({ error: 'projectId requis' }, { status: 400 })

  // Verify ownership of the project
  const { data: proj } = await supabase
    .from('projects')
    .select('id, name, user_id')
    .eq('id', projectId)
    .single()

  if (!proj)               return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })
  if (proj.user_id !== user.id)
    return NextResponse.json({ error: 'Seul le propriétaire peut partager ce projet' }, { status: 403 })

  // Verify membership in the team
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) return NextResponse.json({ error: 'Vous n\'êtes pas membre de cette équipe' }, { status: 403 })

  const { data, error } = await supabase
    .from('team_projects')
    .insert({ team_id: teamId, project_id: projectId, shared_by: user.id })
    .select()
    .single()

  if (error) {
    if (error.code === '23505')
      return NextResponse.json({ error: 'Ce projet est déjà partagé avec cette équipe' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 })
}

// ─── DELETE — unshare a project from a team ──────────────────────────────────

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { teamProjectId } = await req.json() as { teamProjectId: string }
  if (!teamProjectId) return NextResponse.json({ error: 'teamProjectId requis' }, { status: 400 })

  const { error } = await supabase
    .from('team_projects')
    .delete()
    .eq('id', teamProjectId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
