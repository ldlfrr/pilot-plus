import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── BOAMP OpenDataSoft API ────────────────────────────────────────────────────
const BOAMP_API = 'https://www.boamp.fr/api/explore/v2.1/catalog/datasets/boamp/records'

interface BoampRecord {
  fields?: {
    idweb?: string
    nomacheteur?: string
    objet?: string
    libelledepartement?: string
    codedepartement?: string
    datelimitereponse?: string
    montant?: number | null
    typemarche?: string
    reference?: string
    dateparution?: string
  }
  record_timestamp?: string
}

interface BoampResponse {
  total_count: number
  results: BoampRecord[]
}

async function queryBoamp(
  keywords: string[],
  regions: string[],
  typesMarche: string[],
  montantMin: number,
  montantMax: number,
): Promise<BoampRecord[]> {
  const conditions: string[] = []

  // Keywords — search in objet and nomacheteur
  if (keywords.length > 0) {
    const kw = keywords.map(k => `search(objet,"${k.replace(/"/g,'')}")`).join(' or ')
    conditions.push(`(${kw})`)
  }

  // Regions (department codes)
  if (regions.length > 0) {
    const dep = regions.map(r => `codedepartement="${r}"`).join(' or ')
    conditions.push(`(${dep})`)
  }

  // Types
  if (typesMarche.length > 0) {
    const types = typesMarche.map(t => `typemarche="${t}"`).join(' or ')
    conditions.push(`(${types})`)
  }

  // Amount filter (only if set > 0)
  if (montantMin > 0) conditions.push(`montant>=${montantMin}`)
  if (montantMax < 5000000) conditions.push(`montant<=${montantMax}`)

  // Only recent notices (last 14 days)
  const since = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10)
  conditions.push(`dateparution>="${since}"`)

  const where = conditions.length > 0 ? conditions.join(' and ') : 'dateparution>="' + since + '"'

  const url = new URL(BOAMP_API)
  url.searchParams.set('where', where)
  url.searchParams.set('order_by', 'dateparution desc')
  url.searchParams.set('limit', '50')

  const res = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 0 },
  })

  if (!res.ok) throw new Error(`BOAMP API error: ${res.status}`)
  const json = await res.json() as BoampResponse
  return json.results ?? []
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Load settings
  const { data: settings } = await supabase
    .from('veille_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!settings) return NextResponse.json({ error: 'Aucun critère configuré' }, { status: 400 })

  // Load existing project names to avoid duplicates
  const { data: existing } = await supabase
    .from('projects')
    .select('name')
    .eq('user_id', user.id)
  const existingNames = new Set((existing ?? []).map(p => p.name.trim().toLowerCase()))

  let records: BoampRecord[] = []
  let fetchError: string | null = null

  try {
    records = await queryBoamp(
      settings.keywords ?? [],
      settings.regions ?? [],
      settings.types_marche ?? [],
      settings.montant_min ?? 0,
      settings.montant_max ?? 5000000,
    )
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Erreur BOAMP'
  }

  let imported = 0
  let skipped  = 0
  const importedProjects: { id: string; name: string }[] = []

  if (!fetchError && records.length > 0) {
    for (const record of records) {
      const f = record.fields ?? {}

      const name   = (f.objet ?? '').trim().slice(0, 200) || 'Consultation sans titre'
      const client = (f.nomacheteur ?? '').trim().slice(0, 150) || 'Acheteur inconnu'
      const loc    = (f.libelledepartement ?? '').trim() || 'Non précisé'
      const type   = (f.typemarche ?? 'Travaux').trim()
      const ref    = f.reference ?? f.idweb ?? ''

      const dedupKey = `${name} — ${client}`.toLowerCase()

      if (existingNames.has(dedupKey) || existingNames.has(name.toLowerCase())) {
        skipped++
        continue
      }

      // Parse deadline
      let deadline: string | null = null
      if (f.datelimitereponse) {
        try {
          deadline = new Date(f.datelimitereponse).toISOString().slice(0, 10)
        } catch { /* ignore */ }
      }

      const { data: created, error } = await supabase
        .from('projects')
        .insert({
          user_id:          user.id,
          name:             ref ? `[${ref}] ${name}` : name,
          client,
          consultation_type: type,
          location:         loc,
          offer_deadline:   deadline,
          status:           'draft',
          outcome:          'pending',
        })
        .select('id, name')
        .single()

      if (!error && created) {
        imported++
        existingNames.add(dedupKey)
        existingNames.add(name.toLowerCase())
        importedProjects.push({ id: created.id, name: created.name })
      }
    }
  }

  // Log the run
  await supabase.from('veille_runs').insert({
    user_id:     user.id,
    source:      'boamp',
    total_found: records.length,
    imported,
    skipped,
    error:       fetchError,
  })

  // Update last_run_at
  await supabase.from('veille_settings')
    .update({ last_run_at: new Date().toISOString() })
    .eq('user_id', user.id)

  return NextResponse.json({
    total_found: records.length,
    imported,
    skipped,
    error: fetchError,
    projects: importedProjects,
  })
}
