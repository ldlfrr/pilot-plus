import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, projectInvitationEmail, teamInvitationEmail } from '@/lib/email'

/**
 * POST /api/invitations
 * Body: { type: 'project'|'team', projectId?|teamId?, email, role }
 * Creates an invitation + sends email.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await req.json() as {
      type:       'project' | 'team'
      projectId?: string
      teamId?:    string
      email:      string
      role:       string
    }

    const { type, email, role } = body
    const normalizedEmail = email?.trim().toLowerCase()

    if (!normalizedEmail) return NextResponse.json({ error: 'Email requis' }, { status: 400 })

    // Get inviter's profile
    const { data: inviterProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()
    const inviterName = inviterProfile?.full_name ?? inviterProfile?.email ?? 'Un utilisateur'

    // Check if invitee already has an account
    const { data: inviteeProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle()

    const isNewUser = !inviteeProfile

    let projectName: string | null = null
    let teamName:    string | null = null
    let projectId:   string | null = null
    let teamId:      string | null = null

    if (type === 'project') {
      projectId = body.projectId ?? null
      if (!projectId) return NextResponse.json({ error: 'projectId requis' }, { status: 400 })

      // Verify requester owns / can manage this project
      const { data: proj } = await supabase
        .from('projects')
        .select('id, name, user_id')
        .eq('id', projectId)
        .single()

      if (!proj) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })
      if (proj.user_id !== user.id)
        return NextResponse.json({ error: 'Seul le propriétaire peut inviter' }, { status: 403 })

      projectName = proj.name

      // Don't re-invite owner
      if (inviteeProfile?.id === user.id)
        return NextResponse.json({ error: 'Vous êtes déjà propriétaire de ce projet' }, { status: 400 })

      // Check already a member
      if (inviteeProfile) {
        const { data: existingMember } = await supabase
          .from('project_members')
          .select('id')
          .eq('project_id', projectId)
          .eq('user_id', inviteeProfile.id)
          .maybeSingle()

        if (existingMember)
          return NextResponse.json({ error: 'Cet utilisateur est déjà membre du projet' }, { status: 409 })
      }

      // Check no pending invitation already
      const { data: existing } = await supabase
        .from('invitations')
        .select('id, status')
        .eq('type', 'project')
        .eq('project_id', projectId)
        .eq('invited_email', normalizedEmail)
        .eq('status', 'pending')
        .maybeSingle()

      if (existing) return NextResponse.json({ error: 'Une invitation est déjà en attente pour cet email' }, { status: 409 })

    } else if (type === 'team') {
      teamId = body.teamId ?? null
      if (!teamId) return NextResponse.json({ error: 'teamId requis' }, { status: 400 })

      const { data: team } = await supabase
        .from('teams')
        .select('id, name')
        .eq('id', teamId)
        .single()

      if (!team) return NextResponse.json({ error: 'Équipe introuvable' }, { status: 404 })

      // Only admins of this team can invite
      const { data: callerMembership } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle()

      if (!callerMembership)
        return NextResponse.json({ error: 'Seul un admin peut inviter' }, { status: 403 })

      teamName = team.name

      if (inviteeProfile) {
        const { data: existingMember } = await supabase
          .from('team_members')
          .select('id')
          .eq('team_id', teamId)
          .eq('user_id', inviteeProfile.id)
          .maybeSingle()

        if (existingMember)
          return NextResponse.json({ error: 'Cet utilisateur est déjà dans l\'équipe' }, { status: 409 })
      }

      const { data: existing } = await supabase
        .from('invitations')
        .select('id')
        .eq('type', 'team')
        .eq('team_id', teamId)
        .eq('invited_email', normalizedEmail)
        .eq('status', 'pending')
        .maybeSingle()

      if (existing) return NextResponse.json({ error: 'Une invitation est déjà en attente pour cet email' }, { status: 409 })
    } else {
      return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
    }

    // Create invitation record
    const { data: invitation, error: invErr } = await supabase
      .from('invitations')
      .insert({
        type,
        project_id:   projectId,
        team_id:      teamId,
        project_name: projectName,
        team_name:    teamName,
        inviter_name: inviterName,
        invited_email: normalizedEmail,
        invited_by:   user.id,
        role,
      })
      .select()
      .single()

    if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 })

    // Send email
    try {
      let emailPayload: { subject: string; html: string }
      if (type === 'project') {
        emailPayload = projectInvitationEmail({
          inviterName,
          projectName: projectName!,
          role,
          token: invitation.token,
          isNewUser,
        })
      } else {
        emailPayload = teamInvitationEmail({
          inviterName,
          teamName: teamName!,
          role,
          token: invitation.token,
          isNewUser,
        })
      }

      await sendEmail({ to: normalizedEmail, ...emailPayload })
    } catch (emailErr) {
      // Don't fail the whole request if email fails
      console.warn('[invitations] Email send failed:', emailErr)
    }

    return NextResponse.json({
      invitation: {
        id:     invitation.id,
        token:  invitation.token,
        status: invitation.status,
        type,
      },
      isNewUser,
    }, { status: 201 })

  } catch (err) {
    console.error('[invitations POST]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * GET /api/invitations — list invitations for the current user
 * ?history=1 → returns accepted/declined/expired (for notification history)
 */
export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single()

  const userEmail = (profile?.email ?? user.email ?? '').toLowerCase()
  if (!userEmail) return NextResponse.json({ invitations: [] })

  const isHistory = new URL(req.url).searchParams.get('history') === '1'

  const query = supabase
    .from('invitations')
    .select('id, type, project_id, team_id, project_name, team_name, inviter_name, role, token, status, created_at, expires_at')
    .eq('invited_email', userEmail)
    .order('created_at', { ascending: false })
    .limit(30)

  if (isHistory) {
    query.in('status', ['accepted', 'declined', 'expired'])
  } else {
    query.eq('status', 'pending').gt('expires_at', new Date().toISOString())
  }

  const { data } = await query
  return NextResponse.json({ invitations: data ?? [] })
}
