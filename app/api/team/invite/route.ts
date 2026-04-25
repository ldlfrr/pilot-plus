import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// POST — invite member by email
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { email, role } = await req.json() as { email: string; role: 'admin' | 'member' | 'viewer' }
  if (!email?.trim()) return NextResponse.json({ error: 'Email requis' }, { status: 400 })

  // Find the team owned/admined by current user
  const { data: membership } = await supabase
    .from('team_members')
    .select('team_id, role')
    .eq('user_id', user.id)
    .in('role', ['owner', 'admin'])
    .limit(1)
    .single()

  if (!membership) return NextResponse.json({ error: 'Vous n\'êtes pas admin d\'une équipe' }, { status: 403 })

  // Find invited user by email using service client (auth.users)
  const service = createServiceClient()
  const { data: authUsers } = await service.auth.admin.listUsers()
  const invitedUser = authUsers?.users?.find(u => u.email?.toLowerCase() === email.trim().toLowerCase())

  if (!invitedUser) {
    return NextResponse.json({ error: 'Aucun compte PILOT+ trouvé pour cet email' }, { status: 404 })
  }

  // Check not already member
  const { data: existing } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', membership.team_id)
    .eq('user_id', invitedUser.id)
    .single()

  if (existing) return NextResponse.json({ error: 'Cet utilisateur est déjà membre' }, { status: 409 })

  // Add member
  const { data: newMember, error } = await supabase
    .from('team_members')
    .insert({ team_id: membership.team_id, user_id: invitedUser.id, role })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', invitedUser.id)
    .single()

  return NextResponse.json({
    member: {
      id: newMember.id,
      user_id: invitedUser.id,
      email: profile?.email ?? email.trim(),
      full_name: profile?.full_name ?? null,
      role,
      joined_at: newMember.joined_at,
    }
  }, { status: 201 })
}
