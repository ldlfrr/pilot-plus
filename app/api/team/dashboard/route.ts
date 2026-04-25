import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface MemberStats {
  user_id:        string
  full_name:      string | null
  email:          string
  role:           string
  total_projects: number
  go_count:       number
  no_go_count:    number
  pending_count:  number
  won_count:      number
  lost_count:     number
  pipeline_value: number   // sum of chiffrage montants
  go_rate:        number   // 0–100
}

export interface TeamDashboard {
  team_id:         string
  team_name:       string
  total_members:   number
  total_projects:  number
  go_count:        number
  no_go_count:     number
  won_count:       number
  lost_count:      number
  pipeline_value:  number
  go_rate:         number
  members:         MemberStats[]
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const teamIdParam = req.nextUrl.searchParams.get('teamId')

  // 1. Find a team where the user is admin
  let membershipQuery = supabase
    .from('team_members')
    .select('team_id, role')
    .eq('user_id', user.id)
    .eq('role', 'admin')

  if (teamIdParam) {
    membershipQuery = membershipQuery.eq('team_id', teamIdParam)
  }

  const { data: memberships } = await membershipQuery
    .order('joined_at', { ascending: true })
    .limit(1)

  const membership = memberships?.[0]
  if (!membership) {
    return NextResponse.json({ error: 'Accès réservé aux admins' }, { status: 403 })
  }

  const { data: team } = await supabase
    .from('teams')
    .select('id, name')
    .eq('id', membership.team_id)
    .single()

  if (!team) return NextResponse.json({ error: 'Équipe introuvable' }, { status: 404 })

  // 2. Get all team members with profiles
  const { data: members } = await supabase
    .from('team_members')
    .select('id, user_id, role, joined_at, profiles(email, full_name)')
    .eq('team_id', team.id)
    .order('joined_at', { ascending: true })

  const teamMembers = (members ?? []).map((m: Record<string, unknown>) => {
    const profile = m.profiles as { email: string; full_name: string | null } | null
    return {
      user_id:   m.user_id as string,
      full_name: profile?.full_name ?? null,
      email:     profile?.email ?? '',
      role:      m.role as string,
    }
  })

  const memberUserIds = teamMembers.map(m => m.user_id)
  if (memberUserIds.length === 0) {
    return NextResponse.json({
      dashboard: {
        team_id: team.id, team_name: team.name, total_members: 0,
        total_projects: 0, go_count: 0, no_go_count: 0, won_count: 0,
        lost_count: 0, pipeline_value: 0, go_rate: 0, members: [],
      }
    })
  }

  // 3. Fetch all projects owned by team members
  const { data: projects } = await supabase
    .from('projects')
    .select('id, user_id, outcome, task_states')
    .in('user_id', memberUserIds)

  // 4. Fetch latest score per project
  const projectIds = (projects ?? []).map((p: { id: string }) => p.id)
  const scoreMap = new Map<string, { verdict: string }>()

  if (projectIds.length > 0) {
    const { data: scores } = await supabase
      .from('project_scores')
      .select('project_id, verdict, created_at')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })

    for (const s of (scores ?? [])) {
      if (!scoreMap.has(s.project_id)) {
        scoreMap.set(s.project_id, { verdict: s.verdict })
      }
    }
  }

  // 5. Build per-member stats
  const memberStats: MemberStats[] = teamMembers.map(m => {
    const myProjects = (projects ?? []).filter(
      (p: { user_id: string }) => p.user_id === m.user_id
    )

    let go_count = 0, no_go_count = 0, won_count = 0, lost_count = 0, pipeline_value = 0

    for (const p of myProjects) {
      const verdict = scoreMap.get(p.id)?.verdict
      if (verdict === 'GO')       go_count++
      if (verdict === 'NO_GO')    no_go_count++
      if (p.outcome === 'won')    won_count++
      if (p.outcome === 'lost')   lost_count++

      // Extract chiffrage from task_states
      const ts = p.task_states as Record<string, unknown> | null
      const montant = (ts?.chiffrage as Record<string, unknown> | null)?.montant
      if (typeof montant === 'number') pipeline_value += montant
    }

    const scored = go_count + no_go_count
    const go_rate = scored > 0 ? Math.round((go_count / scored) * 100) : 0

    return {
      ...m,
      total_projects: myProjects.length,
      go_count,
      no_go_count,
      pending_count: myProjects.filter((p: { outcome: string }) => p.outcome === 'pending').length,
      won_count,
      lost_count,
      pipeline_value,
      go_rate,
    }
  })

  // 6. Aggregate
  const totals = memberStats.reduce(
    (acc, m) => ({
      total_projects: acc.total_projects + m.total_projects,
      go_count:       acc.go_count       + m.go_count,
      no_go_count:    acc.no_go_count    + m.no_go_count,
      won_count:      acc.won_count      + m.won_count,
      lost_count:     acc.lost_count     + m.lost_count,
      pipeline_value: acc.pipeline_value + m.pipeline_value,
    }),
    { total_projects: 0, go_count: 0, no_go_count: 0, won_count: 0, lost_count: 0, pipeline_value: 0 }
  )

  const scored = totals.go_count + totals.no_go_count
  const go_rate = scored > 0 ? Math.round((totals.go_count / scored) * 100) : 0

  const dashboard: TeamDashboard = {
    team_id:        team.id,
    team_name:      team.name,
    total_members:  teamMembers.length,
    ...totals,
    go_rate,
    members:        memberStats,
  }

  return NextResponse.json({ dashboard })
}
