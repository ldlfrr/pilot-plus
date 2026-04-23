import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CompanyCriteria } from '@/types'
import { DEFAULT_CRITERIA } from '@/types'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data } = await supabase
    .from('company_settings')
    .select('criteria')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({
    criteria: (data?.criteria as CompanyCriteria) ?? DEFAULT_CRITERIA,
  })
}

export async function PUT(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await request.json()
  const criteria: CompanyCriteria = body.criteria

  if (!criteria || typeof criteria !== 'object') {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  }

  // Upsert
  const { data, error } = await supabase
    .from('company_settings')
    .upsert(
      { user_id: user.id, criteria },
      { onConflict: 'user_id' }
    )
    .select('criteria')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ criteria: data.criteria })
}
