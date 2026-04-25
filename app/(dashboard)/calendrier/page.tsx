'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CalendarDays, ChevronLeft, ChevronRight,
  AlertTriangle, Clock, Building, MapPin, LayoutGrid, List,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { TaskStates } from '@/types'

// ── Helpers ────────────────────────────────────────────────────────��──────────

function daysLeft(deadline: string): number {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000)
}

function urgency(days: number): 'critical' | 'warning' | 'ok' {
  if (days <= 0)  return 'critical'
  if (days <= 7)  return 'critical'
  if (days <= 14) return 'warning'
  return 'ok'
}

const URGENCY_STYLES = {
  critical: { dot: 'bg-red-400',    text: 'text-red-400',    pill: 'bg-red-500/15 border-red-500/30 text-red-400',    bar: '#ef4444' },
  warning:  { dot: 'bg-amber-400',  text: 'text-amber-400',  pill: 'bg-amber-500/12 border-amber-500/25 text-amber-400', bar: '#f59e0b' },
  ok:       { dot: 'bg-emerald-400',text: 'text-emerald-400',pill: 'bg-emerald-500/12 border-emerald-500/25 text-emerald-400', bar: '#10b981' },
}

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

// ── Types ─────────────────────────────────────────────────────────────────────

interface CalProject {
  id:             string
  name:           string
  client:         string
  location:       string
  offer_deadline: string
  pipeline_stage: string
  score?:         number | null
  verdict?:       string | null
}

// ── List item ──────────────────────��────────────────────���─────────────────────

function ProjectListItem({ project }: { project: CalProject }) {
  const days = daysLeft(project.offer_deadline)
  const urg  = urgency(days)
  const s    = URGENCY_STYLES[urg]
  const dateStr = new Date(project.offer_deadline).toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'long',
  })

  return (
    <Link
      href={`/projects/${project.id}`}
      className="flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all hover:-translate-y-0.5 group"
      style={{ background: 'rgba(8,14,34,0.8)', borderColor: `${s.bar}28` }}
    >
      {/* Urgency bar */}
      <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: s.bar }} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white/85 truncate group-hover:text-white transition-colors">
          {project.name}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="flex items-center gap-1 text-[10px] text-white/35">
            <Building size={9} />{project.client}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-white/25">
            <MapPin size={9} />{project.location}
          </span>
        </div>
      </div>

      {/* Date */}
      <div className="text-right flex-shrink-0">
        <p className={cn('text-xs font-bold', s.text)}>
          {days <= 0 ? 'Passée !' : `J−${days}`}
        </p>
        <p className="text-[10px] text-white/30 mt-0.5">{dateStr}</p>
      </div>

      {/* Score */}
      {project.score != null && (
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0"
          style={{
            background: project.verdict === 'GO' ? 'rgba(16,185,129,0.15)' : project.verdict === 'NO_GO' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
            color:      project.verdict === 'GO' ? '#34d399'             : project.verdict === 'NO_GO' ? '#f87171'              : '#fbbf24',
          }}
        >
          {project.score}
        </span>
      )}
    </Link>
  )
}

// ── Calendar grid ─────────────────────────────────────────────────────────────

function CalendarGrid({
  year, month, projects, onDayClick,
}: {
  year:        number
  month:       number   // 0-based
  projects:    CalProject[]
  onDayClick:  (projects: CalProject[]) => void
}) {
  // Build days array
  const firstDay   = new Date(year, month, 1)
  const lastDay    = new Date(year, month + 1, 0)
  const startDow   = (firstDay.getDay() + 6) % 7  // 0 = Monday
  const totalCells = Math.ceil((startDow + lastDay.getDate()) / 7) * 7

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => i + 1),
    ...Array(totalCells - startDow - lastDay.getDate()).fill(null),
  ]

  // Index projects by day
  const byDay = new Map<number, CalProject[]>()
  projects.forEach(p => {
    const d = new Date(p.offer_deadline)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      byDay.set(day, [...(byDay.get(day) ?? []), p])
    }
  })

  const today = new Date()

  return (
    <div className="bg-[var(--bg-card)] border border-white/8 rounded-2xl overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-white/6">
        {DAYS_FR.map(d => (
          <div key={d} className="py-2.5 text-center text-[10px] font-bold text-white/30 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          const dayProjects = day ? (byDay.get(day) ?? []) : []
          const isToday = day !== null
            && today.getFullYear() === year
            && today.getMonth()    === month
            && today.getDate()     === day

          const hasProjects = dayProjects.length > 0
          const maxUrg = dayProjects.reduce<'critical'|'warning'|'ok'>((max, p) => {
            const u = urgency(daysLeft(p.offer_deadline))
            if (u === 'critical') return 'critical'
            if (u === 'warning' && max !== 'critical') return 'warning'
            return max
          }, 'ok')

          return (
            <div
              key={idx}
              onClick={() => hasProjects && onDayClick(dayProjects)}
              className={cn(
                'relative min-h-[80px] p-2 border-r border-b border-white/4 last:border-r-0 transition-all',
                hasProjects ? 'cursor-pointer hover:bg-white/4' : '',
                idx % 7 === 6 ? 'border-r-0' : '',
              )}
            >
              {day && (
                <>
                  {/* Day number */}
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mb-1',
                    isToday ? 'bg-blue-600 text-white' : 'text-white/40',
                  )}>
                    {day}
                  </div>

                  {/* Project dots/pills */}
                  {dayProjects.slice(0, 3).map((p, i) => {
                    const urg = urgency(daysLeft(p.offer_deadline))
                    const s   = URGENCY_STYLES[urg]
                    return (
                      <div
                        key={i}
                        className={cn('text-[9px] font-medium px-1.5 py-0.5 rounded mb-0.5 truncate border', s.pill)}
                      >
                        {p.name.length > 16 ? p.name.slice(0, 14) + '…' : p.name}
                      </div>
                    )
                  })}
                  {dayProjects.length > 3 && (
                    <div className="text-[8px] text-white/30 px-1.5">
                      +{dayProjects.length - 3} autres
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Day detail panel ──────────────────────────────────────────────────────────

function DayPanel({ projects, onClose }: { projects: CalProject[]; onClose: () => void }) {
  if (!projects.length) return null
  const d   = new Date(projects[0].offer_deadline)
  const days = daysLeft(projects[0].offer_deadline)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background:   'rgba(8,14,34,0.98)',
          border:       '1px solid rgba(255,255,255,0.10)',
          boxShadow:    '0 24px 60px rgba(0,0,0,0.7)',
          backdropFilter: 'blur(24px)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/8">
          <div>
            <p className="text-xs font-bold text-white/50 uppercase tracking-wider">
              Remise — {d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <p className={cn('text-sm font-extrabold mt-0.5', URGENCY_STYLES[urgency(days)].text)}>
              {days <= 0 ? 'Date dépassée !' : `Dans ${days} jour${days > 1 ? 's' : ''}`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-white/30 hover:text-white/70 transition-colors">×</button>
        </div>
        <div className="p-3 space-y-2">
          {projects.map(p => <ProjectListItem key={p.id} project={p} />)}
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────���──────────────────────────────��────────

export default function CalendrierPage() {
  const [projects,  setProjects]  = useState<CalProject[]>([])
  const [loading,   setLoading]   = useState(true)
  const [year,      setYear]      = useState(() => new Date().getFullYear())
  const [month,     setMonth]     = useState(() => new Date().getMonth())
  const [view,      setView]      = useState<'calendar' | 'list'>('calendar')
  const [dayPanel,  setDayPanel]  = useState<CalProject[] | null>(null)

  useEffect(() => {
    fetch('/api/projects?limit=200')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        const mapped: CalProject[] = (data.projects ?? [])
          .filter((p: { offer_deadline: string | null }) => !!p.offer_deadline)
          .map((p: {
            id: string; name: string; client: string; location: string
            offer_deadline: string; task_states: TaskStates | null
            score?: { total_score?: number; verdict?: string } | null
          }) => ({
            id:             p.id,
            name:           p.name,
            client:         p.client,
            location:       p.location,
            offer_deadline: p.offer_deadline,
            pipeline_stage: p.task_states?.pipeline_stage ?? 'veille',
            score:          p.score?.total_score ?? null,
            verdict:        p.score?.verdict     ?? null,
          }))
          .sort((a: CalProject, b: CalProject) =>
            new Date(a.offer_deadline).getTime() - new Date(b.offer_deadline).getTime()
          )
        setProjects(mapped)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  // For list view: upcoming deadlines
  const upcoming = projects.filter(p => {
    const d = new Date(p.offer_deadline)
    return d.getFullYear() === year && d.getMonth() === month
  })

  // Stats
  const critical = projects.filter(p => urgency(daysLeft(p.offer_deadline)) === 'critical').length
  const warning  = projects.filter(p => urgency(daysLeft(p.offer_deadline)) === 'warning').length
  const total    = projects.length

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-white/6 rounded-xl" />
        <div className="h-96 bg-white/4 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-0 animate-fade-in">

      {/* Header */}
      <div
        className="flex-shrink-0 px-4 md:px-6 pt-5 pb-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              <CalendarDays size={20} className="text-blue-400" />
              Calendrier des remises
            </h1>
            <p className="text-xs text-white/35 mt-0.5">
              {total} projet{total !== 1 ? 's' : ''} avec date limite
            </p>
          </div>

          {/* View toggle */}
          <div
            className="flex items-center rounded-lg overflow-hidden border border-white/10"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <button
              onClick={() => setView('calendar')}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all', view === 'calendar' ? 'bg-blue-600 text-white' : 'text-white/40 hover:text-white/70')}
            >
              <LayoutGrid size={12} />Calendrier
            </button>
            <button
              onClick={() => setView('list')}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all', view === 'list' ? 'bg-blue-600 text-white' : 'text-white/40 hover:text-white/70')}
            >
              <List size={12} />Liste
            </button>
          </div>
        </div>

        {/* Urgency stats */}
        <div className="flex items-center gap-5 text-xs">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={11} className="text-red-400" />
            <span className="text-red-400 font-bold">{critical}</span>
            <span className="text-white/30">critiques (≤7j)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={11} className="text-amber-400" />
            <span className="text-amber-400 font-bold">{warning}</span>
            <span className="text-white/30">vigilance (8-14j)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-emerald-400 font-bold">{total - critical - warning}</span>
            <span className="text-white/30">à temps</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">

        {/* Month nav */}
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="p-2 text-white/40 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-all">
            <ChevronLeft size={15} />
          </button>
          <h2 className="text-base font-bold text-white">
            {MONTHS_FR[month]} {year}
          </h2>
          <button onClick={nextMonth} className="p-2 text-white/40 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-all">
            <ChevronRight size={15} />
          </button>
        </div>

        {view === 'calendar' ? (
          <CalendarGrid
            year={year}
            month={month}
            projects={projects}
            onDayClick={ps => setDayPanel(ps)}
          />
        ) : (
          <div className="space-y-2">
            {upcoming.length === 0 ? (
              <div className="bg-[var(--bg-card)] border border-white/6 rounded-2xl p-10 text-center">
                <CalendarDays size={28} className="mx-auto text-white/15 mb-3" />
                <p className="text-sm text-white/30">Aucune remise ce mois-ci</p>
              </div>
            ) : (
              upcoming.map(p => <ProjectListItem key={p.id} project={p} />)
            )}
          </div>
        )}
      </div>

      {/* Day panel */}
      {dayPanel && (
        <DayPanel projects={dayPanel} onClose={() => setDayPanel(null)} />
      )}
    </div>
  )
}
