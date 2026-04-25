import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — get current user's team (or null)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Find team where user is owner or member
  const { data: membership } = await supabase
    .from('team_members')
    .select('team_id, role')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: true })
    .limit(1)
    .single()

  if (!membership) return NextResponse.json({ team: null })

  const { data: team } = await supabase
    .from('teams')
    .select('id, name, owner_id')
    .eq('id', membership.team_id)
    .single()

  if (!team) return NextResponse.json({ team: null })

  // Get members with profile info
  const { data: members } = await supabase
    .from('team_members')
    .select('id, user_id, role, joined_at, profiles(email, full_name)')
    .eq('team_id', team.id)
    .order('joined_at', { ascending: true })

  const formattedMembers = (members ?? []).map((m: Record<string, unknown>) => {
    const profile = m.profiles as { email: string; full_name: string | null } | null
    return {
      id: m.id,
      user_id: m.user_id,
      email: profile?.email ?? '',
      full_name: profile?.full_name ?? null,
      role: m.role,
      joined_at: m.joined_at,
    }
  })

  return NextResponse.json({ team: { ...team, members: formattedMembers } })
}

// POST — create team
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { name } = await req.json() as { name: string }

  // Create team
  const { data: team, error: teamErr } = await supabase
    .from('teams')
    .insert({ name: name?.trim() || 'Mon équipe', owner_id: user.id })
    .select()
    .single()

  if (teamErr) return NextResponse.json({ error: teamErr.message }, { status: 500 })

  // Add owner as first member
  await supabase.from('team_members').insert({
    team_id: team.id,
    user_id: user.id,
    role: 'owner',
  })

  // Get owner profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', user.id)
    .single()

  const ownerMember = {
    id: team.id + '-owner',
    user_id: user.id,
    email: profile?.email ?? user.email ?? '',
    full_name: profile?.full_name ?? null,
    role: 'owner' as const,
    joined_at: new Date().toISOString(),
  }

  return NextResponse.json({ team: { ...team, members: [ownerMember] } }, { status: 201 })
}

// PATCH — rename team
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { name } = await req.json() as { name: string }
  if (!name?.trim()) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })

  const { error } = await supabase
    .from('teams')
    .update({ name: name.trim() })
    .eq('owner_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
