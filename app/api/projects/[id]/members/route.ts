import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProjectAccess } from '@/lib/project-access'

interface Params { params: Promise<{ id: string }> }

// GET — list project members
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const access = await getProjectAccess(supabase, id, user.id)
  if (!access) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })

  const { data: members } = await supabase
    .from('project_members')
    .select('id, user_id, role, created_at, profiles(full_name, email)')
    .eq('project_id', id)
    .order('created_at', { ascending: true })

  const formatted = (members ?? []).map((m: Record<string, unknown>) => {
    const p = m.profiles as { full_name?: string; email?: string } | null
    return {
      id:         m.id,
      user_id:    m.user_id,
      role:       m.role,
      full_name:  p?.full_name ?? null,
      email:      p?.email ?? '',
      created_at: m.created_at,
    }
  })

  return NextResponse.json({ members: formatted })
}

// POST — add a member by email
export async function POST(req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Only owner can add members
  const access = await getProjectAccess(supabase, id, user.id)
  if (!access)           return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })
  if (access.role !== 'owner') return NextResponse.json({ error: 'Seul le propriétaire peut ajouter des membres' }, { status: 403 })

  const { email, role = 'editor' } = await req.json() as { email: string; role?: string }
  if (!email?.trim()) return NextResponse.json({ error: 'Email requis' }, { status: 400 })

  // Find the user by email in profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('email', email.trim().toLowerCase())
    .single()

  if (!profile) {
    return NextResponse.json(
      { error: `Aucun compte PILOT+ trouvé pour ${email}. L'utilisateur doit d'abord créer un compte.` },
      { status: 404 }
    )
  }

  if (profile.id === user.id) {
    return NextResponse.json({ error: 'Vous êtes déjà propriétaire de ce projet' }, { status: 400 })
  }

  // Add to project_members
  const { data: member, error } = await supabase
    .from('project_members')
    .insert({ project_id: id, user_id: profile.id, role, invited_by: user.id })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Cet utilisateur a déjà accès à ce projet' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    member: {
      id:         member.id,
      user_id:    profile.id,
      role:       member.role,
      full_name:  profile.full_name,
      email:      profile.email,
      created_at: member.created_at,
    }
  }, { status: 201 })
}

// PATCH — change a member's role
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const access = await getProjectAccess(supabase, id, user.id)
  if (!access || access.role !== 'owner') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { memberId, role } = await req.json() as { memberId: string; role: string }

  const { error } = await supabase
    .from('project_members').update({ role }).eq('id', memberId).eq('project_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE — remove a member
export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const access = await getProjectAccess(supabase, id, user.id)
  if (!access || access.role !== 'owner') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { memberId } = await req.json() as { memberId: string }

  await supabase.from('project_members').delete().eq('id', memberId).eq('project_id', id)

  return NextResponse.json({ ok: true })
}
