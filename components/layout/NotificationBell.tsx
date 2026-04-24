'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { Bell, Flame, AlertTriangle, Clock, X, Calendar, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { DeadlineNotification } from '@/app/api/notifications/route'

const LS_KEY = 'pilot_dismissed_notifs'

function getDismissed(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(LS_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function saveDismissed(ids: Set<string>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...ids]))
  } catch {}
}

function notifKey(n: DeadlineNotification) {
  return `${n.projectId}_${n.deadline}`
}

export function NotificationBell() {
  const [all, setAll] = useState<DeadlineNotification[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDismissed(getDismissed())
    fetch('/api/notifications')
      .then(r => r.json())
      .then(d => {
        setAll(d.notifications ?? [])
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

  const notifications = all.filter(n => !dismissed.has(notifKey(n)))

  const dismiss = useCallback((n: DeadlineNotification, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const next = new Set(dismissed)
    next.add(notifKey(n))
    setDismissed(next)
    saveDismissed(next)
  }, [dismissed])

  const dismissAll = useCallback(() => {
    const next = new Set(dismissed)
    all.forEach(n => next.add(notifKey(n)))
    setDismissed(next)
    saveDismissed(next)
  }, [all, dismissed])

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
            <div className="flex items-center gap-1">
              {count > 0 && (
                <button
                  onClick={dismissAll}
                  title="Tout effacer"
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-white/30 hover:text-white/60 hover:bg-white/6 transition-colors font-medium"
                >
                  <CheckCheck size={11} />
                  Tout effacer
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 text-white/25 hover:text-white/60 transition-colors">
                <X size={13} />
              </button>
            </div>
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
                  <div key={notifKey(n)} className="relative group">
                    <Link
                      href={`/projects/${n.projectId}`}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-start gap-3 px-4 py-3 pr-8 hover:bg-white/4 transition-colors border-l-2',
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
                    {/* Per-notification dismiss button */}
                    <button
                      onClick={(e) => dismiss(n, e)}
                      title="Ignorer"
                      className="absolute top-2.5 right-2.5 p-1 rounded-md text-white/0 group-hover:text-white/30 hover:!text-white/70 hover:bg-white/8 transition-all"
                    >
                      <X size={11} />
                    </button>
                  </div>
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
