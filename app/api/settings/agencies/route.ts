export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export interface Agency {
  id: string
  name: string
  address: string
  lat: number
  lng: number
}

/** GET — list all company agencies */
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const admin = await createServiceClient()
  const { data } = await admin
    .from('company_settings')
    .select('agencies')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ agencies: (data?.agencies ?? []) as Agency[] })
}

/** PUT — replace all agencies */
export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { agencies } = await request.json() as { agencies: Agency[] }

  const admin = await createServiceClient()
  const { error: upsertError } = await admin
    .from('company_settings')
    .upsert(
      { user_id: user.id, agencies },
      { onConflict: 'user_id' }
    )

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 })
  return NextResponse.json({ agencies })
}
