'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export interface ScoreBucket { label: string; count: number; low: number }

function bucketColor(low: number): string {
  if (low < 10) return '#7f1d1d'
  if (low < 40) return '#EF4444'
  if (low < 60) return '#F59E0B'
  if (low < 75) return '#3B82F6'
  return '#10B981'
}

function bucketGlow(low: number): string {
  if (low < 10) return 'rgba(127,29,29,0.6)'
  if (low < 40) return 'rgba(239,68,68,0.6)'
  if (low < 60) return 'rgba(245,158,11,0.6)'
  if (low < 75) return 'rgba(59,130,246,0.6)'
  return 'rgba(16,185,129,0.6)'
}

const TIP = {
  background: 'rgba(10,10,35,0.95)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  color: '#e2e8f0',
  fontSize: 12,
  padding: '8px 12px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
}

export function ScoreDistribChart({ data }: { data: ScoreBucket[] }) {
  // Filter out zero-count buckets if all are 0, otherwise show all
  const hasData = data.some(d => d.count > 0)
  if (!hasData) return null

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} barSize={20} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="label"
          tick={{ fill: 'rgba(255,255,255,0.30)', fontSize: 10 }}
          axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false}
          tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
          axisLine={false} tickLine={false} />
        <Tooltip contentStyle={TIP} cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          formatter={(v: number) => [v, 'Projets']} />
        <Bar dataKey="count" radius={[4,4,0,0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={bucketColor(d.low)}
              style={{ filter: d.count > 0 ? `drop-shadow(0 0 6px ${bucketGlow(d.low)})` : 'none' }} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
