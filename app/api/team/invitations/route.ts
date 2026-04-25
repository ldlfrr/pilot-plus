import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** GET /api/team/invitations?teamId=xxx — pending team invitations (owner only) */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const teamId = req.nextUrl.searchParams.get('teamId')

  let teamQuery = supabase.from('teams').select('id').eq('owner_id', user.id)
  if (teamId) teamQuery = teamQuery.eq('id', teamId)

  const { data: teams } = await teamQuery
  if (!teams || teams.length === 0) return NextResponse.json({ invitations: [] })

  const teamIds = teams.map(t => t.id)

  const { data } = await supabase
    .from('invitations')
    .select('id, invited_email, role, token, created_at, team_id')
    .eq('type', 'team')
    .in('team_id', teamIds)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  return NextResponse.json({ invitations: data ?? [] })
}
