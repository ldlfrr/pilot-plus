'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Download, FileText, BarChart3, Mail, Star,
  Lock, Check, Loader2, ChevronDown, AlertCircle,
  Building2, Sparkles, FileDown, TableProperties,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ── Types ─────────────────────────────────────────────────────────────────────

type PresetId = 'global' | 'stats_analyses' | 'stats_mail' | 'corporate'
type Format   = 'pdf' | 'csv'

interface Project {
  id: string
  name: string
  client: string
  status: string
  location?: string
  offer_deadline?: string
  consultation_type?: string
  created_at: string
}

interface ProjectWithScore extends Project {
  score?: { total_score: number; verdict: string } | null
}

// ── Preset definitions ────────────────────────────────────────────────────────

const PRESETS = [
  {
    id: 'global' as PresetId,
    name: 'Export Global',
    desc: 'Tous vos projets : noms, clients, statuts, scores et échéances.',
    icon: FileText,
    minTier: null,
    badge: null,
    formats: ['csv', 'pdf'] as Format[],
    color: { border: 'rgba(59,130,246,0.3)', glow: 'rgba(59,130,246,0.08)', icon: '#60a5fa', badge: '' },
  },
  {
    id: 'stats_analyses' as PresetId,
    name: 'Stats Analyses',
    desc: 'Statistiques IA : scores moyens, répartition GO/NO GO, tendances mensuelles.',
    icon: BarChart3,
    minTier: null,
    badge: null,
    formats: ['csv', 'pdf'] as Format[],
    color: { border: 'rgba(139,92,246,0.3)', glow: 'rgba(139,92,246,0.08)', icon: '#a78bfa', badge: '' },
  },
  {
    id: 'stats_mail' as PresetId,
    name: 'Stats Email',
    desc: 'Historique et volume de vos campagnes email IA générées.',
    icon: Mail,
    minTier: null,
    badge: null,
    formats: ['csv'] as Format[],
    color: { border: 'rgba(20,184,166,0.3)', glow: 'rgba(20,184,166,0.08)', icon: '#2dd4bf', badge: '' },
  },
  {
    id: 'corporate' as PresetId,
    name: 'Corporate Brief',
    desc: '1 page executive par projet — tout ce qu\'un directeur commercial doit savoir en 30 secondes.',
    icon: Star,
    minTier: 'enterprise',
    badge: 'IA · Entreprise',
    formats: ['pdf'] as Format[],
    color: {
      border: 'rgba(245,158,11,0.45)',
      glow: 'rgba(245,158,11,0.10)',
      icon: '#fbbf24',
      badge: 'rgba(245,158,11,0.18)',
    },
  },
] as const

// ── CSV helpers ───────────────────────────────────────────────────────────────

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function fmtDate(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR')
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ExportPage() {
  const [selected,   setSelected]   = useState<PresetId>('global')
  const [format,     setFormat]     = useState<Format>('csv')
  const [projects,   setProjects]   = useState<ProjectWithScore[]>([])
  const [pickedProj, setPickedProj] = useState<string>('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [done,       setDone]       = useState(false)
  const [userTier,   setUserTier]   = useState<string>('free')

  // Load projects + tier
  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.projects) setProjects(d.projects) })
      .catch(() => {})
    fetch('/api/user/profile')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.subscription_tier) setUserTier(d.subscription_tier) })
      .catch(() => {})
  }, [])

  // Reset state on preset change
  const selectPreset = (id: PresetId) => {
    const p = PRESETS.find(x => x.id === id)!
    setSelected(id)
    setFormat(p.formats[0])
    setError(null)
    setDone(false)
    setPickedProj('')
  }

  const isCorporateLocked = selected === 'corporate' &&
    userTier !== 'enterprise' && userTier !== 'lifetime'

  // ── Export logic ──────────────────────────────────────────────────────────

  const handleExport = useCallback(async () => {
    setError(null); setDone(false); setLoading(true)
    try {
      // ── Corporate PDF ─────────────────────────────────────────────────────
      if (selected === 'corporate') {
        if (!pickedProj) { setError('Sélectionnez un projet.'); setLoading(false); return }
        const res = await fetch('/api/export/corporate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: pickedProj }),
        })
        if (!res.ok) {
          const j = await res.json().catch(() => ({})) as { error?: string }
          throw new Error(j.error ?? 'Erreur génération PDF')
        }
        const blob = await res.blob()
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        const proj = projects.find(p => p.id === pickedProj)
        a.href = url
        a.download = `Brief_Corporate_${(proj?.name ?? 'projet').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`
        a.click()
        URL.revokeObjectURL(url)
        setDone(true)
        return
      }

      // ── Global CSV / PDF ──────────────────────────────────────────────────
      if (selected === 'global') {
        const rows: string[][] = [
          ['Nom du projet', 'Client', 'Type', 'Localisation', 'Statut', 'Échéance', 'Créé le'],
          ...projects.map(p => [
            p.name, p.client, p.consultation_type ?? '', p.location ?? '',
            p.status, fmtDate(p.offer_deadline), fmtDate(p.created_at),
          ]),
        ]
        downloadCsv(`Export_Global_${new Date().toISOString().slice(0, 10)}.csv`, rows)
        setDone(true)
        return
      }

      // ── Stats Analyses CSV ────────────────────────────────────────────────
      if (selected === 'stats_analyses') {
        // Fetch scores for all projects
        const statsRes = await fetch('/api/dashboard/stats')
        const stats    = statsRes.ok ? await statsRes.json() as Record<string, unknown> : {}

        // Load scores per project
        const scoreRows: string[][] = [
          ['Projet', 'Client', 'Score', 'Verdict', 'Statut'],
        ]
        for (const p of projects) {
          if (p.status === 'scored' || p.status === 'analyzed') {
            // Fetch score inline — use project data already loaded
            scoreRows.push([
              p.name, p.client,
              p.score ? String(p.score.total_score) : 'N/A',
              p.score?.verdict ?? 'N/A',
              p.status,
            ])
          }
        }

        const summaryRows: string[][] = [
          ['Métrique', 'Valeur'],
          ['Total projets', String((stats as Record<string,unknown>)?.total_projects ?? projects.length)],
          ['Projets analysés', String((stats as Record<string,unknown>)?.analyzed_projects ?? '')],
          ['GO', String((stats as Record<string,unknown>)?.go_count ?? '')],
          ['NO GO', String((stats as Record<string,unknown>)?.no_go_count ?? '')],
          ['À étudier', String((stats as Record<string,unknown>)?.a_etudier_count ?? '')],
          ['Score moyen', String((stats as Record<string,unknown>)?.average_score ?? '')],
          [],
          ...scoreRows,
        ]
        downloadCsv(`Stats_Analyses_${new Date().toISOString().slice(0, 10)}.csv`, summaryRows)
        setDone(true)
        return
      }

      // ── Stats Email CSV ───────────────────────────────────────────────────
      if (selected === 'stats_mail') {
        const rows: string[][] = [
          ['Information', 'Valeur'],
          ['Export généré le', new Date().toLocaleDateString('fr-FR')],
          ['Note', 'L\'historique détaillé des campagnes sera disponible dans une prochaine version.'],
          ['Accès à l\'outil', '/email-campaigns'],
        ]
        downloadCsv(`Stats_Email_${new Date().toISOString().slice(0, 10)}.csv`, rows)
        setDone(true)
        return
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }, [selected, format, projects, pickedProj])

  const preset = PRESETS.find(p => p.id === selected)!

  return (
    <div className="min-h-screen p-6 md:p-8 max-w-5xl mx-auto">

      {/* ── Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.2)' }}>
            <FileDown size={18} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Export</h1>
        </div>
        <p className="text-white/40 text-sm ml-12">
          Exportez vos données, statistiques et rapports dans le format de votre choix.
        </p>
      </div>

      {/* ── Preset grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {PRESETS.map(p => {
          const locked = p.minTier === 'enterprise' && userTier !== 'enterprise' && userTier !== 'lifetime'
          const active = selected === p.id
          const Icon   = p.icon
          return (
            <button
              key={p.id}
              onClick={() => !locked && selectPreset(p.id)}
              className={cn(
                'relative text-left rounded-2xl p-5 transition-all duration-200 group',
                locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
              )}
              style={{
                background:  active
                  ? `linear-gradient(135deg, ${p.color.glow}, rgba(255,255,255,0.02))`
                  : 'rgba(255,255,255,0.02)',
                border: `1px solid ${active ? p.color.border : 'rgba(255,255,255,0.07)'}`,
                boxShadow: active ? `0 0 30px ${p.color.glow}` : 'none',
              }}
            >
              {/* Active dot */}
              {active && (
                <span className="absolute top-4 right-4 w-2 h-2 rounded-full"
                  style={{ background: p.color.icon, boxShadow: `0 0 6px ${p.color.icon}` }} />
              )}

              {/* Lock */}
              {locked && (
                <span className="absolute top-4 right-4">
                  <Lock size={13} className="text-white/25" />
                </span>
              )}

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${p.color.icon}18`, border: `1px solid ${p.color.icon}30` }}>
                  <Icon size={18} style={{ color: p.color.icon }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-white text-sm">{p.name}</p>
                    {p.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: p.color.badge, color: p.color.icon, border: `1px solid ${p.color.icon}40` }}>
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Config panel */}
      <div className="rounded-2xl p-6 mb-5"
        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>

        <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-5">
          Configuration — {preset.name}
        </p>

        <div className="flex flex-wrap gap-6 items-end">

          {/* Format picker (only if multiple formats) */}
          {preset.formats.length > 1 && (
            <div>
              <p className="text-xs text-white/40 mb-2">Format</p>
              <div className="flex gap-2">
                {preset.formats.map(f => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={cn(
                      'px-4 py-2 rounded-xl text-xs font-semibold transition-all',
                      format === f
                        ? 'text-white'
                        : 'text-white/35 hover:text-white/60',
                    )}
                    style={format === f ? {
                      background: 'rgba(59,130,246,0.18)',
                      border: '1px solid rgba(59,130,246,0.35)',
                    } : {
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Project picker for corporate */}
          {selected === 'corporate' && (
            <div className="flex-1 min-w-48">
              <p className="text-xs text-white/40 mb-2">Projet à exporter</p>
              <div className="relative">
                <select
                  value={pickedProj}
                  onChange={e => setPickedProj(e.target.value)}
                  disabled={isCorporateLocked}
                  className="w-full appearance-none rounded-xl px-4 py-2.5 pr-9 text-sm text-white/80 outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.10)',
                  }}
                >
                  <option value="" style={{ background: '#0f172a' }}>— Choisir un projet —</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id} style={{ background: '#0f172a' }}>
                      {p.name} · {p.client}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={loading || isCorporateLocked || (selected === 'corporate' && !pickedProj)}
            className={cn(
              'flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all',
              loading || isCorporateLocked || (selected === 'corporate' && !pickedProj)
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:scale-[1.02] active:scale-[0.98]',
            )}
            style={done ? {
              background: 'rgba(16,185,129,0.18)',
              border: '1px solid rgba(16,185,129,0.35)',
              color: '#34d399',
            } : {
              background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
              boxShadow: '0 4px 20px rgba(59,130,246,0.25)',
              color: '#fff',
            }}
          >
            {loading ? (
              <><Loader2 size={15} className="animate-spin" /><span>Génération en cours…</span></>
            ) : done ? (
              <><Check size={15} /><span>Téléchargé !</span></>
            ) : (
              <><Download size={15} /><span>
                {selected === 'corporate' ? 'Générer le Brief IA' : `Exporter en ${(preset.formats[0]).toUpperCase()}`}
              </span></>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Locked notice for corporate */}
        {isCorporateLocked && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm"
            style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}>
            <Lock size={14} className="flex-shrink-0 mt-0.5" />
            <span>
              Le Corporate Brief est réservé au plan <strong>Entreprise (499 €/mois)</strong>.{' '}
              <a href="/subscription" className="underline underline-offset-2">Voir les abonnements →</a>
            </span>
          </div>
        )}
      </div>

      {/* ── Corporate feature highlight */}
      {selected === 'corporate' && !isCorporateLocked && (
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)' }}>
          <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Sparkles size={12} />
            Ce que contient le Brief Corporate
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Building2, title: 'Infos projet', desc: 'Nom, client, localisation, type de marché, échéance' },
              { icon: BarChart3, title: 'Score & Verdict', desc: 'Score IA, GO/NO GO, rentabilité estimée, budget' },
              { icon: Sparkles, title: 'Recommandation IA', desc: '1 phrase percutante générée par Claude — direct, actionnable' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3">
                <Icon size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-white/70 mb-0.5">{title}</p>
                  <p className="text-[11px] text-white/35 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(245,158,11,0.12)' }}>
            <div className="flex items-center gap-5">
              {[
                { label: 'Format', value: 'A4 · 1 page' },
                { label: 'Modèle IA', value: 'Claude Haiku' },
                { label: 'Consomme', value: '1 requête IA' },
                { label: 'Délai', value: '< 15 secondes' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[9px] text-white/25 uppercase tracking-wider">{label}</p>
                  <p className="text-xs font-semibold text-amber-300">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Global / Stats info cards */}
      {(selected === 'global' || selected === 'stats_analyses') && (
        <div className="rounded-2xl px-5 py-4 flex items-start gap-3"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <TableProperties size={14} className="text-white/30 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-white/50 mb-1">Aperçu du contenu</p>
            {selected === 'global' && (
              <p className="text-xs text-white/30 leading-relaxed">
                {projects.length} projet{projects.length !== 1 ? 's' : ''} — colonnes : Nom, Client, Type, Localisation, Statut, Échéance, Date de création
              </p>
            )}
            {selected === 'stats_analyses' && (
              <p className="text-xs text-white/30 leading-relaxed">
                Résumé global (totaux, GO/NO GO, score moyen) + détail ligne par ligne des projets analysés
              </p>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
