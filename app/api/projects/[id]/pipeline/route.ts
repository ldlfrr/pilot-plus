import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { TaskStates, PipelineStage, Intervenant, ChiffrageData, ChecklistRemise } from '@/types'

interface Params { params: Promise<{ id: string }> }

interface PipelinePatchBody {
  pipeline_stage?:                 PipelineStage
  intervenants?:                   Intervenant[]
  chiffrage?:                      ChiffrageData
  checklist?:                      ChecklistRemise
  memoire_technique?:              string
  brief_avant_vente_generated_at?: string
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id, task_states')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })
    }

    const body: PipelinePatchBody = await req.json()

    const current = (project.task_states ?? { pieces: {}, actions: {} }) as TaskStates

    // Merge only the provided pipeline fields
    const updated: TaskStates = { ...current }

    if (body.pipeline_stage !== undefined) updated.pipeline_stage = body.pipeline_stage
    if (body.intervenants    !== undefined) updated.intervenants   = body.intervenants
    if (body.chiffrage       !== undefined) updated.chiffrage      = body.chiffrage
    if (body.checklist       !== undefined) updated.checklist      = body.checklist
    if (body.memoire_technique !== undefined) updated.memoire_technique = body.memoire_technique
    if (body.brief_avant_vente_generated_at !== undefined) {
      updated.brief_avant_vente_generated_at = body.brief_avant_vente_generated_at
    }

    const { error } = await supabase
      .from('projects')
      .update({ task_states: updated })
      .eq('id', id)

    if (error) {
      console.warn('[pipeline] Update failed:', error.message)
    }

    return NextResponse.json({ ok: true, task_states: updated })
  } catch (err) {
    console.error('[pipeline]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(req: Request, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id, task_states')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })
    }

    const ts = (project.task_states ?? {}) as TaskStates
    return NextResponse.json({
      pipeline_stage:                 ts.pipeline_stage,
      intervenants:                   ts.intervenants   ?? [],
      chiffrage:                      ts.chiffrage      ?? null,
      checklist:                      ts.checklist      ?? null,
      memoire_technique:              ts.memoire_technique,
      brief_avant_vente_generated_at: ts.brief_avant_vente_generated_at,
    })
  } catch (err) {
    console.error('[pipeline GET]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
