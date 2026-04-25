import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserTier, checkFeatureGate } from '@/lib/subscription'
import { getAnthropicClient } from '@/lib/ai/client'
import { renderToBuffer } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import { BriefAvantVentePDF } from '@/components/pdf/BriefAvantVentePDF'
import React, { type ReactElement, type JSXElementConstructor } from 'react'
import type { TaskStates } from '@/types'

interface Params { params: Promise<{ id: string }> }

function daysUntil(deadline: string | null): number | null {
  if (!deadline) return null
  const diff = new Date(deadline).getTime() - Date.now()
  return Math.ceil(diff / 86_400_000)
}

export async function POST(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const tier = await getUserTier(supabase, user.id)
    const gate = checkFeatureGate(tier, 'brief_avant_vente')
    if (gate) return NextResponse.json(gate, { status: 402 })

    const [
      { data: project },
      { data: analyses },
      { data: scores },
      { data: profile },
    ] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).eq('user_id', user.id).single(),
      supabase.from('project_analyses').select('result').eq('project_id', id).order('created_at', { ascending: false }).limit(1),
      supabase.from('project_scores').select('total_score, verdict').eq('project_id', id).order('created_at', { ascending: false }).limit(1),
      supabase.from('profiles').select('company, description_courte').eq('id', user.id).single(),
    ])

    if (!project) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })
    if (!analyses?.length) return NextResponse.json({ error: 'Lancez d\'abord l\'analyse IA' }, { status: 400 })

    const analysis = analyses[0].result
    const score    = scores?.[0] ?? null
    const ts       = (project.task_states ?? {}) as TaskStates
    const company  = profile?.company ?? 'PILOT+'

    const keyPoints = (analysis.points_cles ?? []) as string[]
    const risks     = (analysis.risques ?? []) as string[]
    const summary   = (analysis.resume_executif ?? analysis.contexte ?? '') as string
    const budget    = (analysis.budget_estime ?? analysis.montant ?? '') as string

    // Generate brief AI instruction for avant-vente
    const anthropic = getAnthropicClient()
    const aiRes = await anthropic.messages.create({
      model:      'claude-haiku-4-5',
      max_tokens: 250,
      messages: [{
        role:    'user',
        content: `Rédigez en 3 phrases concises l'instruction pour l'équipe avant-vente sur ce projet d'appel d'offres :
Projet: ${project.name}
Client: ${project.client}
Contexte: ${summary.slice(0, 400)}
Points clés: ${keyPoints.slice(0, 3).join(', ')}
Risques: ${risks.slice(0, 2).join(', ')}
Score: ${score?.total_score ?? 'N/A'}/100
Deadline: ${project.offer_deadline ?? 'Non précisée'}

L'instruction doit préciser : ce qu'il faut chiffrer en priorité, les points techniques à clarifier, et le délai impératif.`,
      }],
    })

    const instruction = aiRes.content[0].type === 'text' ? aiRes.content[0].text : ''

    const daysLeft = daysUntil(project.offer_deadline)

    const pdfProps = {
      projectName:   project.name,
      client:        project.client,
      location:      project.location,
      offerDeadline: project.offer_deadline,
      daysLeft,
      summary,
      keyPoints,
      risks,
      intervenants:  (ts.intervenants ?? []) as Array<{ role: string; name: string; email?: string }>,
      score:         score?.total_score ?? null,
      verdict:       score?.verdict     ?? null,
      budget,
      chiffrage:     ts.chiffrage ?? null,
      instruction,
      userCompany:   company,
      generatedAt:   new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    }

    const element = React.createElement(BriefAvantVentePDF, pdfProps) as unknown as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>
    const buffer  = await renderToBuffer(element)

    // Mark as generated in task_states
    await supabase
      .from('projects')
      .update({ task_states: { ...ts, brief_avant_vente_generated_at: new Date().toISOString() } })
      .eq('id', id)

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="Brief_AvantVente_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
      },
    })
  } catch (err) {
    console.error('[brief-avant-vente]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
