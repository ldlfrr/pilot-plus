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

// Tier ordering — higher = more access
const TIER_RANK: Record<string, number> = {
  free: 0, basic: 1, pro: 2, enterprise: 3, lifetime: 3,
}

/**
 * Feature gate definitions.
 * Key = feature slug, value = minimum tier required.
 */
export const FEATURE_MIN_TIER: Record<string, string> = {
  // Available from basic
  rapport_detaille:  'basic',
  find_contacts:     'basic',
  // Available from pro
  export_pdf:        'pro',
  response_plan:     'pro',
  veille_boamp:      'pro',
  email_campaigns:   'pro',
  partage_projets:   'pro',
  // Enterprise only
  api_access:          'enterprise',
  brief_avant_vente:   'enterprise',
}

/**
 * Returns null if the user's tier satisfies the minimum, or a 402 error payload.
 */
export function checkFeatureGate(
  tier: string,
  feature: keyof typeof FEATURE_MIN_TIER,
): { error: string; code: string; upgrade_url: string } | null {
  const userRank = TIER_RANK[tier] ?? 0
  const minTier  = FEATURE_MIN_TIER[feature] ?? 'enterprise'
  const minRank  = TIER_RANK[minTier] ?? 3

  if (userRank >= minRank) return null

  const tierLabel: Record<string, string> = {
    basic: 'Basic (49 €/mois)', pro: 'Pro (149 €/mois)', enterprise: 'Entreprise (499 €/mois)',
  }
  const featureLabel: Record<string, string> = {
    rapport_detaille: 'Le rapport détaillé',
    find_contacts:    'Find contacts',
    export_pdf:       "L'export PDF",
    response_plan:    'Le plan de réponse IA',
    veille_boamp:     'La veille BOAMP',
    email_campaigns:  'Les campagnes email IA',
    partage_projets:  'Le partage de projets',
    api_access:         "L'accès API PILOT+",
    brief_avant_vente:  'Le Brief Avant-Vente IA',
  }

  return {
    error:       `${featureLabel[feature] ?? 'Cette fonctionnalité'} est disponible à partir du plan ${tierLabel[minTier] ?? minTier}.`,
    code:        'FEATURE_GATED',
    upgrade_url: '/subscription',
  }
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
