'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import {
  Users, UserPlus, Mail, Trash2, Loader2, CheckCircle,
  AlertCircle, Crown, Shield, Eye, Clock, X,
} from 'lucide-react'

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

export default function TeamPage() {
  const [team, setTeam]         = useState<Team | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState<string | null>(null)

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole]   = useState<'admin' | 'member' | 'viewer'>('member')
  const [inviting, setInviting]       = useState(false)

  // Team name
  const [teamName, setTeamName]     = useState('')
  const [editingName, setEditingName] = useState(false)
  const [savingName, setSavingName]   = useState(false)

  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/team')
      .then(r => r.json())
      .then(d => {
        setTeam(d.team ?? null)
        setTeamName(d.team?.name ?? '')
      })
      .catch(() => setError('Impossible de charger l\'équipe'))
      .finally(() => setLoading(false))
  }, [])

  function flash(msg: string, isErr = false) {
    if (isErr) { setError(msg); setTimeout(() => setError(null), 4000) }
    else { setSuccess(msg); setTimeout(() => setSuccess(null), 3000) }
  }

  async function handleCreateTeam() {
    setLoading(true)
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamName.trim() || 'Mon équipe' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      setTeam(data.team)
      setTeamName(data.team.name)
      flash('Équipe créée !')
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Erreur', true)
    } finally { setLoading(false) }
  }

  async function handleSaveName() {
    if (!team || !teamName.trim()) return
    setSavingName(true)
    try {
      const res = await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamName.trim() }),
      })
      if (!res.ok) throw new Error('Erreur')
      setTeam(prev => prev ? { ...prev, name: teamName.trim() } : prev)
      setEditingName(false)
      flash('Nom mis à jour')
    } catch {
      flash('Impossible de renommer', true)
    } finally { setSavingName(false) }
  }

  async function handleInvite() {
    if (!inviteEmail.trim() || inviting) return
    setInviting(true)
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      if (data.member) setTeam(prev => prev ? { ...prev, members: [...prev.members, data.member] } : prev)
      setInviteEmail('')
      flash(`Invitation envoyée à ${inviteEmail.trim()}`)
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Erreur', true)
    } finally { setInviting(false) }
  }

  async function handleRemove(memberId: string, memberName: string) {
    if (!confirm(`Retirer ${memberName} de l'équipe ?`)) return
    setRemovingId(memberId)
    try {
      await fetch('/api/team/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      })
      setTeam(prev => prev ? { ...prev, members: prev.members.filter(m => m.id !== memberId) } : prev)
      flash(`${memberName} retiré de l'équipe`)
    } catch {
      flash('Impossible de retirer le membre', true)
    } finally { setRemovingId(null) }
  }

  async function handleRoleChange(memberId: string, newRole: TeamMember['role']) {
    try {
      await fetch('/api/team/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, role: newRole }),
      })
      setTeam(prev => prev
        ? { ...prev, members: prev.members.map(m => m.id === memberId ? { ...m, role: newRole } : m) }
        : prev
      )
      flash('Rôle mis à jour')
    } catch {
      flash('Impossible de changer le rôle', true)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center flex-1 h-full">
      <Loader2 size={22} className="animate-spin text-white/20" />
    </div>
  )

  return (
    <div className="flex flex-col min-h-0 animate-fade-in">

      {/* Header */}
      <div className="px-5 md:px-8 h-14 flex items-center flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.055)', background: 'rgba(8,14,34,0.80)', backdropFilter: 'blur(16px)' }}>
        <div>
          <h1 className="text-base font-semibold text-white">Équipe</h1>
          <p className="text-xs text-white/35 mt-0.5">Gérez les membres et leurs accès</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 max-w-2xl">

        {/* Feedback */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            <AlertCircle size={13} />{error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
            <CheckCircle size={13} />{success}
          </div>
        )}

        {/* No team yet */}
        {!team ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.10)' }}>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <Users size={22} className="text-blue-400" />
            </div>
            <h2 className="text-white font-semibold mb-1">Créez votre équipe</h2>
            <p className="text-white/40 text-sm mb-6">
              Invitez vos collaborateurs pour partager des projets et collaborer sur des analyses
            </p>
            <div className="flex items-center gap-2 max-w-sm mx-auto">
              <input
                type="text"
                placeholder="Nom de l'équipe"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateTeam()}
                className="flex-1 px-3 py-2.5 bg-white/5 border border-white/8 rounded-lg text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all"
              />
              <button
                onClick={handleCreateTeam}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
              >
                Créer
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Team name card */}
            <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
              <div className="flex items-center justify-between gap-4">
                {editingName ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={teamName}
                      onChange={e => setTeamName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false) }}
                      autoFocus
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                    />
                    <button onClick={handleSaveName} disabled={savingName}
                      className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                      {savingName ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    </button>
                    <button onClick={() => { setEditingName(false); setTeamName(team.name) }}
                      className="p-2 text-white/30 hover:text-white/70 border border-white/10 rounded-lg transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-[10px] text-white/30 font-semibold uppercase tracking-widest mb-0.5">Équipe</p>
                      <h2 className="text-lg font-bold text-white">{team.name}</h2>
                    </div>
                    <button
                      onClick={() => setEditingName(true)}
                      className="text-xs text-white/30 hover:text-white/60 border border-white/10 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Renommer
                    </button>
                  </>
                )}
              </div>
              <p className="text-xs text-white/30 mt-2">{team.members.length} membre{team.members.length > 1 ? 's' : ''}</p>
            </div>

            {/* Invite form */}
            <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
              <p className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                <UserPlus size={14} className="text-blue-400" />Inviter un membre
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="adresse@email.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInvite()}
                  className="flex-1 px-3 py-2.5 bg-white/5 border border-white/8 rounded-lg text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all"
                />
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as typeof inviteRole)}
                  className="bg-white/5 border border-white/8 rounded-lg px-2 py-2.5 text-xs text-white/70 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Membre</option>
                  <option value="viewer">Lecteur</option>
                </select>
                <button
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim() || inviting}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {inviting ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                  Inviter
                </button>
              </div>
            </div>

            {/* Members list */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
              <div className="px-5 py-3.5 border-b border-white/5">
                <p className="text-sm font-semibold text-white/70">Membres</p>
              </div>
              <div className="divide-y divide-white/4">
                {team.members.map(member => {
                  const cfg = ROLE_CFG[member.role]
                  const RoleIcon = cfg.icon
                  const displayName = member.full_name || member.email.split('@')[0]
                  return (
                    <div key={member.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/2 transition-colors group">
                      {/* Avatar */}
                      <div className={cn(
                        'w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
                        avatarColor(member.email),
                      )}>
                        {initials(displayName)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white/80 truncate">{displayName}</p>
                        <p className="text-xs text-white/35 truncate">{member.email}</p>
                      </div>

                      {/* Joined date */}
                      <p className="hidden sm:flex items-center gap-1 text-[10px] text-white/20 flex-shrink-0">
                        <Clock size={9} />
                        {new Date(member.joined_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>

                      {/* Role selector (non-owner) */}
                      {member.role === 'owner' ? (
                        <span className={cn('flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border flex-shrink-0', cfg.bg, cfg.color)}>
                          <RoleIcon size={9} />{cfg.label}
                        </span>
                      ) : (
                        <select
                          value={member.role}
                          onChange={e => handleRoleChange(member.id, e.target.value as TeamMember['role'])}
                          className={cn('text-[10px] font-bold px-2 py-1 rounded-full border bg-transparent cursor-pointer focus:outline-none flex-shrink-0', cfg.bg, cfg.color)}
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Membre</option>
                          <option value="viewer">Lecteur</option>
                        </select>
                      )}

                      {/* Remove (non-owner) */}
                      {member.role !== 'owner' && (
                        <button
                          onClick={() => handleRemove(member.id, displayName)}
                          disabled={removingId === member.id}
                          className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center bg-red-500/8 hover:bg-red-500/15 text-red-400/60 hover:text-red-400 rounded-lg transition-all flex-shrink-0"
                        >
                          {removingId === member.id
                            ? <Loader2 size={12} className="animate-spin" />
                            : <Trash2 size={12} />}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Role legend */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-3">Niveaux d&apos;accès</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(ROLE_CFG) as [string, typeof ROLE_CFG[keyof typeof ROLE_CFG]][]).map(([key, cfg]) => {
                  const Icon = cfg.icon
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className={cn('flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border', cfg.bg, cfg.color)}>
                        <Icon size={9} />{cfg.label}
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
        )}
      </div>
    </div>
  )
}
