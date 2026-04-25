'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils/cn'
import {
  Users, UserPlus, Mail, Trash2, Loader2, CheckCircle,
  AlertCircle, Shield, Eye, Clock, X, BarChart3,
  Plus, Hash, ChevronDown, MoreVertical, LogOut,
  Settings, Crown, Copy, Check,
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

interface PendingInvitation {
  id:            string
  invited_email: string
  role:          string
  token:         string
  created_at:    string
}

type TeamTab = 'membres' | 'invitations' | 'dashboard'

// ─── Config ───────────────────────────────────────────────────────────────────

const ROLE_CFG = {
  admin:  {
    label: 'Admin',   icon: Shield,
    color: 'text-blue-400',    bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.28)',
    desc: 'Gère les membres, paramètres et dashboards',
  },
  member: {
    label: 'Membre',  icon: Users,
    color: 'text-emerald-400', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.25)',
    desc: 'Crée et modifie des projets partagés',
  },
  viewer: {
    label: 'Lecteur', icon: Eye,
    color: 'text-white/45',    bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.12)',
    desc: 'Consultation uniquement',
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GRAD_PALETTE = [
  ['#3b82f6','#7c3aed'], ['#10b981','#0891b2'], ['#f59e0b','#ef4444'],
  ['#8b5cf6','#ec4899'], ['#06b6d4','#3b82f6'], ['#f97316','#f59e0b'],
]
function getGradient(s: string) {
  let h = 0; for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h)
  return GRAD_PALETTE[Math.abs(h) % GRAD_PALETTE.length]
}
function getInitials(name: string | null, email: string) {
  const src = name?.trim() || email.split('@')[0]
  return src.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ name, email, size = 36 }: { name: string | null; email: string; size?: number }) {
  const [c1, c2] = getGradient(name || email)
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 select-none"
      style={{ width: size, height: size, fontSize: size * 0.32, background: `linear-gradient(135deg,${c1},${c2})`, boxShadow: '0 0 0 2px rgba(0,0,0,0.25)' }}>
      {getInitials(name, email)}
    </div>
  )
}

function RoleBadge({ role, size = 'md' }: { role: string; size?: 'sm' | 'md' }) {
  const cfg = ROLE_CFG[role as keyof typeof ROLE_CFG] ?? ROLE_CFG.member
  const I = cfg.icon
  return (
    <span className={cn('inline-flex items-center gap-1 font-semibold rounded-full flex-shrink-0',
      size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-1', cfg.color)}
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <I size={size === 'sm' ? 8 : 10} />{cfg.label}
    </span>
  )
}

// ─── Dashboard tab ────────────────────────────────────────────────────────────

function DashboardTab({ teamId }: { teamId: string }) {
  const [dash,    setDash]    = useState<TeamDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [openId,  setOpenId]  = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/team/dashboard?teamId=${teamId}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setDash(d.dashboard) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [teamId])

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={20} className="animate-spin text-white/20" /></div>
  if (error)   return <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3"><AlertCircle size={13}/>{error}</div>
  if (!dash)   return null

  const scored = dash.go_count + dash.no_go_count
  const stats = [
    { label: 'Membres',        value: dash.total_members,                      accent: ''                   },
    { label: 'Projets',        value: dash.total_projects,                     accent: ''                   },
    { label: 'Taux GO',        value: `${dash.go_rate}%`,                      accent: 'text-emerald-400'   },
    { label: 'Projets scorés', value: scored,                                  accent: ''                   },
    { label: 'Gagnés',         value: dash.won_count,                          accent: 'text-amber-400'     },
    { label: 'Perdus',         value: dash.lost_count,                         accent: 'text-red-400'       },
    { label: 'GO',             value: dash.go_count,                           accent: 'text-emerald-400'   },
    { label: 'NO GO',          value: dash.no_go_count,                        accent: 'text-red-400'       },
  ]

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[11px] text-white/30 mb-1.5">{s.label}</p>
            <p className={cn('text-2xl font-bold tabular-nums', s.accent || 'text-white')}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Per-member */}
      {dash.members.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/25 mb-3">Performance par membre</p>
          <div className="space-y-2">
            {dash.members.map((m: MemberStats) => {
              const name = m.full_name || m.email.split('@')[0]
              const open = openId === m.user_id
              return (
                <div key={m.user_id} className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                  <button onClick={() => setOpenId(p => p === m.user_id ? null : m.user_id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/3 transition-colors text-left">
                    <Avatar name={m.full_name} email={m.email} size={32} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white/85 truncate">{name}</p>
                      <p className="text-xs text-white/30 truncate">{m.email}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/35 mr-1">
                      <span>{m.total_projects} projets</span>
                      <span className="font-semibold text-emerald-400">{m.go_rate}% GO</span>
                    </div>
                    <ChevronDown size={12} className={cn('text-white/20 flex-shrink-0 transition-transform', open && 'rotate-180')} />
                  </button>
                  {open && (
                    <div className="border-t border-white/5 px-4 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { l: 'Projets', v: m.total_projects,          a: '' },
                        { l: 'Taux GO', v: `${m.go_rate}%`,            a: 'text-emerald-400' },
                        { l: 'Gagnés',  v: m.won_count,                a: 'text-amber-400'   },
                        { l: 'Perdus',  v: m.lost_count,               a: 'text-red-400'     },
                      ].map(s => (
                        <div key={s.l} className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <p className="text-[11px] text-white/25 mb-1">{s.l}</p>
                          <p className={cn('text-lg font-bold', s.a || 'text-white')}>{s.v}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Invitations tab ──────────────────────────────────────────────────────────

function InvitationsTab({
  teamId, pending, setPending,
}: {
  teamId:      string
  pending:     PendingInvitation[]
  setPending:  React.Dispatch<React.SetStateAction<PendingInvitation[]>>
}) {
  const [email,    setEmail]    = useState('')
  const [role,     setRole]     = useState<'admin' | 'member' | 'viewer'>('member')
  const [inviting, setInviting] = useState(false)
  const [msg,      setMsg]      = useState<{ text: string; ok: boolean } | null>(null)
  const [cancelId, setCancelId] = useState<string | null>(null)

  function flash(text: string, ok = true) { setMsg({ text, ok }); setTimeout(() => setMsg(null), 4000) }

  async function handleInvite() {
    if (!email.trim() || inviting) return
    setInviting(true)
    try {
      const res  = await fetch('/api/invitations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'team', teamId, email: email.trim(), role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      setEmail('')
      flash(data.isNewUser
        ? `Invitation envoyée — ${email.trim()} devra créer un compte PILOT+`
        : `Invitation envoyée à ${email.trim()}`)
      const r2 = await fetch(`/api/team/invitations?teamId=${teamId}`)
      if (r2.ok) { const d = await r2.json(); setPending(d.invitations ?? []) }
    } catch (e) { flash(e instanceof Error ? e.message : 'Erreur', false) }
    finally { setInviting(false) }
  }

  async function handleCancel(token: string) {
    setCancelId(token)
    try {
      await fetch(`/api/invitations/${token}`, { method: 'DELETE' })
      setPending(p => p.filter(i => i.token !== token))
    } catch { flash('Erreur lors de l\'annulation', false) }
    finally { setCancelId(null) }
  }

  return (
    <div className="space-y-5">
      {msg && (
        <div className={cn('flex items-center gap-2 text-sm rounded-xl px-4 py-2.5',
          msg.ok ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                 : 'text-red-400 bg-red-500/10 border border-red-500/20')}>
          {msg.ok ? <CheckCircle size={13}/> : <AlertCircle size={13}/>}{msg.text}
        </div>
      )}

      {/* Invite form */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <p className="text-sm font-semibold text-white/80 flex items-center gap-2">
          <UserPlus size={14} className="text-blue-400"/>Inviter un collaborateur
        </p>

        <div className="flex gap-2">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleInvite()}
            placeholder="adresse@email.com"
            className="flex-1 px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}/>
          <button onClick={handleInvite} disabled={!email.trim() || inviting}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all">
            {inviting ? <Loader2 size={13} className="animate-spin"/> : <Mail size={13}/>}
            Inviter
          </button>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-3 gap-2">
          {(['admin','member','viewer'] as const).map(r => {
            const cfg = ROLE_CFG[r]
            const I   = cfg.icon
            const sel = role === r
            return (
              <button key={r} onClick={() => setRole(r)}
                className="text-left p-3 rounded-xl border transition-all"
                style={{
                  background: sel ? cfg.bg : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${sel ? cfg.border : 'rgba(255,255,255,0.07)'}`,
                }}>
                <div className={cn('flex items-center gap-1.5 text-xs font-semibold mb-1', sel ? cfg.color : 'text-white/40')}>
                  <I size={11}/>{cfg.label}
                </div>
                <p className="text-[10px] text-white/25 leading-tight">{cfg.desc}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Pending invitations */}
      {pending.length > 0 ? (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px dashed rgba(255,255,255,0.08)' }}>
          <div className="px-5 py-3 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <Clock size={12} className="text-white/25"/>
            <p className="text-xs font-bold uppercase tracking-widest text-white/25">En attente · {pending.length}</p>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {pending.map(inv => (
              <div key={inv.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Mail size={12} className="text-white/25"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/60 truncate">{inv.invited_email}</p>
                  <p className="text-[11px] text-white/25 mt-0.5">
                    Envoyée le {new Date(inv.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <RoleBadge role={inv.role} size="sm"/>
                <button onClick={() => handleCancel(inv.token)} disabled={cancelId === inv.token}
                  className="w-7 h-7 flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-all">
                  {cancelId === inv.token ? <Loader2 size={11} className="animate-spin"/> : <X size={11}/>}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl py-10 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.06)' }}>
          <Mail size={18} className="text-white/15 mx-auto mb-2"/>
          <p className="text-sm text-white/25">Aucune invitation en attente</p>
        </div>
      )}
    </div>
  )
}

// ─── Members tab ──────────────────────────────────────────────────────────────

function MembresTab({
  team, members, setMembers, currentUserId, isAdmin,
  onLeft, onTeamDeleted,
}: {
  team:          Team
  members:       TeamMember[]
  setMembers:    React.Dispatch<React.SetStateAction<TeamMember[]>>
  currentUserId: string
  isAdmin:       boolean
  onLeft:        () => void
  onTeamDeleted: () => void
}) {
  const [openMenu,  setOpenMenu]  = useState<string | null>(null)
  const [removingId,setRemovingId]= useState<string | null>(null)
  const [leaving,   setLeaving]   = useState(false)
  const [deleting,  setDeleting]  = useState(false)
  const [msg,       setMsg]       = useState<{ text: string; ok: boolean } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function flash(text: string, ok = true) { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3500) }

  async function handleRoleChange(memberId: string, newRole: TeamMember['role']) {
    setOpenMenu(null)
    try {
      const res = await fetch('/api/team/members', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, teamId: team.id, role: newRole }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setMembers(p => p.map(m => m.id === memberId ? { ...m, role: newRole } : m))
      flash('Rôle mis à jour')
    } catch (e) { flash(e instanceof Error ? e.message : 'Erreur', false) }
  }

  async function handleRemove(memberId: string, name: string) {
    setOpenMenu(null)
    if (!confirm(`Retirer ${name} de l'équipe ?`)) return
    setRemovingId(memberId)
    try {
      const res = await fetch('/api/team/members', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, teamId: team.id }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setMembers(p => p.filter(m => m.id !== memberId))
      flash(`${name} retiré·e`)
    } catch (e) { flash(e instanceof Error ? e.message : 'Erreur', false) }
    finally { setRemovingId(null) }
  }

  async function handleLeave() {
    if (!confirm('Quitter cette équipe ?')) return
    setLeaving(true)
    try {
      const res = await fetch('/api/team/leave', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: team.id }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      onLeft()
    } catch (e) { flash(e instanceof Error ? e.message : 'Erreur', false) }
    finally { setLeaving(false) }
  }

  async function handleDeleteTeam() {
    if (!confirm(`Supprimer "${team.name}" ? Tous les membres perdront l'accès. Irréversible.`)) return
    setDeleting(true)
    try {
      const res = await fetch('/api/team', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: team.id }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      onTeamDeleted()
    } catch (e) { flash(e instanceof Error ? e.message : 'Erreur', false) }
    finally { setDeleting(false) }
  }

  const myMembership = members.find(m => m.user_id === currentUserId)
  const isSoleAdmin = isAdmin && members.filter(m => m.role === 'admin').length === 1

  return (
    <div className="space-y-5">
      {msg && (
        <div className={cn('flex items-center gap-2 text-sm rounded-xl px-4 py-2.5',
          msg.ok ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                 : 'text-red-400 bg-red-500/10 border border-red-500/20')}>
          {msg.ok ? <CheckCircle size={13}/> : <AlertCircle size={13}/>}{msg.text}
        </div>
      )}

      {/* Members list */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="px-5 py-3 flex items-center justify-between"
          style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs font-bold uppercase tracking-widest text-white/25">
            Membres · {members.length}
          </p>
        </div>

        {members.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Users size={20} className="text-white/15 mx-auto mb-2"/>
            <p className="text-sm text-white/25">Aucun membre</p>
          </div>
        ) : (
          <div ref={menuRef} className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {members.map(member => {
              const name   = member.full_name || member.email.split('@')[0]
              const isMe   = member.user_id === currentUserId
              const isCreator = member.user_id === team.owner_id

              return (
                <div key={member.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/2 transition-colors">
                  <Avatar name={member.full_name} email={member.email} size={36}/>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white/85 truncate">{name}</p>
                      {isMe && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/6 text-white/30">vous</span>
                      )}
                      {isCreator && !isMe && (
                        <Crown size={11} className="text-amber-400/50 flex-shrink-0"/>
                      )}
                    </div>
                    <p className="text-xs text-white/30 truncate">{member.email}</p>
                  </div>

                  {/* Joined date */}
                  <p className="hidden sm:flex items-center gap-1 text-[11px] text-white/20 flex-shrink-0">
                    <Clock size={9}/>
                    {new Date(member.joined_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </p>

                  <RoleBadge role={member.role}/>

                  {/* Admin action menu (not for self) */}
                  {isAdmin && !isMe && (
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={() => setOpenMenu(p => p === member.id ? null : member.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-white/20 hover:text-white/70 hover:bg-white/8 transition-all">
                        {removingId === member.id
                          ? <Loader2 size={12} className="animate-spin"/>
                          : <MoreVertical size={14}/>}
                      </button>

                      {openMenu === member.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 rounded-xl shadow-2xl z-30 overflow-hidden"
                          style={{ background: 'rgba(12,18,38,0.98)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(20px)' }}>
                          <div className="p-1.5">
                            <p className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-white/20">Changer le rôle</p>
                            {(['admin','member','viewer'] as const).map(r => {
                              const c = ROLE_CFG[r]
                              const I = c.icon
                              return (
                                <button key={r} onClick={() => handleRoleChange(member.id, r)}
                                  disabled={member.role === r}
                                  className={cn('w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg transition-all',
                                    member.role === r ? 'opacity-40 cursor-default' : 'hover:bg-white/6')}>
                                  <I size={11} className={c.color}/>
                                  <span className={cn('font-semibold', c.color)}>{c.label}</span>
                                  <span className="text-white/25 text-[10px] ml-auto">{c.desc.split(' ')[0]}</span>
                                  {member.role === r && <CheckCircle size={10} className="text-emerald-400 ml-auto"/>}
                                </button>
                              )
                            })}
                            <div className="my-1.5 border-t border-white/8"/>
                            <button onClick={() => handleRemove(member.id, name)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400/70 hover:text-red-400 hover:bg-red-950/25 rounded-lg transition-all">
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

      {/* Permissions legend */}
      <div className="rounded-xl px-4 py-3.5 space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-2">Permissions</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(['admin','member','viewer'] as const).map(r => {
            const cfg = ROLE_CFG[r]; const I = cfg.icon
            return (
              <div key={r} className="flex items-start gap-2">
                <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5', cfg.color)}
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                  <I size={8}/>{cfg.label}
                </span>
                <p className="text-[11px] text-white/25 leading-tight">{cfg.desc}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Leave team / danger zone */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {/* Leave team (any non-sole-admin) */}
        {myMembership && !(isAdmin && isSoleAdmin) && (
          <button onClick={handleLeave} disabled={leaving}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white/35 hover:text-amber-400 border border-white/10 hover:border-amber-500/25 hover:bg-amber-950/15 rounded-xl transition-all disabled:opacity-40">
            {leaving ? <Loader2 size={13} className="animate-spin"/> : <LogOut size={13}/>}
            Quitter l&apos;équipe
          </button>
        )}
        {/* Sole admin can't leave — must delete or promote first */}
        {isAdmin && isSoleAdmin && (
          <p className="text-[11px] text-white/20 italic">Vous êtes le seul admin — promouvez un membre avant de partir</p>
        )}

        {/* Delete team (admin only) */}
        {isAdmin && (
          <button onClick={handleDeleteTeam} disabled={deleting}
            className="ml-auto flex items-center gap-1.5 px-4 py-2 text-sm text-red-400/40 hover:text-red-400 border border-red-500/10 hover:border-red-500/30 hover:bg-red-950/20 rounded-xl transition-all disabled:opacity-40">
            {deleting ? <Loader2 size={13} className="animate-spin"/> : <Trash2 size={13}/>}
            Supprimer l&apos;équipe
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Team detail ──────────────────────────────────────────────────────────────

function TeamDetail({
  team, currentUserId,
  onDeleted, onRenamed, onLeft,
}: {
  team:          Team
  currentUserId: string
  onDeleted:     (id: string) => void
  onRenamed:     (id: string, name: string) => void
  onLeft:        (id: string) => void
}) {
  const [tab,         setTab]         = useState<TeamTab>('membres')
  const [members,     setMembers]     = useState<TeamMember[]>(team.members)
  const [pending,     setPending]     = useState<PendingInvitation[]>([])
  const [editName,    setEditName]    = useState(false)
  const [newName,     setNewName]     = useState(team.name)
  const [savingName,  setSavingName]  = useState(false)
  const [nameMsg,     setNameMsg]     = useState<{ text: string; ok: boolean } | null>(null)
  const [copied,      setCopied]      = useState(false)

  const isAdmin = members.some(m => m.user_id === currentUserId && m.role === 'admin')
  const myRole  = members.find(m => m.user_id === currentUserId)?.role ?? null

  useEffect(() => { setMembers(team.members); setNewName(team.name) }, [team])

  useEffect(() => {
    if (isAdmin) {
      fetch(`/api/team/invitations?teamId=${team.id}`)
        .then(r => r.ok ? r.json() : { invitations: [] })
        .then(d => setPending(d.invitations ?? []))
        .catch(() => {})
    }
  }, [team.id, isAdmin])

  async function handleSaveName() {
    if (!newName.trim()) return
    setSavingName(true)
    try {
      const res = await fetch('/api/team', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: team.id, name: newName.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setEditName(false)
      onRenamed(team.id, newName.trim())
      setNameMsg({ text: 'Nom mis à jour', ok: true })
      setTimeout(() => setNameMsg(null), 2500)
    } catch (e) {
      setNameMsg({ text: e instanceof Error ? e.message : 'Erreur', ok: false })
    }
    finally { setSavingName(false) }
  }

  function copyId() {
    navigator.clipboard.writeText(team.id).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  const TABS = [
    { id: 'membres'     as const, label: 'Membres',      icon: Users,    always: true  },
    { id: 'invitations' as const, label: 'Invitations',  icon: Mail,     always: false },
    { id: 'dashboard'   as const, label: 'Dashboard',    icon: BarChart3,always: false },
  ].filter(t => t.always || isAdmin)

  return (
    <div className="space-y-5">

      {/* Team header card */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            {/* Team ID */}
            <button onClick={copyId}
              className="flex items-center gap-1.5 mb-2 group/id hover:opacity-80 transition-opacity">
              <Hash size={10} className="text-white/20"/>
              <span className="text-[10px] font-mono text-white/20">{team.id.slice(0,8)}</span>
              {copied
                ? <Check size={9} className="text-emerald-400"/>
                : <Copy size={9} className="text-white/10 group-hover/id:text-white/30 transition-colors"/>}
            </button>

            {/* Team name */}
            {editName ? (
              <div className="flex items-center gap-2">
                <input type="text" value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key==='Enter') handleSaveName(); if (e.key==='Escape') { setEditName(false); setNewName(team.name) }}}
                  autoFocus
                  className="flex-1 px-3 py-2 rounded-lg text-base font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }}/>
                <button onClick={handleSaveName} disabled={savingName}
                  className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                  {savingName ? <Loader2 size={13} className="animate-spin"/> : <CheckCircle size={13}/>}
                </button>
                <button onClick={() => { setEditName(false); setNewName(team.name) }}
                  className="p-2 text-white/30 hover:text-white/70 rounded-lg border border-white/10 transition-colors">
                  <X size={13}/>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-white truncate">{team.name}</h2>
                {isAdmin && (
                  <button onClick={() => setEditName(true)}
                    className="text-[11px] text-white/20 hover:text-white/60 px-2 py-0.5 rounded-md border border-white/8 hover:border-white/18 transition-all flex-shrink-0">
                    Renommer
                  </button>
                )}
              </div>
            )}

            {nameMsg && (
              <p className={cn('text-xs mt-1', nameMsg.ok ? 'text-emerald-400' : 'text-red-400')}>{nameMsg.text}</p>
            )}

            {/* Meta */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <p className="text-xs text-white/30">{members.length} membre{members.length !== 1 ? 's' : ''}</p>
              {myRole && <RoleBadge role={myRole} size="sm"/>}
              {isAdmin && <span className="text-xs text-blue-400/60">· Accès admin</span>}
            </div>
          </div>

          {/* Settings icon shortcut (admin) */}
          {isAdmin && (
            <button onClick={() => setTab('invitations')}
              className="w-9 h-9 flex items-center justify-center text-white/20 hover:text-white/70 hover:bg-white/6 rounded-xl border border-white/8 transition-all flex-shrink-0">
              <Settings size={14}/>
            </button>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {TABS.map(t => {
          const I = t.icon
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                active ? 'bg-white/10 text-white shadow-sm' : 'text-white/35 hover:text-white/65')}>
              <I size={12}/>{t.label}
              {t.id === 'invitations' && pending.length > 0 && (
                <span className="ml-1 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[9px] font-bold bg-blue-500/30 text-blue-300 px-1">
                  {pending.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {tab === 'membres' && (
        <MembresTab
          team={team}
          members={members}
          setMembers={setMembers}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onLeft={() => onLeft(team.id)}
          onTeamDeleted={() => onDeleted(team.id)}
        />
      )}

      {tab === 'invitations' && isAdmin && (
        <InvitationsTab teamId={team.id} pending={pending} setPending={setPending}/>
      )}

      {tab === 'dashboard' && isAdmin && (
        <DashboardTab teamId={team.id}/>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const [teams,         setTeams]         = useState<Team[]>([])
  const [loading,       setLoading]       = useState(true)
  const [selectedId,    setSelectedId]    = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState('')
  const [creating,      setCreating]      = useState(false)
  const [newName,       setNewName]       = useState('')
  const [saving,        setSaving]        = useState(false)
  const [globalErr,     setGlobalErr]     = useState<string | null>(null)

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

  function handleLeft(id: string) {
    handleDeleted(id)  // same effect: remove from list, select next
  }

  function handleRenamed(id: string, name: string) {
    setTeams(p => p.map(t => t.id === id ? { ...t, name } : t))
  }

  const selected = teams.find(t => t.id === selectedId) ?? null

  return (
    <div className="flex flex-col min-h-0 animate-fade-in">

      {/* ── Page header + team tabs ──────────────────────────────────────── */}
      <div className="flex-shrink-0 px-5 md:px-8" style={{ background: 'rgba(8,14,34,0.80)', borderBottom: '1px solid rgba(255,255,255,0.055)', backdropFilter: 'blur(16px)' }}>
        <div className="h-14 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-white">Équipes</h1>
            <p className="text-xs text-white/30 mt-0.5">
              {loading ? '…' : teams.length === 0 ? 'Aucune équipe' : `${teams.length} équipe${teams.length > 1 ? 's' : ''}`}
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
                <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold tabular-nums',
                  selectedId === t.id ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/25')}>
                  {t.members.length}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-5 md:p-8 max-w-3xl">

        {globalErr && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5">
            <AlertCircle size={13}/>{globalErr}
          </div>
        )}

        {/* Create form */}
        {creating && (
          <div className="rounded-2xl p-5 mb-5" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.18)' }}>
            <p className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
              <Plus size={13} className="text-blue-400"/>Nouvelle équipe
            </p>
            <div className="flex gap-2">
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="Nom de l'équipe" autoFocus
                className="flex-1 px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}/>
              <button onClick={handleCreate} disabled={!newName.trim() || saving}
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
          <div className="flex items-center justify-center py-24">
            <Loader2 size={22} className="animate-spin text-white/20"/>
          </div>
        ) : teams.length === 0 && !creating ? (
          <div className="rounded-2xl p-14 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center mx-auto mb-5">
              <Users size={24} className="text-blue-400"/>
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Aucune équipe</h2>
            <p className="text-sm text-white/35 mb-6 max-w-xs mx-auto leading-relaxed">
              Créez une équipe pour inviter vos collaborateurs et partager vos projets.
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
            onLeft={handleLeft}
          />
        ) : null}
      </div>
    </div>
  )
}
