'use client'

import { useState } from 'react'
import { Users, Plus, Trash2, Mail, Phone, Briefcase, UserCheck, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Intervenant, IntervenantRole } from '@/types'

const ROLES: { value: IntervenantRole; label: string; color: string; bg: string; icon: typeof Briefcase }[] = [
  { value: 'commercial',       label: 'Commercial',         color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  icon: Briefcase  },
  { value: 'directeur_agence', label: 'Directeur agence',   color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: UserCheck  },
  { value: 'charge_affaires',  label: "Chargé d'affaires",  color: '#34d399', bg: 'rgba(52,211,153,0.12)',  icon: Users      },
  { value: 'avant_vente',      label: 'Avant-vente',        color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  icon: Briefcase  },
]

function getRoleCfg(role: IntervenantRole) {
  return ROLES.find(r => r.value === role) ?? ROLES[0]
}

interface IntervenantsTabProps {
  projectId:    string
  intervenants: Intervenant[]
  onChange:     (updated: Intervenant[]) => void
}

const EMPTY_FORM: { role: IntervenantRole; name: string; email: string; phone: string } = {
  role:  'commercial',
  name:  '',
  email: '',
  phone: '',
}

export function IntervenantsTab({ projectId, intervenants, onChange }: IntervenantsTabProps) {
  const [form,    setForm]    = useState({ ...EMPTY_FORM })
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  async function save(next: Intervenant[]) {
    setSaving(true)
    try {
      await fetch(`/api/projects/${projectId}/pipeline`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ intervenants: next }),
      })
      onChange(next)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  function handleAdd() {
    if (!form.name.trim()) return
    const next: Intervenant[] = [
      ...intervenants,
      {
        role:  form.role,
        name:  form.name.trim(),
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      },
    ]
    save(next)
    setForm({ ...EMPTY_FORM })
    setShowAdd(false)
  }

  function handleRemove(idx: number) {
    const next = intervenants.filter((_, i) => i !== idx)
    save(next)
  }

  // Group by role
  const byRole = ROLES.map(r => ({
    ...r,
    members: intervenants.filter(iv => iv.role === r.value),
  }))

  return (
    <div className="max-w-2xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users size={16} className="text-blue-400" />
            Intervenants
          </h2>
          <p className="text-xs text-white/40 mt-0.5">Assignez les rôles clés sur ce projet</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <Check size={12} />Sauvegardé
            </span>
          )}
          <button
            onClick={() => setShowAdd(v => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all',
              showAdd
                ? 'bg-blue-500/20 border border-blue-500/40 text-blue-400'
                : 'bg-white/6 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white'
            )}
          >
            <Plus size={13} />
            Ajouter
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-[var(--bg-card)] border border-white/10 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Nouvel intervenant</p>

          {/* Role picker */}
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map(r => {
              const Icon = r.icon
              return (
                <button
                  key={r.value}
                  onClick={() => setForm(f => ({ ...f, role: r.value }))}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all',
                    form.role === r.value
                      ? 'text-white'
                      : 'border-white/8 bg-white/3 text-white/40 hover:text-white/60 hover:border-white/15'
                  )}
                  style={form.role === r.value ? { background: r.bg, borderColor: r.color + '40', color: r.color } : {}}
                >
                  <Icon size={12} />
                  {r.label}
                </button>
              )
            })}
          </div>

          {/* Name */}
          <div>
            <label className="text-[10px] text-white/35 uppercase tracking-wider mb-1 block">Nom *</label>
            <input
              type="text"
              placeholder="Prénom NOM"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-white/35 uppercase tracking-wider mb-1 block">Email</label>
              <input
                type="email"
                placeholder="prenom@entreprise.fr"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/35 uppercase tracking-wider mb-1 block">Téléphone</label>
              <input
                type="tel"
                placeholder="06 12 34 56 78"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={!form.name.trim() || saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              Ajouter
            </button>
            <button
              onClick={() => { setShowAdd(false); setForm({ ...EMPTY_FORM }) }}
              className="px-3 py-2 text-white/40 hover:text-white/70 text-xs transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Intervenant cards by role */}
      {intervenants.length === 0 && !showAdd ? (
        <div className="bg-[var(--bg-card)] border border-white/6 rounded-xl p-10 text-center">
          <Users size={28} className="mx-auto text-white/15 mb-3" />
          <p className="text-sm text-white/30">Aucun intervenant assigné</p>
          <p className="text-xs text-white/20 mt-1">Cliquez sur « Ajouter » pour assigner des rôles</p>
        </div>
      ) : (
        <div className="space-y-4">
          {byRole.filter(r => r.members.length > 0).map(roleGroup => (
            <div key={roleGroup.value}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: roleGroup.color }}>
                {roleGroup.label}
              </p>
              <div className="space-y-2">
                {roleGroup.members.map((iv, i) => {
                  const globalIdx = intervenants.indexOf(iv)
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl border"
                      style={{
                        background:   roleGroup.bg,
                        borderColor:  roleGroup.color + '22',
                      }}
                    >
                      {/* Avatar */}
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0"
                        style={{ background: roleGroup.color + '25', color: roleGroup.color }}
                      >
                        {iv.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white/90">{iv.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {iv.email && (
                            <a href={`mailto:${iv.email}`} className="flex items-center gap-1 text-[10px] text-white/35 hover:text-white/70 transition-colors">
                              <Mail size={9} />{iv.email}
                            </a>
                          )}
                          {iv.phone && (
                            <a href={`tel:${iv.phone}`} className="flex items-center gap-1 text-[10px] text-white/35 hover:text-white/70 transition-colors">
                              <Phone size={9} />{iv.phone}
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => handleRemove(globalIdx)}
                        className="p-1.5 text-white/20 hover:text-red-400 transition-colors rounded-lg hover:bg-red-950/20"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
