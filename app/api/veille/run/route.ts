import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BOAMP_API = 'https://www.boamp.fr/api/explore/v2.1/catalog/datasets/boamp/records'

const DEP_LABELS: Record<string, string> = {
  '01':'Ain','02':'Aisne','03':'Allier','06':'Alpes-Maritimes','13':'Bouches-du-Rhône',
  '14':'Calvados','21':'Côte-d\'Or','25':'Doubs','31':'Haute-Garonne','33':'Gironde',
  '34':'Hérault','35':'Ille-et-Vilaine','38':'Isère','44':'Loire-Atlantique','45':'Loiret',
  '49':'Maine-et-Loire','54':'Meurthe-et-Moselle','57':'Moselle','59':'Nord',
  '62':'Pas-de-Calais','63':'Puy-de-Dôme','67':'Bas-Rhin','68':'Haut-Rhin','69':'Rhône',
  '75':'Paris','76':'Seine-Maritime','77':'Seine-et-Marne','78':'Yvelines','83':'Var',
  '84':'Vaucluse','92':'Hauts-de-Seine','93':'Seine-Saint-Denis','94':'Val-de-Marne',
}

interface BoampRecord {
  idweb?: string
  objet?: string
  nomacheteur?: string
  code_departement?: string[]
  datelimitereponse?: string | null
  type_marche_facette?: string[]
  famille_libelle?: string
  dateparution?: string
  nature?: string
}

interface BoampResponse {
  total_count: number
  results: BoampRecord[]
}

async function queryBoamp(
  keywords: string[],
  regions: string[],
  typesMarche: string[],
): Promise<BoampRecord[]> {
  // Build WHERE clauses
  const where: string[] = []

  // Only last 21 days
  const since = new Date(Date.now() - 21 * 86400000).toISOString().slice(0, 10)
  where.push(`dateparution >= "${since}"`)

  // Exclude attribution results — keep only open tenders
  where.push(`nature != "ATTRIBUTION"`)

  // Keyword search — use objet LIKE (q param doesn't filter by content)
  if (keywords.length > 0) {
    const kwClause = keywords
      .map(k => `objet like "%${k.replace(/"/g, '')}%"`)
      .join(' OR ')
    where.push(`(${kwClause})`)
  }

  // Department filter — code_departement is an array field; ODSQL `=` checks containment
  if (regions.length > 0) {
    const depClause = regions.map(r => `code_departement = "${r}"`).join(' OR ')
    where.push(`(${depClause})`)
  }

  // Type de marché
  if (typesMarche.length > 0) {
    const typeClause = typesMarche.map(t => `type_marche_facette = "${t}"`).join(' OR ')
    where.push(`(${typeClause})`)
  }

  const url = new URL(BOAMP_API)
  url.searchParams.set('where', where.join(' AND '))
  url.searchParams.set('order_by', 'dateparution desc')
  url.searchParams.set('limit', '50')
  url.searchParams.set('select', [
    'idweb','objet','nomacheteur','code_departement',
    'datelimitereponse','type_marche_facette','famille_libelle',
    'dateparution','nature',
  ].join(','))

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`BOAMP ${res.status}: ${body.slice(0, 300)}`)
  }

  const json = await res.json() as BoampResponse
  return json.results ?? []
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: settings } = await supabase
    .from('veille_settings').select('*').eq('user_id', user.id).single()

  if (!settings) return NextResponse.json({ error: 'Aucun critère configuré' }, { status: 400 })

  const { data: existing } = await supabase
    .from('projects').select('name').eq('user_id', user.id)
  const existingKeys = new Set((existing ?? []).map(p => p.name.trim().toLowerCase()))

  let records: BoampRecord[] = []
  let fetchError: string | null = null

  try {
    records = await queryBoamp(
      settings.keywords    ?? [],
      settings.regions     ?? [],
      settings.types_marche ?? [],
    )
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Erreur BOAMP'
  }

  let imported = 0, skipped = 0
  const importedProjects: { id: string; name: string }[] = []

  if (!fetchError) {
    for (const r of records) {
      const rawName     = (r.objet ?? '').trim()
      const name        = rawName.slice(0, 200) || 'Consultation sans titre'
      const client      = (r.nomacheteur ?? '').trim().slice(0, 150) || 'Acheteur inconnu'
      const depCode     = (r.code_departement ?? [])[0] ?? ''
      const loc         = depCode ? (DEP_LABELS[depCode] ?? `Dép. ${depCode}`) : 'Non précisé'
      const type        = (r.type_marche_facette ?? [])[0] ?? r.famille_libelle ?? 'Travaux'
      const ref         = (r.idweb ?? '').trim()
      const projectName = ref ? `[${ref}] ${name}` : name

      const key = projectName.toLowerCase()
      if (existingKeys.has(key)) { skipped++; continue }

      let deadline: string | null = null
      if (r.datelimitereponse) {
        try { deadline = new Date(r.datelimitereponse).toISOString().slice(0, 10) }
        catch { /* ignore */ }
      }

      const { data: created, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id, name: projectName, client,
          consultation_type: type, location: loc,
          offer_deadline: deadline, status: 'draft', outcome: 'pending',
        })
        .select('id, name').single()

      if (!error && created) {
        imported++
        existingKeys.add(key)
        importedProjects.push({ id: created.id, name: created.name })
      }
    }
  }

  await supabase.from('veille_runs').insert({
    user_id: user.id, source: 'boamp',
    total_found: records.length, imported, skipped, error: fetchError,
  })
  await supabase.from('veille_settings')
    .update({ last_run_at: new Date().toISOString() })
    .eq('user_id', user.id)

  return NextResponse.json({
    total_found: records.length, imported, skipped,
    error: fetchError, projects: importedProjects,
  })
}
