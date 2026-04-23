import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { DashboardStats, ActivityDataPoint } from '@/types'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // Parallel queries
  const [projectsResult, scoresResult] = await Promise.all([
    supabase
      .from('projects')
      .select('id, status, created_at')
      .eq('user_id', user.id),
    supabase
      .from('project_scores')
      .select('verdict, project_id, created_at')
      .in(
        'project_id',
        (
          await supabase
            .from('projects')
            .select('id')
            .eq('user_id', user.id)
        ).data?.map((p) => p.id) ?? []
      ),
  ])

  const projects = projectsResult.data ?? []
  const scores = scoresResult.data ?? []

  const total_projects = projects.length
  const analyzed_projects = projects.filter(
    (p) => p.status === 'analyzed' || p.status === 'scored'
  ).length
  const go_count = scores.filter((s) => s.verdict === 'GO').length
  const no_go_count = scores.filter((s) => s.verdict === 'NO_GO').length
  const a_etudier_count = scores.filter((s) => s.verdict === 'A_ETUDIER').length
  const transformation_rate =
    total_projects > 0 ? Math.round((go_count / total_projects) * 100) : 0

  const en_cours_count = projects.filter(p => p.status !== 'scored').length

  const stats: DashboardStats = {
    total_projects,
    analyzed_projects,
    go_count,
    no_go_count,
    a_etudier_count,
    transformation_rate,
    en_cours_count,
  }

  // Build activity data: last 14 days
  const activityMap = new Map<string, { projects: number; analyses: number }>()

  const now = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    activityMap.set(key, { projects: 0, analyses: 0 })
  }

  projects.forEach((p) => {
    const key = new Date(p.created_at).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
    })
    const entry = activityMap.get(key)
    if (entry) entry.projects++
  })

  const activity: ActivityDataPoint[] = Array.from(activityMap.entries()).map(
    ([date, data]) => ({ date, ...data })
  )

  // Recent projects
  const recentProjects = projects
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5)

  return NextResponse.json({ stats, activity, recentProjects })
}
