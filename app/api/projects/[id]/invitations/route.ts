import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProjectAccess } from '@/lib/project-access'

interface Params { params: Promise<{ id: string }> }

/** GET — list pending invitations for this project (owner only) */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const access = await getProjectAccess(supabase, id, user.id)
  if (!access || access.role !== 'owner')
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { data } = await supabase
    .from('invitations')
    .select('id, invited_email, role, created_at, token, status')
    .eq('type', 'project')
    .eq('project_id', id)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  return NextResponse.json({ invitations: data ?? [] })
}
