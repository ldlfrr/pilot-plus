import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** GET /api/team/invitations — pending team invitations (owner only) */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Find team owned by user
  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!team) return NextResponse.json({ invitations: [] })

  const { data } = await supabase
    .from('invitations')
    .select('id, invited_email, role, token, created_at')
    .eq('type', 'team')
    .eq('team_id', team.id)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  return NextResponse.json({ invitations: data ?? [] })
}
