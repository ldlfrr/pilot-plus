export const runtime = 'nodejs'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient, SCORING_MODEL } from '@/lib/ai/client'
import { buildScoringSystemPrompt, buildScoringUserPrompt } from '@/lib/ai/prompts'
import { getMockScore } from '@/lib/openai/mock'
import type { ScoringResult, CompanyCriteria } from '@/types'
import { TIER_LIMITS } from '@/app/api/user/limits/route'

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
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  const tier: string = (profile as { subscription_tier?: string })?.subscription_tier ?? 'free'

  // Free tier cannot score at all
  if (tier === 'free') {
    return NextResponse.json({
      error: 'Le scoring Go/No Go est disponible à partir du plan Basic (49€/mois).',
      code: 'LIMIT_REACHED',
      upgrade_url: '/subscription',
    }, { status: 402 })
  }

  // Paid tier: check analysis count limit
  const limit = TIER_LIMITS[tier] ?? 1
  if (limit !== null) {
    const { data: userProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)

    const projectIds = [...new Set([...(userProjects?.map(p => p.id) ?? []), id])]

    const { count: totalAnalyses } = await supabase
      .from('project_analyses')
      .select('id', { count: 'exact', head: true })
      .in('project_id', projectIds)

    if ((totalAnalyses ?? limit) > limit) {
      return NextResponse.json({
        error: `Limite de ${limit} analyses atteinte. Passez au plan supérieur.`,
        code: 'LIMIT_REACHED',
        upgrade_url: '/subscription',
      }, { status: 402 })
    }
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

  // Load company criteria (silently ignore if table missing)
  let criteria: CompanyCriteria | null = null
  try {
    const { data: settingsRow } = await supabase
      .from('company_settings')
      .select('criteria')
      .eq('user_id', user.id)
      .single()
    criteria = (settingsRow?.criteria as CompanyCriteria) ?? null
  } catch {
    // Table might not exist yet — scoring still works without criteria
  }

  let scoringResult: ScoringResult

  if (DEMO_MODE) {
    // ── Demo mode ──────────────────────────────────────────────────────────────
    await new Promise((r) => setTimeout(r, 800))
    scoringResult = getMockScore()
  } else {
    // ── Real mode : Anthropic ──────────────────────────────────────────────────
    let rawContent: string

    try {
      const message = await getAnthropicClient().messages.create({
        model: SCORING_MODEL,
        max_tokens: 2048,
        temperature: 0.2,
        system: buildScoringSystemPrompt(),
        messages: [
          { role: 'user', content: buildScoringUserPrompt(analysis.result, criteria) },
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
    { score, criteria_used: !!criteria, demo: DEMO_MODE },
    { status: 201 }
  )
}
