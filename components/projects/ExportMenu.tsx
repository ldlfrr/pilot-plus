'use client'

import { useEffect, useRef, useState } from 'react'
import {
  FileText, BarChart3, Mail, Star,
  Lock, Loader2, Check, X, FileDown, Download,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ExportMenuProps {
  projectId: string
  projectName: string
  userTier: string
}

const ENTERPRISE_TIERS = new Set(['enterprise', 'lifetime'])

const PRESETS = [
  {
    id:    'rapport',
    label: 'Rapport PDF',
    sub:   'Vue synthèse complète du projet',
    icon:  FileText,
    tier:  null,
    color: '#60a5fa',
  },
  {
    id:    'csv',
    label: 'Données CSV',
    sub:   'Infos projet, score, analyse IA',
    icon:  BarChart3,
    tier:  null,
    color: '#a78bfa',
  },
  {
    id:    'stats_mail',
    label: 'Stats Email',
    sub:   'Export campagnes liées au projet',
    icon:  Mail,
    tier:  null,
    color: '#2dd4bf',
  },
  {
    id:    'corporate',
    label: 'Corporate Brief',
    sub:   '1 page executive générée par IA',
    icon:  Star,
    tier:  'enterprise',
    color: '#fbbf24',
  },
]

export function ExportMenu({ projectId, projectName, userTier }: ExportMenuProps) {
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [done,    setDone]    = useState<string | null>(null)
  const [err,     setErr]     = useState<string | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  async function handleExport(id: string) {
    if (loading) return
    setErr(null); setDone(null)

    // ── Rapport PDF ─────────────────────────────────────────────────────────
    if (id === 'rapport') {
      window.open(`/print/${projectId}`, '_blank')
      setDone('rapport')
      setTimeout(() => { setDone(null); setOpen(false) }, 1200)
      return
    }

    // ── CSV ─────────────────────────────────────────────────────────────────
    if (id === 'csv') {
      setLoading('csv')
      try {
        const res  = await fetch(`/api/projects/${projectId}`)
        const data = res.ok
          ? await res.json() as {
              project:   Record<string, unknown>
              score?:    { total_score?: number; verdict?: string } | null
              analyses?: { result?: Record<string, unknown> }[]
            }
          : null

        const p  = data?.project ?? {}
        const sc = data?.score ?? null
        const an = (data?.analyses?.[0]?.result ?? {}) as Record<string, unknown>

        const rows = [
          ['Champ', 'Valeur'],
          ['Nom du projet', String(p.name ?? '')],
          ['Client', String(p.client ?? '')],
          ['Localisation', String(p.location ?? '')],
          ['Type de marché', String(p.consultation_type ?? '')],
          ['Statut', String(p.status ?? '')],
          ['Échéance', p.offer_deadline ? new Date(p.offer_deadline as string).toLocaleDateString('fr-FR') : 'N/A'],
          ['Score IA', sc?.total_score != null ? `${sc.total_score}/100` : 'N/A'],
          ['Verdict', sc?.verdict ?? 'N/A'],
          ['Référence AO', String(an.ref_ao ?? 'N/A')],
          ['Budget estimé', String(an.budget_estime ?? an.montant ?? 'N/A')],
          ['Résumé IA', String(an.resume_executif ?? an.contexte ?? '')],
        ]

        const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href     = url
        a.download = `${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
        setDone('csv')
        setTimeout(() => { setDone(null); setOpen(false) }, 1400)
      } catch {
        setErr('Erreur lors de la génération du CSV.')
      } finally {
        setLoading(null)
      }
      return
    }

    // ── Stats Email CSV ──────────────────────────────────────────────────────
    if (id === 'stats_mail') {
      setLoading('stats_mail')
      try {
        const rows = [
          ['Information', 'Valeur'],
          ['Projet', projectName],
          ['Export généré le', new Date().toLocaleDateString('fr-FR')],
          ['Note', 'L\'historique détaillé des campagnes sera disponible prochainement.'],
        ]
        const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href     = url
        a.download = `Stats_Email_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
        setDone('stats_mail')
        setTimeout(() => { setDone(null); setOpen(false) }, 1400)
      } catch {
        setErr('Erreur export.')
      } finally {
        setLoading(null)
      }
      return
    }

    // ── Corporate Brief ──────────────────────────────────────────────────────
    if (id === 'corporate') {
      if (!ENTERPRISE_TIERS.has(userTier)) return
      setLoading('corporate')
      try {
        const res = await fetch('/api/export/corporate', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ projectId }),
        })
        if (!res.ok) {
          const j = await res.json().catch(() => ({})) as { error?: string }
          throw new Error(j.error ?? 'Erreur génération')
        }
        const blob = await res.blob()
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href     = url
        a.download = `Brief_Corporate_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`
        a.click()
        URL.revokeObjectURL(url)
        setDone('corporate')
        setTimeout(() => { setDone(null); setOpen(false) }, 1400)
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Erreur génération PDF.')
      } finally {
        setLoading(null)
      }
    }
  }

  return (
    <>
      {/* ── Trigger button */}
      <button
        ref={btnRef}
        onClick={() => { setOpen(o => !o); setErr(null); setDone(null) }}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 border text-xs font-medium rounded-lg transition-all',
          open
            ? 'bg-blue-500/15 border-blue-500/35 text-blue-400'
            : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white',
        )}
      >
        <FileDown size={13} />
        Export
        <span className={cn('text-[9px] transition-transform duration-150 inline-block', open && 'rotate-180')}>▾</span>
      </button>

      {/* ── Fixed overlay (avoids overflow-hidden clipping) */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Panel — positioned via JS anchor */}
          <ExportPanel
            anchorRef={btnRef}
            presets={PRESETS}
            loading={loading}
            done={done}
            err={err}
            userTier={userTier}
            onSelect={handleExport}
            onClose={() => setOpen(false)}
          />
        </>
      )}
    </>
  )
}

// ── Sub-component: the floating panel ─────────────────────────────────────────

function ExportPanel({
  anchorRef, presets, loading, done, err, userTier, onSelect, onClose,
}: {
  anchorRef: React.RefObject<HTMLButtonElement | null>
  presets: typeof PRESETS
  loading: string | null
  done: string | null
  err: string | null
  userTier: string
  onSelect: (id: string) => void
  onClose: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    const panelW = 272
    let left = rect.left
    // Don't overflow right edge
    if (left + panelW > window.innerWidth - 12) left = window.innerWidth - panelW - 12
    setPos({ top: rect.bottom + 6, left })
  }, [anchorRef])

  return (
    <div
      ref={panelRef}
      className="fixed z-50 w-68 rounded-2xl overflow-hidden"
      style={{
        top:    pos.top,
        left:   pos.left,
        width:  272,
        background:   'linear-gradient(160deg, rgba(12,20,40,0.98) 0%, rgba(6,10,22,0.99) 100%)',
        border:       '1px solid rgba(255,255,255,0.10)',
        boxShadow:    '0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
        backdropFilter: 'blur(24px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Exporter le projet</p>
        <button onClick={onClose} className="p-1 text-white/20 hover:text-white/50 transition-colors rounded">
          <X size={12} />
        </button>
      </div>

      {/* Preset list */}
      <div className="px-2 pb-2 space-y-0.5">
        {presets.map(p => {
          const locked    = p.tier === 'enterprise' && !ENTERPRISE_TIERS.has(userTier)
          const isLoading = loading === p.id
          const isDone    = done    === p.id
          const Icon      = p.icon

          return (
            <button
              key={p.id}
              onClick={() => !locked && !isLoading && onSelect(p.id)}
              disabled={locked || !!isLoading}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all',
                locked
                  ? 'opacity-40 cursor-not-allowed'
                  : isDone
                  ? 'bg-emerald-500/10'
                  : isLoading
                  ? 'bg-white/5'
                  : 'hover:bg-white/6 cursor-pointer active:bg-white/10',
              )}
            >
              {/* Icon */}
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: isDone ? 'rgba(16,185,129,0.15)' : `${p.color}18`,
                  border:     `1px solid ${isDone ? 'rgba(16,185,129,0.3)' : `${p.color}28`}`,
                }}
              >
                {isLoading ? (
                  <Loader2 size={14} className="animate-spin" style={{ color: p.color }} />
                ) : isDone ? (
                  <Check size={14} className="text-emerald-400" />
                ) : (
                  <Icon size={14} style={{ color: p.color }} />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    'text-xs font-semibold leading-tight',
                    isDone ? 'text-emerald-400' : 'text-white/85',
                  )}>
                    {isDone ? 'Téléchargé !' : p.label}
                  </p>
                  {p.tier === 'enterprise' && (
                    <span
                      className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(245,158,11,0.18)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.28)' }}
                    >
                      ENT
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-white/30 truncate mt-0.5">{p.sub}</p>
              </div>

              {/* Right icon */}
              {locked ? (
                <Lock size={11} className="text-white/22 flex-shrink-0" />
              ) : !isLoading && !isDone ? (
                <Download size={11} className="text-white/18 flex-shrink-0" />
              ) : null}
            </button>
          )
        })}
      </div>

      {/* Error */}
      {err && (
        <div className="mx-3 mb-3 px-3 py-2 rounded-lg text-[10px] text-red-400"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
          {err}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2.5 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="text-[9px] text-white/18">Corporate Brief · plan Entreprise</p>
        <a href="/export" className="text-[9px] text-white/25 hover:text-white/50 transition-colors">
          Page Export →
        </a>
      </div>
    </div>
  )
}
