'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { ActivityDataPoint } from '@/types'

interface ActivityChartProps {
  data: ActivityDataPoint[]
}

export function ActivityChart({ data }: ActivityChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-slate-400">
        Aucune activité à afficher
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorAnalyses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: 'none',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#f8fafc',
          }}
        />
        <Area
          type="monotone"
          dataKey="projects"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#colorProjects)"
          name="Projets"
          dot={false}
          activeDot={{ r: 4, fill: '#3b82f6' }}
        />
        <Area
          type="monotone"
          dataKey="analyses"
          stroke="#8b5cf6"
          strokeWidth={2}
          fill="url(#colorAnalyses)"
          name="Analyses"
          dot={false}
          activeDot={{ r: 4, fill: '#8b5cf6' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
