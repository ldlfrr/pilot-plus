import Anthropic from '@anthropic-ai/sdk'

export const ANALYSIS_MODEL = 'claude-opus-4-5'
export const SCORING_MODEL  = 'claude-opus-4-5'
export const PROMPT_VERSION = 'v2-anthropic'

// Lazy singleton — never throws at module level
let _client: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY manquant dans .env.local'
      )
    }
    _client = new Anthropic({ apiKey })
  }
  return _client
}
