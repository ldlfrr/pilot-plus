'use client'

export interface FunnelStep { step: string; count: number; pct: number }

const STEPS = [
  { fill: 'linear-gradient(90deg,#7C3AED,#6D28D9)', glow: 'rgba(124,58,237,0.5)' },
  { fill: 'linear-gradient(90deg,#3B82F6,#2563EB)', glow: 'rgba(59,130,246,0.5)'  },
  { fill: 'linear-gradient(90deg,#06B6D4,#0891B2)', glow: 'rgba(6,182,212,0.5)'   },
  { fill: 'linear-gradient(90deg,#10B981,#059669)', glow: 'rgba(16,185,129,0.5)'  },
  { fill: 'linear-gradient(90deg,#22C55E,#16A34A)', glow: 'rgba(34,197,94,0.5)'   },
]

export function FunnelChart({ steps }: { steps: FunnelStep[] }) {
  const max = steps[0]?.count || 1

  return (
    <div className="space-y-3">
      {steps.map((s, i) => {
        const c    = STEPS[i] ?? STEPS[STEPS.length - 1]
        const barW = max > 0 ? Math.max((s.count / max) * 100, s.count > 0 ? 5 : 0) : 0
        return (
          <div key={s.step} className="flex items-center gap-3 group">
            <span className="text-[11px] text-white/40 w-20 flex-shrink-0 text-right font-medium">{s.step}</span>
            <div className="flex-1 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.05)', height: 28 }}>
              <div className="h-full rounded-full flex items-center px-3 transition-all duration-700"
                style={{
                  width:      `${barW}%`,
                  minWidth:   s.count > 0 ? 40 : 0,
                  background: c.fill,
                  boxShadow:  s.count > 0 ? `0 0 12px ${c.glow}` : 'none',
                }}>
                {s.count > 0 && (
                  <span className="text-xs font-bold text-white/90 whitespace-nowrap tabular-nums">
                    {s.count}
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs font-extrabold w-10 flex-shrink-0 tabular-nums text-right"
              style={{ color: s.pct > 0 ? '#94a3b8' : 'rgba(255,255,255,0.15)' }}>
              {s.pct}%
            </span>
          </div>
        )
      })}
    </div>
  )
}
