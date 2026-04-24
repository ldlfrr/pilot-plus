import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface VeilleResult {
  id: string
  idweb: string | null
  name: string
  client: string
  location: string
  consultation_type: string
  offer_deadline: string | null
  dateparution: string | null
  status: 'pending' | 'imported' | 'dismissed'
  project_id: string | null
  created_at: string
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('veille_results')
    .select('id, idweb, name, client, location, consultation_type, offer_deadline, dateparution, status, project_id, created_at')
    .eq('user_id', user.id)
    .in('status', ['pending', 'imported'])
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ results: data ?? [] })
}
