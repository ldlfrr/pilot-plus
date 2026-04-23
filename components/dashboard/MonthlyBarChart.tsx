'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props { data: { month: string; count: number }[] }

export function MonthlyBarChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{ background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
          formatter={(v: number) => [v, 'Projets']}
        />
        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
