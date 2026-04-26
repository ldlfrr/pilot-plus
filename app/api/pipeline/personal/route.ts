import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PipelineStage, TaskStates } from '@/types'

// ── GET /api/pipeline/personal ───────────────────────────────────────────────
// Returns all projects accessible to the user, merged with their personal
// pipeline stage (from user_pipeline_stages). Falls back to the project's
// shared pipeline_stage when no personal stage is set yet.

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // 1. Owned projects
  const { data: ownedProjects } = await supabase
    .from('projects')
    .select('id, name, client, location, offer_deadline, outcome, task_states, user_id')
    .eq('user_id', user.id)
    .neq('outcome', 'archived')
    .order('created_at', { ascending: false })

  // 2. Projects the user is a member of (but not owner)
  const { data: memberships } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', user.id)

  const memberProjectIds = (memberships ?? []).map(m => m.project_id as string)
  const ownedIds = new Set((ownedProjects ?? []).map(p => p.id as string))
  const foreignIds = memberProjectIds.filter(id => !ownedIds.has(id))

  let memberProjects: typeof ownedProjects = []
  if (foreignIds.length > 0) {
    const { data } = await supabase
      .from('projects')
      .select('id, name, client, location, offer_deadline, outcome, task_states, user_id')
      .in('id', foreignIds)
      .neq('outcome', 'archived')
    memberProjects = data ?? []
  }

  const allProjects = [...(ownedProjects ?? []), ...memberProjects]
  if (allProjects.length === 0) return NextResponse.json({ projects: [] })

  const projectIds = allProjects.map(p => p.id as string)

  // 3. Fetch personal pipeline stages
  const { data: personalStages } = await supabase
    .from('user_pipeline_stages')
    .select('project_id, stage')
    .eq('user_id', user.id)
    .in('project_id', projectIds)

  const stageMap: Record<string, PipelineStage> = {}
  for (const row of personalStages ?? []) {
    stageMap[row.project_id as string] = row.stage as PipelineStage
  }

  // 4. Fetch latest scores
  const { data: scores } = await supabase
    .from('project_scores')
    .select('project_id, total_score, verdict, created_at')
    .in('project_id', projectIds)
    .order('created_at', { ascending: false })

  const latestScore: Record<string, { total_score: number; verdict: string }> = {}
  for (const s of scores ?? []) {
    if (!latestScore[s.project_id as string]) {
      latestScore[s.project_id as string] = { total_score: s.total_score as number, verdict: s.verdict as string }
    }
  }

  const result = allProjects.map(p => {
    const ts = (p.task_states ?? {}) as TaskStates
    const sharedStage = (ts.pipeline_stage ?? 'prospection') as PipelineStage
    return {
      id:             p.id,
      name:           p.name,
      client:         p.client,
      location:       p.location,
      offer_deadline: p.offer_deadline,
      outcome:        p.outcome,
      pipeline_stage: stageMap[p.id as string] ?? sharedStage,   // personal stage takes precedence
      shared_stage:   sharedStage,
      is_owner:       p.user_id === user.id,
      score:          latestScore[p.id as string]?.total_score ?? null,
      verdict:        latestScore[p.id as string]?.verdict ?? null,
      chiffrage_montant: ts.chiffrage?.montant ?? null,
    }
  })

  return NextResponse.json({ projects: result })
}

// ── PATCH /api/pipeline/personal ─────────────────────────────────────────────
// Upsert the user's personal pipeline stage for a project.
// Body: { projectId: string, stage: PipelineStage }

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { projectId, stage } = await req.json() as { projectId: string; stage: PipelineStage }
  if (!projectId || !stage) return NextResponse.json({ error: 'projectId et stage requis' }, { status: 400 })

  const { error } = await supabase
    .from('user_pipeline_stages')
    .upsert(
      { user_id: user.id, project_id: projectId, stage, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,project_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
