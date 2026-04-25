export const runtime = 'nodejs'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient, SCORING_MODEL } from '@/lib/ai/client'
import { buildScoringSystemPrompt, buildScoringUserPrompt, type ScoringContext } from '@/lib/ai/prompts'
import { getMockScore } from '@/lib/openai/mock'
import type { ScoringResult, CompanyCriteria } from '@/types'
import { getUserTier } from '@/lib/subscription'

const DEMO_MODE = process.env.DEMO_MODE === 'true'

interface Params { params: Promise<{ id: string }> }

// Top-level catch: guarantees JSON response even on unexpected crash
export async function POST(_req: Request, { params }: Params) {
  try {
    return await handleScore(params)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[score] Unhandled error:', err)
    return NextResponse.json({ error: `Erreur serveur : ${msg}` }, { status: 500 })
  }
}

async function handleScore(params: Params['params']) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })
  }

  // ── Subscription tier check ─────────────────────────────────────────────────
  const tier = await getUserTier(supabase, user.id)
  console.log(`[score] user=${user.id} tier=${tier}`)

  if (tier === 'free') {
    return NextResponse.json({
      error: 'Le scoring Go/No Go est disponible à partir du plan Basic (49€/mois).',
      code:        'LIMIT_REACHED',
      upgrade_url: '/subscription',
    }, { status: 402 })
  }
  // ────────────────────────────────────────────────────────────────────────────

  // Latest analysis
  const { data: analysis } = await supabase
    .from('project_analyses')
    .select('*')
    .eq('project_id', id)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  if (!analysis) {
    return NextResponse.json(
      { error: "Aucune analyse disponible. Lancez d'abord l'analyse IA." },
      { status: 422 }
    )
  }

  // Load company settings (criteria or imported document)
  let scoringContext: ScoringContext = { mode: 'form', criteria: null }
  try {
    const { data: settingsRow } = await supabase
      .from('company_settings')
      .select('criteria, settings_mode, company_document_text')
      .eq('user_id', user.id)
      .single()

    if (settingsRow?.settings_mode === 'document' && settingsRow?.company_document_text) {
      scoringContext = { mode: 'document', documentText: settingsRow.company_document_text }
    } else {
      scoringContext = {
        mode: 'form',
        criteria: (settingsRow?.criteria as CompanyCriteria) ?? null,
      }
    }
  } catch {
    // Table might not exist yet — scoring still works without company profile
  }

  const criteria = scoringContext.mode === 'form' ? scoringContext.criteria : null

  let scoringResult: ScoringResult

  if (DEMO_MODE) {
    // ── Demo mode ──────────────────────────────────────────────────────────────
    await new Promise((r) => setTimeout(r, 800))
    scoringResult = getMockScore()
  } else {
    // ── Real mode : Anthropic ──────────────────────────────────────────────────
    if (!analysis.result) {
      return NextResponse.json(
        { error: "L'analyse IA ne contient pas de résultat. Relancez l'analyse avant de scorer." },
        { status: 422 }
      )
    }

    let rawContent: string

    try {
      let userPrompt: string
      try {
        userPrompt = buildScoringUserPrompt(analysis.result, scoringContext)
      } catch (promptErr: unknown) {
        const msg = promptErr instanceof Error ? promptErr.message : String(promptErr)
        console.error('[score] Error building prompt:', msg)
        return NextResponse.json({ error: `Erreur construction du prompt : ${msg}` }, { status: 500 })
      }

      const message = await getAnthropicClient().messages.create({
        model: SCORING_MODEL,
        max_tokens: 2048,
        temperature: 0.2,
        system: buildScoringSystemPrompt(),
        messages: [
          { role: 'user', content: userPrompt },
        ],
      })

      const block = message.content[0]
      if (block.type !== 'text' || !block.text) {
        return NextResponse.json({ error: 'Réponse IA vide' }, { status: 500 })
      }
      rawContent = block.text.trim()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur API Anthropic'
      console.error('[score] Anthropic error:', msg)
      return NextResponse.json({ error: `Erreur IA : ${msg}` }, { status: 500 })
    }

    const cleaned = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

    try {
      scoringResult = JSON.parse(cleaned) as ScoringResult
    } catch {
      console.error('[score] JSON parse error. Raw:', rawContent.slice(0, 300))
      return NextResponse.json({ error: "La réponse IA n'est pas un JSON valide." }, { status: 500 })
    }

    // Recalculate with weighted criteria
    if (criteria) {
      const d = scoringResult.score_details
      const sumPoids =
        criteria.poids_rentabilite + criteria.poids_complexite +
        criteria.poids_alignement + criteria.poids_probabilite +
        criteria.poids_charge
      const weighted =
        d.rentabilite.score * criteria.poids_rentabilite +
        d.complexite.score * criteria.poids_complexite +
        d.alignement_capacite.score * criteria.poids_alignement +
        d.probabilite_gain.score * criteria.poids_probabilite +
        d.charge_interne.score * criteria.poids_charge

      scoringResult.total_score = Math.round((weighted / (sumPoids * 20)) * 100)
    }
  }

  // Enforce verdict
  const total = scoringResult.total_score
  scoringResult.verdict = total >= 80 ? 'GO' : total >= 50 ? 'A_ETUDIER' : 'NO_GO'

  await supabase.from('project_scores').delete().eq('project_id', id)

  const { data: score, error: insertError } = await supabase
    .from('project_scores')
    .insert({
      project_id: id,
      analysis_id: analysis.id,
      score_details: scoringResult.score_details,
      total_score: scoringResult.total_score,
      verdict: scoringResult.verdict,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  await supabase.from('projects').update({ status: 'scored' }).eq('id', id)

  return NextResponse.json(
    {
      score,
      criteria_used: scoringContext.mode === 'form' && !!criteria,
      company_doc_used: scoringContext.mode === 'document',
      demo: DEMO_MODE,
    },
    { status: 201 }
  )
}
