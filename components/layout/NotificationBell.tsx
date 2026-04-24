'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, Flame, AlertTriangle, Clock, X, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { DeadlineNotification } from '@/app/api/notifications/route'

export function NotificationBell() {
  const [notifications, setNotifications] = useState<DeadlineNotification[]>([])
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(d => {
        setNotifications(d.notifications ?? [])
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const critical = notifications.filter(n => n.urgency === 'critical').length
  const count = notifications.length

  const urgencyIcon = (u: DeadlineNotification['urgency']) =>
    u === 'critical' ? <Flame size={13} className="text-red-400 flex-shrink-0" />
    : u === 'high'   ? <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />
    :                  <Clock size={13} className="text-blue-400 flex-shrink-0" />

  const urgencyBg = (u: DeadlineNotification['urgency']) =>
    u === 'critical' ? 'border-l-red-500/60'
    : u === 'high'   ? 'border-l-amber-500/60'
    :                  'border-l-blue-500/40'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'relative p-2 rounded-lg transition-all',
          open
            ? 'bg-white/10 text-white'
            : 'text-white/40 hover:text-white hover:bg-white/8',
        )}
        aria-label="Notifications"
      >
        <Bell size={17} />
        {loaded && count > 0 && (
          <span className={cn(
            'absolute top-1 right-1 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-[9px] font-extrabold text-white leading-none px-0.5',
            critical > 0 ? 'bg-red-500' : 'bg-amber-500',
          )}>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--bg-surface)] border border-white/10 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
            <div className="flex items-center gap-2">
              <Bell size={13} className="text-white/40" />
              <span className="text-sm font-semibold text-white">Alertes échéances</span>
              {count > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/8 text-white/50 font-bold tabular-nums">
                  {count}
                </span>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="p-1 text-white/25 hover:text-white/60 transition-colors">
              <X size={13} />
            </button>
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <Calendar size={16} className="text-white/20" />
                </div>
                <p className="text-xs text-white/30 text-center">
                  Aucune échéance dans les 14 prochains jours
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/4">
                {notifications.map(n => (
                  <Link
                    key={n.id}
                    href={`/projects/${n.projectId}`}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 hover:bg-white/4 transition-colors border-l-2',
                      urgencyBg(n.urgency),
                    )}
                  >
                    <div className="mt-0.5">{urgencyIcon(n.urgency)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80 font-medium truncate leading-tight">
                        {n.projectName}
                      </p>
                      <p className="text-xs text-white/35 mt-0.5 truncate">{n.client}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={cn(
                          'text-[10px] font-extrabold px-1.5 py-0.5 rounded-md tabular-nums',
                          n.urgency === 'critical' ? 'bg-red-500/20 text-red-300'
                          : n.urgency === 'high'   ? 'bg-amber-500/20 text-amber-300'
                          :                          'bg-blue-500/15 text-blue-300',
                        )}>
                          {n.daysLeft === 0 ? "Aujourd'hui !" : `J-${n.daysLeft}`}
                        </span>
                        <span className="text-[10px] text-white/30">
                          {new Date(n.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-white/6 px-4 py-2.5">
              <Link
                href="/accueil"
                onClick={() => setOpen(false)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                Voir toutes les échéances →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
