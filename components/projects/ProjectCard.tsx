import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { MapPin, Calendar, FileText, Star } from 'lucide-react'
import type { ProjectWithScore } from '@/types'

const VERDICT_CFG = {
  GO:       { label: 'GO',        bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  A_ETUDIER:{ label: 'A ANALYSER',bg: 'bg-amber-500/20',   text: 'text-amber-400',   border: 'border-amber-500/30' },
  NO_GO:    { label: 'NO GO',     bg: 'bg-red-500/20',     text: 'text-red-400',      border: 'border-red-500/30' },
}

const STATUS_LABELS = { draft: 'Brouillon', analyzed: 'Analysé', scored: 'Scoré' }

interface Props {
  project: ProjectWithScore
}

export function ProjectCard({ project }: Props) {
  const verdict = project.score?.verdict
  const score   = project.score?.total_score
  const cfg     = verdict ? VERDICT_CFG[verdict] : null
  const isFavorite = (score ?? 0) >= 80

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group bg-[var(--bg-card)] border border-white/8 hover:border-blue-500/40 rounded-xl p-4 flex flex-col gap-3 transition-all hover:shadow-lg hover:shadow-blue-500/5"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {isFavorite && <Star size={11} className="text-amber-400 fill-amber-400 flex-shrink-0" />}
            <h3 className="text-sm font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
              {project.name}
            </h3>
          </div>
          <p className="text-xs text-blue-400/80 truncate">{project.client}</p>
        </div>
        {cfg ? (
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5', cfg.bg, cfg.text, cfg.border)}>
            {cfg.label}
          </span>
        ) : (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-white/30 flex-shrink-0 mt-0.5">
            {STATUS_LABELS[project.status]}
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-white/30 flex-wrap">
        {project.location && (
          <span className="flex items-center gap-1"><MapPin size={11} />{project.location}</span>
        )}
        {project.offer_deadline && (
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {new Date(project.offer_deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-white/5 pt-2.5">
        <span className="text-[11px] text-white/30">
          {new Date(project.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <div className="flex items-center gap-3">
          {(project.file_count ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-white/30">
              <FileText size={11} />
              {project.file_count}
            </span>
          )}
          {score !== undefined && score !== null && (
            <span className={cn('text-sm font-extrabold tabular-nums', cfg?.text ?? 'text-white/30')}>
              {score}/100
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
