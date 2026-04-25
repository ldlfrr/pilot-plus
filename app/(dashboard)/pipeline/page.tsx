'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import {
  Kanban, MapPin, Building, Clock,
  AlertTriangle, ChevronRight, MoreHorizontal, ArrowRight,
  TrendingUp, RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { PipelineStage, TaskStates } from '@/types'

// ── Stage config ──────────────────────────────────────────────────────────────

interface StageCfg {
  value:  PipelineStage
  label:  string
  color:  string
  bg:     string
  border: string
  dot:    string
}

const STAGES: StageCfg[] = [
  { value: 'prospection',     label: 'Prospection',    color: '#60a5fa', bg: 'rgba(96,165,250,0.07)',   border: 'rgba(96,165,250,0.18)',   dot: '#3b82f6' },
  { value: 'qualification',   label: 'Qualification',  color: '#a78bfa', bg: 'rgba(167,139,250,0.07)',  border: 'rgba(167,139,250,0.18)',  dot: '#7c3aed' },
  { value: 'vente_interne',   label: 'Vente interne',  color: '#34d399', bg: 'rgba(52,211,153,0.07)',   border: 'rgba(52,211,153,0.20)',   dot: '#10b981' },
  { value: 'avant_vente',     label: 'Avant-vente',    color: '#fb923c', bg: 'rgba(251,146,60,0.07)',   border: 'rgba(251,146,60,0.18)',   dot: '#ea580c' },
  { value: 'echanges_client', label: 'Échanges client',color: '#f472b6', bg: 'rgba(244,114,182,0.07)',  border: 'rgba(244,114,182,0.18)',  dot: '#db2777' },
  { value: 'juridique',       label: 'Juridique',      color: '#facc15', bg: 'rgba(250,204,21,0.07)',   border: 'rgba(250,204,21,0.18)',   dot: '#ca8a04' },
  { value: 'signature',       label: 'Signature',      color: '#4ade80', bg: 'rgba(74,222,128,0.07)',   border: 'rgba(74,222,128,0.18)',   dot: '#16a34a' },
  { value: 'cloture',         label: 'Clôturé',        color: '#6b7280', bg: 'rgba(107,114,128,0.07)',  border: 'rgba(107,114,128,0.12)',  dot: '#4b5563' },
]

function stageCfg(stage: PipelineStage | undefined): StageCfg {
  return STAGES.find(s => s.value === stage) ?? STAGES[0]
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface PipelineProject {
  id:             string
  name:           string
  client:         string
  location:       string
  offer_deadline: string | null
  outcome:        string
  pipeline_stage: PipelineStage
  score?:         number | null
  verdict?:       string | null
  chiffrage_montant?: number | null
}

function daysLeft(deadline: string | null): number | null {
  if (!deadline) return null
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000)
}

function urgencyClass(days: number | null): string {
  if (days === null) return 'text-white/30'
  if (days <= 0)  return 'text-red-400'
  if (days <= 7)  return 'text-red-400'
  if (days <= 14) return 'text-amber-400'
  return 'text-emerald-400'
}

// ── Project card ──────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  onStageChange,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  project:       PipelineProject
  onStageChange: (id: string, stage: PipelineStage) => void
  isDragging:    boolean
  onDragStart:   (id: string) => void
  onDragEnd:     () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const days    = daysLeft(project.offer_deadline)
  const cfg     = stageCfg(project.pipeline_stage)
  const nextStage = STAGES[STAGES.findIndex(s => s.value === project.pipeline_stage) + 1]

  useEffect(() => {
    if (!menuOpen) return
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <div
      draggable
      onDragStart={() => onDragStart(project.id)}
      onDragEnd={onDragEnd}
      className={cn(
        'group rounded-xl border p-3 cursor-grab active:cursor-grabbing transition-all duration-200',
        isDragging ? 'opacity-40 scale-95' : 'hover:-translate-y-0.5',
      )}
      style={{
        background:   isDragging ? 'rgba(255,255,255,0.04)' : 'rgba(8,14,34,0.85)',
        borderColor:  cfg.border,
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Title */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link
          href={`/projects/${project.id}`}
          className="text-xs font-semibold text-white/85 hover:text-white line-clamp-2 leading-tight flex-1 transition-colors"
          onClick={e => e.stopPropagation()}
        >
          {project.name}
        </Link>
        {/* Quick actions menu */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="p-1 text-white/20 hover:text-white/60 rounded-md hover:bg-white/6 transition-all opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal size={12} />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-6 z-50 w-44 rounded-xl overflow-hidden"
              style={{
                background:   'rgba(8,14,34,0.98)',
                border:       '1px solid rgba(255,255,255,0.10)',
                boxShadow:    '0 8px 24px rgba(0,0,0,0.6)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="px-2 py-1.5">
                <p className="text-[8px] font-bold text-white/25 uppercase tracking-widest px-2 py-1">Déplacer vers</p>
                {STAGES.filter(s => s.value !== project.pipeline_stage).map(s => (
                  <button
                    key={s.value}
                    onClick={() => { onStageChange(project.id, s.value); setMenuOpen(false) }}
                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/6 transition-all"
                  >
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Client */}
      <div className="flex items-center gap-1.5 text-[10px] text-white/35 mb-2">
        <Building size={8} />
        <span className="truncate">{project.client}</span>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-[10px] text-white/25 mb-2.5 truncate">
        <MapPin size={8} />
        <span className="truncate">{project.location}</span>
      </div>

      {/* Footer: deadline + score */}
      <div className="flex items-center justify-between gap-2">
        {project.offer_deadline ? (
          <div className={cn('flex items-center gap-1 text-[10px] font-semibold', urgencyClass(days))}>
            {days !== null && days <= 7 ? <AlertTriangle size={9} /> : <Clock size={9} />}
            {days === null ? '' : days <= 0 ? 'Passée' : `J−${days}`}
          </div>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-1.5">
          {project.chiffrage_montant != null && (
            <span className="text-[9px] text-emerald-400 font-semibold">
              {new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 0 }).format(project.chiffrage_montant)}€
            </span>
          )}
          {project.score != null && (
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
              style={{
                background: project.verdict === 'GO' ? 'rgba(16,185,129,0.15)' : project.verdict === 'NO_GO' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                color:      project.verdict === 'GO' ? '#34d399'             : project.verdict === 'NO_GO' ? '#f87171'             : '#fbbf24',
              }}
            >
              {project.score}
            </span>
          )}
        </div>
      </div>

      {/* Quick advance button */}
      {nextStage && (
        <button
          onClick={() => onStageChange(project.id, nextStage.value)}
          className="mt-2 w-full flex items-center justify-center gap-1 py-1 rounded-lg text-[9px] font-semibold transition-all opacity-0 group-hover:opacity-100"
          style={{ background: nextStage.bg, color: nextStage.color, border: `1px solid ${nextStage.border}` }}
        >
          <ArrowRight size={9} />
          {nextStage.label}
        </button>
      )}
    </div>
  )
}

// ── Column ────────────────────────────────────────────────────────────────────

function KanbanColumn({
  stage,
  projects,
  onStageChange,
  dragOverStage,
  draggingId,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  stage:         StageCfg
  projects:      PipelineProject[]
  onStageChange: (id: string, stage: PipelineStage) => void
  dragOverStage: PipelineStage | null
  draggingId:    string | null
  onDragStart:   (id: string) => void
  onDragEnd:     () => void
  onDragOver:    (stage: PipelineStage) => void
  onDrop:        (stage: PipelineStage) => void
}) {
  const isOver       = dragOverStage === stage.value
  const totalMontant = projects.reduce((s, p) => s + (p.chiffrage_montant ?? 0), 0)

  return (
    <div
      className="flex flex-col min-w-[220px] w-56 flex-shrink-0"
      onDragOver={e => { e.preventDefault(); onDragOver(stage.value) }}
      onDrop={e => { e.preventDefault(); onDrop(stage.value) }}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-2.5 flex-shrink-0"
        style={{ background: stage.bg, border: `1px solid ${stage.border}` }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: stage.dot }} />
          <span className="text-xs font-bold" style={{ color: stage.color }}>{stage.label}</span>
          <span
            className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full"
            style={{ background: stage.color + '20', color: stage.color }}
          >
            {projects.length}
          </span>
        </div>
        {totalMontant > 0 && (
          <span className="text-[9px] text-white/30 font-semibold flex items-center gap-0.5">
            <TrendingUp size={8} />
            {new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 0 }).format(totalMontant)}€
          </span>
        )}
      </div>

      {/* Drop zone */}
      <div
        className={cn(
          'flex-1 rounded-xl flex flex-col gap-2 p-2 min-h-[120px] transition-all duration-200',
          isOver ? 'ring-2 ring-inset' : '',
        )}
        style={isOver ? {
          background: stage.bg,
          boxShadow:  `inset 0 0 0 2px ${stage.color}`,
        } : {
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        {projects.map(p => (
          <ProjectCard
            key={p.id}
            project={p}
            onStageChange={onStageChange}
            isDragging={draggingId === p.id}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
        {projects.length === 0 && (
          <div className="flex items-center justify-center h-16 text-[10px] text-white/15">
            Aucun projet
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const [projects,  setProjects]  = useState<PipelineProject[]>([])
  const [loading,   setLoading]   = useState(true)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOver,   setDragOver]   = useState<PipelineStage | null>(null)
  const [filter,     setFilter]     = useState<'all' | 'active'>('active')
  const [refreshing, setRefreshing] = useState(false)

  async function loadProjects() {
    try {
      const res  = await fetch('/api/projects?limit=200')
      if (!res.ok) return
      const data = await res.json() as { projects: Array<{
        id: string; name: string; client: string; location: string
        offer_deadline: string | null; outcome: string; task_states: TaskStates | null
        score?: { total_score?: number; verdict?: string } | null
      }> }
      const mapped: PipelineProject[] = (data.projects ?? []).map(p => ({
        id:             p.id,
        name:           p.name,
        client:         p.client,
        location:       p.location,
        offer_deadline: p.offer_deadline,
        outcome:        p.outcome,
        pipeline_stage: (p.task_states?.pipeline_stage ?? 'prospection') as PipelineStage,
        score:          p.score?.total_score ?? null,
        verdict:        p.score?.verdict ?? null,
        chiffrage_montant: p.task_states?.chiffrage?.montant ?? null,
      }))
      setProjects(mapped)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { loadProjects() }, [])

  async function handleStageChange(projectId: string, newStage: PipelineStage) {
    // Optimistic update
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, pipeline_stage: newStage } : p))
    await fetch(`/api/projects/${projectId}/pipeline`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ pipeline_stage: newStage }),
    })
  }

  function handleDragStart(id: string) { setDraggingId(id) }
  function handleDragEnd()             { setDraggingId(null); setDragOver(null) }
  function handleDragOver(stage: PipelineStage) { setDragOver(stage) }

  function handleDrop(stage: PipelineStage) {
    if (draggingId) handleStageChange(draggingId, stage)
    setDragOver(null)
    setDraggingId(null)
  }

  function handleRefresh() {
    setRefreshing(true)
    loadProjects()
  }

  const displayed = filter === 'active'
    ? projects.filter(p => p.outcome === 'pending' && p.pipeline_stage !== 'cloture')
    : projects

  const byStage = (stage: PipelineStage) => displayed.filter(p => p.pipeline_stage === stage)

  // Pipeline value stats
  const totalValue   = displayed.reduce((s, p) => s + (p.chiffrage_montant ?? 0), 0)
  const totalGo      = displayed.filter(p => ['vente_interne', 'avant_vente', 'echanges_client', 'juridique', 'signature'].includes(p.pipeline_stage)).length
  const totalRemis   = displayed.filter(p => p.pipeline_stage === 'signature').length

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-white/6 rounded-xl" />
        <div className="flex gap-4 overflow-hidden">
          {STAGES.map(s => (
            <div key={s.value} className="min-w-[220px] h-64 bg-white/4 rounded-xl border border-white/6" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-0 h-full animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-4 md:px-6 pt-5 pb-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Kanban size={20} className="text-blue-400" />
              Pipeline commercial
            </h1>
            <p className="text-xs text-white/35 mt-0.5">
              {displayed.length} projet{displayed.length !== 1 ? 's' : ''} · Glissez-déposez pour avancer une étape
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter toggle */}
            <div
              className="flex items-center rounded-lg overflow-hidden border border-white/10"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              {(['active', 'all'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-semibold transition-all',
                    filter === f ? 'bg-blue-600 text-white' : 'text-white/40 hover:text-white/70'
                  )}
                >
                  {f === 'active' ? 'Actifs' : 'Tous'}
                </button>
              ))}
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-white/30 hover:text-white/70 border border-white/10 rounded-lg hover:bg-white/5 transition-all"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            </button>

            <Link
              href="/projects/new"
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Nouveau projet
              <ChevronRight size={12} />
            </Link>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-white/35">Projets actifs :</span>
            <span className="text-white font-bold">{displayed.length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-white/35">En GO+ :</span>
            <span className="text-emerald-400 font-bold">{totalGo}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-white/35">Remis :</span>
            <span className="text-teal-400 font-bold">{totalRemis}</span>
          </div>
          {totalValue > 0 && (
            <div className="flex items-center gap-1.5">
              <TrendingUp size={11} className="text-white/30" />
              <span className="text-white/35">Valeur pipeline :</span>
              <span className="text-white font-bold">
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(totalValue)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Kanban board ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 px-4 md:px-6 py-4 h-full min-h-0" style={{ minWidth: 'max-content' }}>
          {STAGES.map(stage => (
            <KanbanColumn
              key={stage.value}
              stage={stage}
              projects={byStage(stage.value)}
              onStageChange={handleStageChange}
              dragOverStage={dragOver}
              draggingId={draggingId}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
