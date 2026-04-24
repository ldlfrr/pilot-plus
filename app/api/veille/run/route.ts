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

// Loose type — we don't control what BOAMP returns
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoampRecord = Record<string, any>

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

  const whereStr = where.join(' AND ')

  // NOTE: no `select=` param — let BOAMP return its default fields to avoid
  // "Unknown field" errors that differ between dataset versions.
  const finalUrl = (
    `${BOAMP_API}`
    + `?where=${encodeURIComponent(whereStr).replace(/%25/g, '%')}`
    + `&order_by=dateparution%20desc`
    + `&limit=50`
  )

  const res = await fetch(finalUrl, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`BOAMP ${res.status}: ${body.slice(0, 400)}`)
  }

  const json = await res.json() as BoampResponse
  return json.results ?? []
}

export async function POST() {
  // Top-level guard: always return JSON, never crash the response stream
  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: settings } = await supabase
      .from('veille_settings').select('*').eq('user_id', user.id).single()
    if (!settings) return NextResponse.json({ error: 'Aucun critère configuré' }, { status: 400 })

    // Existing idweb/names — dedup
    const { data: existingRows } = await supabase
      .from('veille_results')
      .select('idweb, name')
      .eq('user_id', user.id)

    const existingIdwebs = new Set((existingRows ?? []).map((r: { idweb: string }) => r.idweb).filter(Boolean))
    const existingNames  = new Set((existingRows ?? []).map((r: { name: string }) => r.name.trim().toLowerCase()))

    let records: BoampRecord[] = []
    let fetchError: string | null = null

    try {
      records = await queryBoamp(
        settings.keywords     ?? [],
        settings.regions      ?? [],
        settings.types_marche ?? [],
      )
    } catch (err) {
      fetchError = err instanceof Error ? err.message : 'Erreur BOAMP inconnue'
    }

    // Create the run record
    const { data: runRecord } = await supabase
      .from('veille_runs')
      .insert({
        user_id: user.id,
        total_found: records.length,
        imported: 0,
        skipped: 0,
        error: fetchError,
      })
      .select('id')
      .single()

    const runId = runRecord?.id ?? null

    let added = 0, skipped = 0

    if (!fetchError) {
      for (const r of records) {
        const idweb   = String(r.idweb ?? '').trim() || null
        const rawName = String(r.objet ?? '').trim()
        const name    = rawName.slice(0, 200) || 'Consultation sans titre'

        if (idweb && existingIdwebs.has(idweb))              { skipped++; continue }
        if (!idweb && existingNames.has(name.toLowerCase())) { skipped++; continue }

        const client  = String(r.nomacheteur ?? '').trim().slice(0, 150) || 'Acheteur inconnu'
        const depCode = Array.isArray(r.code_departement) ? (r.code_departement[0] ?? '') : String(r.code_departement ?? '')
        const loc     = depCode ? (DEP_LABELS[depCode] ?? `Dép. ${depCode}`) : 'Non précisé'
        const type    = Array.isArray(r.type_marche_facette)
          ? (r.type_marche_facette[0] ?? r.famille_libelle ?? 'Travaux')
          : String(r.famille_libelle ?? 'Travaux')

        let deadline: string | null = null
        if (r.datelimitereponse) {
          try { deadline = new Date(String(r.datelimitereponse)).toISOString().slice(0, 10) } catch { /* */ }
        }
        let parution: string | null = null
        if (r.dateparution) {
          try { parution = new Date(String(r.dateparution)).toISOString().slice(0, 10) } catch { /* */ }
        }

        const sourceUrl   = idweb ? `https://www.boamp.fr/avis/detail/${idweb}` : null
        const description = String(r.descripteur_libelle ?? '').trim() || null

        // Insert — ignore column errors gracefully
        const insertPayload: Record<string, unknown> = {
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
        }

        // Optionally include extended columns if migration 017 was applied
        // (Supabase will silently reject the insert if the columns don't exist)
        try {
          const { error: insertErr } = await supabase
            .from('veille_results')
            .insert({ ...insertPayload, source_url: sourceUrl, description, montant_estime: null, procedure_type: null })

          if (!insertErr) {
            added++
            if (idweb) existingIdwebs.add(idweb)
            existingNames.add(name.toLowerCase())
            continue
          }
          // Fall through to base insert if extended columns failed
        } catch { /* */ }

        // Fallback insert without extended columns
        const { error: baseErr } = await supabase.from('veille_results').insert(insertPayload)
        if (!baseErr) {
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

  } catch (fatal) {
    // Absolute last resort — ensures the client always receives valid JSON
    console.error('[veille/run] fatal:', fatal)
    return NextResponse.json(
      { error: fatal instanceof Error ? fatal.message : 'Erreur serveur inattendue' },
      { status: 500 },
    )
  }
}
