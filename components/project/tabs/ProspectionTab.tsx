'use client'

import { useState } from 'react'
import {
  Search, User, Mail, Phone, Euro, FileText, Check,
  Loader2, Globe, Users, Radio, Inbox, HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { ProspectionData, ProspectionSource } from '@/types'

const SOURCE_OPTIONS: { value: ProspectionSource; label: string; icon: typeof Globe; color: string; bg: string; border: string }[] = [
  { value: 'boamp',           label: 'BOAMP / TED',          icon: Globe,       color: 'text-blue-300',    bg: 'bg-blue-500/12',    border: 'border-blue-500/25'    },
  { value: 'marches_publics', label: 'Marchés publics',      icon: Search,      color: 'text-violet-300',  bg: 'bg-violet-500/12',  border: 'border-violet-500/25'  },
  { value: 'reseau',          label: 'Réseau / Recommand.',  icon: Users,       color: 'text-emerald-300', bg: 'bg-emerald-500/12', border: 'border-emerald-500/25' },
  { value: 'inbound',         label: 'Inbound / Site web',   icon: Inbox,       color: 'text-amber-300',   bg: 'bg-amber-500/12',   border: 'border-amber-500/25'   },
  { value: 'autre',           label: 'Autre source',         icon: HelpCircle,  color: 'text-white/40',    bg: 'bg-white/5',        border: 'border-white/12'       },
]

interface ProspectionTabProps {
  projectId:  string
  data:       ProspectionData | null
  onChange:   (data: ProspectionData) => void
}

export function ProspectionTab({ projectId, data, onChange }: ProspectionTabProps) {
  const [form, setForm] = useState<ProspectionData>(data ?? {})
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  function update(patch: Partial<ProspectionData>) {
    setForm(prev => ({ ...prev, ...patch }))
  }

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/pipeline`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ prospection: { ...form, detected_at: form.detected_at ?? new Date().toISOString() } }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { error?: string }).error ?? 'Erreur')
      }
      onChange(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Search size={16} className="text-blue-400" />
            Étape 1 — Prospection & Détection
          </h2>
          <p className="text-xs text-white/40 mt-0.5">
            Origine de l&apos;opportunité et contact principal
          </p>
        </div>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <Check size={12} />Sauvegardé
          </span>
        )}
      </div>

      {/* Source de détection */}
      <div className="bg-[var(--bg-card)] border border-white/8 rounded-2xl p-5 space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-white/30">Source de détection</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SOURCE_OPTIONS.map(opt => {
            const Icon = opt.icon
            const selected = form.source === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => update({ source: opt.value })}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all text-left',
                  selected ? cn(opt.bg, opt.border, opt.color) : 'bg-white/3 border-white/8 text-white/40 hover:border-white/20 hover:text-white/60',
                )}
              >
                <Icon size={13} className="flex-shrink-0" />
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Contact principal */}
      <div className="bg-[var(--bg-card)] border border-white/8 rounded-2xl p-5 space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-white/30">Contact principal</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field
            icon={<User size={13} />}
            label="Nom du contact"
            value={form.contact_nom ?? ''}
            placeholder="ex: Jean Dupont"
            onChange={v => update({ contact_nom: v })}
          />
          <Field
            icon={<FileText size={13} />}
            label="Poste / Fonction"
            value={form.contact_poste ?? ''}
            placeholder="ex: Directeur des achats"
            onChange={v => update({ contact_poste: v })}
          />
          <Field
            icon={<Mail size={13} />}
            label="Email"
            type="email"
            value={form.contact_email ?? ''}
            placeholder="jean.dupont@mairie.fr"
            onChange={v => update({ contact_email: v })}
          />
          <Field
            icon={<Phone size={13} />}
            label="Téléphone"
            type="tel"
            value={form.contact_phone ?? ''}
            placeholder="06 XX XX XX XX"
            onChange={v => update({ contact_phone: v })}
          />
        </div>
      </div>

      {/* Budget & Notes */}
      <div className="bg-[var(--bg-card)] border border-white/8 rounded-2xl p-5 space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-white/30">Estimation & Notes</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] text-white/40">Budget estimé (€)</label>
            <div className="relative">
              <Euro size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                type="number"
                min="0"
                value={form.budget_estime ?? ''}
                onChange={e => update({ budget_estime: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="ex : 250000"
                className="w-full bg-white/4 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-white/40">Date de détection</label>
            <input
              type="date"
              value={form.detected_at ? form.detected_at.slice(0, 10) : ''}
              onChange={e => update({ detected_at: e.target.value })}
              className="w-full bg-white/4 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/70 outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-white/40">Notes de prospection</label>
          <textarea
            rows={4}
            value={form.notes ?? ''}
            onChange={e => update({ notes: e.target.value })}
            placeholder="Contexte de l'appel d'offres, points d'attention, historique avec ce client…"
            className="w-full bg-white/4 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/50 transition-colors resize-none"
          />
        </div>
      </div>

      {/* Save */}
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        {saving ? 'Enregistrement…' : 'Sauvegarder'}
      </button>
    </div>
  )
}

// ── Shared field component ────────────────────────────────────────────────────

function Field({
  icon, label, value, placeholder, type = 'text', onChange,
}: {
  icon: React.ReactNode
  label: string
  value: string
  placeholder: string
  type?: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] text-white/40">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white/4 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/50 transition-colors"
        />
      </div>
    </div>
  )
}
