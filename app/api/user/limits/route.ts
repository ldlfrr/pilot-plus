import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Per-tier analysis limits (null = unlimited)
export const TIER_LIMITS: Record<string, number | null> = {
  free:       1,
  basic:      10,
  pro:        50,
  enterprise: null,
  lifetime:   null,
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Get subscription tier (graceful fallback if migration not run)
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  const tier: string = (profile as { subscription_tier?: string })?.subscription_tier ?? 'free'
  const limit = TIER_LIMITS[tier] ?? 1

  // Count total analyses across all user's projects
  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', user.id)

  const projectIds = projects?.map(p => p.id) ?? []

  let analysesUsed = 0
  if (projectIds.length > 0) {
    const { count } = await supabase
      .from('project_analyses')
      .select('id', { count: 'exact', head: true })
      .in('project_id', projectIds)
    analysesUsed = count ?? 0
  }

  return NextResponse.json({
    tier,
    analyses_used: analysesUsed,
    analyses_limit: limit,   // null = unlimited
  })
}
