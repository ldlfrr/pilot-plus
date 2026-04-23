import { Clock, ChevronRight } from 'lucide-react'
import type { ProjectAnalysis } from '@/types'

interface AnalysisHistoryProps {
  analyses: ProjectAnalysis[]
  currentId: string
  onSelect: (analysis: ProjectAnalysis) => void
}

export function AnalysisHistory({
  analyses,
  currentId,
  onSelect,
}: AnalysisHistoryProps) {
  if (analyses.length <= 1) return null

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={15} className="text-slate-400" />
        <h4 className="text-sm font-semibold text-slate-700">Historique des analyses</h4>
      </div>
      <div className="space-y-1.5">
        {analyses.map((a) => (
          <button
            key={a.id}
            onClick={() => onSelect(a)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              a.id === currentId
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>
              v{a.version} —{' '}
              {new Date(a.created_at).toLocaleDateString('fr-FR')}{' '}
              {new Date(a.created_at).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>{a.model_used}</span>
              <ChevronRight size={13} />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
