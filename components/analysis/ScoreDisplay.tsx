import { cn } from '@/lib/utils/cn'
import type { ProjectScore } from '@/types'

interface ScoreDisplayProps {
  score: ProjectScore
}

const CRITERIA_LABELS: Record<string, string> = {
  rentabilite: 'Rentabilité',
  complexite: 'Complexité',
  alignement_capacite: 'Alignement capacité',
  probabilite_gain: 'Probabilité de gain',
  charge_interne: 'Charge interne',
}

const VERDICT_CONFIG = {
  GO: {
    label: 'GO',
    description: 'Projet à fort potentiel — répondre',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    badge: 'bg-emerald-600',
    bar: 'bg-emerald-500',
  },
  A_ETUDIER: {
    label: 'À ÉTUDIER',
    description: 'Potentiel modéré — analyse approfondie recommandée',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-500',
    bar: 'bg-amber-400',
  },
  NO_GO: {
    label: 'NO GO',
    description: 'Projet non prioritaire — ne pas répondre',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-600',
    bar: 'bg-red-500',
  },
}

function ScoreBar({ value, max = 20, color }: { value: number; max?: number; color: string }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-bold tabular-nums w-8 text-right text-slate-800">
        {value}/20
      </span>
    </div>
  )
}

export function ScoreDisplay({ score }: ScoreDisplayProps) {
  const config = VERDICT_CONFIG[score.verdict]

  return (
    <div className="space-y-5">
      {/* Verdict banner */}
      <div
        className={cn(
          'rounded-xl border p-5 flex items-center justify-between',
          config.bg,
          config.border
        )}
      >
        <div>
          <div
            className={cn(
              'inline-flex items-center px-3 py-1 rounded-full text-sm font-bold text-white mb-2',
              config.badge
            )}
          >
            {config.label}
          </div>
          <p className={cn('text-sm font-medium', config.text)}>{config.description}</p>
        </div>

        {/* Circular score */}
        <div className="flex-shrink-0 text-right">
          <div
            className={cn(
              'text-4xl font-black tabular-nums',
              config.text
            )}
          >
            {score.total_score}
          </div>
          <div className={cn('text-xs font-medium', config.text)}>/ 100</div>
        </div>
      </div>

      {/* Criteria breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h4 className="text-sm font-semibold text-slate-700 mb-4">Détail des critères</h4>
        <div className="space-y-4">
          {Object.entries(score.score_details).map(([key, detail]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-slate-700 font-medium">
                  {CRITERIA_LABELS[key] ?? key}
                </span>
              </div>
              <ScoreBar
                value={detail.score}
                max={20}
                color={config.bar}
              />
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                {detail.justification}
              </p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center">
        Score calculé le {new Date(score.created_at).toLocaleDateString('fr-FR')} à{' '}
        {new Date(score.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  )
}
