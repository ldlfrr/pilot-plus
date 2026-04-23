import { cn } from '@/lib/utils/cn'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: { value: number; label: string }
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple'
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  orange: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  color = 'blue',
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4 hover:shadow-sm transition-shadow">
      <div className={cn('p-2.5 rounded-lg flex-shrink-0', colorMap[color])}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5 tabular-nums">{value}</p>
        {description && (
          <p className="text-xs text-slate-400 mt-1">{description}</p>
        )}
        {trend && (
          <p className={cn('text-xs font-medium mt-1', trend.value >= 0 ? 'text-emerald-600' : 'text-red-500')}>
            {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
          </p>
        )}
      </div>
    </div>
  )
}
