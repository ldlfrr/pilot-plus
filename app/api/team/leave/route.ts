import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/team/leave
 * Body: { teamId }
 * Lets any team member leave a team.
 * Blocked if the user is the sole admin (they must promote someone or delete the team).
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { teamId } = await req.json() as { teamId: string }
  if (!teamId) return NextResponse.json({ error: 'teamId requis' }, { status: 400 })

  // Check if user is actually a member of this team
  const { data: myMembership } = await supabase
    .from('team_members')
    .select('id, role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!myMembership) {
    return NextResponse.json({ error: 'Vous n\'êtes pas membre de cette équipe' }, { status: 404 })
  }

  // If user is an admin, check they're not the sole admin
  if (myMembership.role === 'admin') {
    const { data: admins } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId)
      .eq('role', 'admin')

    if (admins && admins.length === 1) {
      return NextResponse.json({
        error: 'Vous êtes le seul admin. Promouvez un autre membre en admin avant de partir, ou supprimez l\'équipe.',
      }, { status: 400 })
    }
  }

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', myMembership.id)
    .eq('user_id', user.id)   // extra safety

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
