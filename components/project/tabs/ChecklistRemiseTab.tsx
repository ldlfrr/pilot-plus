'use client'

import { useState, useEffect } from 'react'
import { ClipboardCheck, Check, Loader2, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { ChecklistRemise } from '@/types'

const ITEMS: { key: keyof ChecklistRemise; label: string; desc: string }[] = [
  {
    key:   'memoire_technique',
    label: 'Mémoire technique',
    desc:  'Document technique complet rédigé et validé',
  },
  {
    key:   'chiffrage_valide',
    label: 'Chiffrage validé',
    desc:  'Montant approuvé par le directeur d\'agence',
  },
  {
    key:   'dc1_dc2_dc4',
    label: 'DC1 / DC2 / DC4',
    desc:  'Formulaires administratifs complétés et signés',
  },
  {
    key:   'references_chantiers',
    label: 'Références chantiers',
    desc:  'Fiches références pertinentes sélectionnées',
  },
  {
    key:   'attestations',
    label: 'Attestations',
    desc:  'Attestations fiscales, sociales, assurances à jour',
  },
  {
    key:   'relecture_commerciale',
    label: 'Relecture commerciale',
    desc:  'Revue finale du commercial responsable',
  },
  {
    key:   'remise_effectuee',
    label: 'Remise effectuée',
    desc:  'Offre déposée / envoyée au client',
  },
]

const DEFAULT_CHECKLIST: ChecklistRemise = {
  memoire_technique:    false,
  chiffrage_valide:     false,
  dc1_dc2_dc4:          false,
  references_chantiers: false,
  attestations:         false,
  relecture_commerciale: false,
  remise_effectuee:     false,
}

function daysUntil(deadline: string | null): number | null {
  if (!deadline) return null
  const diff = new Date(deadline).getTime() - Date.now()
  return Math.ceil(diff / 86_400_000)
}

function urgencyColor(days: number | null) {
  if (days === null)  return { text: 'text-white/30', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' }
  if (days <= 0)      return { text: 'text-red-400',    bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.25)' }
  if (days <= 7)      return { text: 'text-red-400',    bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.25)' }
  if (days <= 14)     return { text: 'text-amber-400',  bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)' }
  return                     { text: 'text-emerald-400',bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.25)' }
}

interface ChecklistRemiseTabProps {
  projectId:    string
  checklist:    ChecklistRemise | null
  offerDeadline: string | null
  onChange:     (updated: ChecklistRemise) => void
}

export function ChecklistRemiseTab({ projectId, checklist, offerDeadline, onChange }: ChecklistRemiseTabProps) {
  const [data,   setData]   = useState<ChecklistRemise>(checklist ?? { ...DEFAULT_CHECKLIST })
  const [saving, setSaving] = useState<string | null>(null)
  const [saved,  setSaved]  = useState(false)

  useEffect(() => {
    setData(checklist ?? { ...DEFAULT_CHECKLIST })
  }, [checklist])

  async function toggle(key: keyof ChecklistRemise) {
    const next = { ...data, [key]: !data[key] }
    setData(next)
    setSaving(key)
    try {
      await fetch(`/api/projects/${projectId}/pipeline`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ checklist: next }),
      })
      onChange(next)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } finally {
      setSaving(null)
    }
  }

  const done    = ITEMS.filter(it => data[it.key]).length
  const total   = ITEMS.length
  const pct     = Math.round((done / total) * 100)
  const days    = daysUntil(offerDeadline)
  const urgency = urgencyColor(days)

  return (
    <div className="max-w-xl space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ClipboardCheck size={16} className="text-blue-400" />
            Checklist remise
          </h2>
          <p className="text-xs text-white/40 mt-0.5">Validation avant soumission de l&apos;offre</p>
        </div>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <Check size={12} />Sauvegardé
          </span>
        )}
      </div>

      {/* Deadline countdown */}
      {offerDeadline && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border"
          style={{ background: urgency.bg, borderColor: urgency.border }}
        >
          {days !== null && days <= 7
            ? <AlertTriangle size={16} className={urgency.text} />
            : <Clock size={16} className={urgency.text} />}
          <div className="flex-1">
            <p className={cn('text-sm font-bold', urgency.text)}>
              {days === null ? 'Pas de date limite'
               : days <= 0  ? 'Date dépassée !'
               : days === 1 ? 'Remise demain !'
               :              `J−${days} avant remise`}
            </p>
            <p className="text-xs text-white/35">
              {new Date(offerDeadline).toLocaleDateString('fr-FR', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/40">{done}/{total} éléments validés</span>
          <span className={cn(
            'text-sm font-extrabold',
            pct === 100 ? 'text-emerald-400' : pct >= 70 ? 'text-blue-400' : 'text-white/50'
          )}>
            {pct}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/6 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: pct === 100
                ? 'linear-gradient(90deg, #10b981, #34d399)'
                : 'linear-gradient(90deg, #3b82f6, #6366f1)',
            }}
          />
        </div>
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {ITEMS.map(item => {
          const checked = data[item.key]
          const isLoading = saving === item.key
          return (
            <button
              key={item.key}
              onClick={() => !isLoading && toggle(item.key)}
              disabled={!!isLoading}
              className={cn(
                'w-full flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-all text-left',
                checked
                  ? 'border-emerald-500/25 bg-emerald-500/8 hover:bg-emerald-500/12'
                  : 'border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/15'
              )}
            >
              {/* Checkbox */}
              <div className={cn(
                'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
                checked
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-white/20 bg-transparent'
              )}>
                {isLoading
                  ? <Loader2 size={11} className="animate-spin text-white" />
                  : checked
                    ? <Check size={11} className="text-white" strokeWidth={3} />
                    : null}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm font-semibold leading-tight',
                  checked ? 'text-emerald-400 line-through opacity-70' : 'text-white/85'
                )}>
                  {item.label}
                </p>
                <p className="text-xs text-white/30 mt-0.5">{item.desc}</p>
              </div>

              {/* Done icon */}
              {checked && !isLoading && (
                <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              )}
            </button>
          )
        })}
      </div>

      {/* All done state */}
      {pct === 100 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/8">
          <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-400">Checklist complète !</p>
            <p className="text-xs text-white/40">Toutes les pièces sont prêtes — vous pouvez remettre l&apos;offre.</p>
          </div>
        </div>
      )}
    </div>
  )
}
