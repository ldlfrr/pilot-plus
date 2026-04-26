'use client'

import { useState } from 'react'
import { Check, Loader2, CheckCircle, XCircle, Clock, AlertCircle, ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { VenteInterneData, VenteInterneStatus } from '@/types'

const STATUS_OPTIONS: {
  value:  VenteInterneStatus
  label:  string
  desc:   string
  rgb:    string
  icon:   typeof Clock
}[] = [
  { value: 'en_attente', label: 'En attente',  desc: 'Pas encore présenté à la direction',   rgb: '255,255,255', icon: Clock        },
  { value: 'en_cours',   label: 'En cours',    desc: 'Présentation en cours de validation',  rgb: '245,158,11',  icon: AlertCircle  },
  { value: 'approuve',   label: 'Approuvé',    desc: 'GO — direction a validé le projet',    rgb: '16,185,129',  icon: CheckCircle  },
  { value: 'refuse',     label: 'Refusé',      desc: 'Direction a refusé le projet',         rgb: '239,68,68',   icon: XCircle      },
]

interface VenteInterneTabProps {
  projectId:    string
  data:         VenteInterneData | null
  onChange:     (data: VenteInterneData) => void
  onApproved?:  () => void
}

export function VenteInterneTab({ projectId, data, onChange, onApproved }: VenteInterneTabProps) {
  const [status,   setStatus]   = useState<VenteInterneStatus>(data?.status ?? 'en_attente')
  const [notes,    setNotes]    = useState(data?.notes_direction ?? '')
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [approved, setApproved] = useState(data?.status === 'approuve')
  const [error,    setError]    = useState<string | null>(null)

  async function handleStatusClick(newStatus: VenteInterneStatus) {
    setStatus(newStatus)
    // Auto-save on status change
    await save(newStatus, notes)
  }

  async function save(s: VenteInterneStatus, n: string) {
    setSaving(true); setError(null)
    try {
      const payload: VenteInterneData = {
        status:            s,
        notes_direction:   n,
        participants:      data?.participants ?? [],
        decideur:          data?.decideur,
        date_reunion:      data?.date_reunion,
        decision_at:       s === 'approuve' || s === 'refuse'
          ? (data?.decision_at ?? new Date().toISOString())
          : data?.decision_at,
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

      // If approved, also advance the pipeline stage
      if (s === 'approuve' && !approved) {
        setApproved(true)
        // Advance pipeline stage to avant_vente
        await fetch(`/api/projects/${projectId}/pipeline`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ pipeline_stage: 'avant_vente' }),
        })
        onApproved?.()
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
          style={{ background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.22)' }}>
          <CheckCircle size={16} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">Vente interne</h2>
          <p className="text-xs text-white/35">Approbation direction — validation GO projet</p>
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
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/28">Décision direction</p>
        </div>

        <div className="p-4 grid grid-cols-2 gap-2.5">
          {STATUS_OPTIONS.map(opt => {
            const Icon     = opt.icon
            const selected = status === opt.value
            const isApprove = opt.value === 'approuve'

            return (
              <button
                key={opt.value}
                onClick={() => handleStatusClick(opt.value)}
                disabled={saving}
                className={cn(
                  'relative flex items-start gap-3 p-4 rounded-xl border text-left transition-all',
                  'hover:scale-[1.02] disabled:cursor-wait',
                  selected ? 'scale-[1.01]' : 'hover:border-white/20',
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
                  className={cn('flex-shrink-0 mt-0.5 transition-colors')}
                  style={{ color: selected ? `rgba(${opt.rgb},0.9)` : 'rgba(255,255,255,0.20)' }}
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold leading-none"
                    style={{ color: selected ? `rgba(${opt.rgb},0.95)` : 'rgba(255,255,255,0.40)' }}>
                    {opt.label}
                  </p>
                  <p className="text-[10px] mt-1 leading-tight text-white/25">{opt.desc}</p>
                  {isApprove && selected && (
                    <p className="text-[9px] mt-1.5 font-bold flex items-center gap-1"
                      style={{ color: `rgba(${opt.rgb},0.7)` }}>
                      <ArrowRight size={8} />Pipeline avancé → Avant-vente
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
          <span className="text-sm font-semibold" style={{ color: `rgba(${currentCfg.rgb},0.90)` }}>
            {currentCfg.label}
          </span>
          <span className="text-xs text-white/28 ml-auto">{currentCfg.desc}</span>
        </div>
      </div>

      {/* Approved celebration */}
      {status === 'approuve' && (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl animate-fade-in"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.22)', boxShadow: '0 0 30px rgba(16,185,129,0.06)' }}>
          <Sparkles size={16} className="text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-300">Vente interne validée !</p>
            <p className="text-xs text-emerald-400/50 mt-0.5">Pipeline avancé automatiquement vers l'étape Avant-vente</p>
          </div>
        </div>
      )}

      {/* Notes (optional) */}
      <div className="rounded-2xl p-5 space-y-3"
        style={{ background: 'rgba(8,8,28,0.55)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/28">Notes direction (optionnel)</p>
        <textarea
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={() => save(status, notes)}
          placeholder="Conditions, budget alloué, points de vigilance imposés par la direction…"
          className="w-full bg-white/4 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/18 outline-none focus:border-emerald-500/40 transition-colors resize-none"
        />
        <p className="text-[10px] text-white/20">Sauvegardé automatiquement en quittant le champ</p>
      </div>

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1.5 px-1">
          <AlertCircle size={11} />{error}
        </p>
      )}
    </div>
  )
}
