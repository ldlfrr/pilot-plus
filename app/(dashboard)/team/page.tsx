'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils/cn'
import {
  Users, UserPlus, Mail, Trash2, Loader2, CheckCircle,
  AlertCircle, Crown, Shield, Eye, Clock, X,
  BarChart3, TrendingUp, Target, Trophy, XCircle, ChevronRight,
  Plus, Hash,
} from 'lucide-react'
import type { TeamDashboard, MemberStats } from '@/app/api/team/dashboard/route'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamMember {
  id: string
  user_id: string
  email: string
  full_name: string | null
  role: 'owner' | 'admin' | 'member' | 'viewer'
  joined_at: string
}

interface Team {
  id: string
  name: string
  owner_id: string
  members: TeamMember[]
}

const ROLE_CFG = {
  owner:  { label: 'Propriétaire', icon: Crown,  color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20' },
  admin:  { label: 'Admin',        icon: Shield, color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20'  },
  member: { label: 'Membre',       icon: Users,  color: 'text-white/60',   bg: 'bg-white/5 border-white/10'         },
  viewer: { label: 'Lecteur',      icon: Eye,    color: 'text-white/40',   bg: 'bg-white/3 border-white/8'          },
}

const AVATAR_COLORS = [
  'from-blue-500 to-blue-700', 'from-violet-500 to-violet-700',
  'from-emerald-500 to-emerald-700', 'from-amber-500 to-amber-600',
  'from-pink-500 to-pink-700',
]
function avatarColor(str: string) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
function formatEur(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} M€`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} k€`
  return `${n.toLocaleString('fr-FR')} €`
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="bg-[var(--bg-card)] border border-white/6 rounded-xl p-4">
      <p className="text-xs text-white/35 mb-1">{label}</p>
      <p className={cn('text-2xl font-bold', accent ?? 'text-white')}>{value}</p>
      {sub && <p className="text-xs text-white/25 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Member dashboard card ────────────────────────────────────────────────────

function MemberDashCard({ m, expanded, onToggle }: { m: MemberStats; expanded: boolean; onToggle: () => void }) {
  const displayName = m.full_name ?? m.email.split('@')[0]
  const color = avatarColor(m.email)
  return (
    <div className="bg-[var(--bg-card)] border border-white/6 rounded-xl overflow-hidden hover:border-white/10 transition-colors">
      <button onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/3 transition-colors">
        <div className={cn('w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold flex-shrink-0', color)}>
          {initials(displayName)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white/80 truncate">{displayName}</p>
          <p className="text-xs text-white/30 truncate">{m.email}</p>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs mr-2">
          <span className="text-white/40">{m.total_projects} projet{m.total_projects !== 1 ? 's' : ''}</span>
          <span className="text-emerald-400 font-semibold">{m.go_rate}% GO</span>
          {m.pipeline_value > 0 && <span className="text-blue-400">{formatEur(m.pipeline_value)}</span>}
        </div>
        <ChevronRight size={14} className={cn('text-white/20 flex-shrink-0 transition-transform', expanded && 'rotate-90')} />
      </button>
      {expanded && (
        <div className="border-t border-white/5 px-4 py-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white/3 rounded-lg p-3">
            <p className="text-[11px] text-white/30 mb-1">Projets total</p>
            <p className="text-lg font-bold text-white">{m.total_projects}</p>
          </div>
          <div className="bg-emerald-950/30 border border-emerald-500/15 rounded-lg p-3">
            <p className="text-[11px] text-white/30 mb-1">Taux GO</p>
            <p className="text-lg font-bold text-emerald-400">{m.go_rate}%</p>
            <p className="text-[10px] text-white/20">{m.go_count} GO · {m.no_go_count} NO GO</p>
          </div>
          <div className="bg-amber-950/20 border border-amber-500/15 rounded-lg p-3">
            <p className="text-[11px] text-white/30 mb-1">Affaires gagnées</p>
            <p className="text-lg font-bold text-amber-400">{m.won_count}</p>
            <p className="text-[10px] text-white/20">{m.lost_count} perdues</p>
          </div>
          {m.pipeline_value > 0 && (
            <div className="bg-blue-950/20 border border-blue-500/15 rounded-lg p-3 col-span-2 sm:col-span-1">
              <p className="text-[11px] text-white/30 mb-1">Pipeline chiffré</p>
              <p className="text-lg font-bold text-blue-400">{formatEur(m.pipeline_value)}</p>
            </div>
          )}
          <div className="bg-white/3 rounded-lg p-3">
            <p className="text-[11px] text-white/30 mb-1">En cours</p>
            <p className="text-lg font-bold text-white/60">{m.pending_count}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Dashboard tab ────────────────────────────────────────────────────────────

function DashboardTab({ teamId }: { teamId: string }) {
  const [dashboard, setDashboard] = useState<TeamDashboard | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/team/dashboard')
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setDashboard(d.dashboard)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [teamId])

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={22} className="animate-spin text-white/20" /></div>
  if (error)   return <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3"><AlertCircle size={14} />{error}</div>
  if (!dashboard) return null

  const scored = dashboard.go_count + dashboard.no_go_count

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard label="Membres"        value={dashboard.total_members} />
        <StatCard label="Projets équipe" value={dashboard.total_projects} />
        <StatCard label="Taux GO équipe" value={`${dashboard.go_rate}%`}
          sub={scored > 0 ? `${dashboard.go_count} GO / ${scored} scorés` : 'Aucun projet scoré'} accent="text-emerald-400" />
        <StatCard label="Pipeline chiffré"
          value={dashboard.pipeline_value > 0 ? formatEur(dashboard.pipeline_value) : '—'}
          sub="Somme des chiffrages AV" accent="text-blue-400" />
        <StatCard label="Affaires gagnées" value={dashboard.won_count}  accent="text-amber-400" />
        <StatCard label="Affaires perdues" value={dashboard.lost_count} accent="text-red-400"   />
        <StatCard label="Projets GO"    value={dashboard.go_count}    accent="text-emerald-400" />
        <StatCard label="Projets NO GO" value={dashboard.no_go_count} accent="text-red-400"    />
      </div>
      <div>
        <p className="text-xs font-semibold text-white/35 uppercase tracking-wider mb-3">Par membre</p>
        <div className="space-y-2">
          {dashboard.members.map(m => (
            <MemberDashCard key={m.user_id} m={m}
              expanded={expandedId === m.user_id}
              onToggle={() => setExpandedId(prev => prev === m.user_id ? null : m.user_id)} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Team detail view ─────────────────────────────────────────────────────────

type PageTab = 'membres' | 'dashboard'

function TeamDetail({ team, currentUserId, onDeleted, onRenamed }: {
  team: Team
  currentUserId: string
  onDeleted: (id: string) => void
  onRenamed: (id: string, name: string) => void
}) {
  const [activeTab, setActiveTab]   = useState<PageTab>('membres')
  const [error, setError]           = useState<string | null>(null)
  const [success, setSuccess]       = useState<string | null>(null)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole]   = useState<'admin' | 'member' | 'viewer'>('member')
  const [inviting, setInviting]       = useState(false)

  const [teamName, setTeamName]     = useState(team.name)
  const [editingName, setEditingName] = useState(false)
  const [savingName, setSavingName]   = useState(false)
  const [deletingTeam, setDeletingTeam] = useState(false)

  const [pendingInvites, setPendingInvites] = useState<Array<{ id: string; invited_email: string; role: string; token: string }>>([])
  const [cancellingToken, setCancellingToken] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const [localMembers, setLocalMembers] = useState<TeamMember[]>(team.members)

  const isOwner = team.owner_id === currentUserId

  useEffect(() => {
    setLocalMembers(team.members)
    setTeamName(team.name)
  }, [team])

  useEffect(() => {
    if (isOwner) {
      fetch(`/api/team/invitations?teamId=${team.id}`)
        .then(r => r.ok ? r.json() : { invitations: [] })
        .then(d => setPendingInvites(d.invitations ?? []))
        .catch(() => {})
    }
  }, [team.id, isOwner])

  function flash(msg: string, isErr = false) {
    if (isErr) { setError(msg); setTimeout(() => setError(null), 4000) }
    else { setSuccess(msg); setTimeout(() => setSuccess(null), 3000) }
  }

  async function handleSaveName() {
    if (!teamName.trim()) return
    setSavingName(true)
    try {
      const res = await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: team.id, name: teamName.trim() }),
      })
      if (!res.ok) throw new Error('Erreur')
      setEditingName(false)
      onRenamed(team.id, teamName.trim())
      flash('Nom mis à jour')
    } catch { flash('Impossible de renommer', true) }
    finally { setSavingName(false) }
  }

  async function handleInvite() {
    if (!inviteEmail.trim() || inviting) return
    setInviting(true)
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'team', teamId: team.id, email: inviteEmail.trim(), role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      setInviteEmail('')
      flash(data.isNewUser
        ? `Invitation envoyée — l'utilisateur devra créer un compte PILOT+ pour accepter.`
        : `Invitation envoyée à ${inviteEmail.trim()} — une notification lui a été envoyée.`)
      const invRes = await fetch(`/api/team/invitations?teamId=${team.id}`)
      if (invRes.ok) { const d = await invRes.json(); setPendingInvites(d.invitations ?? []) }
    } catch (err) { flash(err instanceof Error ? err.message : 'Erreur', true) }
    finally { setInviting(false) }
  }

  async function handleDeleteTeam() {
    if (!confirm(`Supprimer définitivement l'équipe "${team.name}" ? Tous les membres perdront l'accès. Action irréversible.`)) return
    setDeletingTeam(true)
    try {
      const res = await fetch('/api/team', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: team.id }),
      })
      if (!res.ok) throw new Error('Erreur')
      onDeleted(team.id)
    } catch { flash('Impossible de supprimer l\'équipe', true) }
    finally { setDeletingTeam(false) }
  }

  async function handleCancelInvite(token: string) {
    setCancellingToken(token)
    try {
      await fetch(`/api/invitations/${token}`, { method: 'DELETE' })
      setPendingInvites(prev => prev.filter(i => i.token !== token))
      flash('Invitation annulée.')
    } catch { flash('Erreur', true) }
    finally { setCancellingToken(null) }
  }

  async function handleRemove(memberId: string, memberName: string) {
    if (!confirm(`Retirer ${memberName} de l'équipe ?`)) return
    setRemovingId(memberId)
    try {
      await fetch('/api/team/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, teamId: team.id }),
      })
      setLocalMembers(prev => prev.filter(m => m.id !== memberId))
      flash(`${memberName} retiré de l'équipe`)
    } catch { flash('Impossible de retirer le membre', true) }
    finally { setRemovingId(null) }
  }

  async function handleRoleChange(memberId: string, newRole: TeamMember['role']) {
    try {
      await fetch('/api/team/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, teamId: team.id, role: newRole }),
      })
      setLocalMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m))
      flash('Rôle mis à jour')
    } catch { flash('Impossible de changer le rôle', true) }
  }

  const PAGE_TABS: { id: PageTab; label: string; icon: typeof Users }[] = [
    { id: 'membres',   label: 'Membres',        icon: Users    },
    ...(isOwner ? [{ id: 'dashboard' as PageTab, label: 'Dashboard équipe', icon: BarChart3 }] : []),
  ]

  return (
    <div className="space-y-4">

      {/* Feedback */}
      {error   && <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"><AlertCircle size={13}/>{error}<button onClick={() => setError(null)} className="ml-auto"><X size={12}/></button></div>}
      {success && <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2"><CheckCircle size={13}/>{success}</div>}

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-white/5 -mx-0.5">
        {PAGE_TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={cn('flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-all',
              activeTab === id ? 'border-blue-500 text-blue-400' : 'border-transparent text-white/40 hover:text-white/70')}>
            <Icon size={12}/>{label}
          </button>
        ))}
      </div>

      {activeTab === 'membres' ? (
        <>
          {/* Team name card */}
          <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between gap-4">
              {editingName ? (
                <div className="flex items-center gap-2 flex-1">
                  <input type="text" value={teamName} onChange={e => setTeamName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false) }}
                    autoFocus className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"/>
                  <button onClick={handleSaveName} disabled={savingName}
                    className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                    {savingName ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle size={14}/>}
                  </button>
                  <button onClick={() => { setEditingName(false); setTeamName(team.name) }}
                    className="p-2 text-white/30 hover:text-white/70 border border-white/10 rounded-lg transition-colors">
                    <X size={14}/>
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <Hash size={10} className="text-white/20"/>
                      <p className="text-[10px] text-white/25 font-mono">{team.id.slice(0, 8)}</p>
                    </div>
                    <h2 className="text-lg font-bold text-white">{team.name}</h2>
                  </div>
                  {isOwner && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditingName(true)}
                        className="text-xs text-white/30 hover:text-white/60 border border-white/10 px-3 py-1.5 rounded-lg transition-colors">
                        Renommer
                      </button>
                      <button onClick={handleDeleteTeam} disabled={deletingTeam}
                        className="flex items-center gap-1 text-xs text-red-400/50 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 hover:bg-red-950/30 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-40">
                        {deletingTeam ? <Loader2 size={11} className="animate-spin"/> : <Trash2 size={11}/>}
                        Supprimer
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            <p className="text-xs text-white/30 mt-2">{localMembers.length} membre{localMembers.length > 1 ? 's' : ''}</p>
          </div>

          {/* Invite form (owner only) */}
          {isOwner && (
            <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                <UserPlus size={14} className="text-blue-400"/>Inviter un membre
              </p>
              <div className="flex gap-2">
                <input type="email" placeholder="adresse@email.com" value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleInvite()}
                  className="flex-1 px-3 py-2.5 bg-white/5 border border-white/8 rounded-lg text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"/>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value as typeof inviteRole)}
                  className="bg-white/5 border border-white/8 rounded-lg px-2 py-2.5 text-xs text-white/70 focus:outline-none">
                  <option value="admin">Admin</option>
                  <option value="member">Membre</option>
                  <option value="viewer">Lecteur</option>
                </select>
                <button onClick={handleInvite} disabled={!inviteEmail.trim() || inviting}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors">
                  {inviting ? <Loader2 size={14} className="animate-spin"/> : <Mail size={14}/>}
                  Inviter
                </button>
              </div>
            </div>
          )}

          {/* Members list */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="px-5 py-3.5 border-b border-white/5">
              <p className="text-sm font-semibold text-white/70">Membres</p>
            </div>
            <div className="divide-y divide-white/4">
              {localMembers.map(member => {
                const cfg = ROLE_CFG[member.role] ?? ROLE_CFG.member
                const RoleIcon = cfg.icon
                const displayName = member.full_name || member.email.split('@')[0]
                return (
                  <div key={member.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/2 transition-colors group">
                    <div className={cn('w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold flex-shrink-0', avatarColor(member.email))}>
                      {initials(displayName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white/80 truncate">{displayName}</p>
                      <p className="text-xs text-white/35 truncate">{member.email}</p>
                    </div>
                    <p className="hidden sm:flex items-center gap-1 text-[10px] text-white/20 flex-shrink-0">
                      <Clock size={9}/>{new Date(member.joined_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                    {member.role === 'owner' ? (
                      <span className={cn('flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border flex-shrink-0', cfg.bg, cfg.color)}>
                        <RoleIcon size={9}/>{cfg.label}
                      </span>
                    ) : isOwner ? (
                      <select value={member.role}
                        onChange={e => handleRoleChange(member.id, e.target.value as TeamMember['role'])}
                        className={cn('text-[10px] font-bold px-2 py-1 rounded-full border bg-transparent cursor-pointer focus:outline-none flex-shrink-0', cfg.bg, cfg.color)}>
                        <option value="admin">Admin</option>
                        <option value="member">Membre</option>
                        <option value="viewer">Lecteur</option>
                      </select>
                    ) : (
                      <span className={cn('flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border flex-shrink-0', cfg.bg, cfg.color)}>
                        <RoleIcon size={9}/>{cfg.label}
                      </span>
                    )}
                    {member.role !== 'owner' && isOwner && (
                      <button onClick={() => handleRemove(member.id, displayName)} disabled={removingId === member.id}
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center bg-red-500/8 hover:bg-red-500/15 text-red-400/60 hover:text-red-400 rounded-lg transition-all flex-shrink-0">
                        {removingId === member.id ? <Loader2 size={12} className="animate-spin"/> : <Trash2 size={12}/>}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Pending invitations */}
          {isOwner && pendingInvites.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
              <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-2">
                <Clock size={13} className="text-white/30"/>
                <p className="text-sm font-semibold text-white/50">Invitations en attente ({pendingInvites.length})</p>
              </div>
              <div className="divide-y divide-white/4">
                {pendingInvites.map(inv => (
                  <div key={inv.id} className="flex items-center gap-3 px-5 py-3 opacity-70">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0">
                      <Mail size={12} className="text-white/25"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/50 truncate">{inv.invited_email}</p>
                      <p className="text-xs text-white/25">En attente d&apos;acceptation</p>
                    </div>
                    <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full border border-white/8">{inv.role}</span>
                    <button onClick={() => handleCancelInvite(inv.token)} disabled={cancellingToken === inv.token}
                      className="p-1.5 text-white/20 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-all">
                      {cancellingToken === inv.token ? <Loader2 size={11} className="animate-spin"/> : <X size={11}/>}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Role legend */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-3">Niveaux d&apos;accès</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(ROLE_CFG) as [string, typeof ROLE_CFG[keyof typeof ROLE_CFG]][]).map(([key, cfg]) => {
                const Icon = cfg.icon
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className={cn('flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border', cfg.bg, cfg.color)}>
                      <Icon size={9}/>{cfg.label}
                    </span>
                    <span className="text-[10px] text-white/25">
                      {key === 'owner'  && 'Tous les droits'}
                      {key === 'admin'  && 'Gérer projets & membres'}
                      {key === 'member' && 'Créer & modifier'}
                      {key === 'viewer' && 'Lecture seule'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      ) : (
        <DashboardTab teamId={team.id}/>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const [teams, setTeams]           = useState<Team[]>([])
  const [loading, setLoading]       = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>('')

  // Create-new-team state
  const [creating, setCreating]     = useState(false)
  const [newName, setNewName]       = useState('')
  const [saving, setSaving]         = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)

  const loadTeams = useCallback(async () => {
    const [teamsRes, profileRes] = await Promise.all([
      fetch('/api/team').then(r => r.json()),
      fetch('/api/user/profile').then(r => r.json()),
    ])
    const fetchedTeams: Team[] = teamsRes.teams ?? []
    setTeams(fetchedTeams)
    setCurrentUserId(profileRes.id ?? '')
    if (fetchedTeams.length > 0 && !selectedId) {
      setSelectedId(fetchedTeams[0].id)
    }
    setLoading(false)
  }, [selectedId])

  useEffect(() => { loadTeams() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreateTeam() {
    if (!newName.trim() || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      const newTeam: Team = data.team
      setTeams(prev => [...prev, newTeam])
      setSelectedId(newTeam.id)
      setNewName('')
      setCreating(false)
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'Erreur')
      setTimeout(() => setGlobalError(null), 4000)
    } finally { setSaving(false) }
  }

  function handleTeamDeleted(id: string) {
    setTeams(prev => {
      const next = prev.filter(t => t.id !== id)
      if (selectedId === id) setSelectedId(next[0]?.id ?? null)
      return next
    })
  }

  function handleTeamRenamed(id: string, name: string) {
    setTeams(prev => prev.map(t => t.id === id ? { ...t, name } : t))
  }

  const selectedTeam = teams.find(t => t.id === selectedId) ?? null

  return (
    <div className="flex flex-col min-h-0 animate-fade-in">

      {/* Header */}
      <div className="bg-[var(--bg-surface)] border-b border-white/5 px-5 md:px-8 flex-shrink-0">
        <div className="h-14 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-white">Équipes</h1>
            <p className="text-xs text-white/35 mt-0.5">Gérez vos équipes et leurs membres</p>
          </div>
          {!creating && (
            <button onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-400 border border-blue-500/25 hover:border-blue-500/50 hover:bg-blue-500/10 rounded-lg transition-all">
              <Plus size={12}/>Nouvelle équipe
            </button>
          )}
        </div>

        {/* Team tabs */}
        {teams.length > 0 && (
          <div className="flex gap-0.5 -mb-px overflow-x-auto scrollbar-hide">
            {teams.map(t => (
              <button key={t.id} onClick={() => setSelectedId(t.id)}
                className={cn('flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap',
                  selectedId === t.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-white/40 hover:text-white/70')}>
                <Users size={11}/>{t.name}
                <span className="text-[9px] text-white/20">({t.members.length})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 max-w-3xl">

        {/* Global error */}
        {globalError && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            <AlertCircle size={13}/>{globalError}
          </div>
        )}

        {/* Create team form */}
        {creating && (
          <div className="rounded-2xl p-5" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.20)' }}>
            <p className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
              <Plus size={14} className="text-blue-400"/>Créer une nouvelle équipe
            </p>
            <div className="flex gap-2">
              <input type="text" placeholder="Nom de l'équipe" value={newName}
                onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateTeam()}
                autoFocus
                className="flex-1 px-3 py-2.5 bg-white/5 border border-white/8 rounded-lg text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"/>
              <button onClick={handleCreateTeam} disabled={!newName.trim() || saving}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors">
                {saving ? <Loader2 size={14} className="animate-spin"/> : 'Créer'}
              </button>
              <button onClick={() => { setCreating(false); setNewName('') }}
                className="px-3 py-2.5 text-white/30 hover:text-white/70 border border-white/10 rounded-lg transition-colors">
                <X size={14}/>
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-white/20"/>
          </div>
        ) : teams.length === 0 && !creating ? (
          /* No teams yet */
          <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.10)' }}>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <Users size={22} className="text-blue-400"/>
            </div>
            <h2 className="text-white font-semibold mb-1">Aucune équipe</h2>
            <p className="text-white/40 text-sm mb-6">
              Créez une équipe pour inviter vos collaborateurs et partager des projets.
            </p>
            <button onClick={() => setCreating(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors">
              <Plus size={14}/>Créer ma première équipe
            </button>
          </div>
        ) : selectedTeam ? (
          <TeamDetail
            team={selectedTeam}
            currentUserId={currentUserId}
            onDeleted={handleTeamDeleted}
            onRenamed={handleTeamRenamed}
          />
        ) : null}
      </div>
    </div>
  )
}

// Suppress unused-import warnings
void TrendingUp; void Target; void Trophy; void XCircle
