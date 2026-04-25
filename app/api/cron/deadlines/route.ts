export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendDeadlineAlert } from '@/lib/email'

// Called by Vercel Cron every day at 08:00 UTC
// vercel.json: { "crons": [{ "path": "/api/cron/deadlines", "schedule": "0 8 * * *" }] }

export async function GET(req: Request) {
  // Verify cron secret
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Find projects with deadline in 7 or 3 days, still pending
  const in7 = new Date(today); in7.setDate(in7.getDate() + 7)
  const in3 = new Date(today); in3.setDate(in3.getDate() + 3)

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, client, offer_deadline, user_id')
    .eq('outcome', 'pending')
    .not('offer_deadline', 'is', null)
    .in('offer_deadline', [
      in7.toISOString().split('T')[0],
      in3.toISOString().split('T')[0],
    ])

  if (!projects?.length) return NextResponse.json({ sent: 0 })

  let sent = 0
  const errors: string[] = []

  for (const project of projects) {
    try {
      // Get user email and notification prefs
      const { data: authUser } = await supabase.auth.admin.getUserById(project.user_id)
      if (!authUser?.user?.email) continue

      // Check if user has deadline notifications enabled (stored in profile or just always send)
      const deadline = new Date(project.offer_deadline)
      const daysLeft = Math.round((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      await sendDeadlineAlert({
        to: authUser.user.email,
        projectName: project.name,
        client: project.client,
        daysLeft,
        deadline: deadline.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
        projectUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/projects/${project.id}`,
      })
      sent++
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e))
    }
  }

  return NextResponse.json({ sent, errors: errors.length ? errors : undefined })
}
