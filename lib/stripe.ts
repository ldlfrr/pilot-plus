import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

// Map subscription tier → Stripe Price ID (set in .env.local)
export const PRICE_IDS: Record<string, string> = {
  basic: process.env.STRIPE_BASIC_PRICE_ID ?? '',
  pro:   process.env.STRIPE_PRO_PRICE_ID   ?? '',
}

// Reverse map: Stripe Price ID → tier
export function tierFromPriceId(priceId: string): string | null {
  const entry = Object.entries(PRICE_IDS).find(([, pid]) => pid === priceId)
  return entry ? entry[0] : null
}
