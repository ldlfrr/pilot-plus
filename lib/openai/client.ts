// OpenAI client — kept for compatibility but no longer used as primary AI
// Primary AI is now Anthropic (lib/ai/client.ts)

export const ANALYSIS_MODEL = 'gpt-4o'
export const SCORING_MODEL  = 'gpt-4o'
export const PROMPT_VERSION = 'v1'

// Lazy — never throws at module level (OPENAI_API_KEY is optional)
export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY manquant dans .env.local')
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const OpenAI = require('openai')
  return new OpenAI({ apiKey }) as import('openai').default
}
