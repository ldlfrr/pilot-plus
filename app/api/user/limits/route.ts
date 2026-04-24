import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TIER_LIMITS, getUserTier, countUserAnalyses } from '@/lib/subscription'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const tier          = await getUserTier(supabase, user.id)
  const limit         = TIER_LIMITS[tier] ?? 1
  const analysesUsed  = await countUserAnalyses(supabase)

  return NextResponse.json({ tier, analyses_used: analysesUsed, analyses_limit: limit })
}
