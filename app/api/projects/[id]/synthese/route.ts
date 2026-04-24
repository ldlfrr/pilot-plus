import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data } = await supabase
    .from('project_syntheses')
    .select('*')
    .eq('project_id', id)
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ synthese: data ?? null })
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Verify project ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (!project) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })

  const body = await req.json()

  const { data, error: upsertError } = await supabase
    .from('project_syntheses')
    .upsert({ ...body, project_id: id, user_id: user.id }, { onConflict: 'project_id' })
    .select()
    .single()

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 })
  return NextResponse.json({ synthese: data })
}
