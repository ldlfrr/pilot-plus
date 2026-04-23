import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateProjectPayload } from '@/types'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ projects })
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
