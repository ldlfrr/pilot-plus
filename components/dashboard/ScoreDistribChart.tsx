'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export interface ScoreBucket { label: string; count: number; low: number }

function bucketColor(low: number) {
  if (low < 40) return '#ef4444'
  if (low < 60) return '#f59e0b'
  if (low < 75) return '#3b82f6'
  return '#22c55e'
}

const TOOLTIP_STYLE = {
  background: 'var(--bg-hover, #252840)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 8,
  color: '#f1f5f9',
  fontSize: 12,
}

export function ScoreDistribChart({ data }: { data: ScoreBucket[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} barSize={18} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: 'rgba(241,245,249,0.4)', fontSize: 10 }}
          axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fill: 'rgba(241,245,249,0.4)', fontSize: 10 }}
          axisLine={false} tickLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          formatter={(v: number) => [v, 'Projets']} />
        <Bar dataKey="count" radius={[4,4,0,0]}>
          {data.map((d, i) => <Cell key={i} fill={bucketColor(d.low)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
