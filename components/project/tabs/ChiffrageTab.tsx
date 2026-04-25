'use client'

import { useState, useEffect } from 'react'
import { Calculator, Check, Loader2, Euro, Calendar, FileText, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { ChiffrageData, ChiffrageStatus } from '@/types'

const STATUSES: { value: ChiffrageStatus; label: string; color: string; bg: string; dot: string }[] = [
  { value: 'a_chiffrer', label: 'À chiffrer',  color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', dot: '#64748b' },
  { value: 'en_cours',   label: 'En cours',    color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  dot: '#f59e0b' },
  { value: 'chiffre',    label: 'Chiffré',     color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  dot: '#3b82f6' },
  { value: 'valide',     label: 'Validé ✓',    color: '#34d399', bg: 'rgba(52,211,153,0.12)',  dot: '#10b981' },
]

interface ChiffrageTabProps {
  projectId: string
  chiffrage: ChiffrageData | null
  onChange:  (updated: ChiffrageData) => void
}

const DEFAULT: ChiffrageData = { status: 'a_chiffrer' }

export function ChiffrageTab({ projectId, chiffrage, onChange }: ChiffrageTabProps) {
  const [data,    setData]    = useState<ChiffrageData>(chiffrage ?? DEFAULT)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [dirty,   setDirty]   = useState(false)

  useEffect(() => {
    setData(chiffrage ?? DEFAULT)
    setDirty(false)
  }, [chiffrage])

  function update(patch: Partial<ChiffrageData>) {
    setData(prev => ({ ...prev, ...patch }))
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    const payload: ChiffrageData = { ...data, updated_at: new Date().toISOString() }
    try {
      await fetch(`/api/projects/${projectId}/pipeline`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ chiffrage: payload }),
      })
      onChange(payload)
      setSaved(true)
      setDirty(false)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const currentStatus = STATUSES.find(s => s.value === data.status) ?? STATUSES[0]
  const statusIdx     = STATUSES.findIndex(s => s.value === data.status)

  return (
    <div className="max-w-xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calculator size={16} className="text-blue-400" />
            Suivi de chiffrage
          </h2>
          <p className="text-xs text-white/40 mt-0.5">Avancement financier du projet</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <Check size={12} />Sauvegardé
            </span>
          )}
          {dirty && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              Sauvegarder
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-white/50">Progression</p>
          <span className="text-xs font-bold" style={{ color: currentStatus.color }}>
            {currentStatus.label}
          </span>
        </div>
        <div className="flex gap-1.5">
          {STATUSES.map((s, i) => (
            <div
              key={s.value}
              className="h-1.5 flex-1 rounded-full transition-all duration-500"
              style={{
                background: i <= statusIdx ? s.dot : 'rgba(255,255,255,0.06)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Status selector */}
      <div>
        <label className="text-[10px] font-bold text-white/35 uppercase tracking-wider mb-2 block">
          Statut du chiffrage
        </label>
        <div className="grid grid-cols-2 gap-2">
          {STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => update({ status: s.value })}
              className={cn(
                'flex items-center gap-2.5 px-3 py-3 rounded-xl border text-sm font-medium transition-all',
                data.status === s.value ? 'text-white' : 'border-white/8 bg-white/3 text-white/40 hover:text-white/70'
              )}
              style={data.status === s.value ? { background: s.bg, borderColor: s.color + '40', color: s.color } : {}}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: s.dot }}
              />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="text-[10px] font-bold text-white/35 uppercase tracking-wider mb-2 block flex items-center gap-1">
          <Euro size={10} />Montant estimé (€)
        </label>
        <div className="relative">
          <TrendingUp size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            type="number"
            min="0"
            step="1000"
            placeholder="ex : 125 000"
            value={data.montant ?? ''}
            onChange={e => update({ montant: e.target.value ? parseFloat(e.target.value) : undefined })}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/40 transition-colors"
          />
          {data.montant != null && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(data.montant)}
            </span>
          )}
        </div>
      </div>

      {/* Deadline */}
      <div>
        <label className="text-[10px] font-bold text-white/35 uppercase tracking-wider mb-2 block flex items-center gap-1">
          <Calendar size={10} />Date limite de chiffrage
        </label>
        <input
          type="date"
          value={data.deadline ?? ''}
          onChange={e => update({ deadline: e.target.value || undefined })}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/40 transition-colors"
          style={{ colorScheme: 'dark' }}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="text-[10px] font-bold text-white/35 uppercase tracking-wider mb-2 block flex items-center gap-1">
          <FileText size={10} />Notes & commentaires
        </label>
        <textarea
          rows={4}
          placeholder="Remarques sur le chiffrage, hypothèses, points à clarifier..."
          value={data.notes ?? ''}
          onChange={e => update({ notes: e.target.value || undefined })}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/40 transition-colors resize-none"
        />
      </div>

      {/* Last updated */}
      {data.updated_at && (
        <p className="text-[10px] text-white/20">
          Dernière mise à jour : {new Date(data.updated_at).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
          })}
        </p>
      )}
    </div>
  )
}
