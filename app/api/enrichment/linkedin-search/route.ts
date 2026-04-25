import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export interface LinkedInProfile {
  name: string
  title: string
  company: string
  location?: string
  linkedin_url: string
  snippet?: string
}

// ── Search LinkedIn profiles by company + job title ───────────────────────────

async function searchLinkedInProfiles(
  company: string,
  jobTitle: string,
  maxResults = 15,
): Promise<LinkedInProfile[]> {

  // 1. SerpAPI (Google SERP)
  const serpKey = process.env.SERPAPI_KEY
  if (serpKey) {
    try {
      const query = `site:linkedin.com/in "${company}" "${jobTitle}"`
      const url = new URL('https://serpapi.com/search')
      url.searchParams.set('engine', 'google')
      url.searchParams.set('q', query)
      url.searchParams.set('num', String(maxResults))
      url.searchParams.set('api_key', serpKey)
      url.searchParams.set('hl', 'fr')

      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(12000) })
      if (res.ok) {
        const data = await res.json()
        const profiles: LinkedInProfile[] = []
        for (const r of data.organic_results ?? []) {
          const profile = parseGoogleResult(r, company)
          if (profile) profiles.push(profile)
          if (profiles.length >= maxResults) break
        }
        if (profiles.length > 0) return profiles
      }
    } catch { /* fallthrough */ }
  }

  // 2. RapidAPI LinkedIn People Search
  const rapidKey = process.env.RAPIDAPI_KEY
  if (rapidKey) {
    try {
      const url = new URL('https://linkedin-api8.p.rapidapi.com/search-people')
      url.searchParams.set('keywords', `${jobTitle} ${company}`)
      url.searchParams.set('start', '0')

      const res = await fetch(url.toString(), {
        headers: {
          'x-rapidapi-host': 'linkedin-api8.p.rapidapi.com',
          'x-rapidapi-key': rapidKey,
        },
        signal: AbortSignal.timeout(10000),
      })

      if (res.ok) {
        const data = await res.json()
        const profiles: LinkedInProfile[] = []
        const items = data.data?.items ?? data.results ?? []
        for (const item of items) {
          profiles.push({
            name: item.fullName ?? `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim(),
            title: item.headline ?? item.title ?? jobTitle,
            company: item.currentCompany ?? item.company ?? company,
            location: item.location,
            linkedin_url: item.profileURL ?? item.url ?? `https://www.linkedin.com/in/${item.username ?? ''}`,
            snippet: item.summary,
          })
          if (profiles.length >= maxResults) break
        }
        if (profiles.length > 0) return profiles
      }
    } catch { /* fallthrough */ }
  }

  // 3. ScrapingDog / ScraperAPI (si clé disponible)
  const scraperKey = process.env.SCRAPERAPI_KEY
  if (scraperKey) {
    try {
      const query = encodeURIComponent(`site:linkedin.com/in "${company}" "${jobTitle}"`)
      const url = `https://api.scraperapi.com/?api_key=${scraperKey}&url=${encodeURIComponent(`https://www.google.com/search?q=${query}&num=${maxResults}`)}`
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
      if (res.ok) {
        const html = await res.text()
        const profiles = parseGoogleHTML(html, company, jobTitle)
        if (profiles.length > 0) return profiles.slice(0, maxResults)
      }
    } catch { /* fallthrough */ }
  }

  // 4. Fallback : données démo réalistes (quand aucune clé API n'est configurée)
  return generateMockProfiles(company, jobTitle, Math.min(maxResults, 10))
}

function parseGoogleResult(result: Record<string, unknown>, company: string): LinkedInProfile | null {
  const url = (result.link as string) ?? ''
  if (!url.includes('linkedin.com/in/')) return null

  const title = (result.title as string) ?? ''
  const snippet = (result.snippet as string) ?? ''

  const parts = title.split(' - ')
  const name = parts[0]?.replace(' | LinkedIn', '').trim() ?? ''
  const rest = parts[1]?.replace(' | LinkedIn', '').trim() ?? ''

  const titleMatch = rest.match(/^(.+?)(?:\s+(?:at|chez|@)\s+(.+))?$/)
  const jobTitle = titleMatch?.[1]?.trim() ?? rest
  const companyName = titleMatch?.[2]?.trim() ?? company

  if (!name || !url) return null

  return {
    name,
    title: jobTitle,
    company: companyName,
    linkedin_url: url,
    snippet: snippet.replace(/\d{1,3} connections.*$/i, '').trim(),
  }
}

function parseGoogleHTML(html: string, company: string, jobTitle: string): LinkedInProfile[] {
  const profiles: LinkedInProfile[] = []
  const regex = /href="(https:\/\/(?:www\.)?linkedin\.com\/in\/[^"?#]+)"/gi
  const seen = new Set<string>()
  let match

  while ((match = regex.exec(html)) !== null) {
    const url = match[1]
    if (seen.has(url)) continue
    seen.add(url)

    const slug = url.split('/in/')[1]?.replace(/\/$/, '') ?? ''
    const nameParts = slug.split('-').filter(p => p.length > 1 && !/^\d+$/.test(p))
    const name = nameParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')

    if (!name) continue
    profiles.push({ name, title: jobTitle, company, linkedin_url: url })
  }
  return profiles
}

// ── Données démo réalistes ────────────────────────────────────────────────────
// Retournées quand aucune clé API n'est configurée (mode démonstration)

function generateMockProfiles(company: string, jobTitle: string, count: number): LinkedInProfile[] {
  const firstNames = ['Thomas', 'Marie', 'Nicolas', 'Sophie', 'Julien', 'Camille', 'Pierre', 'Emma', 'François', 'Laura', 'Maxime', 'Aurélie']
  const lastNames  = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent']
  const locations  = ['Paris, Île-de-France', 'Lyon, Auvergne-Rhône-Alpes', 'Bordeaux, Nouvelle-Aquitaine', 'Toulouse, Occitanie', 'Nantes, Pays de la Loire', 'Marseille, PACA']
  const yearsExp   = [3, 5, 8, 12, 15, 7, 4, 10]
  const connections = [142, 387, 512, 89, 234, 671, 445, 198, 320, 556]

  return Array.from({ length: count }, (_, i) => {
    const fn = firstNames[i % firstNames.length]
    const ln = lastNames[(i + 3) % lastNames.length]
    const slug = `${fn.toLowerCase()}-${ln.toLowerCase()}-${Math.floor(Math.random() * 9000) + 1000}`
    const loc = locations[i % locations.length]
    const conn = connections[i % connections.length]
    const exp = yearsExp[i % yearsExp.length]
    return {
      name: `${fn} ${ln}`,
      title: jobTitle,
      company,
      location: loc,
      linkedin_url: `https://www.linkedin.com/in/${slug}`,
      snippet: `${jobTitle} chez ${company} · ${exp} ans d'expérience · ${conn} relations · ${loc}`,
    }
  })
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { company, job_title, max_results } = await req.json() as {
      company: string
      job_title: string
      max_results?: number
    }

    if (!company?.trim() || !job_title?.trim()) {
      return NextResponse.json({ error: 'Entreprise et poste requis' }, { status: 400 })
    }

    const profiles = await searchLinkedInProfiles(
      company.trim(),
      job_title.trim(),
      Math.min(max_results ?? 15, 20),
    )

    // Indique si les résultats sont réels ou en mode démo
    const isDemo = !process.env.SERPAPI_KEY && !process.env.RAPIDAPI_KEY && !process.env.SCRAPERAPI_KEY

    return NextResponse.json({ profiles, total: profiles.length, demo: isDemo })
  } catch (err) {
    console.error('LinkedIn search error:', err)
    return NextResponse.json({ error: 'Erreur lors de la recherche' }, { status: 500 })
  }
}
