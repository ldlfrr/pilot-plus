'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'

export interface MonthlyPoint {
  month: string
  imported: number
  analyzed: number
  scored: number
}

const TOOLTIP_STYLE = {
  background: 'var(--bg-hover, #252840)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 8,
  color: '#f1f5f9',
  fontSize: 12,
}

export function MonthlyBarChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={7} barGap={2}
        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: 'rgba(241,245,249,0.4)', fontSize: 11 }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: 'rgba(241,245,249,0.4)', fontSize: 11 }}
          axisLine={false} tickLine={false}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: 'rgba(241,245,249,0.5)', paddingTop: 12 }}
          formatter={(v: string) =>
            v === 'imported' ? 'Importés' : v === 'analyzed' ? 'Analysés' : 'Scorés'
          }
        />
        <Bar dataKey="imported" fill="#3b82f6" radius={[3,3,0,0]} name="imported" />
        <Bar dataKey="analyzed" fill="#8b5cf6" radius={[3,3,0,0]} name="analyzed" />
        <Bar dataKey="scored"   fill="#22c55e" radius={[3,3,0,0]} name="scored"   />
      </BarChart>
    </ResponsiveContainer>
  )
}
