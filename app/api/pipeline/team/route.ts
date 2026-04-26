import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserTier } from '@/lib/subscription'
import type { PipelineStage, TaskStates } from '@/types'

// ── GET /api/pipeline/team ───────────────────────────────────────────────────
// Enterprise only. Returns all unique projects from all teams the user belongs to.
// Uses the shared pipeline_stage (task_states) — visible to everyone on the team.

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Enterprise gate
  const tier = await getUserTier(supabase, user.id)
  if (tier !== 'enterprise') {
    return NextResponse.json({ error: 'Réservé aux abonnements Entreprise', tier }, { status: 403 })
  }

  // 1. Get all teams the user belongs to
  const { data: memberships } = await supabase
    .from('team_members')
    .select('team_id, role, teams(id, name)')
    .eq('user_id', user.id)

  if (!memberships || memberships.length === 0) {
    return NextResponse.json({ projects: [], teams: [] })
  }

  const teamIds  = memberships.map(m => m.team_id as string)
  const teamMeta: Record<string, { id: string; name: string }> = {}
  for (const m of memberships) {
    const t = (m.teams as unknown) as { id: string; name: string } | null
    if (t) teamMeta[t.id] = t
  }

  // 2. Get all team_projects across those teams
  const { data: teamProjects } = await supabase
    .from('team_projects')
    .select('project_id, team_id')
    .in('team_id', teamIds)

  if (!teamProjects || teamProjects.length === 0) {
    return NextResponse.json({ projects: [], teams: Object.values(teamMeta) })
  }

  // 3. Deduplicate project IDs (a project in multiple teams appears once)
  // Also track which team(s) the project appears in
  const projectTeams: Record<string, string[]> = {}
  for (const tp of teamProjects) {
    const pid = tp.project_id as string
    const tid = tp.team_id as string
    if (!projectTeams[pid]) projectTeams[pid] = []
    projectTeams[pid].push(tid)
  }

  const uniqueProjectIds = Object.keys(projectTeams)

  // 4. Fetch project details
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, client, location, offer_deadline, outcome, task_states, user_id')
    .in('id', uniqueProjectIds)
    .neq('outcome', 'archived')

  if (!projects || projects.length === 0) {
    return NextResponse.json({ projects: [], teams: Object.values(teamMeta) })
  }

  // 5. Fetch latest scores
  const { data: scores } = await supabase
    .from('project_scores')
    .select('project_id, total_score, verdict, created_at')
    .in('project_id', uniqueProjectIds)
    .order('created_at', { ascending: false })

  const latestScore: Record<string, { total_score: number; verdict: string }> = {}
  for (const s of scores ?? []) {
    if (!latestScore[s.project_id as string]) {
      latestScore[s.project_id as string] = { total_score: s.total_score as number, verdict: s.verdict as string }
    }
  }

  const result = projects.map(p => {
    const ts = (p.task_states ?? {}) as TaskStates
    return {
      id:             p.id,
      name:           p.name,
      client:         p.client,
      location:       p.location,
      offer_deadline: p.offer_deadline,
      outcome:        p.outcome,
      pipeline_stage: (ts.pipeline_stage ?? 'prospection') as PipelineStage,
      is_owner:       p.user_id === user.id,
      teams:          (projectTeams[p.id as string] ?? []).map(tid => teamMeta[tid]?.name ?? tid),
      score:          latestScore[p.id as string]?.total_score ?? null,
      verdict:        latestScore[p.id as string]?.verdict ?? null,
      chiffrage_montant: ts.chiffrage?.montant ?? null,
    }
  })

  return NextResponse.json({ projects: result, teams: Object.values(teamMeta) })
}

// ── PATCH /api/pipeline/team ─────────────────────────────────────────────────
// Enterprise only. Updates the SHARED pipeline_stage for a project.
// Body: { projectId: string, stage: PipelineStage }
// This updates task_states for everyone on the team.

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const tier = await getUserTier(supabase, user.id)
  if (tier !== 'enterprise') {
    return NextResponse.json({ error: 'Réservé aux abonnements Entreprise' }, { status: 403 })
  }

  const { projectId, stage } = await req.json() as { projectId: string; stage: PipelineStage }
  if (!projectId || !stage) return NextResponse.json({ error: 'projectId et stage requis' }, { status: 400 })

  // Verify the user has access to this project via a team
  const { data: teamProjectRow } = await supabase
    .from('team_projects')
    .select('id')
    .eq('project_id', projectId)
    .limit(1)
    .maybeSingle()

  if (!teamProjectRow) return NextResponse.json({ error: 'Projet non accessible via équipe' }, { status: 403 })

  // Update the shared pipeline_stage via task_states JSONB merge
  const { data: proj } = await supabase
    .from('projects')
    .select('task_states')
    .eq('id', projectId)
    .single()

  const ts = ((proj?.task_states ?? {}) as TaskStates)
  const updated = { ...ts, pipeline_stage: stage }

  const { error } = await supabase
    .from('projects')
    .update({ task_states: updated })
    .eq('id', projectId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
