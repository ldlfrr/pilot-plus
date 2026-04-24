export const runtime = 'nodejs'
export const maxDuration = 30

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { SynthesePDFDocument } from '@/components/pdf/SynthesePDF'
import React from 'react'

interface Params { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Load project
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, client, location, offer_deadline')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })

  // Load synthese data
  const { data: synthese } = await supabase
    .from('project_syntheses')
    .select('*')
    .eq('project_id', id)
    .eq('user_id', user.id)
    .single()

  // Load latest analysis for extra context
  const { data: analyses } = await supabase
    .from('project_analyses')
    .select('result')
    .eq('project_id', id)
    .order('created_at', { ascending: false })
    .limit(1)

  const analysis = analyses?.[0]?.result as Record<string, unknown> | undefined

  // Load score
  const { data: score } = await supabase
    .from('project_scores')
    .select('total_score, verdict')
    .eq('project_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(
    React.createElement(SynthesePDFDocument, {
      synthese:          synthese ?? {},
      project:           project,
      score:             score ?? null,
      analysisPoints:    (analysis?.points_cles as string[]) ?? [],
      analysisVigilance: (analysis?.points_vigilance as string[]) ?? (analysis?.risques as string[]) ?? [],
      analysisResume:    (analysis?.resume_executif as string) ?? (analysis?.contexte as string) ?? undefined,
    }) as any
  )

  const projectName = (synthese?.nom_projet_synthese || project.name || 'synthese').replace(/[^a-zA-Z0-9-_]/g, '_')
  const filename    = `Synthese_${projectName}_${new Date().toISOString().slice(0, 10)}.pdf`

  return new Response(pdfBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
