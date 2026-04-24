import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PRICE_IDS } from '@/lib/stripe'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { tier } = await req.json() as { tier: string }
    const priceId = PRICE_IDS[tier]
    if (!priceId) return NextResponse.json({ error: 'Forfait invalide' }, { status: 400 })

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, full_name, subscription_tier')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name:  profile?.full_name ?? undefined,
        metadata: { supabase_uid: user.id },
      })
      customerId = customer.id
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      customer:   customerId,
      mode:       'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/subscription?success=1&tier=${tier}`,
      cancel_url:  `${appUrl}/subscription?canceled=1`,
      metadata: { supabase_uid: user.id, tier },
      subscription_data: {
        metadata: { supabase_uid: user.id, tier },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      locale: 'fr',
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe/checkout]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur serveur' },
      { status: 500 },
    )
  }
}
