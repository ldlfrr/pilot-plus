'use client'

import { useEffect, useState } from 'react'
import { Users, Loader2, Check, ChevronDown, X, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Intervenant, IntervenantRole } from '@/types'

// ── Role config ───────────────────────────────────────────────────────────────

const ROLES: { value: IntervenantRole; label: string; color: string; bg: string; border: string }[] = [
  { value: 'commercial',       label: 'Commercial',         color: 'text-blue-300',   bg: 'bg-blue-500/12',   border: 'border-blue-500/25'   },
  { value: 'directeur_agence', label: 'Directeur agence',   color: 'text-violet-300', bg: 'bg-violet-500/12', border: 'border-violet-500/25' },
  { value: 'charge_affaires',  label: "Chargé d'affaires",  color: 'text-emerald-300',bg: 'bg-emerald-500/12',border: 'border-emerald-500/25'},
  { value: 'avant_vente',      label: 'Avant-vente',        color: 'text-amber-300',  bg: 'bg-amber-500/12',  border: 'border-amber-500/25'  },
]

function getRoleCfg(role: IntervenantRole | null) {
  return ROLES.find(r => r.value === role) ?? null
}

// ── Member type ───────────────────────────────────────────────────────────────

interface Member {
  id:        string
  user_id:   string
  role:      string
  full_name: string | null
  email:     string
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

// ── Role dropdown for a member ────────────────────────────────────────────────

interface RolePickerProps {
  assigned:     IntervenantRole | null
  onAssign:     (role: IntervenantRole | null) => void
  saving:       boolean
}

function RolePicker({ assigned, onAssign, saving }: RolePickerProps) {
  const [open, setOpen] = useState(false)
  const cfg = getRoleCfg(assigned)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={saving}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all',
          cfg
            ? cn(cfg.bg, cfg.border, cfg.color)
            : 'bg-white/4 border-white/8 text-white/30 hover:text-white/50 hover:border-white/15',
        )}
      >
        {saving
          ? <Loader2 size={10} className="animate-spin" />
          : cfg
          ? <UserCheck size={10} />
          : <ChevronDown size={10} />}
        <span>{cfg ? cfg.label : 'Aucun rôle'}</span>
        {!saving && <ChevronDown size={9} className="opacity-40" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-[var(--bg-card)] border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[170px]"
            style={{ backdropFilter: 'blur(16px)' }}>
            {/* Remove role option */}
            {assigned && (
              <button
                onClick={() => { onAssign(null); setOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs text-white/40 hover:bg-white/5 hover:text-red-400 transition-colors border-b border-white/6"
              >
                <X size={10} />Retirer le rôle
              </button>
            )}
            {ROLES.map(r => (
              <button
                key={r.value}
                onClick={() => { onAssign(r.value); setOpen(false) }}
                className={cn(
                  'w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors',
                  assigned === r.value ? cn(r.bg, r.color) : 'text-white/60 hover:bg-white/5',
                )}
              >
                <span className={cn('text-xs font-semibold', assigned === r.value ? r.color : '')}>{r.label}</span>
                {assigned === r.value && <Check size={11} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface IntervenantsTabProps {
  projectId:    string
  intervenants: Intervenant[]
  onChange:     (updated: Intervenant[]) => void
}

export function IntervenantsTab({ projectId, intervenants, onChange }: IntervenantsTabProps) {
  const [members,  setMembers]  = useState<Member[]>([])
  const [loading,  setLoading]  = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [saved,    setSaved]    = useState(false)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/members`)
      .then(r => r.ok ? r.json() : { members: [] })
      .then(d => setMembers(d.members ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectId])

  // Derive assigned role for a given user (by email or user_id)
  function getAssignedRole(member: Member): IntervenantRole | null {
    const iv = intervenants.find(
      i => i.email === member.email || (i as Intervenant & { user_id?: string }).user_id === member.user_id,
    )
    return iv ? iv.role : null
  }

  async function handleAssign(member: Member, role: IntervenantRole | null) {
    setSavingId(member.user_id)
    try {
      // Remove any existing entry for this member
      let next = intervenants.filter(
        i => i.email !== member.email &&
             (i as Intervenant & { user_id?: string }).user_id !== member.user_id,
      )
      // Add new role if provided
      if (role) {
        next = [
          ...next,
          {
            role,
            name:    member.full_name ?? member.email,
            email:   member.email,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            user_id: member.user_id,
          } as any,
        ]
      }
      await fetch(`/api/projects/${projectId}/pipeline`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ intervenants: next }),
      })
      onChange(next)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSavingId(null)
    }
  }

  // Group assigned intervenants by role for the summary view
  const byRole = ROLES.map(r => ({
    ...r,
    members: members.filter(m => getAssignedRole(m) === r.value),
  })).filter(g => g.members.length > 0)

  return (
    <div className="max-w-2xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users size={16} className="text-blue-400" />
            Intervenants
          </h2>
          <p className="text-xs text-white/40 mt-0.5">
            Assignez un rôle commercial aux membres du projet
          </p>
        </div>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <Check size={12} />Sauvegardé
          </span>
        )}
      </div>

      {/* Members list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={18} className="animate-spin text-white/20" />
        </div>
      ) : members.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-dashed border-white/8 rounded-2xl p-10 text-center">
          <Users size={24} className="mx-auto text-white/15 mb-3" />
          <p className="text-sm text-white/35">Aucun membre dans ce projet</p>
          <p className="text-xs text-white/20 mt-1">
            Invitez des collaborateurs dans l'onglet <strong className="text-white/30">Équipe → Membres</strong> pour leur assigner un rôle.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map(member => {
            const assignedRole = getAssignedRole(member)
            const isSaving     = savingId === member.user_id
            const ini          = initials(member.full_name, member.email)
            const roleCfg      = getRoleCfg(assignedRole)

            return (
              <div
                key={member.user_id}
                className={cn(
                  'flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border transition-all',
                  roleCfg
                    ? cn('border-white/8', roleCfg.bg)
                    : 'bg-[var(--bg-card)] border-white/6 hover:border-white/10',
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 border',
                  roleCfg
                    ? cn(roleCfg.bg, roleCfg.border, roleCfg.color)
                    : 'bg-white/6 border-white/10 text-white/40',
                )}>
                  {ini}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/85 truncate">
                    {member.full_name ?? <span className="italic text-white/35">Sans nom</span>}
                  </p>
                  <p className="text-xs text-white/30 truncate">{member.email}</p>
                </div>

                {/* Role picker */}
                <RolePicker
                  assigned={assignedRole}
                  onAssign={role => handleAssign(member, role)}
                  saving={isSaving}
                />
              </div>
            )
          })}
        </div>
      )}

      {/* Role summary */}
      {byRole.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-white/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">Récapitulatif</p>
          <div className="grid grid-cols-2 gap-2">
            {byRole.map(group => (
              <div key={group.value}
                className={cn('px-3.5 py-3 rounded-xl border', group.bg, group.border)}>
                <p className={cn('text-[10px] font-bold uppercase tracking-wider mb-2', group.color)}>
                  {group.label}
                </p>
                {group.members.map(m => (
                  <p key={m.user_id} className="text-xs text-white/65 truncate">
                    {m.full_name ?? m.email}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
