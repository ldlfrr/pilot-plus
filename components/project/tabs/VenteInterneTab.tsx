'use client'

import { useState } from 'react'
import {
  Building2, Calendar, Users, FileText, Check, Loader2,
  CheckCircle, XCircle, Clock, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { VenteInterneData, VenteInterneStatus } from '@/types'

const STATUS_OPTIONS: {
  value: VenteInterneStatus
  label: string
  desc:  string
  color: string
  bg:    string
  border: string
  icon: typeof Clock
}[] = [
  {
    value: 'en_attente',
    label: 'En attente',
    desc: 'Pas encore présenté',
    color: 'text-white/40',
    bg: 'bg-white/4',
    border: 'border-white/10',
    icon: Clock,
  },
  {
    value: 'en_cours',
    label: 'En cours',
    desc: 'Présentation en cours',
    color: 'text-amber-300',
    bg: 'bg-amber-500/12',
    border: 'border-amber-500/25',
    icon: AlertCircle,
  },
  {
    value: 'approuve',
    label: 'Approuvé',
    desc: 'GO direction confirmé',
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/12',
    border: 'border-emerald-500/25',
    icon: CheckCircle,
  },
  {
    value: 'refuse',
    label: 'Refusé',
    desc: 'Direction a refusé',
    color: 'text-red-300',
    bg: 'bg-red-500/12',
    border: 'border-red-500/25',
    icon: XCircle,
  },
]

const PARTICIPANTS_SUGGESTIONS = [
  'Directeur général',
  'Directeur commercial',
  'Directeur technique',
  'Responsable RH',
  'DAF',
  'Chargé d\'affaires',
  'Commercial',
  'Avant-vente',
]

interface VenteInterneTabProps {
  projectId: string
  data:      VenteInterneData | null
  onChange:  (data: VenteInterneData) => void
}

export function VenteInterneTab({ projectId, data, onChange }: VenteInterneTabProps) {
  const [form, setForm] = useState<VenteInterneData>(data ?? { status: 'en_attente', participants: [] })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)
  const [participant, setParticipant] = useState('')

  function update(patch: Partial<VenteInterneData>) {
    setForm(prev => ({ ...prev, ...patch }))
  }

  function addParticipant(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    const current = form.participants ?? []
    if (!current.includes(trimmed)) {
      update({ participants: [...current, trimmed] })
    }
    setParticipant('')
  }

  function removeParticipant(name: string) {
    update({ participants: (form.participants ?? []).filter(p => p !== name) })
  }

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      const payload = {
        ...form,
        decision_at: form.status === 'approuve' || form.status === 'refuse'
          ? (form.decision_at ?? new Date().toISOString())
          : form.decision_at,
      }
      const res = await fetch(`/api/projects/${projectId}/pipeline`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ vente_interne: payload }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { error?: string }).error ?? 'Erreur')
      }
      onChange(payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const statusCfg = STATUS_OPTIONS.find(s => s.value === (form.status ?? 'en_attente'))!

  return (
    <div className="max-w-2xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 size={16} className="text-emerald-400" />
            Étape 3 — Vente interne
          </h2>
          <p className="text-xs text-white/40 mt-0.5">
            Présentation direction & approbation interne
          </p>
        </div>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <Check size={12} />Sauvegardé
          </span>
        )}
      </div>

      {/* Statut décision */}
      <div className="bg-[var(--bg-card)] border border-white/8 rounded-2xl p-5 space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-white/30">Décision direction</p>
        <div className="grid grid-cols-2 gap-2">
          {STATUS_OPTIONS.map(opt => {
            const Icon = opt.icon
            const selected = (form.status ?? 'en_attente') === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => update({ status: opt.value })}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all',
                  selected ? cn(opt.bg, opt.border) : 'bg-white/3 border-white/8 hover:border-white/20',
                )}
              >
                <Icon size={16} className={cn('flex-shrink-0 mt-0.5', selected ? opt.color : 'text-white/20')} />
                <div>
                  <p className={cn('text-xs font-semibold', selected ? opt.color : 'text-white/40')}>{opt.label}</p>
                  <p className="text-[10px] text-white/25 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Status badge */}
        <div className={cn('flex items-center gap-2 px-3.5 py-2.5 rounded-xl border', statusCfg.bg, statusCfg.border)}>
          <statusCfg.icon size={14} className={statusCfg.color} />
          <span className={cn('text-sm font-semibold', statusCfg.color)}>{statusCfg.label}</span>
          {(form.status === 'approuve' || form.status === 'refuse') && form.decision_at && (
            <span className="ml-auto text-[10px] text-white/25">
              {new Date(form.decision_at).toLocaleDateString('fr-FR')}
            </span>
          )}
        </div>
      </div>

      {/* Réunion */}
      <div className="bg-[var(--bg-card)] border border-white/8 rounded-2xl p-5 space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-white/30">Réunion de présentation</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] text-white/40">Date de réunion</label>
            <div className="relative">
              <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                type="date"
                value={form.date_reunion ?? ''}
                onChange={e => update({ date_reunion: e.target.value })}
                className="w-full bg-white/4 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white/70 outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-white/40">Décideur</label>
            <div className="relative">
              <Users size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                type="text"
                value={form.decideur ?? ''}
                onChange={e => update({ decideur: e.target.value })}
                placeholder="ex: PDG, Directeur général…"
                className="w-full bg-white/4 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="space-y-2">
          <label className="text-[11px] text-white/40">Participants à la réunion</label>
          <div className="flex flex-wrap gap-1.5">
            {(form.participants ?? []).map(p => (
              <span
                key={p}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/12 border border-emerald-500/25 text-xs text-emerald-300"
              >
                {p}
                <button
                  onClick={() => removeParticipant(p)}
                  className="text-emerald-400/50 hover:text-emerald-300 transition-colors"
                >×</button>
              </span>
            ))}
          </div>
          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-1">
            {PARTICIPANTS_SUGGESTIONS.filter(s => !(form.participants ?? []).includes(s)).map(s => (
              <button
                key={s}
                onClick={() => addParticipant(s)}
                className="px-2 py-1 text-[11px] rounded-lg bg-white/4 border border-white/8 text-white/35 hover:border-white/25 hover:text-white/60 transition-all"
              >
                + {s}
              </button>
            ))}
          </div>
          {/* Custom participant */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Users size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                type="text"
                value={participant}
                onChange={e => setParticipant(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addParticipant(participant) } }}
                placeholder="Ajouter un participant…"
                className="w-full bg-white/4 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
            <button
              onClick={() => addParticipant(participant)}
              className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold transition-all"
            >
              Ajouter
            </button>
          </div>
        </div>
      </div>

      {/* Notes direction */}
      <div className="bg-[var(--bg-card)] border border-white/8 rounded-2xl p-5 space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-white/30">Notes & Conditions direction</p>
        <div className="relative">
          <FileText size={13} className="absolute left-3 top-3 text-white/25" />
          <textarea
            rows={5}
            value={form.notes_direction ?? ''}
            onChange={e => update({ notes_direction: e.target.value })}
            placeholder="Conditions imposées par la direction, points de vigilance, budget alloué à l'avant-vente…"
            className="w-full bg-white/4 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-emerald-500/50 transition-colors resize-none"
          />
        </div>
      </div>

      {/* Save */}
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        {saving ? 'Enregistrement…' : 'Sauvegarder'}
      </button>
    </div>
  )
}
