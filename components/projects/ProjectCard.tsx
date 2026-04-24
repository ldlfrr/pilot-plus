import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { MapPin, Calendar, FileText, Star, Trophy, XCircle, X } from 'lucide-react'
import type { ProjectWithScore } from '@/types'

const VERDICT_CFG = {
  GO:       { label: 'GO',        bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  A_ETUDIER:{ label: 'A ANALYSER',bg: 'bg-amber-500/20',   text: 'text-amber-400',   border: 'border-amber-500/30' },
  NO_GO:    { label: 'NO GO',     bg: 'bg-red-500/20',     text: 'text-red-400',      border: 'border-red-500/30' },
}

const STATUS_LABELS = { draft: 'Brouillon', analyzed: 'Analysé', scored: 'Scoré' }

const OUTCOME_CFG = {
  won:      { label: 'Gagné',     icon: Trophy,  bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/25' },
  lost:     { label: 'Perdu',     icon: XCircle, bg: 'bg-red-500/15',     text: 'text-red-400',     border: 'border-red-500/25' },
  abandoned:{ label: 'Abandonné', icon: X,       bg: 'bg-white/5',        text: 'text-white/35',    border: 'border-white/10' },
}

interface Props {
  project: ProjectWithScore
}

export function ProjectCard({ project }: Props) {
  const verdict = project.score?.verdict
  const score   = project.score?.total_score
  const cfg     = verdict ? VERDICT_CFG[verdict] : null
  const isFavorite = (score ?? 0) >= 80

  const isClosed = project.outcome !== 'pending'
  const outcomeCfg = isClosed ? OUTCOME_CFG[project.outcome as keyof typeof OUTCOME_CFG] : null
  const OutcomeIcon = outcomeCfg?.icon

  return (
    <Link
      href={`/projects/${project.id}`}
      className={cn(
        'group relative rounded-xl border p-4 flex flex-col gap-3 transition-all',
        isClosed
          ? 'bg-[var(--bg-card)]/60 border-white/5 hover:border-white/12 opacity-70 hover:opacity-90'
          : 'bg-[var(--bg-card)] border-white/8 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5',
      )}
    >
      {/* Closed overlay stripe */}
      {isClosed && (
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className={cn(
            'absolute top-0 left-0 right-0 h-0.5',
            project.outcome === 'won'      && 'bg-emerald-500/30',
            project.outcome === 'lost'     && 'bg-red-500/30',
            project.outcome === 'abandoned'&& 'bg-white/10',
          )} />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {isFavorite && !isClosed && <Star size={11} className="text-amber-400 fill-amber-400 flex-shrink-0" />}
            <h3 className={cn(
              'text-sm font-semibold truncate transition-colors',
              isClosed
                ? 'text-white/50 group-hover:text-white/70'
                : 'text-white group-hover:text-blue-300',
            )}>
              {project.name}
            </h3>
          </div>
          <p className={cn('text-xs truncate', isClosed ? 'text-white/30' : 'text-blue-400/80')}>
            {project.client}
          </p>
        </div>

        {/* Right badge: outcome > verdict > status */}
        {outcomeCfg && OutcomeIcon ? (
          <span className={cn(
            'flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5',
            outcomeCfg.bg, outcomeCfg.text, outcomeCfg.border,
          )}>
            <OutcomeIcon size={9} />
            {outcomeCfg.label}
          </span>
        ) : cfg ? (
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
      <div className={cn('flex items-center gap-3 text-xs flex-wrap', isClosed ? 'text-white/20' : 'text-white/30')}>
        {project.location && (
          <span className="flex items-center gap-1"><MapPin size={11} />{project.location}</span>
        )}
        {project.offer_deadline && (
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {new Date(project.offer_deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </span>
        )}
        {/* CA if won */}
        {project.outcome === 'won' && project.ca_amount && (
          <span className="text-emerald-400/60 font-semibold">
            {project.ca_amount >= 1000
              ? `${(project.ca_amount / 1000).toFixed(0)}k€`
              : `${project.ca_amount}€`}
          </span>
        )}
        {/* Loss reason if lost */}
        {project.outcome === 'lost' && project.loss_reason && (
          <span className="text-red-400/50 truncate max-w-[120px]">{project.loss_reason}</span>
        )}
      </div>

      {/* Footer */}
      <div className={cn('flex items-center justify-between border-t pt-2.5', isClosed ? 'border-white/4' : 'border-white/5')}>
        <span className={cn('text-[11px]', isClosed ? 'text-white/20' : 'text-white/30')}>
          {new Date(project.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <div className="flex items-center gap-3">
          {(project.file_count ?? 0) > 0 && (
            <span className={cn('flex items-center gap-1 text-[11px]', isClosed ? 'text-white/20' : 'text-white/30')}>
              <FileText size={11} />
              {project.file_count}
            </span>
          )}
          {score !== undefined && score !== null && (
            <span className={cn('text-sm font-extrabold tabular-nums', isClosed ? 'text-white/25' : (cfg?.text ?? 'text-white/30'))}>
              {score}/100
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
