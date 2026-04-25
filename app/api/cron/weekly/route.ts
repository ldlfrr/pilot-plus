export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendWeeklySummary } from '@/lib/email'

// Called by Vercel Cron every Monday at 07:00 UTC
// vercel.json: { "crons": [{ "path": "/api/cron/weekly", "schedule": "0 7 * * 1" }] }

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const today = new Date()
  const in14 = new Date(today); in14.setDate(in14.getDate() + 14)

  // Get all active users (with profiles)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')

  if (!profiles?.length) return NextResponse.json({ sent: 0 })

  let sent = 0

  for (const profile of profiles) {
    try {
      const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
      if (!authUser?.user?.email) continue

      // Aggregate user's project data
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, outcome, offer_deadline')
        .eq('user_id', profile.id)

      if (!projects?.length) continue

      const pending = projects.filter(p => p.outcome === 'pending')

      const { data: scores } = await supabase
        .from('project_scores')
        .select('verdict, project_id')
        .in('project_id', projects.map(p => p.id))

      const goCount    = scores?.filter(s => s.verdict === 'GO').length ?? 0
      const noGoCount  = scores?.filter(s => s.verdict === 'NO_GO').length ?? 0

      const upcomingDeadlines = pending
        .filter(p => p.offer_deadline)
        .map(p => ({
          name: p.name,
          daysLeft: Math.round((new Date(p.offer_deadline).getTime() - today.getTime()) / 86400000),
        }))
        .filter(p => p.daysLeft >= 0 && p.daysLeft <= 14)
        .sort((a, b) => a.daysLeft - b.daysLeft)

      await sendWeeklySummary({
        to: authUser.user.email,
        userName: profile.full_name ?? authUser.user.email.split('@')[0],
        totalProjects: projects.length,
        pendingProjects: pending.length,
        upcomingDeadlines,
        goCount,
        noGoCount,
      })
      sent++
    } catch { /* skip user on error */ }
  }

  return NextResponse.json({ sent })
}
