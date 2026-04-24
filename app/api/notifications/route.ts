import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface DeadlineNotification {
  id: string
  projectId: string
  projectName: string
  client: string
  deadline: string
  daysLeft: number
  urgency: 'critical' | 'high' | 'medium'
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ notifications: [] })

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, client, offer_deadline, outcome')
    .eq('user_id', user.id)
    .eq('outcome', 'pending')
    .not('offer_deadline', 'is', null)

  const now = Date.now()
  const notifications: DeadlineNotification[] = []

  for (const p of projects ?? []) {
    const daysLeft = Math.ceil((new Date(p.offer_deadline).getTime() - now) / 86400000)

    if (daysLeft < 0 || daysLeft > 14) continue

    notifications.push({
      id:          `deadline-${p.id}`,
      projectId:   p.id,
      projectName: p.name,
      client:      p.client,
      deadline:    p.offer_deadline,
      daysLeft,
      urgency:     daysLeft <= 3 ? 'critical' : daysLeft <= 7 ? 'high' : 'medium',
    })
  }

  notifications.sort((a, b) => a.daysLeft - b.daysLeft)

  return NextResponse.json({ notifications })
}
