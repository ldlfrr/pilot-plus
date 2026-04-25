'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import {
  Bell, Flame, AlertTriangle, Clock, X, Calendar,
  CheckCheck, FolderOpen, Users, CheckCircle, XCircle,
  Loader2, BellOff, Sparkles, History, CheckCircle2,
  XOctagon, TimerOff,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useRouter } from 'next/navigation'
import type { DeadlineNotification } from '@/app/api/notifications/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LS_KEY      = 'pilot_dismissed_notifs'
const LS_SEEN_KEY = 'pilot_seen_notifs'

function getDismissed(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try { return new Set(JSON.parse(localStorage.getItem(LS_KEY) ?? '[]')) } catch { return new Set() }
}
function saveDismissed(ids: Set<string>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify([...ids])) } catch {}
}
function getSeen(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try { return new Set(JSON.parse(localStorage.getItem(LS_SEEN_KEY) ?? '[]')) } catch { return new Set() }
}
function saveSeen(ids: Set<string>) {
  try { localStorage.setItem(LS_SEEN_KEY, JSON.stringify([...ids])) } catch {}
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
  status:       string
  created_at:   string
}

interface JoinRequest {
  id:         string
  team_id:    string
  team_name:  string
  user_id:    string
  email:      string
  full_name:  string | null
  message:    string | null
  created_at: string
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin', member: 'Membre', viewer: 'Lecteur',
  editor: 'Éditeur', avant_vente: 'Avant-Vente',
}

const URGENCY: Record<string, {
  icon: React.ElementType; textColor: string; bgColor: string
  borderColor: string; barColor: string; badgeBg: string; badgeText: string
}> = {
  critical: {
    icon: Flame,
    textColor: '#f87171', bgColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.20)',
    barColor: '#ef4444', badgeBg: 'rgba(239,68,68,0.15)', badgeText: '#fca5a5',
  },
  high: {
    icon: AlertTriangle,
    textColor: '#fbbf24', bgColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.20)',
    barColor: '#f59e0b', badgeBg: 'rgba(245,158,11,0.15)', badgeText: '#fcd34d',
  },
  medium: {
    icon: Clock,
    textColor: '#60a5fa', bgColor: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.20)',
    barColor: '#3b82f6', badgeBg: 'rgba(59,130,246,0.15)', badgeText: '#93c5fd',
  },
  normal: {
    icon: Clock,
    textColor: '#60a5fa', bgColor: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.20)',
    barColor: '#3b82f6', badgeBg: 'rgba(59,130,246,0.15)', badgeText: '#93c5fd',
  },
}

const STATUS_CFG: Record<string, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  accepted: { icon: CheckCircle2, label: 'Acceptée',  color: '#34d399', bg: 'rgba(16,185,129,0.12)' },
  declined: { icon: XOctagon,     label: 'Refusée',   color: '#f87171', bg: 'rgba(239,68,68,0.10)'  },
  expired:  { icon: TimerOff,     label: 'Expirée',   color: '#6b7280', bg: 'rgba(107,114,128,0.10)' },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(diff / 86_400_000)
  if (d > 30) return `${Math.floor(d / 30)} mois`
  if (d > 0)  return `${d}j`
  if (h > 0)  return `${h}h`
  return 'À l\'instant'
}

// ─── Portal panel ─────────────────────────────────────────────────────────────

function NotifPanel({
  open, onClose, tab, setTab,
  invitations, acting, onInviteAction,
  joinRequests, actingJr, onJoinRequestAction,
  activeDeadlines, dismissedDeadlines,
  onDismiss, onDismissAll,
  history, historyLoading,
}: {
  open:                boolean
  onClose:             () => void
  tab:                 'unread' | 'history'
  setTab:              (t: 'unread' | 'history') => void
  invitations:         Invitation[]
  acting:              string | null
  onInviteAction:      (token: string, action: 'accept' | 'decline') => void
  joinRequests:        JoinRequest[]
  actingJr:            string | null
  onJoinRequestAction: (id: string, action: 'accept' | 'reject') => void
  activeDeadlines:     DeadlineNotification[]
  dismissedDeadlines:  DeadlineNotification[]
  onDismiss:           (n: DeadlineNotification, e: React.MouseEvent) => void
  onDismissAll:        () => void
  history:             Invitation[]
  historyLoading:      boolean
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const unreadCount = invitations.length + activeDeadlines.length + joinRequests.length
  const critical    = activeDeadlines.filter(n => n.urgency === 'critical').length

  const panel = (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          'fixed inset-0 transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        style={{ zIndex: 9998, background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(3px)' }}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed top-[60px] right-4 w-[400px] max-h-[calc(100vh-80px)] flex flex-col rounded-2xl overflow-hidden',
          'transition-all duration-200 ease-out',
          open ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-3 scale-[0.97] pointer-events-none',
        )}
        style={{
          zIndex: 9999,
          background: 'rgba(9,12,24,0.97)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04) inset',
        }}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-5 pt-4 pb-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
                <Bell size={14} className="text-white/60" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-extrabold text-white"
                    style={{ background: invitations.length > 0 ? '#3b82f6' : critical > 0 ? '#ef4444' : '#f59e0b' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">Notifications</p>
                <p className="text-[10px] text-white/30 mt-0.5">
                  {unreadCount === 0 ? 'Tout est à jour' : `${unreadCount} non lu${unreadCount > 1 ? 'e' : ''}${unreadCount > 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {tab === 'unread' && activeDeadlines.length > 0 && (
                <button onClick={onDismissAll}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] text-white/30 hover:text-white/60 hover:bg-white/6 transition-all">
                  <CheckCheck size={11} />Tout lire
                </button>
              )}
              <button onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/25 hover:text-white/70 hover:bg-white/8 transition-all">
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 pb-0">
            {([
              { id: 'unread'  as const, label: 'Non lues',  count: unreadCount  },
              { id: 'history' as const, label: 'Historique', count: null         },
            ]).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all',
                  tab === t.id
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-white/30 hover:text-white/60',
                )}>
                {t.id === 'history' ? <History size={11} /> : <Bell size={11} />}
                {t.label}
                {t.count !== null && t.count > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 tabular-nums">
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>

          {/* ── UNREAD TAB ──────────────────────────────────────────────── */}
          {tab === 'unread' && (
            <>
              {/* Invitations */}
              {/* Join requests — admin only */}
              {joinRequests.length > 0 && (
                <section className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Demandes d&apos;équipe</span>
                    <span className="ml-auto text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.25)' }}>
                      {joinRequests.length}
                    </span>
                  </div>
                  {joinRequests.map(jr => {
                    const name    = jr.full_name ?? jr.email.split('@')[0]
                    const isAct   = actingJr === jr.id
                    const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
                    return (
                      <div key={jr.id} className="rounded-2xl overflow-hidden"
                        style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.07),rgba(99,102,241,0.07))', border: '1px solid rgba(139,92,246,0.22)' }}>
                        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg,#8b5cf6,#6366f1)' }} />
                        <div className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold text-violet-300"
                              style={{ background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.28)' }}>
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white leading-tight truncate">{name}</p>
                              <p className="text-xs text-white/40 truncate">{jr.email}</p>
                              <p className="text-[11px] text-violet-400/70 mt-0.5 flex items-center gap-1">
                                <Users size={9}/>veut rejoindre <strong className="text-violet-300">{jr.team_name}</strong>
                              </p>
                            </div>
                          </div>
                          {jr.message && (
                            <p className="text-xs text-white/45 italic mb-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', borderLeft: '2px solid rgba(139,92,246,0.4)' }}>
                              &ldquo;{jr.message}&rdquo;
                            </p>
                          )}
                          <div className="flex gap-2">
                            <button onClick={() => onJoinRequestAction(jr.id, 'accept')} disabled={!!actingJr}
                              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-40"
                              style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 4px 12px rgba(124,58,237,0.30)' }}>
                              {isAct ? <Loader2 size={12} className="animate-spin"/> : <CheckCircle size={12}/>}Accepter
                            </button>
                            <button onClick={() => onJoinRequestAction(jr.id, 'reject')} disabled={!!actingJr}
                              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white/40 hover:text-white/70 transition-all"
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
                              <XCircle size={12}/>Refuser
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </section>
              )}

              {joinRequests.length > 0 && (invitations.length > 0 || activeDeadlines.length > 0) && (
                <div className="mx-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
              )}

              {invitations.length > 0 && (
                <section className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                      Invitations en attente
                    </span>
                    <span className="ml-auto text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.25)' }}>
                      {invitations.length}
                    </span>
                  </div>
                  {invitations.map(inv => {
                    const isProject = inv.type === 'project'
                    const Icon      = isProject ? FolderOpen : Users
                    const name      = isProject ? inv.project_name : inv.team_name
                    const isActing  = acting === inv.token
                    return (
                      <div key={inv.id} className="rounded-2xl overflow-hidden"
                        style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.06),rgba(99,102,241,0.06))', border: '1px solid rgba(59,130,246,0.20)' }}>
                        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg,#3b82f6,#6366f1)' }} />
                        <div className="p-4">
                          <div className="flex items-start gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)' }}>
                              <Icon size={16} className="text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-bold text-white leading-tight">{name ?? '—'}</p>
                                {inv.role && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                                    style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)', color: '#93c5fd' }}>
                                    {ROLE_LABELS[inv.role] ?? inv.role}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-white/40 mt-0.5">
                                <span className="text-white/25">Invité par</span>{' '}
                                <span className="text-white/60 font-medium">{inv.inviter_name ?? 'Quelqu\'un'}</span>
                                <span className="text-white/20 mx-1">·</span>
                                <span className="text-white/25">{isProject ? 'Projet' : 'Équipe'}</span>
                              </p>
                            </div>
                            <Sparkles size={13} className="text-blue-400/40 flex-shrink-0 mt-0.5" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => onInviteAction(inv.token, 'accept')} disabled={!!acting}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-40 active:scale-[0.98]"
                              style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)', boxShadow: '0 4px 12px rgba(59,130,246,0.30)' }}>
                              {isActing ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                              Accepter
                            </button>
                            <button onClick={() => onInviteAction(inv.token, 'decline')} disabled={!!acting}
                              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white/40 hover:text-white/70 transition-all"
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
                              <XCircle size={12} />Refuser
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </section>
              )}

              {/* Divider */}
              {invitations.length > 0 && activeDeadlines.length > 0 && (
                <div className="mx-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
              )}

              {/* Deadlines */}
              {activeDeadlines.length > 0 && (
                <section className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', critical > 0 ? 'bg-red-400 animate-pulse' : 'bg-amber-400')} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Échéances proches</span>
                    <span className="ml-auto text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-full"
                      style={{
                        background: critical > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                        color: critical > 0 ? '#fca5a5' : '#fcd34d',
                        border: `1px solid ${critical > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`,
                      }}>
                      {activeDeadlines.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {activeDeadlines.map(n => {
                      const uc  = URGENCY[n.urgency] ?? URGENCY.medium
                      const Ico = uc.icon
                      return (
                        <div key={notifKey(n)} className="group relative rounded-xl overflow-hidden transition-all hover:scale-[1.01]"
                          style={{ background: uc.bgColor, border: `1px solid ${uc.borderColor}` }}>
                          <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl" style={{ background: uc.barColor }} />
                          <Link href={`/projects/${n.projectId}`} onClick={onClose}
                            className="flex items-center gap-3 pl-5 pr-4 py-3.5">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <Ico size={14} style={{ color: uc.textColor }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white/90 truncate leading-tight">{n.projectName}</p>
                              <p className="text-[11px] text-white/35 truncate mt-0.5">{n.client}</p>
                            </div>
                            <div className="flex flex-col items-end gap-0.5 flex-shrink-0 mr-1">
                              <span className="text-xs font-black tabular-nums px-2 py-0.5 rounded-lg"
                                style={{ background: uc.badgeBg, color: uc.badgeText }}>
                                {n.daysLeft === 0 ? 'Auj.' : `J-${n.daysLeft}`}
                              </span>
                              <span className="text-[10px] text-white/25">
                                {new Date(n.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                          </Link>
                          <button onClick={e => onDismiss(n, e)}
                            title="Marquer comme lu"
                            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-md flex items-center justify-center text-white/0 group-hover:text-white/30 hover:!text-white/70 hover:bg-white/10 transition-all z-10">
                            <X size={9} />
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  {/* Calendar footer in unread tab */}
                  <Link href="/accueil" onClick={onClose}
                    className="flex items-center gap-1.5 text-xs font-medium text-blue-400/50 hover:text-blue-400 transition-colors pt-1">
                    <Calendar size={11} />Voir le calendrier
                  </Link>
                </section>
              )}

              {/* Empty */}
              {unreadCount === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-4 px-8">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <BellOff size={22} className="text-white/15" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)' }}>
                      <CheckCircle size={11} className="text-emerald-400" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white/40">Tout est à jour</p>
                    <p className="text-xs text-white/20 mt-1">Aucune invitation ni échéance proche</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── HISTORY TAB ─────────────────────────────────────────────── */}
          {tab === 'history' && (
            <section className="p-4 space-y-3">

              {historyLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={18} className="animate-spin text-white/20" />
                </div>
              )}

              {!historyLoading && history.length === 0 && dismissedDeadlines.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <History size={20} className="text-white/15" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white/30">Aucun historique</p>
                    <p className="text-xs text-white/20 mt-1">Les notifications traitées apparaîtront ici</p>
                  </div>
                </div>
              )}

              {/* Past invitations */}
              {!historyLoading && history.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 pb-1">Invitations</p>
                  {history.map(inv => {
                    const isProject = inv.type === 'project'
                    const Icon      = isProject ? FolderOpen : Users
                    const name      = isProject ? inv.project_name : inv.team_name
                    const sc        = STATUS_CFG[inv.status] ?? STATUS_CFG.expired
                    const Sc        = sc.icon
                    return (
                      <div key={inv.id} className="flex items-center gap-3 px-3.5 py-3 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: sc.bg }}>
                          <Icon size={13} style={{ color: sc.color, opacity: 0.7 }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white/60 truncate">{name ?? '—'}</p>
                          <p className="text-[11px] text-white/25 mt-0.5">
                            {isProject ? 'Projet' : 'Équipe'} · {inv.inviter_name ?? '—'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: sc.bg, color: sc.color }}>
                            <Sc size={9} />{sc.label}
                          </span>
                          <span className="text-[10px] text-white/20">{timeAgo(inv.created_at)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Dismissed deadlines */}
              {!historyLoading && dismissedDeadlines.length > 0 && (
                <div className="space-y-2 mt-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 pb-1">Échéances lues</p>
                  {dismissedDeadlines.map(n => {
                    const uc  = URGENCY[n.urgency] ?? URGENCY.medium
                    const Ico = uc.icon
                    return (
                      <Link key={notifKey(n)} href={`/projects/${n.projectId}`} onClick={onClose}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors hover:bg-white/3"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 opacity-50"
                          style={{ background: uc.bgColor }}>
                          <Ico size={12} style={{ color: uc.textColor }} />
                        </div>
                        <div className="flex-1 min-w-0 opacity-50">
                          <p className="text-xs font-medium text-white/70 truncate">{n.projectName}</p>
                          <p className="text-[10px] text-white/30 truncate">{n.client}</p>
                        </div>
                        <span className="text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded opacity-40"
                          style={{ background: uc.badgeBg, color: uc.badgeText }}>
                          {n.daysLeft === 0 ? 'Auj.' : `J-${n.daysLeft}`}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </>
  )

  return createPortal(panel, document.body)
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NotificationBell() {
  const router = useRouter()

  const [deadlines,          setDeadlines]          = useState<DeadlineNotification[]>([])
  const [dismissed,          setDismissed]          = useState<Set<string>>(new Set())
  const [seen,               setSeen]               = useState<Set<string>>(new Set())
  const [dlLoaded,           setDlLoaded]           = useState(false)
  const [invitations,        setInvitations]        = useState<Invitation[]>([])
  const [joinRequests,       setJoinRequests]       = useState<JoinRequest[]>([])
  const [actingJr,           setActingJr]           = useState<string | null>(null)
  const [acting,             setActing]             = useState<string | null>(null)
  const [open,               setOpen]               = useState(false)
  const [tab,                setTab]                = useState<'unread' | 'history'>('unread')
  const [history,            setHistory]            = useState<Invitation[]>([])
  const [historyLoading,     setHistoryLoading]     = useState(false)
  const [historyLoaded,      setHistoryLoaded]      = useState(false)

  // ── Load initial data ──────────────────────────────────────────────────────

  useEffect(() => {
    setDismissed(getDismissed())
    setSeen(getSeen())
    fetch('/api/notifications')
      .then(r => r.json())
      .then(d => { setDeadlines(d.notifications ?? []); setDlLoaded(true) })
      .catch(() => setDlLoaded(true))
    fetch('/api/invitations')
      .then(r => r.ok ? r.json() : { invitations: [] })
      .then(d => setInvitations(d.invitations ?? []))
      .catch(() => {})
    fetch('/api/team/join-request')
      .then(r => r.ok ? r.json() : { requests: [] })
      .then(d => setJoinRequests(d.requests ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      fetch('/api/invitations')
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setInvitations(d.invitations ?? []) })
        .catch(() => {})
      fetch('/api/team/join-request')
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setJoinRequests(d.requests ?? []) })
        .catch(() => {})
    }, 20_000)
    return () => clearInterval(id)
  }, [])

  // ── Load history when switching to history tab ─────────────────────────────

  useEffect(() => {
    if (tab === 'history' && !historyLoaded) {
      setHistoryLoading(true)
      fetch('/api/invitations?history=1')
        .then(r => r.ok ? r.json() : { invitations: [] })
        .then(d => { setHistory(d.invitations ?? []); setHistoryLoaded(true) })
        .catch(() => {})
        .finally(() => setHistoryLoading(false))
    }
  }, [tab, historyLoaded])

  // ── Mark as seen when opening panel ───────────────────────────────────────

  useEffect(() => {
    if (open) {
      const next = new Set(seen)
      invitations.forEach(i => next.add(i.id))
      deadlines.forEach(n => next.add(notifKey(n)))
      setSeen(next)
      saveSeen(next)
    }
  }, [open]) // eslint-disable-line

  // ── Close on Escape ────────────────────────────────────────────────────────

  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // ── Computed ───────────────────────────────────────────────────────────────

  const activeDeadlines    = deadlines.filter(n => !dismissed.has(notifKey(n)))
  const dismissedDeadlines = deadlines.filter(n => dismissed.has(notifKey(n)))
  const critical           = activeDeadlines.filter(n => n.urgency === 'critical').length

  // "New" = not yet seen
  const newInvCount  = invitations.filter(i => !seen.has(i.id)).length
  const newDlCount   = activeDeadlines.filter(n => !seen.has(notifKey(n))).length
  const newJrCount   = joinRequests.filter(r => !seen.has(`jr-${r.id}`)).length
  const badgeCount   = newInvCount + newDlCount + newJrCount
  const totalUnread  = invitations.length + activeDeadlines.length + joinRequests.length

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

  async function handleJoinRequestAction(requestId: string, action: 'accept' | 'reject') {
    setActingJr(requestId)
    try {
      const res = await fetch('/api/team/join-request', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      })
      if (res.ok) {
        setJoinRequests(prev => prev.filter(r => r.id !== requestId))
      }
    } catch { /* silent */ } finally { setActingJr(null) }
  }

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
      setHistoryLoaded(false) // force refresh history
      if (action === 'accept') {
        setOpen(false)
        if (json.type === 'project' && json.projectId) { router.push(`/projects/${json.projectId}`); router.refresh() }
        else if (json.type === 'team') { router.push('/team'); router.refresh() }
      }
    } catch { /* silent */ } finally { setActing(null) }
  }

  const badgeBg = (dlLoaded || invitations.length > 0)
    ? invitations.length > 0 ? '#3b82f6' : critical > 0 ? '#ef4444' : '#f59e0b'
    : '#6b7280'

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'relative p-2 rounded-lg transition-all',
          open ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/8',
        )}
        aria-label="Notifications"
      >
        <Bell size={17} />
        {(dlLoaded || invitations.length > 0) && badgeCount > 0 && (
          <span
            className={cn(
              'absolute top-1 right-1 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-[9px] font-extrabold text-white leading-none px-0.5',
              invitations.length > 0 && 'animate-pulse',
            )}
            style={{ background: badgeBg }}
          >
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      <NotifPanel
        open={open}
        onClose={() => setOpen(false)}
        tab={tab}
        setTab={t => { setTab(t) }}
        invitations={invitations}
        acting={acting}
        onInviteAction={handleInviteAction}
        joinRequests={joinRequests}
        actingJr={actingJr}
        onJoinRequestAction={handleJoinRequestAction}
        activeDeadlines={activeDeadlines}
        dismissedDeadlines={dismissedDeadlines}
        onDismiss={dismiss}
        onDismissAll={dismissAll}
        history={history}
        historyLoading={historyLoading}
      />
    </>
  )
}
