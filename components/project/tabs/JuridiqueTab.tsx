'use client'

import { useState } from 'react'
import {
  Scale, AlertTriangle, CheckCircle, AlertCircle,
  User, Calendar, FileText, Check, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { JuridiqueData, JuridiqueRisque } from '@/types'

const RISQUE_OPTIONS: {
  value: JuridiqueRisque
  label: string
  desc:  string
  color: string
  bg:    string
  border: string
  icon: typeof CheckCircle
}[] = [
  {
    value: 'faible',
    label: 'Risque faible',
    desc: 'Contrat standard, conditions acceptables',
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/12',
    border: 'border-emerald-500/25',
    icon: CheckCircle,
  },
  {
    value: 'moyen',
    label: 'Risque modéré',
    desc: 'Quelques clauses à surveiller',
    color: 'text-amber-300',
    bg: 'bg-amber-500/12',
    border: 'border-amber-500/25',
    icon: AlertCircle,
  },
  {
    value: 'eleve',
    label: 'Risque élevé',
    desc: 'Clauses problématiques identifiées',
    color: 'text-red-300',
    bg: 'bg-red-500/12',
    border: 'border-red-500/25',
    icon: AlertTriangle,
  },
]

const CHECKLIST_ITEMS: { key: keyof Pick<JuridiqueData, 'clauses_penalites' | 'sous_traitance' | 'assurances'>; label: string; desc: string }[] = [
  {
    key: 'clauses_penalites',
    label: 'Clauses de pénalités analysées',
    desc: 'Délais, montants, conditions de déclenchement',
  },
  {
    key: 'sous_traitance',
    label: 'Sous-traitance autorisée',
    desc: 'Vérifier conditions de sous-traitance éventuelle',
  },
  {
    key: 'assurances',
    label: 'Assurances vérifiées',
    desc: 'RC Pro, décennale, couvertures exigées',
  },
]

interface JuridiqueTabProps {
  projectId: string
  data:      JuridiqueData | null
  onChange:  (data: JuridiqueData) => void
}

export function JuridiqueTab({ projectId, data, onChange }: JuridiqueTabProps) {
  const [form, setForm] = useState<JuridiqueData>(data ?? {})
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  function update(patch: Partial<JuridiqueData>) {
    setForm(prev => ({ ...prev, ...patch }))
  }

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      const payload = { ...form, revue_at: form.revue_at ?? new Date().toISOString().slice(0, 10) }
      const res = await fetch(`/api/projects/${projectId}/pipeline`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ juridique: payload }),
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

  const risqueCfg = RISQUE_OPTIONS.find(r => r.value === form.risque_global)

  return (
    <div className="max-w-2xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Scale size={16} className="text-yellow-400" />
            Étape 6 — Analyse juridique
          </h2>
          <p className="text-xs text-white/40 mt-0.5">
            Revue du contrat, clauses à risque et conditions
          </p>
        </div>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <Check size={12} />Sauvegardé
          </span>
        )}
      </div>

      {/* Niveau de risque global */}
      <div className="bg-[var(--bg-card)] border border-white/8 rounded-2xl p-5 space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-white/30">Niveau de risque global</p>
        <div className="grid grid-cols-3 gap-2">
          {RISQUE_OPTIONS.map(opt => {
            const Icon = opt.icon
            const selected = form.risque_global === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => update({ risque_global: opt.value })}
                className={cn(
                  'flex flex-col items-center gap-2 px-3 py-4 rounded-xl border text-center transition-all',
                  selected ? cn(opt.bg, opt.border) : 'bg-white/3 border-white/8 hover:border-white/20',
                )}
              >
                <Icon size={20} className={selected ? opt.color : 'text-white/20'} />
                <p className={cn('text-xs font-semibold', selected ? opt.color : 'text-white/35')}>{opt.label}</p>
                <p className="text-[10px] text-white/25 leading-tight">{opt.desc}</p>
              </button>
            )
          })}
        </div>
        {risqueCfg && (
          <div className={cn('flex items-center gap-2 px-3.5 py-2.5 rounded-xl border', risqueCfg.bg, risqueCfg.border)}>
            <risqueCfg.icon size={14} className={risqueCfg.color} />
            <span className={cn('text-sm font-semibold', risqueCfg.color)}>
              Évaluation : {risqueCfg.label}
            </span>
          </div>
        )}
      </div>

      {/* Checklist contractuelle */}
      <div className="bg-[var(--bg-card)] border border-white/8 rounded-2xl p-5 space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-white/30">Checklist contractuelle</p>
        {CHECKLIST_ITEMS.map(item => {
          const checked = !!(form[item.key])
          return (
            <button
              key={item.key}
              onClick={() => update({ [item.key]: !checked })}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all',
                checked
                  ? 'bg-emerald-500/8 border-emerald-500/20'
                  : 'bg-white/3 border-white/8 hover:border-white/18',
              )}
            >
              <div className={cn(
                'flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all',
                checked ? 'bg-emerald-500/30 border-emerald-500/60' : 'border-white/15',
              )}>
                {checked && <Check size={11} className="text-emerald-400" />}
              </div>
              <div>
                <p className={cn('text-sm font-medium', checked ? 'text-emerald-300' : 'text-white/60')}>
                  {item.label}
                </p>
                <p className="text-[11px] text-white/25 mt-0.5">{item.desc}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Conditions paiement & durée */}
      <div className="bg-[var(--bg-card)] border border-white/8 rounded-2xl p-5 space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-white/30">Conditions contractuelles</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] text-white/40">Conditions de paiement</label>
            <input
              type="text"
              value={form.conditions_paiement ?? ''}
              onChange={e => update({ conditions_paiement: e.target.value })}
              placeholder="ex: 30 jours fin de mois"
              className="w-full bg-white/4 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-yellow-500/50 transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-white/40">Durée du contrat</label>
            <input
              type="text"
              value={form.duree_contrat ?? ''}
              onChange={e => update({ duree_contrat: e.target.value })}
              placeholder="ex: 12 mois, 3 ans…"
              className="w-full bg-white/4 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-yellow-500/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Revue & notes */}
      <div className="bg-[var(--bg-card)] border border-white/8 rounded-2xl p-5 space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-white/30">Revue juridique</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] text-white/40">Revu par</label>
            <div className="relative">
              <User size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                type="text"
                value={form.revu_par ?? ''}
                onChange={e => update({ revu_par: e.target.value })}
                placeholder="Nom du juriste / responsable"
                className="w-full bg-white/4 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-yellow-500/50 transition-colors"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-white/40">Date de revue</label>
            <div className="relative">
              <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                type="date"
                value={form.revue_at ?? ''}
                onChange={e => update({ revue_at: e.target.value })}
                className="w-full bg-white/4 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white/70 outline-none focus:border-yellow-500/50 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] text-white/40">Notes juridiques</label>
          <div className="relative">
            <FileText size={13} className="absolute left-3 top-3 text-white/25" />
            <textarea
              rows={5}
              value={form.notes_juridiques ?? ''}
              onChange={e => update({ notes_juridiques: e.target.value })}
              placeholder="Points de vigilance juridiques, clauses négociées, recommandations…"
              className="w-full bg-white/4 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-yellow-500/50 transition-colors resize-none"
            />
          </div>
        </div>
      </div>

      {/* Save */}
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        {saving ? 'Enregistrement…' : 'Sauvegarder'}
      </button>
    </div>
  )
}
