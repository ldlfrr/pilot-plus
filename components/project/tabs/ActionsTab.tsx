'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { AnalysisResult, TaskStates } from '@/types'

interface Props {
  result: AnalysisResult
  projectId: string
  initialStates: TaskStates
}

const DEFAULT_ACTIONS = [
  'Répondre à la consultation avant la date limite',
  'Contacter Enedis pour le raccordement',
  'Préparer les références similaires',
  'Planifier la visite de site',
]

export function ActionsTab({ result, projectId, initialStates }: Props) {
  const suggested = result.actions_suggerees?.length ? result.actions_suggerees : DEFAULT_ACTIONS
  const [states, setStates]     = useState<Record<string, boolean>>(initialStates.actions ?? {})
  const [custom, setCustom]     = useState<string[]>([])
  const [newAction, setNewAction] = useState('')
  const [saving, setSaving]     = useState(false)

  const allActions = [...suggested, ...custom]
  const doneCount  = allActions.filter(a => states[a]).length

  async function toggle(action: string) {
    const next = { ...states, [action]: !states[action] }
    setStates(next)
    setSaving(true)
    try {
      await fetch(`/api/projects/${projectId}/task-states`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'actions', key: action, value: !states[action] }),
      })
    } finally {
      setSaving(false)
    }
  }

  function addCustom() {
    const v = newAction.trim()
    if (v && !allActions.includes(v)) {
      setCustom(prev => [...prev, v])
    }
    setNewAction('')
  }

  return (
    <div className="space-y-4">
      <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500/20 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">Actions à mener</h3>
          </div>
          <div className="flex items-center gap-2">
            {saving && <span className="text-xs text-white/30 animate-pulse">Sauvegarde...</span>}
            <span className="text-xs font-semibold text-white/40">
              {doneCount}/{allActions.length} effectuées
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="h-1.5 bg-white/10 rounded-full mb-5 overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${allActions.length > 0 ? (doneCount / allActions.length) * 100 : 0}%` }}
          />
        </div>

        {/* Actions */}
        <div className="space-y-1 mb-5">
          {allActions.map((action) => (
            <div key={action} className="flex items-center gap-2 group">
              <button
                onClick={() => toggle(action)}
                className={cn(
                  'flex-1 flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-left',
                  states[action] ? 'bg-emerald-900/20 border border-emerald-800/30' : 'hover:bg-white/5 border border-transparent'
                )}
              >
                {states[action]
                  ? <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                  : <Circle size={16} className="text-white/20 flex-shrink-0" />
                }
                <span className={cn('text-sm', states[action] ? 'text-white/40 line-through' : 'text-white/80')}>
                  {action}
                </span>
              </button>
              {custom.includes(action) && (
                <button
                  onClick={() => setCustom(prev => prev.filter(a => a !== action))}
                  className="opacity-0 group-hover:opacity-100 p-1 text-white/30 hover:text-red-400 transition-all"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add custom action */}
        <div className="flex gap-2 pt-4 border-t border-white/5">
          <input
            type="text"
            value={newAction}
            onChange={e => setNewAction(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustom()}
            placeholder="Ajouter une action personnalisée..."
            className="flex-1 px-3 py-2 bg-[var(--bg-base)] border border-white/10 rounded-lg text-sm text-white placeholder-white/25 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            onClick={addCustom}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
