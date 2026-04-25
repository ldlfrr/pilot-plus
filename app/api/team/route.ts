import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

async function getFormattedTeam(supabase: Awaited<ReturnType<typeof createClient>>, teamId: string) {
  const { data: team } = await supabase
    .from('teams')
    .select('id, name, owner_id')
    .eq('id', teamId)
    .single()

  if (!team) return null

  const { data: members } = await supabase
    .from('team_members')
    .select('id, user_id, role, joined_at, profiles(email, full_name)')
    .eq('team_id', teamId)
    .order('joined_at', { ascending: true })

  const formattedMembers = (members ?? []).map((m: Record<string, unknown>) => {
    const profile = m.profiles as { email: string; full_name: string | null } | null
    return {
      id:        m.id,
      user_id:   m.user_id,
      email:     profile?.email ?? '',
      full_name: profile?.full_name ?? null,
      role:      m.role,
      joined_at: m.joined_at,
    }
  })

  return { ...team, members: formattedMembers }
}

// ─── GET — all teams the current user belongs to ──────────────────────────────

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // All team_ids the user is a member of
  const { data: memberships } = await supabase
    .from('team_members')
    .select('team_id, role, joined_at')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: true })

  if (!memberships || memberships.length === 0) {
    return NextResponse.json({ teams: [] })
  }

  const teams = await Promise.all(
    memberships.map(m => getFormattedTeam(supabase, m.team_id as string))
  )

  return NextResponse.json({ teams: teams.filter(Boolean) })
}

// ─── POST — create a new team ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { name } = await req.json() as { name: string }

  const { data: team, error: teamErr } = await supabase
    .from('teams')
    .insert({ name: name?.trim() || 'Mon équipe', owner_id: user.id })
    .select()
    .single()

  if (teamErr) return NextResponse.json({ error: teamErr.message }, { status: 500 })

  // Add creator as first member with admin role
  const { data: newMember, error: memberErr } = await supabase
    .from('team_members')
    .insert({ team_id: team.id, user_id: user.id, role: 'admin' })
    .select()
    .single()

  if (memberErr) {
    // Rollback team creation if member insert fails
    await supabase.from('teams').delete().eq('id', team.id)
    return NextResponse.json({ error: memberErr.message }, { status: 500 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', user.id)
    .single()

  const formattedTeam = {
    ...team,
    members: [{
      id:        newMember?.id ?? `${team.id}-admin`,
      user_id:   user.id,
      email:     profile?.email ?? user.email ?? '',
      full_name: profile?.full_name ?? null,
      role:      'admin' as const,
      joined_at: new Date().toISOString(),
    }],
  }

  return NextResponse.json({ team: formattedTeam }, { status: 201 })
}

// ─── DELETE — delete a team (admin only) ─────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { teamId } = await req.json() as { teamId: string }
  if (!teamId) return NextResponse.json({ error: 'teamId requis' }, { status: 400 })

  // Verify caller is admin of this team
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle()

  if (!membership) return NextResponse.json({ error: 'Réservé aux admins' }, { status: 403 })

  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', teamId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// ─── PATCH — rename a team (admin only) ──────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { teamId, name } = await req.json() as { teamId: string; name: string }
  if (!teamId) return NextResponse.json({ error: 'teamId requis' }, { status: 400 })
  if (!name?.trim()) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })

  // Verify caller is admin of this team
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle()

  if (!membership) return NextResponse.json({ error: 'Réservé aux admins' }, { status: 403 })

  const { error } = await supabase
    .from('teams')
    .update({ name: name.trim() })
    .eq('id', teamId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
