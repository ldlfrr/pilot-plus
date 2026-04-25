'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Bell, Flame, AlertTriangle, Clock, X, Calendar,
  CheckCheck, FolderOpen, Users, CheckCircle, XCircle,
  Loader2, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useRouter } from 'next/navigation'
import type { DeadlineNotification } from '@/app/api/notifications/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LS_KEY = 'pilot_dismissed_notifs'

function getDismissed(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try { return new Set(JSON.parse(localStorage.getItem(LS_KEY) ?? '[]')) }
  catch { return new Set() }
}
function saveDismissed(ids: Set<string>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify([...ids])) } catch {}
}
function notifKey(n: DeadlineNotification) { return `${n.projectId}_${n.deadline}` }

// ─── Types ────────────────────────────────────────────────────────────────────

interface Invitation {
  id:           string
  type:         'project' | 'team'
  project_id:   string | null
  team_id:      string | null
  project_name: string | null
  team_name:    string | null
  inviter_name: string | null
  role:         string
  token:        string
  created_at:   string
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin', member: 'Membre', viewer: 'Lecteur',
  editor: 'Éditeur', avant_vente: 'Avant-Vente',
}

const URGENCY_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; bar: string; label: string; badge: string }> = {
  critical: { icon: Flame,         color: 'text-red-400',   bg: 'bg-red-500/10',   bar: 'bg-red-500',   label: 'Critique', badge: 'bg-red-500/20 text-red-300'   },
  high:     { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', bar: 'bg-amber-400', label: 'Urgent',   badge: 'bg-amber-500/20 text-amber-300' },
  medium:   { icon: Clock,         color: 'text-blue-400',  bg: 'bg-blue-500/10',  bar: 'bg-blue-400',  label: 'À venir',  badge: 'bg-blue-500/20 text-blue-300'   },
  normal:   { icon: Clock,         color: 'text-blue-400',  bg: 'bg-blue-500/10',  bar: 'bg-blue-400',  label: 'À venir',  badge: 'bg-blue-500/20 text-blue-300'   },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationBell() {
  const router = useRouter()
  const ref    = useRef<HTMLDivElement>(null)

  const [deadlines,   setDeadlines]   = useState<DeadlineNotification[]>([])
  const [dismissed,   setDismissed]   = useState<Set<string>>(new Set())
  const [dlLoaded,    setDlLoaded]    = useState(false)
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [acting,      setActing]      = useState<string | null>(null)
  const [open,        setOpen]        = useState(false)

  // ── Load data ──────────────────────────────────────────────────────────────

  useEffect(() => {
    setDismissed(getDismissed())
    fetch('/api/notifications')
      .then(r => r.json())
      .then(d => { setDeadlines(d.notifications ?? []); setDlLoaded(true) })
      .catch(() => setDlLoaded(true))
    fetch('/api/invitations')
      .then(r => r.ok ? r.json() : { invitations: [] })
      .then(d => setInvitations(d.invitations ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      fetch('/api/invitations')
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setInvitations(d.invitations ?? []) })
        .catch(() => {})
    }, 20_000)
    return () => clearInterval(id)
  }, [])

  // ── Outside click ──────────────────────────────────────────────────────────

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Computed ───────────────────────────────────────────────────────────────

  const activeDeadlines = deadlines.filter(n => !dismissed.has(notifKey(n)))
  const critical        = activeDeadlines.filter(n => n.urgency === 'critical').length
  const totalCount      = activeDeadlines.length + invitations.length

  const dismiss = useCallback((n: DeadlineNotification, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    const next = new Set(dismissed); next.add(notifKey(n))
    setDismissed(next); saveDismissed(next)
  }, [dismissed])

  const dismissAll = useCallback(() => {
    const next = new Set(dismissed)
    deadlines.forEach(n => next.add(notifKey(n)))
    setDismissed(next); saveDismissed(next)
  }, [deadlines, dismissed])

  // ── Invitation actions ─────────────────────────────────────────────────────

  async function handleInviteAction(token: string, action: 'accept' | 'decline') {
    setActing(token)
    try {
      const res  = await fetch(`/api/invitations/${token}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setInvitations(prev => prev.filter(i => i.token !== token))
      if (action === 'accept') {
        setOpen(false)
        if (json.type === 'project' && json.projectId) { router.push(`/projects/${json.projectId}`); router.refresh() }
        else if (json.type === 'team') { router.push('/team'); router.refresh() }
      }
    } catch { /* silent */ } finally { setActing(null) }
  }

  // ── Bell badge color ───────────────────────────────────────────────────────

  const badgeColor = invitations.length > 0 ? 'bg-blue-500'
    : critical > 0 ? 'bg-red-500' : 'bg-amber-500'

  return (
    <div ref={ref} className="relative">

      {/* ── Bell button ─────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'relative p-2 rounded-lg transition-all',
          open ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/8',
        )}
        aria-label="Notifications"
      >
        <Bell size={17} />
        {(dlLoaded || invitations.length > 0) && totalCount > 0 && (
          <span className={cn(
            'absolute top-1 right-1 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-[9px] font-extrabold text-white leading-none px-0.5',
            badgeColor,
          )}>
            {totalCount > 9 ? '9+' : totalCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ────────────────────────────────────────────────────── */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[340px] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50"
          style={{ background: 'rgba(13,17,30,0.98)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(20px)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/6 flex items-center justify-center">
                <Bell size={13} className="text-white/50" />
              </div>
              <span className="text-sm font-semibold text-white">Notifications</span>
              {totalCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/8 text-white/50 tabular-nums">
                  {totalCount}
                </span>
              )}
            </div>
            <button onClick={() => setOpen(false)}
              className="w-6 h-6 rounded-md flex items-center justify-center text-white/25 hover:text-white/60 hover:bg-white/8 transition-all">
              <X size={12} />
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">

            {/* ── Invitations section ─────────────────────────────────── */}
            {invitations.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">
                    Invitations
                  </p>
                  <span className="ml-auto text-[10px] font-bold text-blue-400 bg-blue-500/15 px-1.5 py-0.5 rounded-full">
                    {invitations.length}
                  </span>
                </div>

                <div className="px-3 pb-2 space-y-2">
                  {invitations.map(inv => {
                    const isProject = inv.type === 'project'
                    const Icon      = isProject ? FolderOpen : Users
                    const name      = isProject ? inv.project_name : inv.team_name
                    const isActing  = acting === inv.token
                    return (
                      <div key={inv.id} className="rounded-xl p-3.5"
                        style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)' }}>

                        {/* Top row */}
                        <div className="flex items-start gap-2.5 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <Icon size={14} className="text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white leading-tight truncate">{name}</p>
                            <p className="text-[11px] text-white/40 mt-0.5 truncate">
                              Invité par <span className="text-white/60">{inv.inviter_name ?? 'Quelqu\'un'}</span>
                            </p>
                          </div>
                          {inv.role && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)', color: '#93c5fd' }}>
                              {ROLE_LABELS[inv.role] ?? inv.role}
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleInviteAction(inv.token, 'accept')}
                            disabled={!!acting}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-all"
                          >
                            {isActing ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                            Accepter
                          </button>
                          <button
                            onClick={() => handleInviteAction(inv.token, 'decline')}
                            disabled={!!acting}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-white/40 hover:text-white/70 text-xs transition-all"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                          >
                            <XCircle size={11} />
                            Refuser
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Deadlines section ───────────────────────────────────── */}
            {activeDeadlines.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                  <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', critical > 0 ? 'bg-red-400' : 'bg-amber-400')} />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">Échéances</p>
                  <span className={cn(
                    'ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                    critical > 0 ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300',
                  )}>
                    {activeDeadlines.length}
                  </span>
                </div>

                <div className="px-3 pb-3 space-y-1.5">
                  {activeDeadlines.map(n => {
                    const uc  = URGENCY_CONFIG[n.urgency]
                    const Ico = uc.icon
                    return (
                      <div key={notifKey(n)} className="relative group">
                        <Link
                          href={`/projects/${n.projectId}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-3 px-3.5 py-3 rounded-xl hover:bg-white/5 transition-colors"
                          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                        >
                          {/* Urgency bar */}
                          <div className={cn('w-0.5 h-8 rounded-full flex-shrink-0', uc.bar)} />

                          {/* Icon */}
                          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', uc.bg)}>
                            <Ico size={13} className={uc.color} />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white/80 font-medium truncate leading-tight">{n.projectName}</p>
                            <p className="text-[11px] text-white/30 truncate mt-0.5">{n.client}</p>
                          </div>

                          {/* Badge */}
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className={cn('text-[10px] font-extrabold px-1.5 py-0.5 rounded-md tabular-nums', uc.badge)}>
                              {n.daysLeft === 0 ? 'Auj.' : `J-${n.daysLeft}`}
                            </span>
                            <span className="text-[10px] text-white/25">
                              {new Date(n.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>

                          <ChevronRight size={12} className="text-white/15 flex-shrink-0" />
                        </Link>

                        {/* Dismiss */}
                        <button
                          onClick={e => dismiss(n, e)}
                          title="Ignorer"
                          className="absolute top-2 right-2 w-5 h-5 rounded flex items-center justify-center text-white/0 group-hover:text-white/30 hover:!text-white/70 hover:bg-white/10 transition-all z-10"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Empty state ─────────────────────────────────────────── */}
            {totalCount === 0 && (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center">
                  <Bell size={18} className="text-white/20" />
                </div>
                <p className="text-xs text-white/30 font-medium">Tout est à jour</p>
                <p className="text-[11px] text-white/20 text-center px-6">Aucune invitation ni échéance proche</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {activeDeadlines.length > 0 && (
            <div className="border-t border-white/6 px-4 py-2.5 flex items-center justify-between">
              <Link href="/accueil" onClick={() => setOpen(false)}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">
                <Calendar size={11} />Voir le calendrier
              </Link>
              <button onClick={dismissAll}
                className="flex items-center gap-1 text-[10px] text-white/25 hover:text-white/55 transition-colors">
                <CheckCheck size={11} />Tout effacer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
