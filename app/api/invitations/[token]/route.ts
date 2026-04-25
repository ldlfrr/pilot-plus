import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ token: string }> }

/** GET /api/invitations/[token] — get invitation details (public, no auth required) */
export async function GET(_req: Request, { params }: Params) {
  const { token } = await params
  const supabase  = await createClient()

  const { data: invitation } = await supabase
    .from('invitations')
    .select('id, type, project_id, team_id, project_name, team_name, inviter_name, role, status, expires_at')
    .eq('token', token)
    .single()

  if (!invitation) return NextResponse.json({ error: 'Invitation introuvable ou expirée' }, { status: 404 })

  // Check expiry
  if (new Date(invitation.expires_at) < new Date() && invitation.status === 'pending') {
    await supabase.from('invitations').update({ status: 'expired' }).eq('token', token)
    return NextResponse.json({ error: 'Cette invitation a expiré' }, { status: 410 })
  }

  return NextResponse.json({ invitation })
}

/** POST /api/invitations/[token] — accept or decline */
export async function POST(req: Request, { params }: Params) {
  const { token } = await params
  const supabase  = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé — connectez-vous d\'abord' }, { status: 401 })

  const { action } = await req.json() as { action: 'accept' | 'decline' }

  // Get invitation
  const { data: invitation } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .single()

  if (!invitation) return NextResponse.json({ error: 'Invitation introuvable' }, { status: 404 })
  if (invitation.status !== 'pending') return NextResponse.json({ error: `Invitation déjà ${invitation.status}` }, { status: 400 })
  if (new Date(invitation.expires_at) < new Date()) {
    await supabase.from('invitations').update({ status: 'expired' }).eq('id', invitation.id)
    return NextResponse.json({ error: 'Cette invitation a expiré' }, { status: 410 })
  }

  // Verify the logged-in user matches the invited email
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single()

  if (profile?.email?.toLowerCase() !== invitation.invited_email.toLowerCase()) {
    return NextResponse.json({
      error: `Cette invitation est destinée à ${invitation.invited_email}. Connectez-vous avec ce compte.`
    }, { status: 403 })
  }

  if (action === 'decline') {
    await supabase.from('invitations').update({ status: 'declined' }).eq('id', invitation.id)
    return NextResponse.json({ ok: true, action: 'declined' })
  }

  // ── ACCEPT ──────────────────────────────────────────────────────────────────

  if (invitation.type === 'project' && invitation.project_id) {
    // Don't add if already a member
    const { data: existing } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', invitation.project_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!existing) {
      const { error } = await supabase
        .from('project_members')
        .insert({
          project_id:  invitation.project_id,
          user_id:     user.id,
          role:        invitation.role,
          invited_by:  invitation.invited_by,
        })

      if (error && error.code !== '23505') {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    await supabase.from('invitations').update({ status: 'accepted' }).eq('id', invitation.id)
    return NextResponse.json({ ok: true, action: 'accepted', type: 'project', projectId: invitation.project_id })
  }

  if (invitation.type === 'team' && invitation.team_id) {
    const { data: existing } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', invitation.team_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!existing) {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id:  invitation.team_id,
          user_id:  user.id,
          role:     invitation.role,
        })

      if (error && error.code !== '23505') {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    await supabase.from('invitations').update({ status: 'accepted' }).eq('id', invitation.id)
    return NextResponse.json({ ok: true, action: 'accepted', type: 'team', teamId: invitation.team_id })
  }

  return NextResponse.json({ error: 'Type d\'invitation invalide' }, { status: 400 })
}

/** DELETE /api/invitations/[token] — cancel (inviter only) */
export async function DELETE(_req: Request, { params }: Params) {
  const { token } = await params
  const supabase  = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  await supabase
    .from('invitations')
    .update({ status: 'expired' })
    .eq('token', token)
    .eq('invited_by', user.id)

  return NextResponse.json({ ok: true })
}
