import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/invitations/auto-accept
 * Called after a new user signs up via an invitation link.
 * Accepts ALL pending invitations for the user's email.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single()

  const userEmail = (profile?.email ?? user.email ?? '').toLowerCase()
  if (!userEmail) return NextResponse.json({ accepted: [] })

  // Fetch all pending invitations for this email
  const { data: invitations } = await supabase
    .from('invitations')
    .select('*')
    .eq('invited_email', userEmail)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())

  const accepted: string[] = []

  for (const inv of invitations ?? []) {
    try {
      if (inv.type === 'project' && inv.project_id) {
        await supabase.from('project_members').insert({
          project_id: inv.project_id,
          user_id:    user.id,
          role:       inv.role,
          invited_by: inv.invited_by,
        })
        accepted.push(inv.project_id)
      } else if (inv.type === 'team' && inv.team_id) {
        await supabase.from('team_members').insert({
          team_id:  inv.team_id,
          user_id:  user.id,
          role:     inv.role,
        })
      }
      await supabase.from('invitations').update({ status: 'accepted' }).eq('id', inv.id)
    } catch {
      // duplicate key = already a member, mark as accepted anyway
      await supabase.from('invitations').update({ status: 'accepted' }).eq('id', inv.id)
    }
  }

  return NextResponse.json({ accepted, count: accepted.length })
}
