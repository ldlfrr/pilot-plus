'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

export interface DonutData { name: string; value: number; color: string }

const TOOLTIP_STYLE = {
  background: 'var(--bg-hover, #252840)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 8,
  color: '#f1f5f9',
  fontSize: 12,
}

export function DonutChart({ data }: { data: DonutData[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="flex flex-col items-center gap-4">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%"
            innerRadius={52} outerRadius={78}
            paddingAngle={3} dataKey="value" strokeWidth={0}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: number) => [`${value} (${Math.round((value / total) * 100)}%)`, '']}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-3">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="text-xs text-white/50">{d.name} <span className="text-white/80 font-semibold">{d.value}</span></span>
          </div>
        ))}
      </div>
    </div>
  )
}
