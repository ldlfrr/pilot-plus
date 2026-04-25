'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Download, FileText, BarChart3, Star, Lock,
  Loader2, Check, ChevronDown, FileDown,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ExportMenuProps {
  projectId: string
  projectName: string
  userTier: string
}

interface Option {
  id:     string
  label:  string
  sub:    string
  icon:   typeof FileText
  tier:   string | null   // null = all tiers
  color:  string
}

const OPTIONS: Option[] = [
  {
    id:    'print',
    label: 'Rapport PDF',
    sub:   'Vue complète du projet (impression)',
    icon:  FileText,
    tier:  null,
    color: '#60a5fa',
  },
  {
    id:    'csv',
    label: 'Données CSV',
    sub:   'Infos projet + score + analyse',
    icon:  BarChart3,
    tier:  null,
    color: '#a78bfa',
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

const CORPORATE_TIERS = new Set(['enterprise', 'lifetime'])

export function ExportMenu({ projectId, projectName, userTier }: ExportMenuProps) {
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [done,    setDone]    = useState<string | null>(null)
  const [err,     setErr]     = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function handleOption(optId: string) {
    setErr(null)
    setDone(null)

    // ── Print / Rapport PDF ─────────────────────────────────────────────────
    if (optId === 'print') {
      window.open(`/print/${projectId}`, '_blank')
      setOpen(false)
      return
    }

    // ── CSV ─────────────────────────────────────────────────────────────────
    if (optId === 'csv') {
      setLoading('csv')
      try {
        const [projRes, scoresRes, analysesRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}`), // same endpoint returns everything
          Promise.resolve(null),
        ])
        const data = projRes.ok ? await projRes.json() as {
          project: Record<string,unknown>
          score?: { total_score?: number; verdict?: string } | null
          analyses?: { result?: Record<string,unknown> }[]
        } : null

        const p   = data?.project ?? {}
        const sc  = data?.score ?? null
        const an  = data?.analyses?.[0]?.result ?? {}

        const rows = [
          ['Champ', 'Valeur'],
          ['Nom', String(p.name ?? '')],
          ['Client', String(p.client ?? '')],
          ['Localisation', String(p.location ?? '')],
          ['Type de marché', String(p.consultation_type ?? '')],
          ['Échéance', p.offer_deadline ? new Date(p.offer_deadline as string).toLocaleDateString('fr-FR') : ''],
          ['Statut', String(p.status ?? '')],
          ['Score', sc?.total_score != null ? String(sc.total_score) + '/100' : 'N/A'],
          ['Verdict', sc?.verdict ?? 'N/A'],
          ['Résumé IA', String((an as Record<string,unknown>).resume_executif ?? (an as Record<string,unknown>).contexte ?? '')],
          ['Référence AO', String((an as Record<string,unknown>).ref_ao ?? '')],
        ]

        const csv  = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href     = url
        a.download = `${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
        setDone('csv')
        setTimeout(() => { setDone(null); setOpen(false) }, 1500)
      } catch {
        setErr('Erreur export CSV')
      } finally {
        setLoading(null)
      }
      return
    }

    // ── Corporate Brief (enterprise only) ───────────────────────────────────
    if (optId === 'corporate') {
      if (!CORPORATE_TIERS.has(userTier)) return
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
        setTimeout(() => { setDone(null); setOpen(false) }, 1500)
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Erreur')
      } finally {
        setLoading(null)
      }
    }
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => { setOpen(o => !o); setErr(null) }}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 border text-xs font-medium rounded-lg transition-all',
          open
            ? 'bg-blue-500/15 border-blue-500/35 text-blue-400'
            : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white',
        )}
      >
        <FileDown size={13} />
        Export
        <ChevronDown size={11} className={cn('transition-transform duration-150', open && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 top-full mt-1.5 z-50 w-64 rounded-xl overflow-hidden"
          style={{
            background:   'linear-gradient(160deg, rgba(15,23,42,0.98), rgba(8,14,28,0.99))',
            border:       '1px solid rgba(255,255,255,0.09)',
            boxShadow:    '0 8px 32px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <p className="px-3.5 pt-3 pb-2 text-[9px] font-bold text-white/25 uppercase tracking-widest">
            Choisir un format
          </p>

          {OPTIONS.map(opt => {
            const locked   = opt.tier === 'enterprise' && !CORPORATE_TIERS.has(userTier)
            const isLoading = loading === opt.id
            const isDone    = done    === opt.id
            const Icon      = opt.icon

            return (
              <button
                key={opt.id}
                onClick={() => !locked && !isLoading && handleOption(opt.id)}
                disabled={locked || isLoading}
                className={cn(
                  'w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-all',
                  locked
                    ? 'opacity-45 cursor-not-allowed'
                    : 'hover:bg-white/5 cursor-pointer',
                )}
              >
                {/* Icon */}
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${opt.color}15`, border: `1px solid ${opt.color}25` }}
                >
                  {isLoading ? (
                    <Loader2 size={13} className="animate-spin" style={{ color: opt.color }} />
                  ) : isDone ? (
                    <Check size={13} style={{ color: '#34d399' }} />
                  ) : (
                    <Icon size={13} style={{ color: opt.color }} />
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={cn('text-xs font-semibold', isDone ? 'text-emerald-400' : 'text-white/80')}>
                    {isDone ? 'Téléchargé !' : opt.label}
                  </p>
                  <p className="text-[10px] text-white/30 truncate">{opt.sub}</p>
                </div>

                {/* Right side */}
                {locked ? (
                  <Lock size={11} className="text-white/25 flex-shrink-0" />
                ) : !isLoading && !isDone ? (
                  <Download size={11} className="text-white/20 flex-shrink-0" />
                ) : null}

                {/* Enterprise badge */}
                {opt.tier === 'enterprise' && (
                  <span
                    className="text-[8px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }}
                  >
                    ENT
                  </span>
                )}
              </button>
            )
          })}

          {/* Error */}
          {err && (
            <p className="px-3.5 py-2 text-[10px] text-red-400 border-t border-white/5">{err}</p>
          )}

          <div className="px-3.5 py-2.5 border-t border-white/5">
            <p className="text-[9px] text-white/18">
              Corporate Brief réservé au plan Entreprise
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
