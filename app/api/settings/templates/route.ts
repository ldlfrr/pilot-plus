import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CompanyCriteria } from '@/types'

export interface CriteriaTemplate {
  id: string
  name: string
  description: string
  criteria: CompanyCriteria
  created_at: string
}

// GET — list templates
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data } = await supabase
    .from('company_settings')
    .select('criteria_templates')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ templates: (data?.criteria_templates as CriteriaTemplate[]) ?? [] })
}

// POST — save current criteria as new template
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { name, description, criteria } = await req.json() as {
    name: string; description: string; criteria: CompanyCriteria
  }
  if (!name?.trim()) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })

  // Get existing templates
  const { data: existing } = await supabase
    .from('company_settings')
    .select('criteria_templates')
    .eq('user_id', user.id)
    .single()

  const templates: CriteriaTemplate[] = (existing?.criteria_templates as CriteriaTemplate[]) ?? []

  const newTemplate: CriteriaTemplate = {
    id: crypto.randomUUID(),
    name: name.trim(),
    description: description?.trim() ?? '',
    criteria,
    created_at: new Date().toISOString(),
  }

  templates.push(newTemplate)

  await supabase.from('company_settings')
    .upsert({ user_id: user.id, criteria_templates: templates }, { onConflict: 'user_id' })

  return NextResponse.json({ template: newTemplate }, { status: 201 })
}

// DELETE — remove template by id
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await req.json() as { id: string }

  const { data: existing } = await supabase
    .from('company_settings')
    .select('criteria_templates')
    .eq('user_id', user.id)
    .single()

  const templates = ((existing?.criteria_templates as CriteriaTemplate[]) ?? []).filter(t => t.id !== id)

  await supabase.from('company_settings')
    .upsert({ user_id: user.id, criteria_templates: templates }, { onConflict: 'user_id' })

  return NextResponse.json({ ok: true })
}
