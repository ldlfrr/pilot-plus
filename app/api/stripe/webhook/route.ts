import { NextResponse } from 'next/server'
import { getStripe, tierFromPriceId } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

// Use service-role client (bypasses RLS) — webhooks run outside user sessions
function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function setSubscription(
  supabaseUid: string,
  tier: string,
  stripeSubId: string | null,
) {
  const supabase = adminSupabase()
  await supabase
    .from('profiles')
    .update({
      subscription_tier:         tier,
      stripe_subscription_id:    stripeSubId,
      subscription_started_at:   tier !== 'free' ? new Date().toISOString() : null,
      subscription_expires_at:   null,
    })
    .eq('id', supabaseUid)
}

export async function POST(req: Request) {
  const body   = await req.text()
  const sig    = req.headers.get('stripe-signature') ?? ''
  const secret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret)
  } catch (err) {
    console.error('[webhook] signature failed:', err)
    return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 })
  }

  const supabase = adminSupabase()

  switch (event.type) {

    // ── Payment succeeded — activate subscription ─────────────────────────
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break

      const uid  = session.metadata?.supabase_uid
      const tier = session.metadata?.tier
      const sub  = session.subscription

      if (uid && tier) {
        await setSubscription(uid, tier, typeof sub === 'string' ? sub : sub?.id ?? null)
      }
      break
    }

    // ── Subscription updated (plan change / renewal) ──────────────────────
    case 'customer.subscription.updated': {
      const sub  = event.data.object as Stripe.Subscription
      const uid  = sub.metadata?.supabase_uid
      const item = sub.items.data[0]
      const tier = item ? tierFromPriceId(item.price.id) : null

      if (uid && tier) {
        await setSubscription(uid, tier, sub.id)
      } else if (uid && sub.status === 'past_due') {
        // Payment failed — optionally downgrade
      }
      break
    }

    // ── Subscription cancelled ────────────────────────────────────────────
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const uid = sub.metadata?.supabase_uid

      // Also try looking up by stripe_subscription_id
      if (!uid) {
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_subscription_id', sub.id)
          .single()
        if (data?.id) {
          await setSubscription(data.id, 'free', null)
        }
      } else {
        await setSubscription(uid, 'free', null)
      }
      break
    }

    // ── Invoice paid — keep subscription active ───────────────────────────
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const subId   = (invoice as Stripe.Invoice & { subscription?: string }).subscription
      if (subId) {
        const sub  = await getStripe().subscriptions.retrieve(subId)
        const uid  = sub.metadata?.supabase_uid
        const item = sub.items.data[0]
        const tier = item ? tierFromPriceId(item.price.id) : null
        if (uid && tier) await setSubscription(uid, tier, sub.id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
