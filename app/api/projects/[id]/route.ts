import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UpdateProjectPayload } from '@/types'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !project) {
    return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })
  }

  // Fetch files, latest analysis and latest score in parallel
  const [filesResult, analysesResult, scoresResult] = await Promise.all([
    supabase
      .from('project_files')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('project_analyses')
      .select('*')
      .eq('project_id', id)
      .order('version', { ascending: false }),
    supabase
      .from('project_scores')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .limit(1),
  ])

  return NextResponse.json({
    project,
    files: filesResult.data ?? [],
    analyses: analysesResult.data ?? [],
    score: scoresResult.data?.[0] ?? null,
  })
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body: UpdateProjectPayload = await request.json()

  const updates: Record<string, unknown> = {}
  if (body.name) updates.name = body.name.trim()
  if (body.client) updates.client = body.client.trim()
  if (body.consultation_type) updates.consultation_type = body.consultation_type
  if (body.location) updates.location = body.location.trim()
  if ('offer_deadline' in body) updates.offer_deadline = body.offer_deadline || null
  if (body.status) updates.status = body.status

  const { data: project, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !project) {
    return NextResponse.json({ error: 'Mise à jour impossible' }, { status: 500 })
  }

  return NextResponse.json({ project })
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // Delete storage files first
  const { data: files } = await supabase
    .from('project_files')
    .select('storage_path')
    .eq('project_id', id)

  if (files && files.length > 0) {
    await supabase.storage
      .from('dce-files')
      .remove(files.map((f) => f.storage_path))
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
