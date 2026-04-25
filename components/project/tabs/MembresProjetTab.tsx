'use client'

import { useEffect, useState } from 'react'
import { Users, UserPlus, Trash2, ChevronDown, Loader2, AlertCircle, CheckCircle, Crown, Shield, Eye, Wrench, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Member {
  id:         string
  user_id:    string
  role:       string
  full_name:  string | null
  email:      string
  created_at: string
}

interface MembresProjetTabProps {
  projectId:   string
  /** Role of the currently authenticated user on this project */
  currentRole: 'owner' | 'editor' | 'viewer' | 'avant_vente'
}

const ROLE_OPTIONS = [
  { value: 'editor',      label: 'Éditeur',      desc: 'Peut modifier le projet',            color: 'text-blue-400',   bg: 'bg-blue-500/15 border-blue-500/30'  },
  { value: 'avant_vente', label: 'Avant-Vente',   desc: 'Accès chiffrage + mémoire',          color: 'text-violet-400', bg: 'bg-violet-500/15 border-violet-500/30' },
  { value: 'viewer',      label: 'Lecteur',       desc: 'Consultation uniquement',            color: 'text-white/50',   bg: 'bg-white/5 border-white/10'         },
]

function roleCfg(role: string) {
  switch (role) {
    case 'owner':      return { label: 'Propriétaire', icon: Crown,   color: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/30'  }
    case 'editor':     return { label: 'Éditeur',      icon: Wrench,  color: 'text-blue-400',    bg: 'bg-blue-500/15 border-blue-500/30'    }
    case 'avant_vente':return { label: 'Avant-Vente',  icon: Shield,  color: 'text-violet-400',  bg: 'bg-violet-500/15 border-violet-500/30' }
    case 'viewer':     return { label: 'Lecteur',      icon: Eye,     color: 'text-white/50',    bg: 'bg-white/5 border-white/10'           }
    default:           return { label: role,           icon: Users,   color: 'text-white/40',    bg: 'bg-white/5 border-white/10'           }
  }
}

function initials(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(/\s+/)
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

export function MembresProjetTab({ projectId, currentRole }: MembresProjetTabProps) {
  const isOwner = currentRole === 'owner'

  const [members,      setMembers]      = useState<Member[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [success,      setSuccess]      = useState<string | null>(null)

  // Add form
  const [addEmail,     setAddEmail]     = useState('')
  const [addRole,      setAddRole]      = useState('editor')
  const [adding,       setAdding]       = useState(false)
  const [addError,     setAddError]     = useState<string | null>(null)

  // Role change
  const [changingId,   setChangingId]   = useState<string | null>(null)
  const [roleMenuId,   setRoleMenuId]   = useState<string | null>(null)

  // Remove
  const [removingId,   setRemovingId]   = useState<string | null>(null)

  async function loadMembers() {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/members`)
      if (!res.ok) throw new Error('Impossible de charger les membres')
      const json = await res.json()
      setMembers(json.members ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadMembers() }, [projectId])   // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addEmail.trim()) return
    setAdding(true); setAddError(null); setSuccess(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addEmail.trim(), role: addRole }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur')
      setMembers(prev => [...prev, json.member])
      setAddEmail('')
      setSuccess(`${json.member.full_name ?? json.member.email} a été ajouté·e au projet.`)
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setAdding(false)
    }
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    setChangingId(memberId); setRoleMenuId(null); setSuccess(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, role: newRole }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Erreur')
      }
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m))
      setSuccess('Rôle mis à jour.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setChangingId(null)
    }
  }

  async function handleRemove(memberId: string, name: string) {
    if (!confirm(`Retirer ${name} du projet ?`)) return
    setRemovingId(memberId); setSuccess(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Erreur')
      }
      setMembers(prev => prev.filter(m => m.id !== memberId))
      setSuccess(`${name} a été retiré·e du projet.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Users size={18} className="text-white/40" />
        <h2 className="text-base font-semibold text-white">Membres du projet</h2>
        <span className="ml-auto text-xs text-white/30">{members.length + 1} membre{members.length > 0 ? 's' : ''}</span>
      </div>

      {/* Feedback banners */}
      {error && (
        <div className="mb-4 flex items-start gap-2 text-sm text-red-400 bg-red-950/30 border border-red-800/40 rounded-lg px-3.5 py-2.5">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-white/30 hover:text-white/60"><X size={12} /></button>
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 text-sm text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 rounded-lg px-3.5 py-2.5">
          <CheckCircle size={14} />
          <span className="flex-1">{success}</span>
          <button onClick={() => setSuccess(null)} className="text-white/30 hover:text-white/60"><X size={12} /></button>
        </div>
      )}

      {/* Add member form — owner only */}
      {isOwner && (
        <form
          onSubmit={handleAdd}
          className="mb-6 bg-[var(--bg-card)] border border-white/8 rounded-xl p-4"
        >
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Inviter un membre</p>
          <div className="flex gap-2 flex-wrap">
            <input
              type="email"
              placeholder="email@exemple.com"
              value={addEmail}
              onChange={e => setAddEmail(e.target.value)}
              className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-blue-500/50 transition-colors"
            />
            {/* Role picker */}
            <select
              value={addRole}
              onChange={e => setAddRole(e.target.value)}
              className="bg-[var(--bg-base)] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 outline-none focus:border-blue-500/50 cursor-pointer"
            >
              {ROLE_OPTIONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={adding || !addEmail.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {adding ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
              Inviter
            </button>
          </div>
          {addError && (
            <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5">
              <AlertCircle size={11} />{addError}
            </p>
          )}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {ROLE_OPTIONS.map(r => (
              <div key={r.value} className={cn('border rounded-lg p-2.5 text-xs transition-all cursor-pointer', addRole === r.value ? r.bg : 'border-white/6 bg-white/3')}
                onClick={() => setAddRole(r.value)}>
                <p className={cn('font-semibold mb-0.5', addRole === r.value ? r.color : 'text-white/50')}>{r.label}</p>
                <p className="text-white/30 text-[11px] leading-tight">{r.desc}</p>
              </div>
            ))}
          </div>
        </form>
      )}

      {/* Members list */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-white/30 py-8 justify-center">
          <Loader2 size={16} className="animate-spin" />Chargement...
        </div>
      ) : (
        <div className="space-y-2">
          {/* Owner row (static — always first) */}
          <div className="flex items-center gap-3 bg-[var(--bg-card)] border border-amber-500/15 rounded-xl px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
              <Crown size={14} className="text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/80 truncate">Vous (propriétaire)</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400">
              Propriétaire
            </span>
          </div>

          {members.length === 0 && (
            <div className="text-center py-10 text-white/30 text-sm">
              Aucun membre ajouté pour l&apos;instant.
              {isOwner && <p className="text-xs mt-1 text-white/20">Utilisez le formulaire ci-dessus pour inviter des collaborateurs.</p>}
            </div>
          )}

          {members.map(member => {
            const cfg = roleCfg(member.role)
            const RoleIcon = cfg.icon
            const displayName = member.full_name ?? member.email
            const isChanging = changingId === member.id
            const isRemoving = removingId === member.id

            return (
              <div
                key={member.id}
                className="flex items-center gap-3 bg-[var(--bg-card)] border border-white/6 rounded-xl px-4 py-3 hover:border-white/10 transition-colors"
              >
                {/* Avatar */}
                <div className={cn('w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 text-[11px] font-bold', cfg.bg, cfg.color)}>
                  {initials(member.full_name, member.email)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">{member.full_name ?? <span className="text-white/40 italic">Sans nom</span>}</p>
                  <p className="text-xs text-white/35 truncate">{member.email}</p>
                </div>

                {/* Role pill / dropdown */}
                {isOwner ? (
                  <div className="relative">
                    <button
                      onClick={() => setRoleMenuId(roleMenuId === member.id ? null : member.id)}
                      disabled={isChanging}
                      className={cn(
                        'flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border transition-all',
                        cfg.bg, cfg.color,
                        'hover:opacity-80'
                      )}
                    >
                      {isChanging ? <Loader2 size={11} className="animate-spin" /> : <RoleIcon size={11} />}
                      {cfg.label}
                      <ChevronDown size={10} className="opacity-60" />
                    </button>

                    {roleMenuId === member.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setRoleMenuId(null)} />
                        <div className="absolute right-0 top-full mt-1 z-20 bg-[var(--bg-card)] border border-white/12 rounded-xl shadow-xl overflow-hidden min-w-[160px]">
                          {ROLE_OPTIONS.map(r => (
                            <button
                              key={r.value}
                              onClick={() => handleRoleChange(member.id, r.value)}
                              className={cn(
                                'w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-white/5 transition-colors',
                                member.role === r.value && 'bg-white/4'
                              )}
                            >
                              <div className="flex-1">
                                <p className={cn('text-xs font-semibold', r.color)}>{r.label}</p>
                                <p className="text-[11px] text-white/30 mt-0.5">{r.desc}</p>
                              </div>
                              {member.role === r.value && <CheckCircle size={12} className={cn('mt-0.5 flex-shrink-0', r.color)} />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-md border', cfg.bg, cfg.color)}>
                    <RoleIcon size={11} className="inline mr-1" />{cfg.label}
                  </span>
                )}

                {/* Remove — owner only */}
                {isOwner && (
                  <button
                    onClick={() => handleRemove(member.id, displayName)}
                    disabled={isRemoving}
                    title="Retirer du projet"
                    className="p-1.5 text-white/20 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-all disabled:opacity-40"
                  >
                    {isRemoving ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Info box */}
      <div className="mt-6 bg-blue-950/20 border border-blue-500/15 rounded-xl px-4 py-3">
        <p className="text-xs text-blue-300/70 font-medium mb-1">Accès en temps réel</p>
        <p className="text-xs text-white/30 leading-relaxed">
          Tous les membres voient le même projet. Les analyses, coches, chiffrage et mémoires sont partagés instantanément.
          Seul le propriétaire peut ajouter ou retirer des membres.
        </p>
      </div>
    </div>
  )
}
