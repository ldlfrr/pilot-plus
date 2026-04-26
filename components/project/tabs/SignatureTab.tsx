'use client'

import { useState } from 'react'
import { PenLine, Clock, Send, CheckCircle, XCircle, Check, Loader2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { SignatureData, SignatureStatus } from '@/types'

const STATUS_OPTIONS: {
  value:  SignatureStatus
  label:  string
  desc:   string
  rgb:    string
  icon:   typeof Clock
}[] = [
  { value: 'en_attente', label: 'En attente', desc: 'Contrat pas encore envoyé',          rgb: '255,255,255', icon: Clock        },
  { value: 'envoye',     label: 'Envoyé',     desc: 'Contrat envoyé pour signature',       rgb: '59,130,246',  icon: Send         },
  { value: 'signe',      label: 'Signé',      desc: 'Contrat signé par toutes les parties', rgb: '16,185,129',  icon: CheckCircle  },
  { value: 'refuse',     label: 'Refusé',     desc: 'Signature refusée',                   rgb: '239,68,68',   icon: XCircle      },
]

interface SignatureTabProps {
  projectId: string
  data:      SignatureData | null
  onChange:  (data: SignatureData) => void
  onSigned?: () => void
}

export function SignatureTab({ projectId, data, onChange, onSigned }: SignatureTabProps) {
  const [status,  setStatus]  = useState<SignatureStatus>(data?.status ?? 'en_attente')
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [signed,  setSigned]  = useState(data?.status === 'signe')
  const [error,   setError]   = useState<string | null>(null)

  async function handleStatusClick(newStatus: SignatureStatus) {
    setStatus(newStatus)
    await save(newStatus)
  }

  async function save(s: SignatureStatus) {
    setSaving(true); setError(null)
    try {
      const payload: SignatureData = {
        ...(data ?? {}),
        status:    s,
        envoye_at: s === 'envoye' ? (data?.envoye_at ?? new Date().toISOString()) : data?.envoye_at,
        signe_at:  s === 'signe'  ? (data?.signe_at  ?? new Date().toISOString()) : data?.signe_at,
      }

      const res = await fetch(`/api/projects/${projectId}/pipeline`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ signature_data: payload }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { error?: string }).error ?? 'Erreur')
      }

      onChange(payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)

      // When signed, advance pipeline to cloture
      if (s === 'signe' && !signed) {
        setSigned(true)
        await fetch(`/api/projects/${projectId}/pipeline`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ pipeline_stage: 'cloture' }),
        })
        onSigned?.()
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
          <PenLine size={16} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">Signature finale</h2>
          <p className="text-xs text-white/35">Signature électronique du contrat</p>
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
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/28">Statut de signature</p>
        </div>

        <div className="p-4 grid grid-cols-2 gap-2.5">
          {STATUS_OPTIONS.map(opt => {
            const Icon    = opt.icon
            const selected = status === opt.value
            const isSigne  = opt.value === 'signe'

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
                  border:     `1px solid rgba(${opt.rgb},0.30)`,
                  boxShadow:  `0 0 24px rgba(${opt.rgb},0.10)`,
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
                  {isSigne && selected && (
                    <p className="text-[9px] mt-1.5 font-bold flex items-center gap-1"
                      style={{ color: `rgba(${opt.rgb},0.7)` }}>
                      <ArrowRight size={8} />Pipeline clôturé
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
          {status === 'envoye' && data?.envoye_at && (
            <span className="ml-auto text-[10px] text-white/25">
              Envoyé le {new Date(data.envoye_at).toLocaleDateString('fr-FR')}
            </span>
          )}
          {status === 'signe' && data?.signe_at && (
            <span className="ml-auto text-[10px] text-white/25">
              Signé le {new Date(data.signe_at).toLocaleDateString('fr-FR')}
            </span>
          )}
          {status !== 'envoye' && status !== 'signe' && (
            <span className="text-xs text-white/28 ml-auto">{currentCfg.desc}</span>
          )}
        </div>
      </div>

      {/* Signed celebration */}
      {status === 'signe' && (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.22)', boxShadow: '0 0 30px rgba(16,185,129,0.06)' }}>
          <Sparkles size={16} className="text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-300">Contrat signé !</p>
            <p className="text-xs text-emerald-400/50 mt-0.5">Le projet est clôturé — félicitations pour ce succès !</p>
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
