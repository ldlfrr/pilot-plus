import { createClient } from '@supabase/supabase-js'

// Service-role client (no cookie auth) — for cron jobs and server-side admin tasks
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
