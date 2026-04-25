import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/ai/client'
import * as dns from 'dns/promises'
import * as net from 'net'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ContactInput {
  linkedin_url?: string
  first_name: string
  last_name: string
  company: string
  domain?: string   // override auto-detected domain
}

export interface EnrichedContact {
  first_name: string
  last_name: string
  full_name: string
  company: string
  domain: string | null
  linkedin_url: string | null
  emails: EmailResult[]
  phones: string[]
  job_title: string | null
  siren: string | null
  sources: string[]
  confidence: 'high' | 'medium' | 'low'
  raw_website_emails: string[]
}

interface EmailResult {
  address: string
  pattern: string
  verified: boolean
  confidence: number  // 0-100
  source: string
}

// ── Email pattern generator ───────────────────────────────────────────────────

function generateEmailPatterns(firstName: string, lastName: string, domain: string): { address: string; pattern: string }[] {
  const f  = firstName.toLowerCase().replace(/[^a-z]/g, '')
  const l  = lastName.toLowerCase().replace(/[^a-z]/g, '')
  const f1 = f[0] ?? ''
  const l1 = l[0] ?? ''

  // Normalize accents
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
  const fn = norm(f)
  const ln = norm(l)

  const patterns = [
    { address: `${fn}.${ln}@${domain}`,   pattern: 'prenom.nom' },
    { address: `${fn}${ln}@${domain}`,    pattern: 'prenomnom' },
    { address: `${f1}${ln}@${domain}`,    pattern: 'pnom' },
    { address: `${fn}@${domain}`,         pattern: 'prenom' },
    { address: `${fn}.${l1}@${domain}`,   pattern: 'prenom.n' },
    { address: `${f1}.${ln}@${domain}`,   pattern: 'p.nom' },
    { address: `${ln}.${fn}@${domain}`,   pattern: 'nom.prenom' },
    { address: `${ln}${fn}@${domain}`,    pattern: 'nomprenom' },
    { address: `${ln}@${domain}`,         pattern: 'nom' },
    { address: `${f1}${l1}@${domain}`,    pattern: 'pn' },
    { address: `${fn}_${ln}@${domain}`,   pattern: 'prenom_nom' },
    { address: `${f1}-${ln}@${domain}`,   pattern: 'p-nom' },
    { address: `contact@${domain}`,       pattern: 'contact' },
    { address: `info@${domain}`,          pattern: 'info' },
    { address: `direction@${domain}`,     pattern: 'direction' },
  ]

  // Remove duplicates
  const seen = new Set<string>()
  return patterns.filter(p => {
    if (seen.has(p.address)) return false
    seen.add(p.address)
    return true
  })
}

// ── SMTP verification (without sending mail) ──────────────────────────────────

async function smtpVerify(email: string): Promise<boolean> {
  const domain = email.split('@')[1]
  if (!domain) return false

  try {
    // 1. Get MX records
    const mxRecords = await dns.resolveMx(domain)
    if (!mxRecords.length) return false

    mxRecords.sort((a, b) => a.priority - b.priority)
    const mxHost = mxRecords[0].exchange

    // 2. Open TCP connection to port 25
    return await new Promise<boolean>(resolve => {
      const socket = net.createConnection({ host: mxHost, port: 25 })
      socket.setTimeout(5000)

      let step = 0
      let buffer = ''

      socket.on('data', (data) => {
        buffer += data.toString()
        const lines = buffer.split('\r\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const code = parseInt(line.slice(0, 3))
          if (isNaN(code)) continue

          if (step === 0 && code === 220) {
            // Server ready → EHLO
            socket.write(`EHLO pilot-plus.fr\r\n`)
            step = 1
          } else if (step === 1 && (code === 250 || code === 220)) {
            // After EHLO → MAIL FROM
            socket.write(`MAIL FROM:<check@pilot-plus.fr>\r\n`)
            step = 2
          } else if (step === 2 && code === 250) {
            // MAIL accepted → RCPT TO
            socket.write(`RCPT TO:<${email}>\r\n`)
            step = 3
          } else if (step === 3) {
            // 250/251 = exists, 550/551/553 = doesn't exist
            const exists = code === 250 || code === 251 || code === 252
            socket.write(`QUIT\r\n`)
            socket.destroy()
            resolve(exists)
          }
        }
      })

      socket.on('timeout', () => { socket.destroy(); resolve(false) })
      socket.on('error', () => resolve(false))
      socket.on('close', () => resolve(false))
    })
  } catch {
    return false
  }
}

// ── Domain finder ─────────────────────────────────────────────────────────────

async function findDomain(company: string, linkedinUrl?: string): Promise<string | null> {
  // Try to extract from LinkedIn URL slug
  if (linkedinUrl?.includes('linkedin.com/company/')) {
    const slug = linkedinUrl.split('linkedin.com/company/')[1]?.split('/')[0]?.split('?')[0]
    if (slug) {
      // Try slug as domain base
      const candidates = [
        `${slug}.fr`, `${slug}.com`, `www.${slug}.fr`, `www.${slug}.com`,
      ]
      for (const c of candidates) {
        try {
          await dns.lookup(c.replace('www.', ''))
          return c.replace('www.', '')
        } catch { /* continue */ }
      }
    }
  }

  // Normalize company name → domain candidate
  const normalized = company
    .toLowerCase()
    .replace(/\s+(sas|sarl|sa|sasu|eurl|sci|scop|groupe|group|holding|france)\s*/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()

  const candidates = [
    `${normalized}.fr`,
    `${normalized}.com`,
    `${normalized}.net`,
    `${normalized}.io`,
    `${normalized}.eu`,
  ]

  for (const c of candidates) {
    try {
      await dns.lookup(c)
      return c
    } catch { /* continue */ }
  }

  return null
}

// ── Pappers API (French company registry) ─────────────────────────────────────

interface PappersResult {
  siren?: string
  dirigeants?: Array<{ nom?: string; prenom?: string; qualite?: string }>
  site_internet?: string
  email?: string
  telephone?: string
}

async function searchPappers(company: string): Promise<PappersResult | null> {
  const apiKey = process.env.PAPPERS_API_KEY
  // Works without key in free mode (limited results)
  const base = 'https://api.pappers.fr/v2'
  const url = apiKey
    ? `${base}/entreprise?q=${encodeURIComponent(company)}&api_token=${apiKey}&champs=siren,dirigeants,site_internet`
    : `${base}/recherche?q=${encodeURIComponent(company)}`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PILOT+ Contact Enrichment' },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const data = await res.json() as { resultats?: PappersResult[]; siren?: string; dirigeants?: PappersResult['dirigeants'] }

    // Normalize response
    if (data.resultats?.length) return data.resultats[0]
    if (data.siren) return data as PappersResult
    return null
  } catch {
    return null
  }
}

// ── Website contact scraper ───────────────────────────────────────────────────

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
const PHONE_FR_REGEX = /(?:(?:\+|00)33[\s.-]?(?:\(0\)[\s.-]?)?|0)[1-9](?:[\s.-]?\d{2}){4}/g

async function scrapeWebsite(domain: string): Promise<{ emails: string[]; phones: string[] }> {
  const pages = [
    `https://${domain}`,
    `https://${domain}/contact`,
    `https://${domain}/contact-us`,
    `https://${domain}/nous-contacter`,
    `https://${domain}/equipe`,
    `https://${domain}/team`,
    `https://${domain}/a-propos`,
    `https://${domain}/about`,
  ]

  const emails = new Set<string>()
  const phones = new Set<string>()

  // Only hit first 4 pages to stay fast
  for (const url of pages.slice(0, 4)) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PilotPlusBot/1.0)',
          'Accept': 'text/html',
        },
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) continue
      const html = await res.text()

      const foundEmails = html.match(EMAIL_REGEX) ?? []
      for (const e of foundEmails) {
        if (!e.includes('example') && !e.includes('test') && !e.includes('.png') && !e.includes('.jpg'))
          emails.add(e.toLowerCase())
      }

      const foundPhones = html.match(PHONE_FR_REGEX) ?? []
      for (const p of foundPhones) {
        const clean = p.replace(/[\s.\-]/g, '')
        if (clean.length >= 10) phones.add(clean)
      }

      if (emails.size >= 5) break // enough
    } catch { /* continue */ }
  }

  return {
    emails: [...emails].slice(0, 20),
    phones: [...phones].slice(0, 5),
  }
}

// ── Claude enrichment / scoring ───────────────────────────────────────────────

async function claudeEnrich(contact: ContactInput, candidates: EmailResult[], websiteEmails: string[], pappersData: PappersResult | null) {
  const anthropic = getAnthropicClient()

  const prompt = `Tu es un expert en enrichissement de données B2B.

CONTACT CIBLE:
- Nom: ${contact.first_name} ${contact.last_name}
- Entreprise: ${contact.company}
- LinkedIn: ${contact.linkedin_url ?? 'N/A'}

EMAILS CANDIDATS (à scorer):
${candidates.map(c => `- ${c.address} (pattern: ${c.pattern}, smtp_vérifié: ${c.verified})`).join('\n')}

EMAILS TROUVÉS SUR LE SITE WEB DE L'ENTREPRISE:
${websiteEmails.length ? websiteEmails.join(', ') : 'Aucun'}

DONNÉES PAPPERS (registre entreprises FR):
${pappersData ? JSON.stringify(pappersData, null, 2) : 'Non disponible'}

TÂCHE:
1. Identifie le domaine email le plus probable de l'entreprise
2. Détermine quel pattern email est probablement utilisé par cette entreprise (basé sur les emails trouvés sur le site)
3. Attribue un score de confiance (0-100) à chaque email candidat
4. Si tu identifies clairement l'email le plus probable, mets-le en premier
5. Extrait le poste/titre le plus probable du contact si identifiable
6. Identifie si c'est un dirigeant selon Pappers

Réponds UNIQUEMENT en JSON:
{
  "most_likely_pattern": "prenom.nom | p.nom | etc.",
  "domain": "domaine.fr",
  "job_title": "string ou null",
  "is_dirigeant": true/false,
  "scored_emails": [
    { "address": "email@domaine.fr", "confidence": 85, "reason": "courte explication" }
  ],
  "siren": "string ou null",
  "notes": "observations utiles"
}`

  try {
    const res = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = res.content[0].type === 'text' ? res.content[0].text : ''
    const json = text.match(/\{[\s\S]*\}/)
    if (!json) return null
    return JSON.parse(json[0]) as {
      most_likely_pattern: string
      domain: string
      job_title: string | null
      is_dirigeant: boolean
      scored_emails: { address: string; confidence: number; reason: string }[]
      siren: string | null
      notes: string
    }
  } catch {
    return null
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await req.json() as { contacts: ContactInput[] }
    const { contacts } = body

    if (!contacts?.length) return NextResponse.json({ error: 'Liste vide' }, { status: 400 })
    if (contacts.length > 20) return NextResponse.json({ error: 'Maximum 20 contacts par lot' }, { status: 400 })

    const results: EnrichedContact[] = []

    for (const contact of contacts) {
      const sources: string[] = []

      // 1. Find domain
      let domain = contact.domain ?? null
      if (!domain) {
        domain = await findDomain(contact.company, contact.linkedin_url)
        if (domain) sources.push('dns')
      }

      // 2. Pappers lookup (parallel with website scrape)
      const [pappersData, websiteData] = await Promise.all([
        searchPappers(contact.company).then(d => { if (d) sources.push('pappers'); return d }),
        domain ? scrapeWebsite(domain).then(d => { if (d.emails.length || d.phones.length) sources.push('website'); return d }) : Promise.resolve({ emails: [], phones: [] }),
      ])

      // 3. Try to find domain from Pappers if still missing
      if (!domain && pappersData?.site_internet) {
        domain = pappersData.site_internet
          .replace(/^https?:\/\/(www\.)?/, '')
          .split('/')[0]
          ?.toLowerCase() ?? null
      }

      // 4. Generate email patterns
      let emailCandidates: EmailResult[] = []
      if (domain) {
        const patterns = generateEmailPatterns(contact.first_name, contact.last_name, domain)

        // 5. SMTP verify top 6 patterns (parallel, max 6s total)
        const toVerify = patterns.slice(0, 8)
        const verifications = await Promise.all(
          toVerify.map(async (p) => {
            const verified = await smtpVerify(p.address)
            return { ...p, verified, confidence: verified ? 85 : 15, source: 'smtp_verify' } as EmailResult
          })
        )
        if (verifications.some(v => v.verified)) sources.push('smtp')

        // Add unverified remaining patterns at lower confidence
        const remainingPatterns = patterns.slice(8)
        emailCandidates = [
          ...verifications,
          ...remainingPatterns.map(p => ({ ...p, verified: false, confidence: 10, source: 'pattern' } as EmailResult)),
        ]

        // Boost confidence if email appears on website
        emailCandidates = emailCandidates.map(e => ({
          ...e,
          confidence: websiteData.emails.includes(e.address) ? 99 : e.confidence,
          source: websiteData.emails.includes(e.address) ? 'website' : e.source,
          verified: websiteData.emails.includes(e.address) ? true : e.verified,
        }))
      }

      // Add raw website emails that didn't match pattern (generic emails: contact@, info@)
      for (const we of websiteData.emails) {
        if (!emailCandidates.find(e => e.address === we)) {
          emailCandidates.push({ address: we, pattern: 'website', verified: true, confidence: 70, source: 'website' })
        }
      }

      // 6. Claude scoring + enrichment
      const claudeResult = await claudeEnrich(contact, emailCandidates.slice(0, 10), websiteData.emails, pappersData)
      if (claudeResult) {
        sources.push('ai')
        // Apply Claude scores
        emailCandidates = emailCandidates.map(e => {
          const scored = claudeResult.scored_emails.find(s => s.address === e.address)
          return scored ? { ...e, confidence: scored.confidence } : e
        })
        // Update domain if Claude found a better one
        if (!domain && claudeResult.domain) domain = claudeResult.domain
      }

      // 7. Sort by confidence desc
      emailCandidates.sort((a, b) => b.confidence - a.confidence)

      // 8. Collect phones
      const phones = [...new Set([
        ...websiteData.phones,
        ...(pappersData?.telephone ? [pappersData.telephone] : []),
      ])].slice(0, 3)

      // 9. Compute global confidence
      const hasVerified = emailCandidates.some(e => e.verified && e.confidence >= 70)
      const hasHighConf = emailCandidates[0]?.confidence >= 65
      const confidence: 'high' | 'medium' | 'low' = hasVerified ? 'high' : hasHighConf ? 'medium' : 'low'

      results.push({
        first_name: contact.first_name,
        last_name: contact.last_name,
        full_name: `${contact.first_name} ${contact.last_name}`,
        company: contact.company,
        domain,
        linkedin_url: contact.linkedin_url ?? null,
        emails: emailCandidates.slice(0, 8),
        phones,
        job_title: claudeResult?.job_title ?? null,
        siren: claudeResult?.siren ?? pappersData?.siren ?? null,
        sources,
        confidence,
        raw_website_emails: websiteData.emails,
      })
    }

    return NextResponse.json({ results })
  } catch (err) {
    console.error('[enrichment]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
