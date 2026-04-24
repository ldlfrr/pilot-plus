/**
 * Subscription limit helpers — shared between API routes.
 * NEVER import this from a route file to avoid Next.js bundling issues.
 */

// Per-tier analysis limits. null = unlimited.
export const TIER_LIMITS: Record<string, number | null> = {
  free:       1,
  basic:      10,
  pro:        50,
  enterprise: null,
  lifetime:   null,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseServerClient = any

/**
 * Returns the subscription tier for a user.
 * Falls back to 'free' on any error (fail-closed).
 */
export async function getUserTier(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single()

    if (error) {
      console.warn('[subscription] profile read error (column may not exist yet):', error.message)
      return 'free'
    }

    const tier = (data as { subscription_tier?: unknown })?.subscription_tier
    if (typeof tier === 'string' && tier in TIER_LIMITS) return tier

    console.warn('[subscription] unknown tier value:', tier, '— defaulting to free')
    return 'free'
  } catch (err) {
    console.error('[subscription] unexpected error in getUserTier:', err)
    return 'free'
  }
}

/**
 * Counts all analyses visible to the current authenticated user.
 * Relies on Supabase RLS — the user can only see their own analyses.
 * Returns 9999 on error (fail-closed).
 */
export async function countUserAnalyses(supabase: SupabaseServerClient): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('project_analyses')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('[subscription] countUserAnalyses error:', error.message)
      return 9999 // fail-closed
    }

    return count ?? 0
  } catch (err) {
    console.error('[subscription] unexpected error in countUserAnalyses:', err)
    return 9999 // fail-closed
  }
}
