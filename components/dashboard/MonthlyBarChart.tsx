'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export interface MonthlyPoint { month: string; imported: number; analyzed: number; scored: number }

const TIP = {
  background: 'rgba(10,10,35,0.95)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  color: '#e2e8f0',
  fontSize: 12,
  padding: '8px 12px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
}

const LABEL_MAP: Record<string, string> = {
  imported: 'Importés',
  analyzed: 'Analysés',
  scored:   'Scorés',
}

export function MonthlyBarChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={6} barGap={2}
        margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="month"
          tick={{ fill: 'rgba(255,255,255,0.32)', fontSize: 11 }}
          axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false}
          tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }}
          axisLine={false} tickLine={false} />
        <Tooltip contentStyle={TIP} cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          formatter={(v: number, key: string) => [v, LABEL_MAP[key] ?? key]} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', paddingTop: 14 }}
          formatter={(v: string) => LABEL_MAP[v] ?? v} />
        <Bar dataKey="imported" fill="#3B82F6" radius={[3,3,0,0]}
          style={{ filter: 'drop-shadow(0 0 4px rgba(59,130,246,0.5))' }} />
        <Bar dataKey="analyzed" fill="#7C3AED" radius={[3,3,0,0]}
          style={{ filter: 'drop-shadow(0 0 4px rgba(124,58,237,0.5))' }} />
        <Bar dataKey="scored"   fill="#10B981" radius={[3,3,0,0]}
          style={{ filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.5))' }} />
      </BarChart>
    </ResponsiveContainer>
  )
}
