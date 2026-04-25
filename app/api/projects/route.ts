import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateProjectPayload } from '@/types'

export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // Own projects
  const { data: ownProjects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Projects shared with this user via project_members
  let memberProjects: typeof ownProjects = []
  try {
    const { data: memberships } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user.id)

    if (memberships && memberships.length > 0) {
      const sharedIds = memberships.map((m: { project_id: string }) => m.project_id)
      const { data: shared } = await supabase
        .from('projects')
        .select('*')
        .in('id', sharedIds)
        .order('created_at', { ascending: false })
      memberProjects = shared ?? []
    }
  } catch { /* best-effort */ }

  // Deduplicate and merge
  const ownIds  = new Set((ownProjects ?? []).map((p: { id: string }) => p.id))
  const allProjects = [
    ...(ownProjects ?? []),
    ...(memberProjects ?? []).filter((p: { id: string }) => !ownIds.has(p.id)),
  ].sort((a: { created_at: string }, b: { created_at: string }) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  // Enrich with latest score per project (best-effort)
  try {
    const ids = allProjects.map((p: { id: string }) => p.id)
    if (ids.length > 0) {
      const { data: scores } = await supabase
        .from('project_scores')
        .select('project_id, total_score, verdict, created_at')
        .in('project_id', ids)
        .order('created_at', { ascending: false })

      const latestScore = new Map<string, { total_score: number; verdict: string }>()
      for (const s of (scores ?? [])) {
        if (!latestScore.has(s.project_id)) {
          latestScore.set(s.project_id, { total_score: s.total_score, verdict: s.verdict })
        }
      }

      const enriched = allProjects.map((p: { id: string }) => ({
        ...p,
        score: latestScore.get(p.id) ?? null,
      }))
      return NextResponse.json({ projects: enriched })
    }
  } catch { /* ignore */ }

  return NextResponse.json({ projects: allProjects })
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body: CreateProjectPayload = await request.json()

  if (!body.name?.trim() || !body.client?.trim() || !body.consultation_type || !body.location?.trim()) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
  }

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: body.name.trim(),
      client: body.client.trim(),
      consultation_type: body.consultation_type,
      location: body.location.trim(),
      offer_deadline: body.offer_deadline || null,
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ project }, { status: 201 })
}
