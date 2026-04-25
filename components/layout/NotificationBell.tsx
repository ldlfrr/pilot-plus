'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { Bell, Flame, AlertTriangle, Clock, X, Calendar, CheckCheck, FolderOpen, Users, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useRouter } from 'next/navigation'
import type { DeadlineNotification } from '@/app/api/notifications/route'

// ─── Deadline notifications (existing) ────────────────────────────────────────

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

// ─── Invitation notifications ─────────────────────────────────────────────────

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

const ROLE_SHORT: Record<string, string> = {
  editor: 'Éditeur', viewer: 'Lecteur', avant_vente: 'AV', member: 'Membre', admin: 'Admin',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationBell() {
  const router = useRouter()
  const ref    = useRef<HTMLDivElement>(null)

  // Deadline notifs
  const [deadlines,  setDeadlines]  = useState<DeadlineNotification[]>([])
  const [dismissed,  setDismissed]  = useState<Set<string>>(new Set())
  const [dlLoaded,   setDlLoaded]   = useState(false)

  // Invitation notifs
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [acting,      setActing]      = useState<string | null>(null)

  const [open, setOpen]   = useState(false)
  const [tab,  setTab]    = useState<'invitations' | 'deadlines'>('invitations')

  // Load everything
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

  // Poll invitations every 20s
  useEffect(() => {
    const id = setInterval(() => {
      fetch('/api/invitations')
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setInvitations(d.invitations ?? []) })
        .catch(() => {})
    }, 20_000)
    return () => clearInterval(id)
  }, [])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Open to invitations tab when there are new invites
  useEffect(() => {
    if (invitations.length > 0) setTab('invitations')
    else setTab('deadlines')
  }, [invitations.length])

  // Deadline helpers
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

  const urgencyIcon = (u: DeadlineNotification['urgency']) =>
    u === 'critical' ? <Flame size={13} className="text-red-400 flex-shrink-0" />
    : u === 'high'   ? <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />
    :                  <Clock size={13} className="text-blue-400 flex-shrink-0" />

  const urgencyBg = (u: DeadlineNotification['urgency']) =>
    u === 'critical' ? 'border-l-red-500/60' : u === 'high' ? 'border-l-amber-500/60' : 'border-l-blue-500/40'

  // Accept / decline invitation
  async function handleInviteAction(token: string, action: 'accept' | 'decline') {
    setActing(token)
    try {
      const res = await fetch(`/api/invitations/${token}`, {
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

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
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
            invitations.length > 0 ? 'bg-blue-500' : critical > 0 ? 'bg-red-500' : 'bg-amber-500',
          )}>
            {totalCount > 9 ? '9+' : totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--bg-surface)] border border-white/10 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
            <div className="flex items-center gap-2">
              <Bell size={13} className="text-white/40" />
              <span className="text-sm font-semibold text-white">Notifications</span>
              {totalCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/8 text-white/50 font-bold tabular-nums">{totalCount}</span>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="p-1 text-white/25 hover:text-white/60 transition-colors">
              <X size={13} />
            </button>
          </div>

          {/* Tabs */}
          {(invitations.length > 0 || activeDeadlines.length > 0) && (
            <div className="flex border-b border-white/6">
              {invitations.length > 0 && (
                <button
                  onClick={() => setTab('invitations')}
                  className={cn('flex-1 text-xs py-2 font-semibold transition-colors', tab === 'invitations' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-white/35 hover:text-white/60')}
                >
                  Invitations {invitations.length > 0 && <span className="ml-1 bg-blue-500/20 text-blue-400 px-1 py-0.5 rounded-full text-[9px]">{invitations.length}</span>}
                </button>
              )}
              {activeDeadlines.length > 0 && (
                <button
                  onClick={() => setTab('deadlines')}
                  className={cn('flex-1 text-xs py-2 font-semibold transition-colors', tab === 'deadlines' ? 'text-amber-400 border-b-2 border-amber-500' : 'text-white/35 hover:text-white/60')}
                >
                  Échéances {critical > 0 && <span className="ml-1 bg-red-500/20 text-red-400 px-1 py-0.5 rounded-full text-[9px]">{activeDeadlines.length}</span>}
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="max-h-72 overflow-y-auto">

            {/* Invitations tab */}
            {tab === 'invitations' && (
              invitations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Bell size={16} className="text-white/20" />
                  <p className="text-xs text-white/30">Aucune invitation en attente</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {invitations.map(inv => {
                    const isProject = inv.type === 'project'
                    const Icon = isProject ? FolderOpen : Users
                    const isActing = acting === inv.token
                    return (
                      <div key={inv.id} className="px-4 py-3.5">
                        <div className="flex items-start gap-2.5 mb-3">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Icon size={12} className="text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white/85 truncate">
                              {isProject ? inv.project_name : inv.team_name}
                            </p>
                            <p className="text-[11px] text-white/35 mt-0.5 leading-tight">
                              <span className="text-white/50">{inv.inviter_name ?? 'Quelqu\'un'}</span>
                              {' '}vous invite{isProject ? ' sur ce projet' : ' dans l\'équipe'}
                              {inv.role && ` · ${ROLE_SHORT[inv.role] ?? inv.role}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleInviteAction(inv.token, 'accept')}
                            disabled={!!acting}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors"
                          >
                            {isActing ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle size={10} />}
                            Accepter
                          </button>
                          <button
                            onClick={() => handleInviteAction(inv.token, 'decline')}
                            disabled={!!acting}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 text-xs rounded-lg transition-colors"
                          >
                            <XCircle size={10} />
                            Refuser
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            )}

            {/* Deadlines tab */}
            {tab === 'deadlines' && (
              activeDeadlines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Calendar size={16} className="text-white/20" />
                  <p className="text-xs text-white/30 text-center">Aucune échéance dans les 14 prochains jours</p>
                </div>
              ) : (
                <div className="divide-y divide-white/4">
                  {activeDeadlines.map(n => (
                    <div key={notifKey(n)} className="relative group">
                      <Link
                        href={`/projects/${n.projectId}`}
                        onClick={() => setOpen(false)}
                        className={cn('flex items-start gap-3 px-4 py-3 pr-8 hover:bg-white/4 transition-colors border-l-2', urgencyBg(n.urgency))}
                      >
                        <div className="mt-0.5">{urgencyIcon(n.urgency)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white/80 font-medium truncate leading-tight">{n.projectName}</p>
                          <p className="text-xs text-white/35 mt-0.5 truncate">{n.client}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={cn('text-[10px] font-extrabold px-1.5 py-0.5 rounded-md tabular-nums',
                              n.urgency === 'critical' ? 'bg-red-500/20 text-red-300' : n.urgency === 'high' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/15 text-blue-300')}>
                              {n.daysLeft === 0 ? "Aujourd'hui !" : `J-${n.daysLeft}`}
                            </span>
                            <span className="text-[10px] text-white/30">
                              {new Date(n.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>
                      </Link>
                      <button onClick={(e) => dismiss(n, e)} title="Ignorer"
                        className="absolute top-2.5 right-2.5 p-1 rounded-md text-white/0 group-hover:text-white/30 hover:!text-white/70 hover:bg-white/8 transition-all">
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Footer */}
          {tab === 'deadlines' && activeDeadlines.length > 0 && (
            <div className="border-t border-white/6 px-4 py-2.5 flex items-center justify-between">
              <Link href="/accueil" onClick={() => setOpen(false)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">
                Voir toutes les échéances →
              </Link>
              <button onClick={dismissAll} className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition-colors">
                <CheckCheck size={11} />Tout effacer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
