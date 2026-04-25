import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export interface LinkedInProfile {
  name:         string
  title:        string
  company:      string
  location?:    string
  linkedin_url: string
  snippet?:     string
}

// ── 1. SerpAPI — structured Google JSON (best quality) ───────────────────────

async function searchViaSerpApi(company: string, jobTitle: string, maxResults: number): Promise<LinkedInProfile[]> {
  const key = process.env.SERPAPI_KEY
  if (!key) return []
  try {
    const url = new URL('https://serpapi.com/search')
    url.searchParams.set('engine', 'google')
    url.searchParams.set('q', `site:linkedin.com/in "${company}" "${jobTitle}"`)
    url.searchParams.set('num', String(Math.min(maxResults, 10)))
    url.searchParams.set('api_key', key)
    url.searchParams.set('hl', 'fr')
    url.searchParams.set('gl', 'fr')

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(12000) })
    if (!res.ok) return []
    const data = await res.json()
    const profiles: LinkedInProfile[] = []
    for (const r of data.organic_results ?? []) {
      const p = parseGoogleJsonResult(r, company)
      if (p) profiles.push(p)
      if (profiles.length >= maxResults) break
    }
    console.log(`[linkedin] SerpAPI → ${profiles.length} results`)
    return profiles
  } catch (e) {
    console.warn('[linkedin] SerpAPI failed:', e)
    return []
  }
}

// ── 2. RapidAPI LinkedIn People Search ───────────────────────────────────────

async function searchViaRapidApi(company: string, jobTitle: string, maxResults: number): Promise<LinkedInProfile[]> {
  const key = process.env.RAPIDAPI_KEY
  if (!key) return []
  try {
    const url = new URL('https://linkedin-api8.p.rapidapi.com/search-people')
    url.searchParams.set('keywords', `${jobTitle} ${company}`)
    url.searchParams.set('start', '0')

    const res = await fetch(url.toString(), {
      headers: {
        'x-rapidapi-host': 'linkedin-api8.p.rapidapi.com',
        'x-rapidapi-key': key,
      },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return []
    const data = await res.json()
    const profiles: LinkedInProfile[] = []
    for (const item of data.data?.items ?? data.results ?? []) {
      profiles.push({
        name:         item.fullName ?? `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim(),
        title:        item.headline ?? item.title ?? jobTitle,
        company:      item.currentCompany ?? item.company ?? company,
        location:     item.location,
        linkedin_url: item.profileURL ?? item.url ?? `https://www.linkedin.com/in/${item.username ?? ''}`,
        snippet:      item.summary,
      })
      if (profiles.length >= maxResults) break
    }
    console.log(`[linkedin] RapidAPI → ${profiles.length} results`)
    return profiles
  } catch (e) {
    console.warn('[linkedin] RapidAPI failed:', e)
    return []
  }
}

// ── 3. ScraperAPI — Google SERP with proper URL extraction ───────────────────
// Google wraps all links as /url?q=https://linkedin.com/in/... — we parse that.

async function searchViaScraperApi(company: string, jobTitle: string, maxResults: number): Promise<LinkedInProfile[]> {
  const key = process.env.SCRAPERAPI_KEY
  if (!key) return []
  try {
    const googleQuery = encodeURIComponent(`site:linkedin.com/in "${company}" "${jobTitle}"`)
    const targetUrl   = `https://www.google.com/search?q=${googleQuery}&num=${Math.min(maxResults * 2, 20)}&hl=fr`
    const scraperUrl  = `https://api.scraperapi.com/?api_key=${key}&url=${encodeURIComponent(targetUrl)}&render=false&country_code=fr`

    const res = await fetch(scraperUrl, { signal: AbortSignal.timeout(20000) })
    if (!res.ok) return []
    const html = await res.text()
    const profiles = parseGoogleHtmlFull(html, company, jobTitle)
    console.log(`[linkedin] ScraperAPI → ${profiles.length} results`)
    return profiles.slice(0, maxResults)
  } catch (e) {
    console.warn('[linkedin] ScraperAPI failed:', e)
    return []
  }
}

// ── Parse structured SerpAPI JSON result ─────────────────────────────────────

function parseGoogleJsonResult(result: Record<string, unknown>, company: string): LinkedInProfile | null {
  const url = (result.link as string) ?? ''
  if (!url.includes('linkedin.com/in/')) return null

  const rawTitle  = (result.title as string) ?? ''
  const snippet   = (result.snippet as string) ?? ''

  // Title patterns: "John Doe - Engineer at Acme | LinkedIn" or "John Doe | LinkedIn"
  const titleClean = rawTitle.replace(/\s*\|\s*LinkedIn\s*/i, '').trim()
  const parts      = titleClean.split(/\s*[-–—]\s+/)
  const name       = parts[0]?.trim() ?? ''
  const rest       = parts.slice(1).join(' - ').trim()

  // Extract job title and company from "Engineer at Acme Corp"
  const atMatch = rest.match(/^(.+?)\s+(?:chez|at|@)\s+(.+)$/i)
  const jobTitle  = atMatch ? atMatch[1].trim() : rest
  const companyName = atMatch ? atMatch[2].trim() : company

  if (!name) return null

  return {
    name,
    title:        jobTitle || company,
    company:      companyName,
    linkedin_url: url,
    snippet:      snippet.replace(/\d+\s+(?:connections|relations).*$/i, '').trim() || undefined,
  }
}

// ── Parse raw Google HTML — handles /url?q= redirects + <h3> titles ──────────

function parseGoogleHtmlFull(html: string, company: string, jobTitle: string): LinkedInProfile[] {
  const profiles: LinkedInProfile[] = []
  const seen = new Set<string>()

  // Google wraps all links as: href="/url?q=https://www.linkedin.com/in/john-doe/&amp;sa=..."
  // We extract both the LinkedIn URL and the preceding <h3> text (the page title)

  // Match each Google result block: <h3>title</h3>...<a href="/url?q=linkedin_url">
  // Strategy: find all /url?q= with a linkedin.com/in URL, then backtrack for the title
  const urlPattern = /\/url\?q=(https?:\/\/(?:www\.)?linkedin\.com\/in\/([^&"]+))/g
  let m: RegExpExecArray | null

  while ((m = urlPattern.exec(html)) !== null) {
    const linkedinUrl = decodeURIComponent(m[1]).split('?')[0].replace(/\/$/, '')
    if (seen.has(linkedinUrl)) continue
    seen.add(linkedinUrl)

    // Backtrack up to 2000 chars to find the nearest <h3> before this URL
    const start   = Math.max(0, m.index - 2000)
    const before  = html.slice(start, m.index)
    const h3Match = [...before.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)].pop()

    let name      = ''
    let title     = jobTitle
    let parsedCompany = company

    if (h3Match) {
      // Strip HTML tags and decode entities
      const rawText = h3Match[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/\s*\|\s*LinkedIn\s*/i, '')
        .trim()

      // "John Doe - Engineer at Acme" or "John Doe | LinkedIn"
      const parts = rawText.split(/\s*[-–—]\s+/)
      name = parts[0]?.trim() ?? ''
      const rest = parts.slice(1).join(' - ').trim()
      if (rest) {
        const atMatch = rest.match(/^(.+?)\s+(?:chez|at|@)\s+(.+)$/i)
        title         = atMatch ? atMatch[1].trim() : rest
        parsedCompany = atMatch ? atMatch[2].trim() : company
      }
    }

    if (!name) {
      // Fall back to slug-based name
      const slug     = m[2]?.replace(/\/$/, '') ?? ''
      const nameParts = slug.split('-').filter(p => p.length > 1 && !/^\d+$/.test(p))
      name = nameParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
    }

    if (!name) continue

    profiles.push({ name, title, company: parsedCompany, linkedin_url: linkedinUrl })
    if (profiles.length >= 20) break
  }

  return profiles
}

// ── Mock data (only when NO API key is configured) ───────────────────────────

function generateMockProfiles(company: string, jobTitle: string, count: number): LinkedInProfile[] {
  const firstNames = ['Thomas', 'Marie', 'Nicolas', 'Sophie', 'Julien', 'Camille', 'Pierre', 'Emma', 'François', 'Laura', 'Maxime', 'Aurélie']
  const lastNames  = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent']
  const locations  = ['Paris, Île-de-France', 'Lyon, Auvergne-Rhône-Alpes', 'Bordeaux, Nouvelle-Aquitaine', 'Toulouse, Occitanie', 'Nantes, Pays de la Loire', 'Marseille, PACA']
  const yearsExp   = [3, 5, 8, 12, 15, 7, 4, 10]
  const connections = [142, 387, 512, 89, 234, 671, 445, 198, 320, 556]

  return Array.from({ length: count }, (_, i) => {
    const fn  = firstNames[i % firstNames.length]
    const ln  = lastNames[(i + 3) % lastNames.length]
    const slug = `${fn.toLowerCase()}-${ln.toLowerCase()}-${Math.floor(Math.random() * 9000) + 1000}`
    const loc  = locations[i % locations.length]
    const conn = connections[i % connections.length]
    const exp  = yearsExp[i % yearsExp.length]
    return {
      name:         `${fn} ${ln}`,
      title:        jobTitle,
      company,
      location:     loc,
      linkedin_url: `https://www.linkedin.com/in/${slug}`,
      snippet:      `${jobTitle} chez ${company} · ${exp} ans d'expérience · ${conn} relations · ${loc}`,
    }
  })
}

// ── Main search cascade ───────────────────────────────────────────────────────

async function searchLinkedInProfiles(company: string, jobTitle: string, maxResults: number): Promise<{ profiles: LinkedInProfile[]; source: string }> {
  // 1. SerpAPI
  const serpResults = await searchViaSerpApi(company, jobTitle, maxResults)
  if (serpResults.length > 0) return { profiles: serpResults, source: 'serpapi' }

  // 2. RapidAPI
  const rapidResults = await searchViaRapidApi(company, jobTitle, maxResults)
  if (rapidResults.length > 0) return { profiles: rapidResults, source: 'rapidapi' }

  // 3. ScraperAPI
  const scraperResults = await searchViaScraperApi(company, jobTitle, maxResults)
  if (scraperResults.length > 0) return { profiles: scraperResults, source: 'scraperapi' }

  // 4. Mock fallback
  const mock = generateMockProfiles(company, jobTitle, Math.min(maxResults, 10))
  return { profiles: mock, source: 'demo' }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { company, job_title, max_results } = await req.json() as {
      company:      string
      job_title:    string
      max_results?: number
    }

    if (!company?.trim() || !job_title?.trim()) {
      return NextResponse.json({ error: 'Entreprise et poste requis' }, { status: 400 })
    }

    const { profiles, source } = await searchLinkedInProfiles(
      company.trim(),
      job_title.trim(),
      Math.min(max_results ?? 15, 20),
    )

    const isDemo = source === 'demo'
    const hasKeys = !!(process.env.SERPAPI_KEY || process.env.RAPIDAPI_KEY || process.env.SCRAPERAPI_KEY)

    // If keys are configured but scraping returned 0, ScraperAPI couldn't find anything real
    // In this case we still return mock but flag it
    return NextResponse.json({
      profiles,
      total:  profiles.length,
      demo:   isDemo,
      source,
      has_keys: hasKeys,
    })
  } catch (err) {
    console.error('[linkedin-search] Error:', err)
    return NextResponse.json({ error: 'Erreur lors de la recherche' }, { status: 500 })
  }
}
