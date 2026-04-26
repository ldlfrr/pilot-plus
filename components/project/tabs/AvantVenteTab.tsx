'use client'

import { useState } from 'react'
import { Check, Loader2, CheckCircle, ArrowRight, Send, Wrench, FileText, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { AvantVenteData, AvantVenteStatus } from '@/types'

// ── Status options ────────────────────────────────────────────────────────────

const STATUS_OPTIONS: {
  value:   AvantVenteStatus
  label:   string
  desc:    string
  rgb:     string
  icon:    typeof Send
  isLast?: boolean
}[] = [
  {
    value: 'transmis',
    label: 'Transmis à l\'avant-vente',
    desc:  'Le dossier a été transmis à l\'équipe technique',
    rgb:   '99,102,241',
    icon:  Send,
  },
  {
    value: 'en_chiffrage',
    label: 'En chiffrage',
    desc:  'Chiffrage technique en cours',
    rgb:   '245,158,11',
    icon:  Wrench,
  },
  {
    value: 'prep_memoire',
    label: 'Préparation Mémoire technique',
    desc:  'Rédaction du mémoire technique en cours',
    rgb:   '59,130,246',
    icon:  FileText,
  },
  {
    value: 'termine',
    label: 'Avant-vente terminé',
    desc:  'Offre complète prête — pipeline avancé vers Échanges client',
    rgb:   '16,185,129',
    icon:  CheckCircle,
    isLast: true,
  },
]

// ── Props ─────────────────────────────────────────────────────────────────────

interface AvantVenteTabProps {
  projectId:   string
  data:        AvantVenteData | null
  onChange:    (data: AvantVenteData) => void
  onTermine?:  () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AvantVenteTab({ projectId, data, onChange, onTermine }: AvantVenteTabProps) {
  const [status,   setStatus]   = useState<AvantVenteStatus>(data?.status ?? 'transmis')
  const [notes,    setNotes]    = useState(data?.notes ?? '')
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [advanced, setAdvanced] = useState(data?.status === 'termine')
  const [error,    setError]    = useState<string | null>(null)

  async function handleStatusClick(newStatus: AvantVenteStatus) {
    setStatus(newStatus)
    await save(newStatus, notes)
  }

  async function save(s: AvantVenteStatus, n: string) {
    setSaving(true); setError(null)
    try {
      const payload: AvantVenteData = {
        status:     s,
        notes:      n,
        updated_at: new Date().toISOString(),
      }

      const res = await fetch(`/api/projects/${projectId}/pipeline`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ avant_vente_data: payload }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { error?: string }).error ?? 'Erreur')
      }

      onChange(payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)

      // If terminated, advance pipeline stage to echanges_client
      if (s === 'termine' && !advanced) {
        setAdvanced(true)
        await fetch(`/api/projects/${projectId}/pipeline`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ pipeline_stage: 'echanges_client' }),
        })
        onTermine?.()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const currentCfg = STATUS_OPTIONS.find(s => s.value === status)!

  return (
    <div className="max-w-xl space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(251,146,60,0.14)', border: '1px solid rgba(251,146,60,0.22)' }}>
          <Wrench size={16} className="text-orange-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">Avant-vente</h2>
          <p className="text-xs text-white/35">Chiffrage, mémoire technique & préparation de l&apos;offre</p>
        </div>
        {saved && (
          <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
            <Check size={11} />Sauvegardé
          </span>
        )}
        {saving && <Loader2 size={13} className="ml-auto animate-spin text-white/30" />}
      </div>

      {/* Status board */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(8,8,28,0.72)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>

        <div className="px-5 py-3.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/28">Avancement avant-vente</p>
        </div>

        <div className="p-4 grid grid-cols-2 gap-2.5">
          {STATUS_OPTIONS.map((opt, idx) => {
            const Icon     = opt.icon
            const selected = status === opt.value
            const isTermine = opt.value === 'termine'

            return (
              <button
                key={opt.value}
                onClick={() => handleStatusClick(opt.value)}
                disabled={saving}
                className={cn(
                  'relative flex items-start gap-3 p-4 rounded-xl border text-left transition-all',
                  'hover:scale-[1.02] disabled:cursor-wait',
                  selected ? 'scale-[1.01]' : 'hover:border-white/20',
                  // "Avant-vente terminé" spans full width
                  isTermine && 'col-span-2',
                )}
                style={selected ? {
                  background: `rgba(${opt.rgb},0.10)`,
                  border: `1px solid rgba(${opt.rgb},0.30)`,
                  boxShadow: `0 0 24px rgba(${opt.rgb},0.10)`,
                } : {
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>

                {/* Selected indicator */}
                {selected && (
                  <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full animate-pulse"
                    style={{ background: `rgba(${opt.rgb},0.9)` }} />
                )}

                <Icon
                  size={17}
                  className="flex-shrink-0 mt-0.5 transition-colors"
                  style={{ color: selected ? `rgba(${opt.rgb},0.9)` : 'rgba(255,255,255,0.20)' }}
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold leading-none"
                    style={{ color: selected ? `rgba(${opt.rgb},0.95)` : 'rgba(255,255,255,0.40)' }}>
                    {opt.label}
                  </p>
                  <p className="text-[10px] mt-1 leading-tight text-white/25">{opt.desc}</p>
                  {isTermine && selected && (
                    <p className="text-[9px] mt-1.5 font-bold flex items-center gap-1"
                      style={{ color: `rgba(${opt.rgb},0.7)` }}>
                      <ArrowRight size={8} />Pipeline avancé → Échanges client
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Current status banner */}
        <div className="mx-4 mb-4 flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{
            background: `rgba(${currentCfg.rgb},0.07)`,
            border: `1px solid rgba(${currentCfg.rgb},0.18)`,
          }}>
          <currentCfg.icon size={14} style={{ color: `rgba(${currentCfg.rgb},0.85)` }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold"
              style={{ color: `rgba(${currentCfg.rgb},0.9)` }}>
              {currentCfg.label}
            </p>
            {status === 'termine' && (
              <p className="text-[10px] text-white/35 mt-0.5 flex items-center gap-1">
                <Sparkles size={9} />Avant-vente validé — pipeline avancé vers Échanges client
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Progress steps indicator */}
      <div className="rounded-xl p-4"
        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-3">Progression</p>
        <div className="space-y-2">
          {STATUS_OPTIONS.map((opt, idx) => {
            const currentIdx = STATUS_OPTIONS.findIndex(s => s.value === status)
            const done    = idx < currentIdx
            const active  = idx === currentIdx
            const future  = idx > currentIdx
            return (
              <div key={opt.value} className="flex items-center gap-3">
                <div className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border transition-all',
                  done   ? 'border-emerald-500 bg-emerald-500/20' :
                  active ? `border-[rgba(${opt.rgb},0.7)] bg-[rgba(${opt.rgb},0.12)]` :
                           'border-white/12 bg-transparent',
                )}>
                  {done
                    ? <Check size={10} className="text-emerald-400" />
                    : <span className="text-[9px] font-bold"
                        style={{ color: active ? `rgba(${opt.rgb},0.9)` : 'rgba(255,255,255,0.2)' }}>
                        {idx + 1}
                      </span>
                  }
                </div>
                <span className={cn(
                  'text-xs transition-all',
                  done   ? 'text-white/35 line-through' :
                  active ? 'font-semibold text-white/85' :
                           'text-white/25',
                )}>
                  {opt.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Notes field */}
      <div className="rounded-xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-4 py-2.5 border-b border-white/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Notes avant-vente (optionnel)</p>
        </div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={() => save(status, notes)}
          rows={4}
          placeholder="Points techniques à traiter, contraintes chiffrage, remarques mémoire…"
          className="w-full px-4 py-3 bg-transparent text-sm text-white/70 placeholder:text-white/18 resize-none focus:outline-none leading-relaxed"
        />
        <p className="px-4 pb-2.5 text-[10px] text-white/20">Sauvegardé automatiquement en quittant le champ</p>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1.5 px-1">
          <span className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />{error}
        </p>
      )}
    </div>
  )
}
