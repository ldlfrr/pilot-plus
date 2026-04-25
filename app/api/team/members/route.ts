import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH — change member role
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { memberId, role } = await req.json() as { memberId: string; role: string }

  // Ensure current user is owner/admin
  const { data: callerMembership } = await supabase
    .from('team_members')
    .select('team_id, role')
    .eq('user_id', user.id)
    .in('role', ['owner', 'admin'])
    .limit(1)
    .single()

  if (!callerMembership) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { error } = await supabase
    .from('team_members')
    .update({ role })
    .eq('id', memberId)
    .eq('team_id', callerMembership.team_id)
    .neq('role', 'owner') // never change owner role

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE — remove member
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { memberId } = await req.json() as { memberId: string }

  // Ensure current user is owner/admin
  const { data: callerMembership } = await supabase
    .from('team_members')
    .select('team_id, role')
    .eq('user_id', user.id)
    .in('role', ['owner', 'admin'])
    .limit(1)
    .single()

  if (!callerMembership) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', memberId)
    .eq('team_id', callerMembership.team_id)
    .neq('role', 'owner')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
