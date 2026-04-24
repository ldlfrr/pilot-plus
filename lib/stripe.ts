import Stripe from 'stripe'

// Lazy singleton — avoids build-time crash when env vars are not yet set
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key || key.startsWith('sk_test_REMPLACE')) {
      throw new Error('STRIPE_SECRET_KEY is not configured. Set it in your environment variables.')
    }
    _stripe = new Stripe(key, { apiVersion: '2026-04-22.dahlia' })
  }
  return _stripe
}

// Map subscription tier → Stripe Price ID (set in .env.local / Vercel env vars)
export const PRICE_IDS: Record<string, string> = {
  basic:      process.env.STRIPE_BASIC_PRICE_ID      ?? '',
  pro:        process.env.STRIPE_PRO_PRICE_ID        ?? '',
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID ?? '',
}

// Reverse map: Stripe Price ID → tier
export function tierFromPriceId(priceId: string): string | null {
  const entry = Object.entries(PRICE_IDS).find(([, pid]) => pid === priceId)
  return entry ? entry[0] : null
}
