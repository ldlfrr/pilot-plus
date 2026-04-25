import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserTier, checkFeatureGate } from '@/lib/subscription'
import { getAnthropicClient } from '@/lib/ai/client'
import type { TaskStates } from '@/types'

interface Params { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const tier = await getUserTier(supabase, user.id)
    const gate = checkFeatureGate(tier, 'response_plan')
    if (gate) return NextResponse.json(gate, { status: 402 })

    // Load project + analysis
    const [{ data: project }, { data: analyses }, { data: profile }] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).eq('user_id', user.id).single(),
      supabase.from('project_analyses').select('result').eq('project_id', id).order('created_at', { ascending: false }).limit(1),
      supabase.from('profiles').select('company, description_courte').eq('id', user.id).single(),
    ])

    if (!project) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })

    const analysis = analyses?.[0]?.result
    if (!analysis) return NextResponse.json({ error: 'Lancez d\'abord l\'analyse IA' }, { status: 400 })

    const company     = profile?.company     ?? 'Notre entreprise'
    const description = (profile as { description_courte?: string } | null)?.description_courte ?? ''

    const prompt = `Tu es un expert en réponse aux appels d'offres publics. Génère une trame de mémoire technique complète et professionnelle pour ce projet.

PROJET : ${project.name}
CLIENT : ${project.client}
LOCALISATION : ${project.location}
CONTEXTE : ${analysis.contexte ?? analysis.resume_executif ?? ''}
BESOIN CLIENT : ${analysis.besoin_client ?? ''}
POINTS CLÉS : ${(analysis.points_cles ?? []).join(', ')}
RISQUES : ${(analysis.risques ?? []).join(', ')}
SPÉCIFICITÉS TECHNIQUES : ${JSON.stringify(analysis.specificites ?? {})}
NOTRE ENTREPRISE : ${company}
${description ? `NOTRE PROFIL : ${description}` : ''}

Génère une trame structurée de mémoire technique avec les sections suivantes :
1. Présentation de l'entreprise répondante
2. Compréhension du besoin et des enjeux
3. Méthodologie et organisation du chantier
4. Moyens humains et matériels
5. Planning prévisionnel
6. Gestion des risques et mesures préventives
7. Références similaires
8. Valeur ajoutée et différenciation

Pour chaque section : fournir 3-5 phrases rédigées basées sur le contexte, avec des [PLACEHOLDER] là où des données spécifiques doivent être remplies.

Formate en Markdown clair avec des titres ##, des listes à puces, et des zones [À COMPLÉTER : description].
Longueur totale : 600-900 mots.`

    const anthropic = getAnthropicClient()
    const response  = await anthropic.messages.create({
      model:      'claude-opus-4-5',
      max_tokens: 3000,
      messages:   [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Persist to task_states
    const { data: projectForStates } = await supabase
      .from('projects')
      .select('task_states')
      .eq('id', id)
      .single()

    const current = (projectForStates?.task_states ?? { pieces: {}, actions: {} }) as TaskStates
    await supabase
      .from('projects')
      .update({ task_states: { ...current, memoire_technique: text } })
      .eq('id', id)

    return NextResponse.json({ memoire_technique: text })
  } catch (err) {
    console.error('[memoire-technique]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
