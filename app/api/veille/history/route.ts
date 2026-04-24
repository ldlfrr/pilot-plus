import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface VeilleResultItem {
  id: string
  idweb: string | null
  name: string
  client: string
  location: string
  consultation_type: string
  offer_deadline: string | null
  dateparution: string | null
  source_url: string | null
  description: string | null
  montant_estime: string | null
  procedure_type: string | null
  status: 'pending' | 'imported' | 'dismissed'
  project_id: string | null
}

export interface VeilleRunGroup {
  id: string
  run_at: string
  total_found: number
  added: number
  skipped: number
  error: string | null
  results: VeilleResultItem[]
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch all runs
  const { data: runs, error } = await supabase
    .from('veille_runs')
    .select('id, run_at, total_found, imported, skipped, error')
    .eq('user_id', user.id)
    .order('run_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const runIds = (runs ?? []).map(r => r.id)

  // Fetch all non-dismissed results linked to these runs
  const { data: results } = runIds.length > 0
    ? await supabase
        .from('veille_results')
        .select('id, idweb, name, client, location, consultation_type, offer_deadline, dateparution, source_url, description, montant_estime, procedure_type, status, project_id, run_id')
        .eq('user_id', user.id)
        .in('run_id', runIds)
        .neq('status', 'dismissed')
        .order('created_at', { ascending: false })
    : { data: [] }

  // Group results by run_id
  const byRun = new Map<string, VeilleResultItem[]>()
  for (const r of results ?? []) {
    if (!r.run_id) continue
    if (!byRun.has(r.run_id)) byRun.set(r.run_id, [])
    byRun.get(r.run_id)!.push({
      id: r.id, idweb: r.idweb, name: r.name, client: r.client,
      location: r.location, consultation_type: r.consultation_type,
      offer_deadline: r.offer_deadline, dateparution: r.dateparution,
      source_url: r.source_url, description: r.description,
      montant_estime: r.montant_estime, procedure_type: r.procedure_type,
      status: r.status, project_id: r.project_id,
    })
  }

  const groups: VeilleRunGroup[] = (runs ?? []).map(run => ({
    id: run.id,
    run_at: run.run_at,
    total_found: run.total_found,
    added: run.imported,
    skipped: run.skipped,
    error: run.error,
    results: byRun.get(run.id) ?? [],
  }))

  return NextResponse.json({ groups })
}
