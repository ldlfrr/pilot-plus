export const runtime = 'nodejs'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient, SCORING_MODEL } from '@/lib/ai/client'
import { RESPONSE_PLAN_SYSTEM_PROMPT, buildResponsePlanUserPrompt } from '@/lib/ai/prompts'
import type { CompanyCriteria } from '@/types'

interface Params { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    // Verify project ownership
    const { data: project } = await supabase
      .from('projects').select('id').eq('id', id).eq('user_id', user.id).single()
    if (!project) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })

    // Get latest analysis
    const { data: analysis } = await supabase
      .from('project_analyses').select('result').eq('project_id', id)
      .order('version', { ascending: false }).limit(1).single()
    if (!analysis) return NextResponse.json({ error: 'Aucune analyse disponible — lancez d\'abord l\'analyse IA.' }, { status: 422 })

    // Get company criteria (optional)
    let criteria: CompanyCriteria | null = null
    try {
      const { data: settings } = await supabase
        .from('company_settings').select('criteria').eq('user_id', user.id).single()
      criteria = (settings?.criteria as CompanyCriteria) ?? null
    } catch { /* optional */ }

    // Call Claude
    const message = await getAnthropicClient().messages.create({
      model: SCORING_MODEL,
      max_tokens: 3000,
      temperature: 0.3,
      system: RESPONSE_PLAN_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildResponsePlanUserPrompt(analysis.result, criteria) }],
    })

    const block = message.content[0]
    if (block.type !== 'text') return NextResponse.json({ error: 'Réponse IA vide' }, { status: 500 })

    const cleaned = block.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const plan = JSON.parse(cleaned)

    return NextResponse.json({ plan }, { status: 200 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[response-plan] error:', msg)
    return NextResponse.json({ error: `Erreur : ${msg}` }, { status: 500 })
  }
}
