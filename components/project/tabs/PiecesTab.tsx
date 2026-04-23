'use client'

import { useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { AnalysisResult, TaskStates } from '@/types'

interface Props {
  result: AnalysisResult
  projectId: string
  initialStates: TaskStates
}

// Default DCE pieces when AI hasn't extracted them
const DEFAULT_PIECES = [
  { nom: 'DC1 – Lettre de candidature',       type: 'obligatoire' as const },
  { nom: 'DC2 – Déclaration du candidat',     type: 'obligatoire' as const },
  { nom: 'Mémoire technique',                  type: 'obligatoire' as const },
  { nom: 'Offre financière (BPU + DQE)',       type: 'obligatoire' as const },
  { nom: 'Attestations d\'assurance',          type: 'obligatoire' as const },
  { nom: 'Références clients (5 dernières années)', type: 'obligatoire' as const },
  { nom: 'Planning prévisionnel',              type: 'obligatoire' as const },
  { nom: 'Méthodologie d\'exécution',          type: 'obligatoire' as const },
  { nom: 'Plan de gestion environnementale',  type: 'recommande' as const },
  { nom: 'Certifications ISO / Qualibat',     type: 'recommande' as const },
]

export function PiecesTab({ result, projectId, initialStates }: Props) {
  const pieces = result.pieces_a_fournir?.length ? result.pieces_a_fournir : DEFAULT_PIECES
  const [states, setStates] = useState<Record<string, boolean>>(initialStates.pieces ?? {})
  const [saving, setSaving] = useState(false)

  async function toggle(nom: string) {
    const next = { ...states, [nom]: !states[nom] }
    setStates(next)
    setSaving(true)
    try {
      await fetch(`/api/projects/${projectId}/task-states`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'pieces', key: nom, value: !states[nom] }),
      })
    } finally {
      setSaving(false)
    }
  }

  const obligatoires = pieces.filter(p => p.type === 'obligatoire')
  const recommandes  = pieces.filter(p => p.type === 'recommande')
  const doneCount    = pieces.filter(p => states[p.nom]).length

  return (
    <div className="space-y-4">
      <div className="bg-[#1a1d2e] border border-white/8 rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500/20 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">Pièces à fournir</h3>
          </div>
          <div className="flex items-center gap-2">
            {saving && <span className="text-xs text-white/30 animate-pulse">Sauvegarde...</span>}
            <span className="text-xs font-semibold text-white/40">
              {doneCount}/{pieces.length} prêtes
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-white/10 rounded-full mb-5 overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${pieces.length > 0 ? (doneCount / pieces.length) * 100 : 0}%` }}
          />
        </div>

        {/* Obligatoires */}
        {obligatoires.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-2 px-1">Obligatoires</p>
            <div className="space-y-1">
              {obligatoires.map(({ nom }) => (
                <PieceRow
                  key={nom}
                  nom={nom}
                  type="obligatoire"
                  done={!!states[nom]}
                  onToggle={() => toggle(nom)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recommandées */}
        {recommandes.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-2 px-1">Recommandées</p>
            <div className="space-y-1">
              {recommandes.map(({ nom }) => (
                <PieceRow
                  key={nom}
                  nom={nom}
                  type="recommande"
                  done={!!states[nom]}
                  onToggle={() => toggle(nom)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PieceRow({
  nom, type, done, onToggle,
}: {
  nom: string; type: 'obligatoire' | 'recommande'; done: boolean; onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left',
        done ? 'bg-emerald-900/20 border border-emerald-800/30' : 'hover:bg-white/5 border border-transparent'
      )}
    >
      {done
        ? <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
        : <Circle size={16} className="text-white/20 flex-shrink-0" />
      }
      <span className={cn('flex-1 text-sm', done ? 'text-white/60 line-through' : 'text-white/80')}>
        {nom}
      </span>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={cn(
          'text-[10px] font-bold px-2 py-0.5 rounded-full',
          type === 'obligatoire' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
        )}>
          {type === 'obligatoire' ? 'Obligatoire' : 'Recommandé'}
        </span>
        <span className={cn(
          'text-[10px] font-semibold px-2 py-0.5 rounded-full',
          done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/30'
        )}>
          {done ? '✓ Prêt' : 'À préparer'}
        </span>
      </div>
    </button>
  )
}
