import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserTier, checkFeatureGate } from '@/lib/subscription'
import { getAnthropicClient } from '@/lib/ai/client'

export const maxDuration = 120  // up to 3 batches × ~30s each

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
    const lang     = language === 'fr' ? 'French' : 'English'

    const anthropic = getAnthropicClient()

    // ── Batch processing to avoid token limits ─────────────────────────────────
    // Each email needs ~350 output tokens. claude-opus-4-5 caps at 8192.
    // We batch into chunks of 15 max and merge results.
    const BATCH_SIZE = 15
    const allResults: GeneratedEmail[] = []

    const batches: EmailEntry[][] = []
    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      batches.push(emails.slice(i, i + BATCH_SIZE))
    }

    for (const batch of batches) {
      const batchListStr = batch.map((e, i) => {
        const domain      = e.email.split('@')[1] ?? ''
        const companyName = e.company || domain.replace(/\.(fr|com|net|org|io|eu|co\.uk)$/, '').replace(/[-_.]/g, ' ').trim()
        return `${i + 1}. email=${e.email} | entreprise=${companyName || '?'} | contact=${e.name || '?'} | domaine=${domain}`
      }).join('\n')

      const batchPrompt = `You are a world-class B2B sales copywriter. Generate ${batch.length} highly personalized cold outreach emails in ${lang}.

SENDER: ${senderName}
CAMPAIGN CONTEXT: ${context}
TONE: ${toneDesc}
LANGUAGE: Write all emails in ${lang}

RECIPIENTS:
${batchListStr}

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

      // Calculate token budget: ~380 tokens per email + overhead
      const tokensNeeded = batch.length * 380 + 500
      const maxTokens    = Math.min(8192, Math.max(tokensNeeded, 2048))

      const response = await anthropic.messages.create({
        model:      'claude-opus-4-5',
        max_tokens: maxTokens,
        messages:   [{ role: 'user', content: batchPrompt }],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''

      // Strip potential markdown code fence
      const cleaned  = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.error('[email-campaigns] No JSON in batch response:', text.slice(0, 300))
        return NextResponse.json({ error: 'Réponse IA invalide — réessayez' }, { status: 500 })
      }

      let parsed: { results: GeneratedEmail[] }
      try {
        parsed = JSON.parse(jsonMatch[0]) as { results: GeneratedEmail[] }
      } catch (parseErr) {
        console.error('[email-campaigns] JSON parse error:', parseErr)
        return NextResponse.json({ error: 'Réponse IA invalide — réessayez' }, { status: 500 })
      }

      const batchResults = parsed.results.map(r => ({
        ...r,
        qualityScore: r.qualityScore ?? 70,
      }))

      allResults.push(...batchResults)
    }

    return NextResponse.json({ results: allResults })
  } catch (err) {
    console.error('[email-campaigns]', err)
    return NextResponse.json({ error: 'Erreur serveur — réessayez' }, { status: 500 })
  }
}
