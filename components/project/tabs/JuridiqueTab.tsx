'use client'

import { useState } from 'react'
import { Scale, Send, Search, Clock, CheckCircle, Check, Loader2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { JuridiqueData, JuridiqueStatus } from '@/types'

const STATUS_OPTIONS: {
  value:  JuridiqueStatus
  label:  string
  desc:   string
  rgb:    string
  icon:   typeof Clock
}[] = [
  { value: 'envoye_juridique', label: 'Envoyé au juridique',      desc: 'Dossier transmis au service juridique',   rgb: '245,158,11',  icon: Send         },
  { value: 'en_cours',         label: 'En cours d\'analyse',      desc: 'Le juridique examine le contrat',         rgb: '59,130,246',  icon: Search       },
  { value: 'modif_attente',    label: 'Modif en attente',         desc: 'Des modifications sont demandées',        rgb: '239,68,68',   icon: Clock        },
  { value: 'valide',           label: 'Validé par le juridique',  desc: 'GO — contrat validé par le juridique',   rgb: '16,185,129',  icon: CheckCircle  },
]

interface JuridiqueTabProps {
  projectId:   string
  data:        JuridiqueData | null
  onChange:    (data: JuridiqueData) => void
  onValidated?: () => void
}

export function JuridiqueTab({ projectId, data, onChange, onValidated }: JuridiqueTabProps) {
  const [status,   setStatus]   = useState<JuridiqueStatus>(data?.status ?? 'envoye_juridique')
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [validated, setValidated] = useState(data?.status === 'valide')
  const [error,    setError]    = useState<string | null>(null)

  async function handleStatusClick(newStatus: JuridiqueStatus) {
    setStatus(newStatus)
    await save(newStatus)
  }

  async function save(s: JuridiqueStatus) {
    setSaving(true); setError(null)
    try {
      const payload: JuridiqueData = {
        ...(data ?? {}),
        status: s,
      }

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

      // If validated, advance the pipeline stage to signature
      if (s === 'valide' && !validated) {
        setValidated(true)
        await fetch(`/api/projects/${projectId}/pipeline`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ pipeline_stage: 'signature' }),
        })
        onValidated?.()
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
          style={{ background: 'rgba(245,158,11,0.14)', border: '1px solid rgba(245,158,11,0.22)' }}>
          <Scale size={16} className="text-amber-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">Juridique</h2>
          <p className="text-xs text-white/35">Statut d'analyse et validation du contrat</p>
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
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/28">Statut juridique</p>
        </div>

        <div className="p-4 grid grid-cols-2 gap-2.5">
          {STATUS_OPTIONS.map(opt => {
            const Icon      = opt.icon
            const selected  = status === opt.value
            const isValidate = opt.value === 'valide'

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
                  background:  `rgba(${opt.rgb},0.10)`,
                  border:      `1px solid rgba(${opt.rgb},0.30)`,
                  boxShadow:   `0 0 24px rgba(${opt.rgb},0.10)`,
                } : {
                  background: 'rgba(255,255,255,0.03)',
                  border:     '1px solid rgba(255,255,255,0.08)',
                }}>

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
                  {isValidate && selected && (
                    <p className="text-[9px] mt-1.5 font-bold flex items-center gap-1"
                      style={{ color: `rgba(${opt.rgb},0.7)` }}>
                      <ArrowRight size={8} />Pipeline avancé → Signature
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
            border:     `1px solid rgba(${currentCfg.rgb},0.18)`,
          }}>
          <currentCfg.icon size={14} style={{ color: `rgba(${currentCfg.rgb},0.85)` }} />
          <span className="text-sm font-semibold" style={{ color: `rgba(${currentCfg.rgb},0.90)` }}>
            {currentCfg.label}
          </span>
          <span className="text-xs text-white/28 ml-auto">{currentCfg.desc}</span>
        </div>
      </div>

      {/* Validated celebration */}
      {status === 'valide' && (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.22)', boxShadow: '0 0 30px rgba(16,185,129,0.06)' }}>
          <Sparkles size={16} className="text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-300">Juridique validé !</p>
            <p className="text-xs text-emerald-400/50 mt-0.5">Pipeline avancé automatiquement vers l'étape Signature</p>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1.5 px-1">
          <AlertCircle size={11} />{error}
        </p>
      )}
    </div>
  )
}
