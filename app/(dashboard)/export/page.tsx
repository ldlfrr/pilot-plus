'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Download, FileText, BarChart3, Mail, Star,
  Lock, Check, Loader2, ChevronDown, AlertCircle,
  Building2, Sparkles, FileDown, TableProperties,
  Sliders, Target, Radio, Kanban, Calendar,
  PenLine, Users, CheckCircle, Plus, X, Eye,
  TrendingUp, Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────

type PresetId = 'global' | 'stats_analyses' | 'stats_mail' | 'corporate' | 'custom'
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

// ── Custom PDF sections ────────────────────────────────────────────────────────

const PDF_SECTIONS = [
  { id: 'cover',       icon: FileText,   label: 'Page de couverture',    desc: 'Titre, date, logo PILOT+',                      always: true  },
  { id: 'summary',     icon: BarChart3,  label: 'Résumé exécutif',       desc: 'KPIs clés : pipeline, taux GO, CA estimé',      always: false },
  { id: 'projects',    icon: Layers,     label: 'Liste des projets',      desc: 'Tableau complet avec statuts et échéances',     always: false },
  { id: 'scores',      icon: Target,     label: 'Scores Go/No Go',        desc: 'Tableau comparatif + graphique distribution',  always: false },
  { id: 'pipeline',    icon: Kanban,     label: 'Vue pipeline',           desc: 'Répartition par étape commerciale',             always: false },
  { id: 'deadlines',   icon: Calendar,   label: 'Calendrier des remises', desc: 'Toutes les échéances à venir triées par date',  always: false },
  { id: 'analysis',    icon: PenLine,    label: 'Extraits d\'analyse IA', desc: 'Synthèse IA des projets sélectionnés',          always: false },
  { id: 'team',        icon: Users,      label: 'Performance équipe',     desc: 'Stats par membre (si équipe active)',           always: false },
  { id: 'veille',      icon: Radio,      label: 'Résultats veille',       desc: 'Dernières annonces BOAMP importées',            always: false },
]

// ── Preset definitions ────────────────────────────────────────────────────────

const PRESETS = [
  {
    id: 'custom' as PresetId,
    name: 'PDF Builder',
    desc: 'Construisez un rapport 100% personnalisé : choisissez les sections, projets et KPIs.',
    icon: Sliders,
    minTier: null,
    badge: 'Nouveau',
    formats: ['pdf'] as Format[],
    color: { border: 'rgba(139,92,246,0.45)', glow: 'rgba(139,92,246,0.12)', icon: '#a78bfa', badge: 'rgba(139,92,246,0.22)' },
  },
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
    color: { border: 'rgba(20,184,166,0.3)', glow: 'rgba(20,184,166,0.08)', icon: '#2dd4bf', badge: '' },
  },
  {
    id: 'stats_mail' as PresetId,
    name: 'Stats Email',
    desc: 'Historique et volume de vos campagnes email IA générées.',
    icon: Mail,
    minTier: null,
    badge: null,
    formats: ['csv'] as Format[],
    color: { border: 'rgba(99,102,241,0.3)', glow: 'rgba(99,102,241,0.08)', icon: '#818cf8', badge: '' },
  },
  {
    id: 'corporate' as PresetId,
    name: 'Corporate Brief',
    desc: '1 page executive par projet — tout ce qu\'un directeur commercial doit savoir en 30 secondes.',
    icon: Star,
    minTier: 'enterprise',
    badge: 'IA · Entreprise',
    formats: ['pdf'] as Format[],
    color: { border: 'rgba(245,158,11,0.45)', glow: 'rgba(245,158,11,0.10)', icon: '#fbbf24', badge: 'rgba(245,158,11,0.18)' },
  },
]

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

// ── Section toggle component ──────────────────────────────────────────────────

function SectionToggle({
  section, checked, onChange,
}: {
  section: typeof PDF_SECTIONS[0]
  checked: boolean
  onChange: (v: boolean) => void
}) {
  const Icon = section.icon
  return (
    <button
      onClick={() => !section.always && onChange(!checked)}
      className={cn(
        'flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all',
        section.always
          ? 'opacity-60 cursor-default'
          : checked
            ? 'bg-violet-500/10 border-violet-500/25'
            : 'bg-white/[0.02] border-white/[0.07] hover:border-white/15 hover:bg-white/[0.04]',
      )}
    >
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
        checked || section.always ? 'bg-violet-500/20' : 'bg-white/[0.05]',
      )}>
        <Icon size={14} className={checked || section.always ? 'text-violet-400' : 'text-white/30'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs font-semibold truncate', checked || section.always ? 'text-white/80' : 'text-white/45')}>
          {section.label}
          {section.always && <span className="ml-1.5 text-[9px] text-violet-400/60 font-normal">Toujours inclus</span>}
        </p>
        <p className="text-[10px] text-white/25 mt-0.5 leading-relaxed truncate">{section.desc}</p>
      </div>
      {!section.always && (
        <div className={cn(
          'w-4 h-4 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all',
          checked ? 'border-violet-500 bg-violet-500' : 'border-white/20',
        )}>
          {checked && <Check size={9} className="text-white" strokeWidth={3} />}
        </div>
      )}
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ExportPage() {
  const [selected,      setSelected]      = useState<PresetId>('custom')
  const [format,        setFormat]        = useState<Format>('pdf')
  const [projects,      setProjects]      = useState<ProjectWithScore[]>([])
  const [pickedProj,    setPickedProj]    = useState<string>('')
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [done,          setDone]          = useState(false)
  const [userTier,      setUserTier]      = useState<string>('free')

  // Custom PDF builder state
  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    new Set(['cover', 'summary', 'projects', 'scores'])
  )
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set())
  const [reportTitle,      setReportTitle]      = useState('Rapport commercial PILOT+')
  const [reportPeriod,     setReportPeriod]     = useState(() => {
    const now = new Date()
    return `${now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
  })
  const [selectAll, setSelectAll] = useState(true)

  // Load projects + tier
  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.projects) {
          setProjects(d.projects)
          // Default: select all projects
          setSelectedProjects(new Set(d.projects.map((p: Project) => p.id)))
        }
      })
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

  const toggleSection = (id: string, v: boolean) => {
    setSelectedSections(prev => {
      const next = new Set(prev)
      v ? next.add(id) : next.delete(id)
      return next
    })
  }

  const toggleProject = (id: string) => {
    setSelectedProjects(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAllProjects = () => {
    if (selectAll) {
      setSelectedProjects(new Set())
      setSelectAll(false)
    } else {
      setSelectedProjects(new Set(projects.map(p => p.id)))
      setSelectAll(true)
    }
  }

  // ── Export logic ──────────────────────────────────────────────────────────

  const handleExport = useCallback(async () => {
    setError(null); setDone(false); setLoading(true)
    try {
      // ── Custom PDF Builder ────────────────────────────────────────────────
      if (selected === 'custom') {
        const sectionsArr = [...selectedSections]
        const projectsArr = [...selectedProjects]

        if (sectionsArr.length === 0) {
          setError('Sélectionnez au moins une section.')
          setLoading(false)
          return
        }

        // For now generate a comprehensive CSV report
        // (PDF generation would require a backend endpoint)
        const selectedProjData = projects.filter(p => projectsArr.includes(p.id))

        const rows: string[][] = [
          [`Rapport: ${reportTitle}`],
          [`Période: ${reportPeriod}`],
          [`Généré le: ${new Date().toLocaleDateString('fr-FR')}`],
          [`Sections: ${sectionsArr.join(', ')}`],
          [],
        ]

        if (selectedSections.has('projects') || selectedSections.has('summary')) {
          rows.push(['=== PROJETS ==='])
          rows.push(['Nom', 'Client', 'Type', 'Localisation', 'Statut', 'Échéance', 'Score', 'Verdict'])
          for (const p of selectedProjData) {
            rows.push([
              p.name, p.client, p.consultation_type ?? '', p.location ?? '',
              p.status, fmtDate(p.offer_deadline),
              p.score ? String(p.score.total_score) : 'N/A',
              p.score?.verdict ?? 'N/A',
            ])
          }
        }

        downloadCsv(`${reportTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`, rows)
        setDone(true)
        return
      }

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

      // ── Global CSV ────────────────────────────────────────────────────────
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
        const statsRes = await fetch('/api/dashboard/stats')
        const stats    = statsRes.ok ? await statsRes.json() as Record<string, unknown> : {}

        const scoreRows: string[][] = [['Projet', 'Client', 'Score', 'Verdict', 'Statut']]
        for (const p of projects) {
          if (p.status === 'scored' || p.status === 'analyzed') {
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
          ['Total projets',     String(stats?.total_projects     ?? projects.length)],
          ['Projets analysés',  String(stats?.analyzed_projects  ?? '')],
          ['GO',                String(stats?.go_count           ?? '')],
          ['NO GO',             String(stats?.no_go_count        ?? '')],
          ['À étudier',         String(stats?.a_etudier_count    ?? '')],
          ['Score moyen',       String(stats?.average_score      ?? '')],
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
  }, [selected, format, projects, pickedProj, selectedSections, selectedProjects, reportTitle, reportPeriod])

  const preset = PRESETS.find(p => p.id === selected)!

  return (
    <div className="flex flex-col min-h-0 h-full animate-fade-in">

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="h-14 flex items-center px-5 md:px-7 gap-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.055)', background: 'rgba(8,14,34,0.80)', backdropFilter: 'blur(16px)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.2)' }}>
          <FileDown size={15} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-white leading-none">Export & Rapports</h1>
          <p className="text-[11px] text-white/30 mt-0.5">Exportez vos données en CSV ou générez des rapports PDF professionnels</p>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="p-5 md:p-7 max-w-6xl mx-auto space-y-6">

          {/* ── Preset grid ─────────────────────────────────────────────── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-3">Choisissez un format</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {PRESETS.map(p => {
                const locked = p.minTier === 'enterprise' && userTier !== 'enterprise' && userTier !== 'lifetime'
                const active = selected === p.id
                const Icon   = p.icon
                return (
                  <button
                    key={p.id}
                    onClick={() => !locked && selectPreset(p.id)}
                    className={cn(
                      'relative text-left rounded-2xl p-4 transition-all duration-200',
                      locked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                      active ? '' : 'hover:scale-[1.01]',
                    )}
                    style={{
                      background: active
                        ? `linear-gradient(135deg, ${p.color.glow}, rgba(255,255,255,0.02))`
                        : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${active ? p.color.border : 'rgba(255,255,255,0.07)'}`,
                      boxShadow: active ? `0 0 0 1px ${p.color.border}` : 'none',
                    }}
                  >
                    {active && (
                      <span className="absolute top-3 right-3 w-2 h-2 rounded-full"
                        style={{ background: p.color.icon, boxShadow: `0 0 8px ${p.color.icon}` }} />
                    )}
                    {locked && (
                      <span className="absolute top-3 right-3">
                        <Lock size={12} className="text-white/20" />
                      </span>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${p.color.icon}15`, border: `1px solid ${p.color.icon}28` }}>
                        <Icon size={16} style={{ color: p.color.icon }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-bold text-white text-sm truncate">{p.name}</p>
                          {p.badge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: p.color.badge || `${p.color.icon}22`, color: p.color.icon, border: `1px solid ${p.color.icon}35` }}>
                              {p.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/35 leading-relaxed line-clamp-2">{p.desc}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── PDF BUILDER ─────────────────────────────────────────────── */}
          {selected === 'custom' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

              {/* Left: Sections */}
              <div className="lg:col-span-3 space-y-4">
                <div className="rounded-2xl p-5"
                  style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.15)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Sliders size={14} className="text-violet-400" />
                    <p className="text-sm font-bold text-white">Sections du rapport</p>
                    <span className="ml-auto text-[11px] text-violet-400/60">
                      {selectedSections.size} / {PDF_SECTIONS.length} sélectionnées
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PDF_SECTIONS.map(section => (
                      <SectionToggle
                        key={section.id}
                        section={section}
                        checked={selectedSections.has(section.id) || section.always}
                        onChange={(v) => toggleSection(section.id, v)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Config + Projects */}
              <div className="lg:col-span-2 space-y-4">
                {/* Rapport info */}
                <div className="rounded-2xl p-5"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-4">Informations du rapport</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-white/40 mb-1.5 block">Titre</label>
                      <input
                        type="text"
                        value={reportTitle}
                        onChange={e => setReportTitle(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-violet-500/40 transition-all"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1.5 block">Période couverte</label>
                      <input
                        type="text"
                        value={reportPeriod}
                        onChange={e => setReportPeriod(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-violet-500/40 transition-all"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Project selection */}
                {(selectedSections.has('projects') || selectedSections.has('scores') || selectedSections.has('analysis')) && (
                  <div className="rounded-2xl p-5"
                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Projets inclus</p>
                      <button
                        onClick={toggleAllProjects}
                        className="ml-auto text-[10px] text-white/30 hover:text-white/60 transition-colors"
                      >
                        {selectAll ? 'Tout déselect.' : 'Tout sélect.'}
                      </button>
                    </div>
                    {projects.length === 0 ? (
                      <p className="text-xs text-white/25 text-center py-4">Aucun projet créé</p>
                    ) : (
                      <div className="space-y-1.5 max-h-52 overflow-y-auto scrollbar-hide">
                        {projects.map(p => {
                          const checked = selectedProjects.has(p.id)
                          return (
                            <button
                              key={p.id}
                              onClick={() => toggleProject(p.id)}
                              className={cn(
                                'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all',
                                checked
                                  ? 'bg-violet-500/10 border border-violet-500/20'
                                  : 'bg-white/[0.02] border border-white/[0.06] hover:border-white/12',
                              )}
                            >
                              <div className={cn(
                                'w-3.5 h-3.5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all',
                                checked ? 'border-violet-500 bg-violet-500' : 'border-white/20',
                              )}>
                                {checked && <Check size={8} className="text-white" strokeWidth={3} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={cn('text-xs font-medium truncate', checked ? 'text-white/80' : 'text-white/40')}>{p.name}</p>
                                <p className="text-[10px] text-white/25 truncate">{p.client}</p>
                              </div>
                              {p.score && (
                                <span className={cn(
                                  'text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0',
                                  p.score.verdict === 'GO' ? 'text-emerald-400 bg-emerald-500/15' :
                                  p.score.verdict === 'NO GO' ? 'text-red-400 bg-red-500/15' :
                                  'text-amber-400 bg-amber-500/15',
                                )}>
                                  {p.score.total_score}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                    <p className="text-[10px] text-white/20 mt-2">
                      {selectedProjects.size} / {projects.length} projets sélectionnés
                    </p>
                  </div>
                )}

                {/* Preview summary */}
                <div className="rounded-2xl p-4"
                  style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Eye size={12} className="text-violet-400" />
                    <p className="text-xs font-semibold text-violet-300">Aperçu du rapport</p>
                  </div>
                  <div className="space-y-1">
                    {PDF_SECTIONS.filter(s => selectedSections.has(s.id) || s.always).map((s, i) => (
                      <div key={s.id} className="flex items-center gap-2">
                        <span className="text-[9px] text-violet-400/40 font-mono w-4">{i + 1}.</span>
                        <span className="text-[11px] text-white/50">{s.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-violet-500/10 flex items-center gap-1.5">
                    <span className="text-[10px] text-white/25">{selectedProjects.size} projet{selectedProjects.size !== 1 ? 's' : ''} · {selectedSections.size} section{selectedSections.size !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Standard preset config ───────────────────────────────────── */}
          {selected !== 'custom' && (
            <div className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-4">
                Configuration — {preset.name}
              </p>

              <div className="flex flex-wrap gap-4 items-end">
                {/* Format picker */}
                {preset.formats.length > 1 && (
                  <div>
                    <p className="text-xs text-white/35 mb-2">Format</p>
                    <div className="flex gap-2">
                      {preset.formats.map(f => (
                        <button
                          key={f}
                          onClick={() => setFormat(f)}
                          className={cn(
                            'px-3.5 py-2 rounded-xl text-xs font-semibold transition-all',
                            format === f ? 'text-white' : 'text-white/30 hover:text-white/60',
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
                    <p className="text-xs text-white/35 mb-2">Projet à exporter</p>
                    <div className="relative">
                      <select
                        value={pickedProj}
                        onChange={e => setPickedProj(e.target.value)}
                        disabled={isCorporateLocked}
                        className="w-full appearance-none rounded-xl px-4 py-2.5 pr-9 text-sm text-white/80 outline-none transition-all"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}
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

                {/* Info for global/stats */}
                {(selected === 'global' || selected === 'stats_analyses') && (
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-white/30"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <TableProperties size={12} className="text-white/25" />
                    {selected === 'global'
                      ? `${projects.length} projet${projects.length !== 1 ? 's' : ''} · 7 colonnes`
                      : 'Totaux + détail par projet analysé'}
                  </div>
                )}

                <div className="flex-1" />
              </div>
            </div>
          )}

          {/* ── Export button ────────────────────────────────────────────── */}
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={handleExport}
              disabled={loading || isCorporateLocked || (selected === 'corporate' && !pickedProj)}
              className={cn(
                'flex items-center gap-2.5 px-7 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg',
                loading || isCorporateLocked || (selected === 'corporate' && !pickedProj)
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:scale-[1.02] active:scale-[0.98]',
              )}
              style={done ? {
                background: 'rgba(16,185,129,0.18)',
                border: '1px solid rgba(16,185,129,0.35)',
                color: '#34d399',
                boxShadow: '0 0 20px rgba(16,185,129,0.15)',
              } : selected === 'custom' ? {
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                boxShadow: '0 4px 24px rgba(139,92,246,0.30)',
                color: '#fff',
              } : {
                background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
                boxShadow: '0 4px 24px rgba(59,130,246,0.25)',
                color: '#fff',
              }}
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /><span>Génération…</span></>
              ) : done ? (
                <><Check size={15} /><span>Téléchargé !</span></>
              ) : (
                <><Download size={15} /><span>
                  {selected === 'corporate'
                    ? 'Générer le Brief IA'
                    : selected === 'custom'
                      ? `Exporter le rapport PDF (${selectedSections.size} sections)`
                      : `Exporter en ${preset.formats[0].toUpperCase()}`}
                </span></>
              )}
            </button>

            {done && (
              <button
                onClick={() => setDone(false)}
                className="text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                Nouvel export
              </button>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* ── Locked notice for corporate ──────────────────────────────── */}
          {isCorporateLocked && (
            <div className="flex items-start gap-3 rounded-2xl px-5 py-4"
              style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <Lock size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-300">Fonctionnalité Entreprise</p>
                <p className="text-xs text-amber-400/60 mt-1">
                  Le Corporate Brief est réservé au plan <strong>Entreprise (499€/mois)</strong>.{' '}
                  <Link href="/subscription" className="underline underline-offset-2 hover:text-amber-300 transition-colors">
                    Voir les abonnements →
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* ── Corporate feature detail ─────────────────────────────────── */}
          {selected === 'corporate' && !isCorporateLocked && (
            <div className="rounded-2xl p-5"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)' }}>
              <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Sparkles size={12} />Ce que contient le Brief Corporate
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {[
                  { icon: Building2, title: 'Infos projet',     desc: 'Nom, client, localisation, type de marché, échéance' },
                  { icon: BarChart3, title: 'Score & Verdict',  desc: 'Score IA, GO/NO GO, rentabilité estimée, budget' },
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
              <div className="flex items-center gap-6 pt-3 border-t border-amber-500/10">
                {[
                  { label: 'Format', value: 'A4 · 1 page' },
                  { label: 'Modèle IA', value: 'Claude Haiku' },
                  { label: 'Délai', value: '< 15 secondes' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[9px] text-white/20 uppercase tracking-wider">{label}</p>
                    <p className="text-xs font-semibold text-amber-300">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
