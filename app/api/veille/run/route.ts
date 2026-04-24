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
  const where: string[] = []

  const since = new Date(Date.now() - 21 * 86400000).toISOString().slice(0, 10)
  where.push(`dateparution >= "${since}"`)
  where.push(`nature != "ATTRIBUTION"`)

  if (keywords.length > 0) {
    const kwClause = keywords
      .map(k => `objet like "%${k.replace(/"/g, '')}%"`)
      .join(' OR ')
    where.push(`(${kwClause})`)
  }

  if (regions.length > 0) {
    const depClause = regions.map(r => `code_departement = "${r}"`).join(' OR ')
    where.push(`(${depClause})`)
  }

  if (typesMarche.length > 0) {
    const typeClause = typesMarche.map(t => `type_marche_facette = "${t}"`).join(' OR ')
    where.push(`(${typeClause})`)
  }

  const whereStr  = where.join(' AND ')
  const selectStr = 'idweb,objet,nomacheteur,code_departement,datelimitereponse,type_marche_facette,famille_libelle,dateparution,nature'
  const finalUrl  = `${BOAMP_API}?where=${encodeURIComponent(whereStr).replace(/%25/g, '%')}&order_by=dateparution%20desc&limit=50&select=${selectStr}`

  const res = await fetch(finalUrl, { headers: { Accept: 'application/json' }, cache: 'no-store' })
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

  // Existing idweb already stored (any status) — skip duplicates
  const { data: existingRows } = await supabase
    .from('veille_results')
    .select('idweb, name')
    .eq('user_id', user.id)

  const existingIdwebs = new Set((existingRows ?? []).map(r => r.idweb).filter(Boolean))
  const existingNames  = new Set((existingRows ?? []).map(r => r.name.trim().toLowerCase()))

  let records: BoampRecord[] = []
  let fetchError: string | null = null

  try {
    records = await queryBoamp(
      settings.keywords     ?? [],
      settings.regions      ?? [],
      settings.types_marche ?? [],
    )
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Erreur BOAMP'
  }

  // Create the run record
  const { data: runRecord } = await supabase
    .from('veille_runs')
    .insert({
      user_id: user.id, source: 'boamp',
      total_found: records.length, imported: 0, skipped: 0, error: fetchError,
    })
    .select('id').single()

  const runId = runRecord?.id ?? null

  let added = 0, skipped = 0

  if (!fetchError) {
    for (const r of records) {
      const idweb  = (r.idweb ?? '').trim() || null
      const rawName = (r.objet ?? '').trim()
      const name    = rawName.slice(0, 200) || 'Consultation sans titre'

      // Deduplicate: by idweb first, then by name
      if (idweb && existingIdwebs.has(idweb)) { skipped++; continue }
      if (!idweb && existingNames.has(name.toLowerCase())) { skipped++; continue }

      const client = (r.nomacheteur ?? '').trim().slice(0, 150) || 'Acheteur inconnu'
      const depCode = (r.code_departement ?? [])[0] ?? ''
      const loc     = depCode ? (DEP_LABELS[depCode] ?? `Dép. ${depCode}`) : 'Non précisé'
      const type    = (r.type_marche_facette ?? [])[0] ?? r.famille_libelle ?? 'Travaux'

      let deadline: string | null = null
      if (r.datelimitereponse) {
        try { deadline = new Date(r.datelimitereponse).toISOString().slice(0, 10) } catch { /* */ }
      }
      let parution: string | null = null
      if (r.dateparution) {
        try { parution = new Date(r.dateparution).toISOString().slice(0, 10) } catch { /* */ }
      }

      const { error } = await supabase.from('veille_results').insert({
        user_id: user.id,
        run_id: runId,
        idweb,
        name,
        client,
        location: loc,
        consultation_type: type,
        offer_deadline: deadline,
        dateparution: parution,
        status: 'pending',
      })

      if (!error) {
        added++
        if (idweb) existingIdwebs.add(idweb)
        existingNames.add(name.toLowerCase())
      }
    }

    if (runId) {
      await supabase.from('veille_runs')
        .update({ imported: added, skipped })
        .eq('id', runId)
    }
  }

  await supabase.from('veille_settings')
    .update({ last_run_at: new Date().toISOString() })
    .eq('user_id', user.id)

  return NextResponse.json({
    total_found: records.length,
    added,
    skipped,
    error: fetchError,
  })
}
