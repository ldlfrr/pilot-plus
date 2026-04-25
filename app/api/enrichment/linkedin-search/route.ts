import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime    = 'nodejs'
export const dynamic    = 'force-dynamic'
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

// ── 3. Free DuckDuckGo Lite scraper (no key needed) ─────────────────────────
// DDG lite returns simple HTML with DIRECT LinkedIn href values — no redirect wrapping

async function searchViaDuckDuckGo(company: string, jobTitle: string, maxResults: number): Promise<LinkedInProfile[]> {
  try {
    const q       = `site:linkedin.com/in "${company}" "${jobTitle}"`
    const formUrl = `https://lite.duckduckgo.com/lite/`

    // DDG lite requires a POST form submission
    const body = new URLSearchParams({ q, s: '0', o: 'json', dc: '0', api: '/d.js', kl: 'fr-fr' })
    const res  = await fetch(formUrl, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent':   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept':       'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        'Referer':      'https://lite.duckduckgo.com/',
      },
      body,
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) {
      console.warn('[linkedin] DDG lite HTTP', res.status)
      return []
    }
    const html     = await res.text()
    const profiles = parseDuckDuckGoHtml(html, company, jobTitle)
    console.log(`[linkedin] DuckDuckGo → ${profiles.length} results`)
    return profiles.slice(0, maxResults)
  } catch (e) {
    console.warn('[linkedin] DuckDuckGo failed:', e)
    return []
  }
}

function parseDuckDuckGoHtml(html: string, company: string, jobTitle: string): LinkedInProfile[] {
  const profiles: LinkedInProfile[] = []
  const seen = new Set<string>()

  // DDG lite: links appear as <a href="https://www.linkedin.com/in/slug" class="result-link">
  // Also as: href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.linkedin.com%2Fin%2F..."
  const directPattern  = /href="(https?:\/\/(?:www\.)?linkedin\.com\/in\/([^"?#]+))"/gi
  const redirectPattern = /href="\/\/duckduckgo\.com\/l\/\?[^"]*uddg=(https?%3A%2F%2F(?:www\.)?linkedin\.com%2Fin%2F[^"&]+)/gi

  const allMatches: Array<{ url: string; slug: string; index: number }> = []

  let m: RegExpExecArray | null
  while ((m = directPattern.exec(html)) !== null) {
    const url  = m[1].split('?')[0].replace(/\/$/, '')
    const slug = m[2].replace(/\/$/, '')
    if (!seen.has(url)) { seen.add(url); allMatches.push({ url, slug, index: m.index }) }
  }
  while ((m = redirectPattern.exec(html)) !== null) {
    try {
      const url  = decodeURIComponent(m[1]).split('?')[0].replace(/\/$/, '')
      const slug = url.replace(/^https?:\/\/(?:www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '')
      if (!seen.has(url)) { seen.add(url); allMatches.push({ url, slug, index: m.index }) }
    } catch { /* skip */ }
  }

  for (const { url, slug, index } of allMatches) {
    // Backtrack for nearest link text or <td> title
    const before  = html.slice(Math.max(0, index - 1500), index)
    const tdMatch = [...before.matchAll(/<td[^>]*class="result-snippet"[^>]*>([\s\S]*?)<\/td>/gi)].pop()
                 ?? [...before.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi)].pop()

    let name      = ''
    let title     = jobTitle
    let parsedCo  = company

    if (tdMatch) {
      const rawText = tdMatch[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
        .replace(/\s*\|\s*LinkedIn\s*/i, '')
        .trim()
      const parts = rawText.split(/\s*[-–—]\s+/)
      name = parts[0]?.trim() ?? ''
      const rest = parts.slice(1).join(' - ').trim()
      if (rest) {
        const atMatch = rest.match(/^(.+?)\s+(?:chez|at|@)\s+(.+)$/i)
        title    = atMatch ? atMatch[1].trim() : rest
        parsedCo = atMatch ? atMatch[2].trim() : company
      }
    }

    if (!name) {
      const nameParts = slug.split('-').filter(p => p.length > 1 && !/^\d+$/.test(p)).slice(0, 3)
      name = nameParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
    }

    if (!name || name.length < 3) continue

    profiles.push({ name, title, company: parsedCo, linkedin_url: url })
    if (profiles.length >= 20) break
  }

  return profiles
}

// ── 4. ScraperAPI — scrapes Bing (no /url?q= redirect, direct LinkedIn URLs) ──
// Bing is far more scraping-friendly than Google and returns direct href values

async function searchViaScraperApi(company: string, jobTitle: string, maxResults: number): Promise<LinkedInProfile[]> {
  const key = process.env.SCRAPERAPI_KEY
  if (!key) return []
  try {
    // Use Bing instead of Google — Bing has direct href, Google wraps in /url?q=
    const bingQuery  = encodeURIComponent(`site:linkedin.com/in "${company}" "${jobTitle}"`)
    const targetUrl  = `https://www.bing.com/search?q=${bingQuery}&count=${Math.min(maxResults * 2, 20)}&setlang=fr`
    const scraperUrl = `https://api.scraperapi.com/?api_key=${key}&url=${encodeURIComponent(targetUrl)}&render=false&country_code=fr`

    console.log('[linkedin] ScraperAPI targeting Bing:', targetUrl)
    const res = await fetch(scraperUrl, { signal: AbortSignal.timeout(25000) })
    if (!res.ok) {
      console.warn('[linkedin] ScraperAPI HTTP', res.status)
      return []
    }
    const html     = await res.text()
    console.log('[linkedin] ScraperAPI HTML length:', html.length, '| first 200:', html.slice(0, 200))
    const profiles = parseBingHtml(html, company, jobTitle)
    console.log(`[linkedin] ScraperAPI/Bing → ${profiles.length} results`)
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

  const titleClean = rawTitle.replace(/\s*\|\s*LinkedIn\s*/i, '').trim()
  const parts      = titleClean.split(/\s*[-–—]\s+/)
  const name       = parts[0]?.trim() ?? ''
  const rest       = parts.slice(1).join(' - ').trim()

  const atMatch   = rest.match(/^(.+?)\s+(?:chez|at|@)\s+(.+)$/i)
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

// ── Parse Bing HTML — direct href values, no redirect wrapping ────────────────

function parseBingHtml(html: string, company: string, jobTitle: string): LinkedInProfile[] {
  const profiles: LinkedInProfile[] = []
  const seen = new Set<string>()

  // Bing wraps links in <h2><a href="https://www.linkedin.com/in/slug"> directly
  // Also possible: data-href or cite attributes
  const patterns = [
    /href="(https?:\/\/(?:www\.)?linkedin\.com\/in\/([^"?#/][^"?#]*)(?:\/[^"?#]*)?)"/gi,
    /<cite[^>]*>(https?:\/\/(?:www\.)?linkedin\.com\/in\/([^<\s?#]+))/gi,
  ]

  for (const pattern of patterns) {
    let m: RegExpExecArray | null
    while ((m = pattern.exec(html)) !== null) {
      const rawUrl = m[1]
      const url    = rawUrl.split('?')[0].replace(/\/$/, '')
      if (!url.includes('/in/') || seen.has(url)) continue
      seen.add(url)

      const slug  = m[2]?.replace(/\/$/, '') ?? ''

      // Backtrack up to 2000 chars for the nearest <h2> or <a> title text
      const start  = Math.max(0, m.index - 2000)
      const before = html.slice(start, m.index)
      const h2Match = [...before.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].pop()
               ?? [...before.matchAll(/<a[^>]*class="[^"]*tilk[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)].pop()

      let name      = ''
      let title     = jobTitle
      let parsedCo  = company

      if (h2Match) {
        const rawText = h2Match[1]
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
          .replace(/\s*\|\s*LinkedIn\s*/i, '')
          .trim()
        const parts = rawText.split(/\s*[-–—]\s+/)
        name = parts[0]?.trim() ?? ''
        const rest = parts.slice(1).join(' - ').trim()
        if (rest) {
          const atMatch = rest.match(/^(.+?)\s+(?:chez|at|@)\s+(.+)$/i)
          title    = atMatch ? atMatch[1].trim() : rest
          parsedCo = atMatch ? atMatch[2].trim() : company
        }
      }

      if (!name) {
        const nameParts = slug.split('-').filter(p => p.length > 1 && !/^\d+$/.test(p)).slice(0, 3)
        name = nameParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
      }

      if (!name || name.length < 3) continue

      profiles.push({ name, title, company: parsedCo, linkedin_url: url })
      if (profiles.length >= 20) break
    }
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
  // 1. SerpAPI (structured JSON, best quality)
  const serpResults = await searchViaSerpApi(company, jobTitle, maxResults)
  if (serpResults.length > 0) return { profiles: serpResults, source: 'serpapi' }

  // 2. RapidAPI (direct LinkedIn API)
  const rapidResults = await searchViaRapidApi(company, jobTitle, maxResults)
  if (rapidResults.length > 0) return { profiles: rapidResults, source: 'rapidapi' }

  // 3. DuckDuckGo Lite (free, no key, direct LinkedIn hrefs)
  const ddgResults = await searchViaDuckDuckGo(company, jobTitle, maxResults)
  if (ddgResults.length > 0) return { profiles: ddgResults, source: 'duckduckgo' }

  // 4. ScraperAPI → Bing (Bing has direct hrefs, more scraping-friendly)
  const scraperResults = await searchViaScraperApi(company, jobTitle, maxResults)
  if (scraperResults.length > 0) return { profiles: scraperResults, source: 'scraperapi' }

  // 5. Mock fallback
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

    const isDemo  = source === 'demo'
    const hasKeys = !!(process.env.SERPAPI_KEY || process.env.RAPIDAPI_KEY || process.env.SCRAPERAPI_KEY)

    return NextResponse.json({
      profiles,
      total:    profiles.length,
      demo:     isDemo,
      source,
      has_keys: hasKeys,
    })
  } catch (err) {
    console.error('[linkedin-search] Error:', err)
    return NextResponse.json({ error: 'Erreur lors de la recherche' }, { status: 500 })
  }
}
