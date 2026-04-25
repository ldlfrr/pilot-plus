// Shared types for enrichment tool — safe to import from both client and server

export interface ContactInput {
  linkedin_url?: string
  first_name: string
  last_name: string
  company: string
  domain?: string
}

export interface EmailResult {
  address: string
  pattern: string
  verified: boolean
  confidence: number
  source: string
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
