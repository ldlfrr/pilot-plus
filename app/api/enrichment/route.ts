import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/ai/client'
import type { ContactInput, EmailResult, EnrichedContact } from '@/lib/types/enrichment'

// Force Node.js runtime — needed for dns + net
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// ── Email pattern generator ───────────────────────────────────────────────────

function norm(s: string) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function generateEmailPatterns(firstName: string, lastName: string, domain: string) {
  const f = norm(firstName); const l = norm(lastName)
  const f1 = f[0] ?? ''; const l1 = l[0] ?? ''
  const seen = new Set<string>()
  const add = (address: string, pattern: string) => {
    if (!seen.has(address)) { seen.add(address); return { address, pattern } }
    return null
  }
  return [
    add(`${f}.${l}@${domain}`,  'prenom.nom'),
    add(`${f}${l}@${domain}`,   'prenomnom'),
    add(`${f1}${l}@${domain}`,  'pnom'),
    add(`${f}@${domain}`,       'prenom'),
    add(`${f}.${l1}@${domain}`, 'prenom.n'),
    add(`${f1}.${l}@${domain}`, 'p.nom'),
    add(`${l}.${f}@${domain}`,  'nom.prenom'),
    add(`${l}${f}@${domain}`,   'nomprenom'),
    add(`${l}@${domain}`,       'nom'),
    add(`${f1}${l1}@${domain}`, 'pn'),
    add(`${f}_${l}@${domain}`,  'prenom_nom'),
    add(`contact@${domain}`,    'contact'),
    add(`info@${domain}`,       'info'),
    add(`direction@${domain}`,  'direction'),
  ].filter(Boolean) as { address: string; pattern: string }[]
}

// ── SMTP verification ─────────────────────────────────────────────────────────

async function smtpVerify(email: string): Promise<boolean> {
  // Vercel blocks port 25 — wrap everything so it never throws
  try {
    const dns = await import('dns/promises')
    const net = await import('net')
    const domain = email.split('@')[1]
    if (!domain) return false

    const mxRecords = await Promise.race([
      dns.resolveMx(domain),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 3000)),
    ]) as Awaited<ReturnType<typeof dns.resolveMx>>
    if (!mxRecords?.length) return false
    mxRecords.sort((a, b) => a.priority - b.priority)

    return await new Promise<boolean>(resolve => {
      const socket = net.createConnection({ host: mxRecords[0].exchange, port: 25 })
      socket.setTimeout(4000)
      let step = 0; let buf = ''

      socket.on('data', d => {
        buf += d.toString()
        const lines = buf.split('\r\n'); buf = lines.pop() ?? ''
        for (const line of lines) {
          const code = parseInt(line.slice(0, 3))
          if (isNaN(code)) continue
          if (step === 0 && code === 220) { socket.write('EHLO pilot-plus.fr\r\n'); step = 1 }
          else if (step === 1 && (code === 250 || code === 220)) { socket.write(`MAIL FROM:<check@pilot-plus.fr>\r\n`); step = 2 }
          else if (step === 2 && code === 250) { socket.write(`RCPT TO:<${email}>\r\n`); step = 3 }
          else if (step === 3) { const ok = code === 250 || code === 251 || code === 252; socket.write('QUIT\r\n'); socket.destroy(); resolve(ok) }
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
  try {
    const dns = await import('dns/promises')

    if (linkedinUrl?.includes('linkedin.com/company/')) {
      const slug = linkedinUrl.split('linkedin.com/company/')[1]?.split('/')[0]?.split('?')[0]
      if (slug) {
        for (const c of [`${slug}.fr`, `${slug}.com`]) {
          try { await dns.lookup(c); return c } catch { /* continue */ }
        }
      }
    }

    const base = norm(company)
      .replace(/sas|sarl|sa|sasu|eurl|sci|scop|groupe|group|holding|france/g, '')
    for (const c of [`${base}.fr`, `${base}.com`, `${base}.net`, `${base}.io`]) {
      try { await dns.lookup(c); return c } catch { /* continue */ }
    }
  } catch { /* continue */ }
  return null
}

// ── Pappers API ───────────────────────────────────────────────────────────────

interface PappersResult { siren?: string; site_internet?: string; telephone?: string }

async function searchPappers(company: string): Promise<PappersResult | null> {
  try {
    const apiKey = process.env.PAPPERS_API_KEY
    const url = apiKey
      ? `https://api.pappers.fr/v2/entreprise?q=${encodeURIComponent(company)}&api_token=${apiKey}`
      : `https://api.pappers.fr/v2/recherche?q=${encodeURIComponent(company)}`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const data = await res.json() as { resultats?: PappersResult[]; siren?: string }
    return data.resultats?.[0] ?? (data.siren ? data as PappersResult : null)
  } catch { return null }
}

// ── Website scraper ───────────────────────────────────────────────────────────

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
const PHONE_RE = /(?:(?:\+|00)33[\s.\-]?(?:\(0\)[\s.\-]?)?|0)[1-9](?:[\s.\-]?\d{2}){4}/g

async function scrapeWebsite(domain: string) {
  const pages = [`https://${domain}`, `https://${domain}/contact`, `https://${domain}/nous-contacter`, `https://${domain}/equipe`]
  const emails = new Set<string>(); const phones = new Set<string>()
  for (const url of pages.slice(0, 3)) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PilotPlusBot/1.0)' }, signal: AbortSignal.timeout(5000) })
      if (!res.ok) continue
      const html = await res.text()
      for (const e of html.match(EMAIL_RE) ?? []) {
        if (!e.includes('example') && !e.includes('.png') && !e.includes('.jpg')) emails.add(e.toLowerCase())
      }
      for (const p of html.match(PHONE_RE) ?? []) {
        const c = p.replace(/[\s.\-]/g, ''); if (c.length >= 10) phones.add(c)
      }
      if (emails.size >= 5) break
    } catch { /* continue */ }
  }
  return { emails: [...emails].slice(0, 15), phones: [...phones].slice(0, 5) }
}

// ── Claude scoring ────────────────────────────────────────────────────────────

async function claudeEnrich(contact: ContactInput, candidates: EmailResult[], websiteEmails: string[], pappersData: PappersResult | null) {
  try {
    const anthropic = getAnthropicClient()
    const prompt = `Expert enrichissement B2B. Contact: ${contact.first_name} ${contact.last_name} @ ${contact.company}
LinkedIn: ${contact.linkedin_url ?? 'N/A'}
Emails candidats: ${candidates.map(c => `${c.address}(smtp:${c.verified})`).join(', ')}
Emails site web: ${websiteEmails.join(', ') || 'aucun'}
Pappers: ${JSON.stringify(pappersData ?? {})}

Réponds UNIQUEMENT en JSON: {"most_likely_pattern":"","domain":"","job_title":null,"siren":null,"scored_emails":[{"address":"","confidence":0}]}`

    const res = await anthropic.messages.create({ model: 'claude-opus-4-5', max_tokens: 800, messages: [{ role: 'user', content: prompt }] })
    const text = res.content[0].type === 'text' ? res.content[0].text : ''
    const json = text.match(/\{[\s\S]*\}/)
    return json ? JSON.parse(json[0]) as { domain?: string; job_title?: string | null; siren?: string | null; scored_emails?: { address: string; confidence: number }[] } : null
  } catch { return null }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { contacts } = await req.json() as { contacts: ContactInput[] }
    if (!contacts?.length) return NextResponse.json({ error: 'Liste vide' }, { status: 400 })
    if (contacts.length > 20) return NextResponse.json({ error: 'Max 20 contacts' }, { status: 400 })

    const results: EnrichedContact[] = []

    for (const contact of contacts) {
      const sources: string[] = []

      let domain = contact.domain ?? null
      if (!domain) { domain = await findDomain(contact.company, contact.linkedin_url); if (domain) sources.push('dns') }

      const [pappersData, websiteData] = await Promise.all([
        searchPappers(contact.company).then(d => { if (d) sources.push('pappers'); return d }),
        domain ? scrapeWebsite(domain).then(d => { if (d.emails.length || d.phones.length) sources.push('website'); return d }) : Promise.resolve({ emails: [], phones: [] }),
      ])

      if (!domain && pappersData?.site_internet) {
        domain = pappersData.site_internet.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]?.toLowerCase() ?? null
      }

      let emailCandidates: EmailResult[] = []
      if (domain) {
        const patterns = generateEmailPatterns(contact.first_name, contact.last_name, domain)
        const verified = await Promise.all(patterns.slice(0, 8).map(async p => ({
          ...p, verified: await smtpVerify(p.address), confidence: 15, source: 'smtp_verify',
        })))
        if (verified.some(v => v.verified)) sources.push('smtp')

        emailCandidates = [
          ...verified.map(v => ({ ...v, confidence: v.verified ? 85 : 15 })),
          ...patterns.slice(8).map(p => ({ ...p, verified: false, confidence: 10, source: 'pattern' })),
        ].map(e => websiteData.emails.includes(e.address) ? { ...e, confidence: 99, source: 'website', verified: true } : e)
      }

      for (const we of websiteData.emails) {
        if (!emailCandidates.find(e => e.address === we))
          emailCandidates.push({ address: we, pattern: 'website', verified: true, confidence: 70, source: 'website' })
      }

      const claudeResult = await claudeEnrich(contact, emailCandidates.slice(0, 10), websiteData.emails, pappersData)
      if (claudeResult) {
        sources.push('ai')
        if (!domain && claudeResult.domain) domain = claudeResult.domain
        emailCandidates = emailCandidates.map(e => {
          const scored = claudeResult.scored_emails?.find(s => s.address === e.address)
          return scored ? { ...e, confidence: scored.confidence } : e
        })
      }

      emailCandidates.sort((a, b) => b.confidence - a.confidence)
      const phones = [...new Set([...websiteData.phones, ...(pappersData?.telephone ? [pappersData.telephone] : [])])].slice(0, 3)
      const hasVerified = emailCandidates.some(e => e.verified && e.confidence >= 70)
      const confidence: 'high' | 'medium' | 'low' = hasVerified ? 'high' : emailCandidates[0]?.confidence >= 60 ? 'medium' : 'low'

      results.push({
        first_name: contact.first_name, last_name: contact.last_name,
        full_name: `${contact.first_name} ${contact.last_name}`,
        company: contact.company, domain, linkedin_url: contact.linkedin_url ?? null,
        emails: emailCandidates.slice(0, 8), phones,
        job_title: claudeResult?.job_title ?? null,
        siren: claudeResult?.siren ?? pappersData?.siren ?? null,
        sources, confidence, raw_website_emails: websiteData.emails,
      })
    }

    return NextResponse.json({ results })
  } catch (err) {
    console.error('[enrichment]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
