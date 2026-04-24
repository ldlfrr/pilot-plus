'use client'

export interface FunnelStep { step: string; count: number; pct: number }

const COLORS = [
  { bg: 'bg-blue-600',   text: 'text-blue-300',   bar: '#2563eb' },
  { bg: 'bg-violet-600', text: 'text-violet-300',  bar: '#7c3aed' },
  { bg: 'bg-indigo-600', text: 'text-indigo-300',  bar: '#4338ca' },
  { bg: 'bg-cyan-600',   text: 'text-cyan-300',    bar: '#0891b2' },
  { bg: 'bg-emerald-600',text: 'text-emerald-300', bar: '#059669' },
]

export function FunnelChart({ steps }: { steps: FunnelStep[] }) {
  const max = steps[0]?.count || 1

  return (
    <div className="space-y-2.5">
      {steps.map((s, i) => {
        const c = COLORS[i] ?? COLORS[COLORS.length - 1]
        const barW = max > 0 ? Math.max((s.count / max) * 100, s.count > 0 ? 4 : 0) : 0
        return (
          <div key={s.step} className="flex items-center gap-3">
            {/* Step label */}
            <span className="text-xs text-white/50 w-20 flex-shrink-0 text-right">{s.step}</span>

            {/* Bar */}
            <div className="flex-1 bg-white/5 rounded-full h-7 overflow-hidden relative">
              <div
                className={`h-full rounded-full ${c.bg} flex items-center px-3 transition-all duration-500`}
                style={{ width: `${barW}%`, minWidth: s.count > 0 ? 32 : 0 }}
              >
                {s.count > 0 && (
                  <span className="text-xs font-bold text-white whitespace-nowrap">
                    {s.count}
                  </span>
                )}
              </div>
            </div>

            {/* Pct */}
            <span className={`text-xs font-bold w-10 flex-shrink-0 tabular-nums ${s.pct > 0 ? c.text : 'text-white/20'}`}>
              {s.pct}%
            </span>
          </div>
        )
      })}
    </div>
  )
}
