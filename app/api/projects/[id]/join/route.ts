import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ id: string }> }

/**
 * POST /api/projects/[id]/join
 * Allows a team member to self-join a project shared in their team (as viewer).
 * Verifies the project is in a team the caller belongs to (via team_projects RLS).
 */
export async function POST(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Check the project is shared in one of the user's teams
  // team_projects RLS filters to the user's own teams automatically
  const { data: teamShare } = await supabase
    .from('team_projects')
    .select('id')
    .eq('project_id', id)
    .limit(1)
    .maybeSingle()

  if (!teamShare) {
    return NextResponse.json(
      { error: 'Ce projet n\'est pas partagé dans votre équipe' },
      { status: 403 },
    )
  }

  // Check not already owner
  const { data: owned } = await supabase
    .from('projects').select('id').eq('id', id).eq('user_id', user.id).maybeSingle()
  if (owned) return NextResponse.json({ error: 'Vous êtes déjà propriétaire' }, { status: 400 })

  // Upsert as viewer (idempotent)
  const { error } = await supabase
    .from('project_members')
    .upsert(
      { project_id: id, user_id: user.id, role: 'viewer' },
      { onConflict: 'project_id,user_id', ignoreDuplicates: false },
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, role: 'viewer' })
}
