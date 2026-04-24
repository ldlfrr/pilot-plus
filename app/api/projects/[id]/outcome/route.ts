import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ id: string }> }

const VALID_OUTCOMES = ['pending', 'won', 'lost', 'abandoned'] as const
type Outcome = typeof VALID_OUTCOMES[number]

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Verify ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (!project) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })

  const body = await req.json() as Record<string, unknown>
  const outcome = body.outcome as Outcome
  if (!VALID_OUTCOMES.includes(outcome)) {
    return NextResponse.json({ error: 'Outcome invalide' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {
    outcome,
    closed_at: outcome !== 'pending' ? new Date().toISOString() : null,
  }
  if (typeof body.loss_reason === 'string') updates.loss_reason = body.loss_reason || null
  if (typeof body.ca_amount === 'number' && body.ca_amount > 0) updates.ca_amount = body.ca_amount
  else if (outcome !== 'won') updates.ca_amount = null

  const { error } = await supabase.from('projects').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
