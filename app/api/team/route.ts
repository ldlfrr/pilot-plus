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

  // Step 1: fetch team members (no embedding — avoids PostgREST FK resolution issues)
  const { data: memberRows } = await supabase
    .from('team_members')
    .select('id, user_id, role, joined_at')
    .eq('team_id', teamId)
    .order('joined_at', { ascending: true })

  const rows = memberRows ?? []

  // Step 2: fetch profiles for those user_ids
  const userIds = rows.map(m => m.user_id as string).filter(Boolean)
  let profileMap: Record<string, { email: string; full_name: string | null }> = {}
  if (userIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds)
    for (const p of profilesData ?? []) {
      profileMap[p.id] = { email: p.email ?? '', full_name: p.full_name ?? null }
    }
  }

  const formattedMembers = rows.map(m => ({
    id:        m.id,
    user_id:   m.user_id,
    email:     profileMap[m.user_id as string]?.email ?? '',
    full_name: profileMap[m.user_id as string]?.full_name ?? null,
    role:      m.role,
    joined_at: m.joined_at,
  }))

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

  // Step 1: Insert team — owner can SELECT their own team via teams_select policy (owner_id = auth.uid())
  const { data: team, error: teamErr } = await supabase
    .from('teams')
    .insert({ name: name?.trim() || 'Mon équipe', owner_id: user.id })
    .select('id, name, owner_id')
    .single()

  if (teamErr) return NextResponse.json({ error: teamErr.message }, { status: 500 })

  // Step 2: Add creator as admin member
  const { error: memberErr } = await supabase
    .from('team_members')
    .insert({ team_id: team.id, user_id: user.id, role: 'admin' })

  if (memberErr) {
    // Rollback: delete the orphan team
    await supabase.from('teams').delete().eq('id', team.id)
    return NextResponse.json({ error: memberErr.message }, { status: 500 })
  }

  // Step 3: Return fully formatted team (user is now a member, getFormattedTeam works)
  const formattedTeam = await getFormattedTeam(supabase, team.id)
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
