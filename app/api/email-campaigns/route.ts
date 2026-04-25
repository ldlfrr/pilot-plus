import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/ai/client'

interface EmailEntry {
  email: string
  company?: string
  name?: string
}

interface GenerateRequest {
  emails: EmailEntry[]
  context: string        // what the campaign is about
  senderName: string     // your company name
  tone: 'professional' | 'friendly' | 'direct'
}

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body: GenerateRequest = await req.json()
    const { emails, context, senderName, tone = 'professional' } = body

    if (!emails?.length || !context?.trim() || !senderName?.trim()) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    if (emails.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 emails par campagne' }, { status: 400 })
    }

    const anthropic = getAnthropicClient()

    const toneDesc = {
      professional: 'professionnel, formel et soigné',
      friendly:     'chaleureux, accessible et humain',
      direct:       'direct, concis et orienté résultat',
    }[tone]

    // Generate all emails in a single call for efficiency
    const emailListStr = emails
      .map((e, i) => {
        const domain = e.email.split('@')[1] ?? ''
        const companyGuess = e.company || domain.replace(/\.(fr|com|net|org|io|eu)$/, '').replace(/[-_]/g, ' ')
        const nameGuess = e.name || ''
        return `${i + 1}. Email: ${e.email} | Entreprise: ${companyGuess || '?'} | Contact: ${nameGuess || '?'}`
      })
      .join('\n')

    const prompt = `Tu es un expert en prospection B2B. Génère ${emails.length} emails de prospection personnalisés.

EXPÉDITEUR: ${senderName}
CONTEXTE DE LA CAMPAGNE: ${context}
TON SOUHAITÉ: ${toneDesc}

LISTE DES DESTINATAIRES:
${emailListStr}

INSTRUCTIONS:
- Pour chaque destinataire, génère un email de prospection personnalisé
- Utilise le nom de l'entreprise (déduit du domaine email si nécessaire) pour personnaliser le message
- L'email doit être court (150-200 mots max), percutant et avec un appel à l'action clair
- Si le prénom est disponible, utilise-le, sinon utilise "Madame, Monsieur"
- Adapte légèrement le message à chaque entreprise
- Réponds UNIQUEMENT en JSON valide avec ce format exact:

{
  "results": [
    {
      "email": "adresse@exemple.com",
      "subject": "Objet de l'email",
      "body": "Corps de l'email en texte brut avec sauts de ligne \\n"
    }
  ]
}`

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Réponse IA invalide' }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0]) as { results: { email: string; subject: string; body: string }[] }

    return NextResponse.json({ results: parsed.results })
  } catch (err) {
    console.error('[email-campaigns]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
