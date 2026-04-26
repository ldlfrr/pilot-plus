'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

export interface DonutData { name: string; value: number; color: string }

const TIP = {
  background: 'rgba(10,10,35,0.95)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 10,
  color: '#e2e8f0',
  fontSize: 12,
  padding: '8px 12px',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
}

export function DonutChart({ data, centerLabel }: { data: DonutData[]; centerLabel?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <ResponsiveContainer width={200} height={180}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%"
              innerRadius={55} outerRadius={80}
              paddingAngle={3} dataKey="value" strokeWidth={0}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color}
                  style={{ filter: `drop-shadow(0 0 8px ${entry.color}55)` }} />
              ))}
            </Pie>
            <Tooltip contentStyle={TIP}
              formatter={(value: number) => [`${value} (${Math.round((value / total) * 100)}%)`, '']}
            />
          </PieChart>
        </ResponsiveContainer>
        {centerLabel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-extrabold text-white tabular-nums"
              style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>
              {centerLabel}
            </span>
            <span className="text-[10px] text-white/35 mt-0.5">/ 100</span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color, boxShadow: `0 0 6px ${d.color}80` }} />
            <span className="text-xs text-white/50">{d.name}</span>
            <span className="text-xs font-bold text-white/80 tabular-nums">{d.value}</span>
            <span className="text-[10px] text-white/25">({Math.round((d.value / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}
