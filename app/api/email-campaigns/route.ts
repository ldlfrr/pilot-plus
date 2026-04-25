import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserTier, checkFeatureGate } from '@/lib/subscription'
import { getAnthropicClient } from '@/lib/ai/client'

export interface EmailEntry {
  email: string
  company?: string
  name?: string
}

export interface GeneratedEmail {
  email:        string
  subject:      string
  subjectB?:    string   // A/B variant
  body:         string
  followUp?:    string   // J+3 follow-up body
  qualityScore: number   // 0-100
}

interface GenerateRequest {
  emails:          EmailEntry[]
  context:         string
  senderName:      string
  tone:            'professional' | 'friendly' | 'direct' | 'urgent' | 'storytelling'
  language:        'fr' | 'en'
  abSubject:       boolean
  includeFollowUp: boolean
}

const TONE_MAP = {
  professional: { fr: 'professionnel et formel, ton soigné et courtois',          en: 'professional and formal, polished and courteous' },
  friendly:     { fr: 'chaleureux et humain, proche et accessible',               en: 'warm and human, approachable and personal' },
  direct:       { fr: 'direct et percutant, concis orienté résultat',              en: 'direct and punchy, concise and results-oriented' },
  urgent:       { fr: 'urgent et incitatif, crée un sentiment d\'opportunité rare', en: 'urgent and compelling, creates FOMO and opportunity sense' },
  storytelling: { fr: 'narratif et accrocheur, commence par une micro-histoire ou analogie', en: 'narrative and engaging, opens with a micro-story or analogy' },
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const tier = await getUserTier(supabase, user.id)
    const gate = checkFeatureGate(tier, 'email_campaigns')
    if (gate) return NextResponse.json(gate, { status: 402 })

    const body: GenerateRequest = await req.json()
    const {
      emails,
      context,
      senderName,
      tone            = 'professional',
      language        = 'fr',
      abSubject       = false,
      includeFollowUp = false,
    } = body

    if (!emails?.length || !context?.trim() || !senderName?.trim()) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }
    if (emails.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 emails par campagne' }, { status: 400 })
    }

    const toneDesc = TONE_MAP[tone]?.[language] ?? TONE_MAP.professional[language]

    const emailListStr = emails.map((e, i) => {
      const domain      = e.email.split('@')[1] ?? ''
      const companyName = e.company || domain.replace(/\.(fr|com|net|org|io|eu|co\.uk)$/, '').replace(/[-_.]/g, ' ').trim()
      return `${i + 1}. email=${e.email} | entreprise=${companyName || '?'} | contact=${e.name || '?'} | domaine=${domain}`
    }).join('\n')

    const lang = language === 'fr' ? 'French' : 'English'

    const abInstruction = abSubject
      ? `- "subjectB": a second alternative subject line (different angle, same email)`
      : ''
    const followUpInstruction = includeFollowUp
      ? `- "followUp": a short follow-up email body (70-100 words) to send 3 days later if no reply`
      : ''

    const qualityInstruction = `- "qualityScore": integer 0-100 measuring personalization depth (higher = more personalized to this specific company/contact)`

    const prompt = `You are a world-class B2B sales copywriter. Generate ${emails.length} highly personalized cold outreach emails in ${lang}.

SENDER: ${senderName}
CAMPAIGN CONTEXT: ${context}
TONE: ${toneDesc}
LANGUAGE: Write all emails in ${lang}

RECIPIENTS:
${emailListStr}

RULES:
- Each email must be 130-200 words max — short, punchy, respectful of the reader's time
- Personalize to the company/contact using their domain and name signals
- Use the contact's first name if available, otherwise use a polite salutation
- Include a clear, single call-to-action
- No generic filler — every sentence must earn its place
- Sign with: ${senderName}${abSubject ? '\n- Generate 2 distinct subject lines per email (different angle/hook)' : ''}${includeFollowUp ? '\n- Generate a short follow-up for each email (J+3, reference the first email, add one new value point)' : ''}

RESPOND with ONLY valid JSON (no markdown, no commentary):
{
  "results": [
    {
      "email": "exact email address",
      "subject": "Main subject line",
      ${abSubject ? '"subjectB": "Alternative subject line",' : ''}
      "body": "Full email body with \\n for line breaks",
      ${includeFollowUp ? '"followUp": "Follow-up body with \\n for line breaks",' : ''}
      "qualityScore": 85
    }
  ]
}`

    const anthropic = getAnthropicClient()
    const response  = await anthropic.messages.create({
      model:      'claude-opus-4-5',
      max_tokens: abSubject || includeFollowUp ? 6000 : 4096,
      messages:   [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Strip potential markdown code fence
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[email-campaigns] No JSON found in response:', text.slice(0, 300))
      return NextResponse.json({ error: 'Réponse IA invalide — réessayez' }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0]) as { results: GeneratedEmail[] }

    // Ensure qualityScore exists on each result
    const results: GeneratedEmail[] = parsed.results.map(r => ({
      ...r,
      qualityScore: r.qualityScore ?? 70,
    }))

    return NextResponse.json({ results })
  } catch (err) {
    console.error('[email-campaigns]', err)
    return NextResponse.json({ error: 'Erreur serveur — réessayez' }, { status: 500 })
  }
}
