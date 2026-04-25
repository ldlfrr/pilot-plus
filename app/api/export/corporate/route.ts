export const runtime = 'nodejs'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserTier, TIER_LIMITS, countUserAnalyses } from '@/lib/subscription'
import { getAnthropicClient } from '@/lib/ai/client'
import { renderToBuffer } from '@react-pdf/renderer'
import { CorporatePDF } from '@/components/pdf/CorporatePDF'
import React from 'react'

// Only enterprise / lifetime can generate corporate briefs
const CORPORATE_TIERS = new Set(['enterprise', 'lifetime'])

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    // ── Tier gate (enterprise / lifetime only) ─────────────────────────────────
    const tier = await getUserTier(supabase, user.id)
    if (!CORPORATE_TIERS.has(tier)) {
      return NextResponse.json({
        error: 'Le Corporate Brief est réservé au plan Entreprise (499 €/mois).',
        code: 'FEATURE_GATED',
        upgrade_url: '/subscription',
      }, { status: 402 })
    }

    // ── Quota check (counts as 1 AI request) ──────────────────────────────────
    const limit = TIER_LIMITS[tier] ?? null
    if (limit !== null) {
      const used = await countUserAnalyses(supabase)
      if (used >= limit) {
        return NextResponse.json({
          error: `Limite de ${limit} analyses atteinte. Passez au plan supérieur.`,
          code: 'LIMIT_REACHED',
          upgrade_url: '/subscription',
        }, { status: 402 })
      }
    }

    const { projectId } = await req.json() as { projectId: string }
    if (!projectId) return NextResponse.json({ error: 'projectId requis' }, { status: 400 })

    // ── Load data ─────────────────────────────────────────────────────────────
    const [projectRes, analysisRes, scoreRes, profileRes] = await Promise.all([
      supabase.from('projects')
        .select('id, name, client, location, offer_deadline, consultation_type')
        .eq('id', projectId).eq('user_id', user.id).single(),
      supabase.from('project_analyses')
        .select('result').eq('project_id', projectId)
        .order('version', { ascending: false }).limit(1).single(),
      supabase.from('project_scores')
        .select('total_score, verdict')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('profiles').select('company').eq('id', user.id).single(),
    ])

    if (!projectRes.data) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })
    if (!analysisRes.data) return NextResponse.json({ error: 'Aucune analyse disponible — lancez d\'abord l\'analyse IA.' }, { status: 422 })

    const project  = projectRes.data
    const analysis = analysisRes.data.result as Record<string, unknown>
    const score    = scoreRes.data as { total_score: number; verdict: 'GO' | 'NO_GO' | 'A_ETUDIER' } | null

    // Extract raw data from analysis
    const rawPoints = (analysis?.points_cles as string[]) ?? []
    const rawRisks  = (analysis?.risques as string[]) ?? (analysis?.points_vigilance as string[]) ?? []
    const rawBudget = (analysis?.budget_estime as string) ?? (analysis?.montant as string) ?? null

    // ── Claude: generate 1-sentence recommendation ────────────────────────────
    const prompt = `Tu es un expert en appels d'offres. Donne UNE SEULE phrase percutante (max 25 mots)
de recommandation pour un directeur commercial sur ce dossier. Sois direct, va à l'essentiel.

Projet: ${project.name} — Client: ${project.client}
Score: ${score?.total_score ?? 'N/A'}/100 — Verdict: ${score?.verdict ?? 'N/A'}
Points clés: ${rawPoints.slice(0, 3).join(' | ')}
Risque principal: ${rawRisks[0] ?? 'Aucun identifié'}

Réponds uniquement avec la phrase de recommandation, sans guillemets.`

    let recommendation = 'Dossier à examiner en équipe avant toute décision d\'engagement.'
    try {
      const msg = await getAnthropicClient().messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 80,
        messages: [{ role: 'user', content: prompt }],
      })
      const txt = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
      if (txt) recommendation = txt
    } catch {
      // use fallback
    }

    // ── Build PDF ─────────────────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(
      React.createElement(CorporatePDF, {
        project,
        score,
        keyPoints:      rawPoints.slice(0, 3),
        mainRisk:       rawRisks[0] ?? null,
        budget:         rawBudget,
        recommendation,
        generatedAt:    new Date().toISOString(),
        userCompany:    (profileRes.data as { company?: string })?.company ?? undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any
    )

    const slug = project.name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)
    const date = new Date().toISOString().slice(0, 10)

    return new Response(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="Brief_Corporate_${slug}_${date}.pdf"`,
      },
    })
  } catch (err) {
    console.error('[export/corporate]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
