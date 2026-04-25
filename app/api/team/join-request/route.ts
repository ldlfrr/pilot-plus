import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

// ── POST /api/team/join-request ───────────────────────────────────────────────
// Body: { teamId: string, message?: string }
// Submits a request to join a team. Notifies all admins by email.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { teamId, message } = await req.json() as { teamId?: string; message?: string }
  if (!teamId?.trim()) return NextResponse.json({ error: 'ID d\'équipe requis' }, { status: 400 })

  // Team must exist
  const { data: team } = await supabase
    .from('teams')
    .select('id, name')
    .eq('id', teamId.trim())
    .single()

  if (!team) return NextResponse.json({ error: 'Équipe introuvable — vérifiez l\'ID' }, { status: 404 })

  // User must not already be a member
  const { data: existing } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Vous êtes déjà membre de cette équipe' }, { status: 409 })

  // No pending request already
  const { data: existingRequest } = await supabase
    .from('team_join_requests')
    .select('id, status')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingRequest) {
    if (existingRequest.status === 'pending')
      return NextResponse.json({ error: 'Vous avez déjà une demande en attente pour cette équipe' }, { status: 409 })
    // Rejected before — allow re-request (update status back to pending)
    const { error: upErr } = await supabase
      .from('team_join_requests')
      .update({ status: 'pending', message: message?.trim() ?? null })
      .eq('id', existingRequest.id)
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
  } else {
    const { error: insErr } = await supabase
      .from('team_join_requests')
      .insert({ team_id: teamId, user_id: user.id, message: message?.trim() ?? null })
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  }

  // Get requester profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()
  const requesterName = profile?.full_name ?? profile?.email ?? 'Quelqu\'un'

  // Notify all admins of the team by email
  const { data: admins } = await supabase
    .from('team_members')
    .select('user_id, profiles(email, full_name)')
    .eq('team_id', teamId)
    .eq('role', 'admin')

  for (const admin of admins ?? []) {
    const p = admin.profiles as { email?: string } | null
    const adminEmail = p?.email
    if (!adminEmail) continue
    try {
      await sendEmail({
        to: adminEmail,
        subject: `🙋 Demande pour rejoindre "${team.name}"`,
        html: `<!DOCTYPE html><html><body style="background:#0a0f1e;font-family:system-ui;padding:40px 20px;color:#fff;">
<div style="max-width:520px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#3b82f6,#2563eb);border-radius:16px;padding:32px;margin-bottom:24px;">
    <h2 style="margin:0;font-size:20px;font-weight:800;">Nouvelle demande d'accès</h2>
    <p style="margin:8px 0 0;opacity:0.8;font-size:14px;">équipe <strong>${team.name}</strong></p>
  </div>
  <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:12px;padding:24px;margin-bottom:20px;">
    <p style="font-size:15px;margin:0 0 8px;"><strong style="color:#93c5fd;">${requesterName}</strong> souhaite rejoindre votre équipe.</p>
    ${message?.trim() ? `<p style="font-size:13px;color:rgba(255,255,255,0.55);margin:12px 0 0;padding:12px;background:rgba(255,255,255,0.04);border-radius:8px;border-left:3px solid rgba(59,130,246,0.5);">"${message.trim()}"</p>` : ''}
  </div>
  <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.pilot-plus.fr'}/team"
     style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;">
    Voir les demandes →
  </a>
  <p style="font-size:11px;color:rgba(255,255,255,0.2);margin-top:28px;">PILOT+ · Gestion d'équipe</p>
</div></body></html>`,
      })
    } catch { /* email best-effort */ }
  }

  return NextResponse.json({ ok: true, teamName: team.name }, { status: 201 })
}

// ── GET /api/team/join-request?teamId=xxx ─────────────────────────────────────
// Returns pending join requests for a team (admin only).
// Without teamId: returns ALL pending requests across all admin teams (for notification bell).
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ requests: [] })

  const { searchParams } = new URL(req.url)
  const teamId = searchParams.get('teamId')

  if (teamId) {
    // Specific team — must be admin
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!membership) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

    const { data: requests } = await supabase
      .from('team_join_requests')
      .select('id, user_id, message, created_at, status')
      .eq('team_id', teamId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    // Enrich with profiles
    const userIds = (requests ?? []).map(r => r.user_id as string)
    let profileMap: Record<string, { email: string; full_name: string | null }> = {}
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds)
      for (const p of profiles ?? []) profileMap[p.id] = { email: p.email ?? '', full_name: p.full_name ?? null }
    }

    const enriched = (requests ?? []).map(r => ({
      ...r,
      email:     profileMap[r.user_id as string]?.email ?? '',
      full_name: profileMap[r.user_id as string]?.full_name ?? null,
    }))

    return NextResponse.json({ requests: enriched })
  }

  // No teamId — return count across all admin teams (for notification bell)
  const { data: adminTeams } = await supabase
    .from('team_members')
    .select('team_id, teams(name)')
    .eq('user_id', user.id)
    .eq('role', 'admin')

  if (!adminTeams || adminTeams.length === 0) return NextResponse.json({ requests: [] })

  const teamIds = adminTeams.map(t => t.team_id as string)
  const { data: requests } = await supabase
    .from('team_join_requests')
    .select('id, team_id, user_id, message, created_at')
    .in('team_id', teamIds)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  const userIds = (requests ?? []).map(r => r.user_id as string)
  let profileMap: Record<string, { email: string; full_name: string | null }> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds)
    for (const p of profiles ?? []) profileMap[p.id] = { email: p.email ?? '', full_name: p.full_name ?? null }
  }

  const teamNameMap: Record<string, string> = {}
  for (const t of adminTeams) {
    const tn = t.teams as { name?: string } | null
    teamNameMap[t.team_id as string] = tn?.name ?? '?'
  }

  const enriched = (requests ?? []).map(r => ({
    id:         r.id,
    team_id:    r.team_id,
    team_name:  teamNameMap[r.team_id as string] ?? '?',
    user_id:    r.user_id,
    email:      profileMap[r.user_id as string]?.email ?? '',
    full_name:  profileMap[r.user_id as string]?.full_name ?? null,
    message:    r.message,
    created_at: r.created_at,
  }))

  return NextResponse.json({ requests: enriched })
}

// ── PATCH /api/team/join-request ──────────────────────────────────────────────
// Body: { requestId: string, action: 'accept' | 'reject', role?: 'admin'|'member'|'viewer' }
// Admin only.
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { requestId, action, role = 'member' } = await req.json() as {
    requestId: string
    action:    'accept' | 'reject'
    role?:     string
  }

  // Load request
  const { data: joinReq } = await supabase
    .from('team_join_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (!joinReq) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
  if (joinReq.status !== 'pending') return NextResponse.json({ error: 'Demande déjà traitée' }, { status: 400 })

  // Verify caller is admin of that team
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', joinReq.team_id)
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle()

  if (!membership) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  if (action === 'accept') {
    // Check not already a member
    const { data: alreadyMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', joinReq.team_id)
      .eq('user_id', joinReq.user_id)
      .maybeSingle()

    if (!alreadyMember) {
      const { error: insertErr } = await supabase
        .from('team_members')
        .insert({ team_id: joinReq.team_id, user_id: joinReq.user_id, role })
      if (insertErr && insertErr.code !== '23505') {
        return NextResponse.json({ error: insertErr.message }, { status: 500 })
      }
    }
  }

  // Update request status
  await supabase
    .from('team_join_requests')
    .update({ status: action === 'accept' ? 'accepted' : 'rejected' })
    .eq('id', requestId)

  // Notify requester by email
  try {
    const { data: team } = await supabase.from('teams').select('name').eq('id', joinReq.team_id).single()
    const { data: requesterProfile } = await supabase.from('profiles').select('email, full_name').eq('id', joinReq.user_id).single()
    if (requesterProfile?.email && team) {
      const accepted = action === 'accept'
      await sendEmail({
        to:      requesterProfile.email,
        subject: accepted ? `✅ Demande acceptée — ${team.name}` : `❌ Demande refusée — ${team.name}`,
        html: `<!DOCTYPE html><html><body style="background:#0a0f1e;font-family:system-ui;padding:40px 20px;color:#fff;">
<div style="max-width:520px;margin:0 auto;">
  <div style="background:${accepted ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#ef4444,#dc2626)'};border-radius:16px;padding:32px;margin-bottom:24px;">
    <h2 style="margin:0;font-size:20px;font-weight:800;">${accepted ? '🎉 Demande acceptée' : '❌ Demande refusée'}</h2>
    <p style="margin:8px 0 0;opacity:0.8;font-size:14px;">équipe <strong>${team.name}</strong></p>
  </div>
  <p style="font-size:14px;color:rgba(255,255,255,0.7);">
    ${accepted
      ? `Votre demande pour rejoindre <strong style="color:white">${team.name}</strong> a été acceptée. Vous pouvez maintenant accéder à l'équipe.`
      : `Votre demande pour rejoindre <strong style="color:white">${team.name}</strong> n'a pas été acceptée.`
    }
  </p>
  ${accepted ? `<a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.pilot-plus.fr'}/team" style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:white;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;margin-top:16px;">Accéder à l'équipe →</a>` : ''}
  <p style="font-size:11px;color:rgba(255,255,255,0.2);margin-top:28px;">PILOT+ · Gestion d'équipe</p>
</div></body></html>`,
      })
    }
  } catch { /* best-effort */ }

  return NextResponse.json({ ok: true })
}

// ── DELETE /api/team/join-request ─────────────────────────────────────────────
// Cancel own pending request. Body: { requestId: string }
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { requestId } = await req.json() as { requestId: string }

  await supabase
    .from('team_join_requests')
    .delete()
    .eq('id', requestId)
    .eq('user_id', user.id)
    .eq('status', 'pending')

  return NextResponse.json({ ok: true })
}
