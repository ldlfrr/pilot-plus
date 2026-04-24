import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ token: string }> }

// Public endpoint — no auth required
export async function GET(_req: Request, { params }: Params) {
  const { token } = await params

  // Basic UUID validation to prevent DB scans with garbage input
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRe.test(token)) {
    return NextResponse.json({ error: 'Lien invalide' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  const { data: project, error } = await supabase
    .from('projects')
    .select('id, name, client, location, consultation_type, offer_deadline, status, task_states, created_at, updated_at')
    .eq('share_token', token)
    .single()

  if (error || !project) {
    return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 404 })
  }

  const [analysesRes, scoreRes] = await Promise.all([
    supabase
      .from('project_analyses')
      .select('*')
      .eq('project_id', project.id)
      .order('version', { ascending: false })
      .limit(1),
    supabase
      .from('project_scores')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false })
      .limit(1),
  ])

  return NextResponse.json({
    project,
    analysis: analysesRes.data?.[0] ?? null,
    score: scoreRes.data?.[0] ?? null,
  })
}
