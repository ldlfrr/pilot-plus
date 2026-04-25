'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils/cn'
import {
  Users, UserPlus, Mail, Trash2, Loader2, CheckCircle,
  AlertCircle, Shield, Eye, Clock, X, BarChart3,
  Plus, Hash, ChevronDown, MoreHorizontal, Crown,
} from 'lucide-react'
import type { TeamDashboard, MemberStats } from '@/app/api/team/dashboard/route'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamMember {
  id:        string
  user_id:   string
  email:     string
  full_name: string | null
  role:      'admin' | 'member' | 'viewer'
  joined_at: string
}

interface Team {
  id:       string
  name:     string
  owner_id: string
  members:  TeamMember[]
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ROLE_CFG = {
  admin:  { label: 'Admin',   icon: Shield, color: 'text-blue-400',  bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)' },
  member: { label: 'Membre',  icon: Users,  color: 'text-white/60',  bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.10)' },
  viewer: { label: 'Lecteur', icon: Eye,    color: 'text-white/35',  bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.07)' },
}

const AVATAR_PALETTE = [
  ['#3b82f6','#7c3aed'], ['#10b981','#0891b2'], ['#f59e0b','#ef4444'],
  ['#8b5cf6','#ec4899'], ['#06b6d4','#3b82f6'], ['#f97316','#f59e0b'],
]
function avatarGradient(str: string) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]
}
function initials(name: string) {
  return name.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || '?'
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const [c1, c2] = avatarGradient(name)
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 select-none"
      style={{
        width: size, height: size,
        fontSize: size * 0.33,
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        boxShadow: `0 0 0 2px rgba(0,0,0,0.3)`,
      }}
    >
      {initials(name)}
    </div>
  )
}

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CFG[role as keyof typeof ROLE_CFG] ?? ROLE_CFG.member
  const Icon = cfg.icon
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full', cfg.color)}
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <Icon size={9} />{cfg.label}
    </span>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <p className="text-[11px] text-white/35 mb-1.5">{label}</p>
      <p className={cn('text-2xl font-bold tabular-nums', accent ?? 'text-white')}>{value}</p>
    </div>
  )
}

// ─── Member card in dashboard ─────────────────────────────────────────────────

function DashMemberCard({ m, open, onToggle }: { m: MemberStats; open: boolean; onToggle: () => void }) {
  const name = m.full_name ?? m.email.split('@')[0]
  return (
    <div className="rounded-xl overflow-hidden transition-colors" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/3 transition-colors text-left">
        <Avatar name={name} size={34} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white/85 truncate">{name}</p>
          <p className="text-xs text-white/30 truncate">{m.email}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/40 mr-2">
          <span>{m.total_projects} projets</span>
          <span className="font-semibold text-emerald-400">{m.go_rate}% GO</span>
        </div>
        <ChevronDown size={13} className={cn('text-white/20 transition-transform flex-shrink-0', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="border-t border-white/5 px-4 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Projets', value: m.total_projects },
            { label: 'Taux GO',   value: `${m.go_rate}%`,  accent: 'text-emerald-400' },
            { label: 'Gagnés',   value: m.won_count,       accent: 'text-amber-400'   },
            { label: 'Perdus',   value: m.lost_count,      accent: 'text-red-400'     },
          ].map(s => (
            <div key={s.label} className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-[11px] text-white/30 mb-1">{s.label}</p>
              <p className={cn('text-lg font-bold', s.accent ?? 'text-white')}>{s.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Dashboard tab ────────────────────────────────────────────────────────────

function DashboardTab({ teamId }: { teamId: string }) {
  const [dash,   setDash]   = useState<TeamDashboard | null>(null)
  const [loading,setLoading]= useState(true)
  const [error,  setError]  = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/team/dashboard')
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setDash(d.dashboard) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [teamId])

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 size={20} className="animate-spin text-white/20" /></div>
  if (error)   return <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"><AlertCircle size={13}/>{error}</div>
  if (!dash)   return null

  const scored = dash.go_count + dash.no_go_count

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Membres"        value={dash.total_members} />
        <StatCard label="Projets équipe" value={dash.total_projects} />
        <StatCard label="Taux GO" value={`${dash.go_rate}%`} accent="text-emerald-400" />
        <StatCard label="Projets scorés" value={scored} />
        <StatCard label="Affaires gagnées" value={dash.won_count}  accent="text-amber-400" />
        <StatCard label="Affaires perdues" value={dash.lost_count} accent="text-red-400"   />
        <StatCard label="Projets GO"    value={dash.go_count}    accent="text-emerald-400" />
        <StatCard label="Projets NO GO" value={dash.no_go_count} accent="text-red-400"    />
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-3">Performance par membre</p>
        <div className="space-y-2">
          {dash.members.map(m => (
            <DashMemberCard key={m.user_id} m={m}
              open={openId === m.user_id}
              onToggle={() => setOpenId(p => p === m.user_id ? null : m.user_id)} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Team detail ──────────────────────────────────────────────────────────────

function TeamDetail({
  team, currentUserId,
  onDeleted, onRenamed,
}: {
  team: Team
  currentUserId: string
  onDeleted: (id: string) => void
  onRenamed: (id: string, name: string) => void
}) {
  const [tab,    setTab]    = useState<'membres' | 'dashboard'>('membres')
  const [msg,    setMsg]    = useState<{ text: string; ok: boolean } | null>(null)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole,  setInviteRole]  = useState<'admin' | 'member'>('member')
  const [inviting,    setInviting]    = useState(false)

  const [editName,   setEditName]   = useState(false)
  const [newName,    setNewName]    = useState(team.name)
  const [savingName, setSavingName] = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  const [pendingInvites, setPendingInvites] = useState<Array<{id:string;invited_email:string;role:string;token:string}>>([])
  const [cancelToken,    setCancelToken]    = useState<string|null>(null)
  const [removingId,     setRemovingId]     = useState<string|null>(null)
  const [openMenu,       setOpenMenu]       = useState<string|null>(null)

  const [members, setMembers] = useState<TeamMember[]>(team.members)

  // Is current user an admin of this team?
  const isAdmin = members.some(m => m.user_id === currentUserId && m.role === 'admin')

  useEffect(() => { setMembers(team.members); setNewName(team.name) }, [team])
  useEffect(() => {
    if (isAdmin) {
      fetch(`/api/team/invitations?teamId=${team.id}`)
        .then(r => r.ok ? r.json() : { invitations: [] })
        .then(d => setPendingInvites(d.invitations ?? []))
        .catch(() => {})
    }
  }, [team.id, isAdmin])

  function flash(text: string, ok = true) {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 3000)
  }

  async function handleSaveName() {
    if (!newName.trim()) return
    setSavingName(true)
    try {
      const res = await fetch('/api/team', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: team.id, name: newName.trim() }),
      })
      if (!res.ok) throw new Error()
      setEditName(false)
      onRenamed(team.id, newName.trim())
      flash('Nom mis à jour')
    } catch { flash('Erreur lors du renommage', false) }
    finally { setSavingName(false) }
  }

  async function handleInvite() {
    if (!inviteEmail.trim() || inviting) return
    setInviting(true)
    try {
      const res  = await fetch('/api/invitations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'team', teamId: team.id, email: inviteEmail.trim(), role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      setInviteEmail('')
      flash(data.isNewUser
        ? `Invitation envoyée — l'utilisateur devra créer un compte PILOT+.`
        : `Invitation envoyée à ${inviteEmail.trim()}`)
      const r2 = await fetch(`/api/team/invitations?teamId=${team.id}`)
      if (r2.ok) { const d = await r2.json(); setPendingInvites(d.invitations ?? []) }
    } catch (e) { flash(e instanceof Error ? e.message : 'Erreur', false) }
    finally { setInviting(false) }
  }

  async function handleDelete() {
    if (!confirm(`Supprimer "${team.name}" ? Tous les membres perdront l'accès. Irréversible.`)) return
    setDeleting(true)
    try {
      const res = await fetch('/api/team', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: team.id }),
      })
      if (!res.ok) throw new Error()
      onDeleted(team.id)
    } catch { flash('Impossible de supprimer', false) }
    finally { setDeleting(false) }
  }

  async function handleRemove(memberId: string, name: string) {
    if (!confirm(`Retirer ${name} de l'équipe ?`)) return
    setRemovingId(memberId)
    setOpenMenu(null)
    try {
      await fetch('/api/team/members', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, teamId: team.id }),
      })
      setMembers(p => p.filter(m => m.id !== memberId))
      flash(`${name} retiré`)
    } catch { flash('Erreur', false) }
    finally { setRemovingId(null) }
  }

  async function handleRoleChange(memberId: string, newRole: TeamMember['role']) {
    setOpenMenu(null)
    try {
      await fetch('/api/team/members', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, teamId: team.id, role: newRole }),
      })
      setMembers(p => p.map(m => m.id === memberId ? { ...m, role: newRole } : m))
      flash('Rôle mis à jour')
    } catch { flash('Erreur', false) }
  }

  async function handleCancelInvite(token: string) {
    setCancelToken(token)
    try {
      await fetch(`/api/invitations/${token}`, { method: 'DELETE' })
      setPendingInvites(p => p.filter(i => i.token !== token))
    } catch { flash('Erreur', false) }
    finally { setCancelToken(null) }
  }

  return (
    <div className="space-y-5">

      {/* Flash message */}
      {msg && (
        <div className={cn('flex items-center gap-2 text-sm rounded-xl px-4 py-2.5',
          msg.ok
            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
            : 'text-red-400 bg-red-500/10 border border-red-500/20')}>
          {msg.ok ? <CheckCircle size={13}/> : <AlertCircle size={13}/>}
          {msg.text}
        </div>
      )}

      {/* Team header card */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* ID */}
            <div className="flex items-center gap-1.5 mb-2">
              <Hash size={10} className="text-white/20"/>
              <span className="text-[10px] font-mono text-white/20">{team.id.slice(0,8)}</span>
            </div>

            {/* Name */}
            {editName ? (
              <div className="flex items-center gap-2">
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key==='Enter') handleSaveName(); if (e.key==='Escape') setEditName(false) }}
                  autoFocus className="flex-1 px-3 py-2 bg-white/6 border border-white/12 rounded-lg text-base font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"/>
                <button onClick={handleSaveName} disabled={savingName}
                  className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                  {savingName ? <Loader2 size={13} className="animate-spin"/> : <CheckCircle size={13}/>}
                </button>
                <button onClick={() => { setEditName(false); setNewName(team.name) }}
                  className="p-2 text-white/30 hover:text-white/60 rounded-lg border border-white/10 transition-colors">
                  <X size={13}/>
                </button>
              </div>
            ) : (
              <h2 className="text-xl font-bold text-white">{team.name}</h2>
            )}

            {/* Meta */}
            <p className="text-xs text-white/30 mt-1.5">
              {members.length} membre{members.length !== 1 ? 's' : ''}
              {isAdmin && <span className="ml-2 text-blue-400">· Vous êtes admin</span>}
            </p>
          </div>

          {/* Admin actions */}
          {isAdmin && !editName && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setEditName(true)}
                className="text-xs text-white/35 hover:text-white/70 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-all">
                Renommer
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-1.5 text-xs text-red-400/50 hover:text-red-400 px-3 py-1.5 rounded-lg border border-red-500/15 hover:border-red-500/35 hover:bg-red-950/25 transition-all disabled:opacity-40">
                {deleting ? <Loader2 size={11} className="animate-spin"/> : <Trash2 size={11}/>}
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      {isAdmin && (
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {([
            { id: 'membres',   label: 'Membres',   icon: Users    },
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                tab === t.id ? 'bg-white/10 text-white' : 'text-white/35 hover:text-white/60')}>
              <t.icon size={12}/>{t.label}
            </button>
          ))}
        </div>
      )}

      {tab === 'dashboard' && isAdmin ? <DashboardTab teamId={team.id}/> : (
        <>
          {/* Invite form (admin only) */}
          {isAdmin && (
            <div className="rounded-2xl p-5" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <p className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                <UserPlus size={14} className="text-blue-400"/>
                Inviter un membre
              </p>
              <div className="flex gap-2">
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && handleInvite()}
                  placeholder="adresse@email.com"
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}/>
                <div className="relative">
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value as 'admin'|'member')}
                    className="appearance-none pl-3 pr-7 py-2.5 rounded-xl text-xs font-semibold text-white/70 focus:outline-none cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
                    <option value="admin">Admin</option>
                    <option value="member">Membre</option>
                  </select>
                  <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"/>
                </div>
                <button onClick={handleInvite} disabled={!inviteEmail.trim() || inviting}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all">
                  {inviting ? <Loader2 size={13} className="animate-spin"/> : <Mail size={13}/>}
                  Inviter
                </button>
              </div>
            </div>
          )}

          {/* Members list */}
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            {/* Header */}
            <div className="px-5 py-3 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs font-bold uppercase tracking-widest text-white/30">
                Membres · {members.length}
              </p>
            </div>

            {members.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Users size={20} className="text-white/15 mx-auto mb-2"/>
                <p className="text-sm text-white/25">Aucun membre pour l&apos;instant</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                {members.map(member => {
                  const name = member.full_name || member.email.split('@')[0]
                  const isMe = member.user_id === currentUserId
                  return (
                    <div key={member.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/2 transition-colors relative">
                      <Avatar name={name} size={36}/>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white/85 truncate">{name}</p>
                          {isMe && <span className="text-[9px] font-bold text-white/25 bg-white/5 px-1.5 py-0.5 rounded-full">vous</span>}
                        </div>
                        <p className="text-xs text-white/30 truncate">{member.email}</p>
                      </div>

                      {/* Joined date */}
                      <p className="hidden sm:flex items-center gap-1 text-[11px] text-white/20 flex-shrink-0">
                        <Clock size={9}/>
                        {new Date(member.joined_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>

                      {/* Role badge */}
                      <RoleBadge role={member.role}/>

                      {/* Admin menu */}
                      {isAdmin && !isMe && (
                        <div className="relative flex-shrink-0">
                          <button
                            onClick={() => setOpenMenu(p => p === member.id ? null : member.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/20 hover:text-white/60 hover:bg-white/8 transition-all">
                            {removingId === member.id
                              ? <Loader2 size={12} className="animate-spin"/>
                              : <MoreHorizontal size={14}/>}
                          </button>
                          {openMenu === member.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 rounded-xl shadow-xl z-20 overflow-hidden"
                              style={{ background: 'rgba(15,20,35,0.98)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(16px)' }}>
                              <div className="p-1">
                                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/25">Changer le rôle</p>
                                {(['admin','member'] as const).map(r => (
                                  <button key={r} onClick={() => handleRoleChange(member.id, r)}
                                    disabled={member.role === r}
                                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-white/60 hover:text-white/90 hover:bg-white/6 rounded-lg transition-all disabled:opacity-30">
                                    {(() => { const I = ROLE_CFG[r].icon; return I ? <I size={11}/> : null })()}
                                    {ROLE_CFG[r].label}
                                    {member.role === r && <CheckCircle size={10} className="ml-auto text-emerald-400"/>}
                                  </button>
                                ))}
                                <div className="border-t border-white/8 my-1"/>
                                <button onClick={() => handleRemove(member.id, name)}
                                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-red-400/70 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-all">
                                  <Trash2 size={11}/>Retirer de l&apos;équipe
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Pending invitations (admin only) */}
          {isAdmin && pendingInvites.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px dashed rgba(255,255,255,0.08)' }}>
              <div className="px-5 py-3 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <Clock size={12} className="text-white/25"/>
                <p className="text-xs font-bold uppercase tracking-widest text-white/25">
                  En attente · {pendingInvites.length}
                </p>
              </div>
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                {pendingInvites.map(inv => (
                  <div key={inv.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <Mail size={12} className="text-white/25"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/50 truncate">{inv.invited_email}</p>
                      <p className="text-[11px] text-white/25 mt-0.5">En attente d&apos;acceptation</p>
                    </div>
                    <RoleBadge role={inv.role}/>
                    <button onClick={() => handleCancelInvite(inv.token)} disabled={cancelToken===inv.token}
                      className="w-7 h-7 flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-all">
                      {cancelToken===inv.token ? <Loader2 size={11} className="animate-spin"/> : <X size={11}/>}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permissions legend */}
          <div className="rounded-xl px-5 py-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-3">Permissions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { role: 'admin',  desc: 'Gérer membres, voir dashboards, supprimer' },
                { role: 'member', desc: 'Créer & modifier des projets partagés'     },
              ].map(({ role, desc }) => (
                <div key={role} className="flex items-center gap-3">
                  <RoleBadge role={role}/>
                  <span className="text-[11px] text-white/25">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const [teams,         setTeams]         = useState<Team[]>([])
  const [loading,       setLoading]       = useState(true)
  const [selectedId,    setSelectedId]    = useState<string|null>(null)
  const [currentUserId, setCurrentUserId] = useState('')
  const [creating,      setCreating]      = useState(false)
  const [newName,       setNewName]       = useState('')
  const [saving,        setSaving]        = useState(false)
  const [globalErr,     setGlobalErr]     = useState<string|null>(null)

  const loadTeams = useCallback(async () => {
    try {
      const [tr, pr] = await Promise.all([
        fetch('/api/team').then(r => r.json()),
        fetch('/api/user/profile').then(r => r.json()),
      ])
      const fetched: Team[] = tr.teams ?? []
      setTeams(fetched)
      setCurrentUserId(pr.id ?? '')
      if (fetched.length > 0) setSelectedId(p => p ?? fetched[0].id)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadTeams() }, []) // eslint-disable-line

  async function handleCreate() {
    if (!newName.trim() || saving) return
    setSaving(true)
    try {
      const res  = await fetch('/api/team', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      const t: Team = data.team
      setTeams(p => [...p, t])
      setSelectedId(t.id)
      setNewName(''); setCreating(false)
    } catch (e) {
      setGlobalErr(e instanceof Error ? e.message : 'Erreur')
      setTimeout(() => setGlobalErr(null), 4000)
    } finally { setSaving(false) }
  }

  function handleDeleted(id: string) {
    setTeams(p => {
      const next = p.filter(t => t.id !== id)
      if (selectedId === id) setSelectedId(next[0]?.id ?? null)
      return next
    })
  }

  function handleRenamed(id: string, name: string) {
    setTeams(p => p.map(t => t.id === id ? { ...t, name } : t))
  }

  const selected = teams.find(t => t.id === selectedId) ?? null

  return (
    <div className="flex flex-col min-h-0 animate-fade-in">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="bg-[var(--bg-surface)] border-b border-white/5 px-5 md:px-8 flex-shrink-0">
        <div className="h-14 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-white">Équipes</h1>
            <p className="text-xs text-white/30 mt-0.5">
              {teams.length === 0 ? 'Aucune équipe' : `${teams.length} équipe${teams.length>1?'s':''}`}
            </p>
          </div>
          {!creating && (
            <button onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-400 rounded-lg border border-blue-500/25 hover:border-blue-500/50 hover:bg-blue-500/8 transition-all">
              <Plus size={12}/>Nouvelle équipe
            </button>
          )}
        </div>

        {/* Team tabs */}
        {teams.length > 0 && (
          <div className="flex -mb-px overflow-x-auto scrollbar-hide">
            {teams.map(t => (
              <button key={t.id} onClick={() => setSelectedId(t.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap flex-shrink-0',
                  selectedId === t.id
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-white/35 hover:text-white/65',
                )}>
                <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ background: selectedId === t.id ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)' }}>
                  <Users size={10} className={selectedId === t.id ? 'text-blue-400' : 'text-white/30'}/>
                </div>
                {t.name}
                <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold',
                  selectedId === t.id ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/25')}>
                  {t.members.length}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-5 md:p-8 max-w-3xl space-y-5">

        {globalErr && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <AlertCircle size={13}/>{globalErr}
          </div>
        )}

        {/* Create form */}
        {creating && (
          <div className="rounded-2xl p-5" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.18)' }}>
            <p className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
              <Plus size={13} className="text-blue-400"/>Nouvelle équipe
            </p>
            <div className="flex gap-2">
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key==='Enter' && handleCreate()}
                placeholder="Nom de l'équipe" autoFocus
                className="flex-1 px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}/>
              <button onClick={handleCreate} disabled={!newName.trim()||saving}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all">
                {saving ? <Loader2 size={14} className="animate-spin"/> : 'Créer'}
              </button>
              <button onClick={() => { setCreating(false); setNewName('') }}
                className="px-3 py-2.5 text-white/30 hover:text-white/70 rounded-xl border border-white/10 transition-all">
                <X size={13}/>
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-white/20"/>
          </div>
        ) : teams.length === 0 && !creating ? (
          /* Empty state */
          <div className="rounded-2xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center mx-auto mb-5">
              <Users size={24} className="text-blue-400"/>
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Aucune équipe</h2>
            <p className="text-sm text-white/35 mb-6 max-w-xs mx-auto">
              Créez une équipe pour inviter vos collaborateurs et partager des projets.
            </p>
            <button onClick={() => setCreating(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all">
              <Plus size={14}/>Créer ma première équipe
            </button>
          </div>
        ) : selected ? (
          <TeamDetail
            team={selected}
            currentUserId={currentUserId}
            onDeleted={handleDeleted}
            onRenamed={handleRenamed}
          />
        ) : null}
      </div>
    </div>
  )
}

void Crown
