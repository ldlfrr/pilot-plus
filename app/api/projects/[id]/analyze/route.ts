export const runtime = 'nodejs'
export const maxDuration = 120

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient, ANALYSIS_MODEL, PROMPT_VERSION } from '@/lib/ai/client'
import { ANALYSIS_SYSTEM_PROMPT, buildAnalysisUserPrompt } from '@/lib/ai/prompts'
import { getMockAnalysis } from '@/lib/openai/mock'
import { truncateText } from '@/lib/utils/extract'
import type { AnalysisResult } from '@/types'
import { TIER_LIMITS, getUserTier, countUserAnalyses } from '@/lib/subscription'

const DEMO_MODE = process.env.DEMO_MODE === 'true'

interface Params { params: Promise<{ id: string }> }

// Top-level catch: guarantees JSON response even on unexpected crash
export async function POST(_req: Request, { params }: Params) {
  try {
    return await handleAnalyze(params)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[analyze] Unhandled error:', err)
    return NextResponse.json({ error: `Erreur serveur : ${msg}` }, { status: 500 })
  }
}

async function handleAnalyze(params: Params['params']) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })
  }

  // ── Subscription limit check ────────────────────────────────────────────────
  const tier  = await getUserTier(supabase, user.id)
  const limit = tier in TIER_LIMITS ? TIER_LIMITS[tier] : 1

  console.log(`[analyze] user=${user.id} tier=${tier} limit=${limit}`)

  if (limit !== null) {
    const used = await countUserAnalyses(supabase)
    console.log(`[analyze] analyses used=${used} limit=${limit} → ${used >= limit ? 'BLOCKED' : 'allowed'}`)

    if (used >= limit) {
      return NextResponse.json({
        error: tier === 'free'
          ? 'Plan gratuit : 1 analyse incluse. Passez au plan Basic (49€/mois) pour continuer.'
          : `Limite de ${limit} analyses atteinte pour le plan ${tier}. Passez au plan supérieur.`,
        code:        'LIMIT_REACHED',
        upgrade_url: '/subscription',
      }, { status: 402 })
    }
  }
  // ────────────────────────────────────────────────────────────────────────────

  const { count } = await supabase
    .from('project_analyses')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', id)

  const version = (count ?? 0) + 1

  let result: AnalysisResult

  if (DEMO_MODE) {
    // ── Demo mode ──────────────────────────────────────────────────────────────
    await new Promise((r) => setTimeout(r, 1200))
    result = getMockAnalysis(project.name)
  } else {
    // ── Real mode : Anthropic ──────────────────────────────────────────────────
    const { data: files } = await supabase
      .from('project_files')
      .select('filename, extracted_text, extraction_status')
      .eq('project_id', id)
      .eq('extraction_status', 'done')

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Aucun fichier avec texte extrait. Uploadez des PDF/DOCX d'abord." },
        { status: 422 }
      )
    }

    const extractedTexts = files
      .filter((f) => f.extracted_text && f.extracted_text.trim().length > 0)
      .map((f) => `[${f.filename}]\n${truncateText(f.extracted_text!, 30_000)}`)

    if (extractedTexts.length === 0) {
      return NextResponse.json(
        { error: 'Aucun texte exploitable dans les fichiers.' },
        { status: 422 }
      )
    }

    let rawContent: string

    try {
      const message = await getAnthropicClient().messages.create({
        model: ANALYSIS_MODEL,
        max_tokens: 4096,
        temperature: 0.1,
        system: ANALYSIS_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildAnalysisUserPrompt(extractedTexts) }],
      })

      const block = message.content[0]
      if (block.type !== 'text' || !block.text) {
        return NextResponse.json({ error: 'Réponse IA vide' }, { status: 500 })
      }
      rawContent = block.text.trim()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur API Anthropic'
      console.error('[analyze] Anthropic error:', msg)
      return NextResponse.json({ error: `Erreur IA : ${msg}` }, { status: 500 })
    }

    const cleaned = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

    try {
      result = JSON.parse(cleaned) as AnalysisResult
    } catch {
      console.error('[analyze] JSON parse error. Raw:', rawContent.slice(0, 300))
      return NextResponse.json({ error: "La réponse IA n'est pas un JSON valide." }, { status: 500 })
    }

    result.points_cles       = result.points_cles       ?? []
    result.points_rse        = result.points_rse        ?? []
    result.risques           = result.risques           ?? []
    result.details_importants = result.details_importants ?? []
  }

  const { data: analysis, error: insertError } = await supabase
    .from('project_analyses')
    .insert({
      project_id: id,
      version,
      result,
      prompt_version: PROMPT_VERSION,
      model_used: DEMO_MODE ? 'demo' : ANALYSIS_MODEL,
      tokens_used: null,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  await supabase.from('projects').update({ status: 'analyzed' }).eq('id', id)

  return NextResponse.json({ analysis, demo: DEMO_MODE }, { status: 201 })
}
