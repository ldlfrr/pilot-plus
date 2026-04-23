'use client'

import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from 'recharts'

interface DonutData { name: string; value: number; color: string }

export function DonutChart({ data }: { data: DonutData[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="flex flex-col items-center gap-4">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
            formatter={(value: number) => [`${value} (${Math.round((value / total) * 100)}%)`, '']}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="text-xs text-white/60">{d.name} ({d.value})</span>
          </div>
        ))}
      </div>
    </div>
  )
}
