import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProjectAccess } from '@/lib/project-access'

interface Params { params: Promise<{ id: string }> }

/** GET /api/projects/[id]/members/me — returns the current user's role on this project */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const access = await getProjectAccess(supabase, id, user.id)
  if (!access) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })

  return NextResponse.json({ role: access.role, canEdit: access.canEdit })
}
