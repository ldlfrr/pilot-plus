'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import {
  FolderKanban, LayoutDashboard, Kanban, CalendarDays,
  Radio, UserSearch, Mail, BarChart3, FileDown,
  Building2, Users, User, CreditCard, HelpCircle,
  LogOut, Plus, ChevronRight, ExternalLink, Sparkles,
  TrendingUp, Zap, Home,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ── Navigation architecture ───────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    id: 'projets',
    label: 'Projets',
    items: [
      { href: '/accueil',    label: 'Accueil',     icon: Home,         sub: 'Vue d\'ensemble'   },
      { href: '/projects',   label: 'Mes projets', icon: FolderKanban, sub: 'Tous vos dossiers' },
      { href: '/pipeline',   label: 'Pipeline',    icon: Kanban,       sub: 'Vue kanban'        },
      { href: '/calendrier', label: 'Calendrier',  icon: CalendarDays, sub: 'Échéances'         },
    ],
  },
  {
    id: 'prospection',
    label: 'Prospection',
    items: [
      { href: '/veille',          label: 'Veille BOAMP',    icon: Radio,       badge: 'Live', badgeColor: 'emerald', sub: 'Marchés publics' },
      { href: '/enrichment',      label: 'Find contacts',   icon: UserSearch,  badge: 'IA',  badgeColor: 'blue',    sub: 'Enrichissement'  },
      { href: '/email-campaigns', label: 'Campagnes email', icon: Mail,        badge: 'IA',  badgeColor: 'blue',    sub: 'Automatisation'  },
    ],
  },
  {
    id: 'analyse',
    label: 'Analyse',
    items: [
      { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, sub: 'Statistiques'  },
      { href: '/export',    label: 'Export',           icon: FileDown,        sub: 'Rapports PDF'  },
    ],
  },
  {
    id: 'configuration',
    label: 'Configuration',
    items: [
      { href: '/settings', label: 'Mon entreprise', icon: Building2, sub: 'Critères & scoring' },
      { href: '/team',     label: 'Équipe',          icon: Users,     sub: 'Membres & rôles'  },
    ],
  },
] as const

const BOTTOM_NAV = [
  { href: '/account',      label: 'Mon compte',   icon: User        },
  { href: '/subscription', label: 'Abonnement',   icon: CreditCard  },
]

// ── Tier config ───────────────────────────────────────────────────────────────

const TIER_CFG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  free:       { label: 'Gratuit',    bg: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.35)', border: 'rgba(255,255,255,0.10)' },
  basic:      { label: 'Basic',      bg: 'rgba(59,130,246,0.15)',  text: '#93c5fd',               border: 'rgba(59,130,246,0.30)'  },
  pro:        { label: 'Pro',        bg: 'rgba(139,92,246,0.18)',  text: '#c4b5fd',               border: 'rgba(139,92,246,0.35)'  },
  enterprise: { label: 'Entreprise', bg: 'rgba(139,92,246,0.18)',  text: '#c4b5fd',               border: 'rgba(139,92,246,0.35)'  },
  lifetime:   { label: 'Lifetime',   bg: 'rgba(245,158,11,0.18)',  text: '#fcd34d',               border: 'rgba(245,158,11,0.35)'  },
}

const BADGE_CFG: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  emerald: { bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.25)', glow: '0 0 6px rgba(16,185,129,0.3)' },
  blue:    { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', border: 'rgba(59,130,246,0.25)', glow: 'none' },
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface SidebarProps { open?: boolean; onClose?: () => void }
interface UserInfo { initials: string; name: string; email: string; tier: string }

// ── Component ─────────────────────────────────────────────────────────────────

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const [user, setUser] = useState<UserInfo | null>(null)

  useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return
        const name: string = d.full_name || d.email?.split('@')[0] || '?'
        const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
        setUser({ initials, name, email: d.email, tier: d.subscription_tier ?? 'free' })
      })
      .catch(() => {})
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function isActive(href: string) {
    if (href === '/accueil')   return pathname === '/accueil'
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/veille')    return pathname.startsWith('/veille')
    return pathname.startsWith(href)
  }

  const tierCfg = TIER_CFG[user?.tier ?? 'free'] ?? TIER_CFG.free

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-20 bg-black/60 md:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex flex-col',
          'transition-transform duration-300 ease-out md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{
          width: '224px',
          background: 'linear-gradient(180deg, #080d1f 0%, #050912 100%)',
          borderRight: '1px solid rgba(255,255,255,0.055)',
        }}
      >

        {/* ── Logo ──────────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 h-[60px] flex items-center px-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <Link href="/projects" onClick={onClose} className="flex items-end gap-2 group">
            <span className="text-[21px] font-black text-white tracking-tight leading-none">
              PILOT<span className="text-blue-400" style={{ textShadow: '0 0 16px rgba(96,165,250,0.7)' }}>+</span>
            </span>
            <span className="text-[8px] font-semibold tracking-[0.15em] uppercase text-white/20 mb-0.5 whitespace-nowrap group-hover:text-white/35 transition-colors">
              Décidez · Gagnez
            </span>
          </Link>
        </div>

        {/* ── CTA Nouveau projet ─────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-3.5 py-3.5">
          <Link
            href="/projects/new"
            onClick={onClose}
            className="flex items-center gap-2.5 px-3.5 py-2.5 w-full rounded-xl text-white text-sm font-bold transition-all group"
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              boxShadow: '0 4px 12px rgba(37,99,235,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
            }}
          >
            <div className="w-5 h-5 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
              <Plus size={12} className="text-white" />
            </div>
            <span className="flex-1">Nouveau projet</span>
            <kbd className="text-[8px] font-medium text-blue-200/40 group-hover:text-blue-200/60 transition-colors hidden lg:block">⌘N</kbd>
          </Link>
        </div>

        {/* ── Main navigation ─────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide px-2 pb-2 space-y-0.5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.id} className="mb-1">

              {/* Section label */}
              <div className="flex items-center gap-2 px-3 py-1.5 mb-0.5">
                <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-white/18 select-none">
                  {section.label}
                </span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              {/* Items */}
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const active = isActive(item.href)
                  const Icon = item.icon
                  const badge = 'badge' in item ? item.badge : undefined
                  const badgeColor = 'badgeColor' in item ? item.badgeColor as string : 'emerald'
                  const sub = 'sub' in item ? item.sub : undefined
                  const bc = badge ? (BADGE_CFG[badgeColor] ?? BADGE_CFG.emerald) : null

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group relative',
                        active ? 'text-white' : 'text-white/42 hover:text-white/80',
                      )}
                      style={active ? {
                        background: 'linear-gradient(135deg, rgba(59,130,246,0.14) 0%, rgba(59,130,246,0.06) 100%)',
                        border: '1px solid rgba(59,130,246,0.18)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 0px rgba(59,130,246,0)',
                      } : {}}
                    >
                      {/* Icon bubble */}
                      <div className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
                        active
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-white/5 text-white/28 group-hover:bg-white/8 group-hover:text-white/55',
                      )}>
                        <Icon size={14} />
                      </div>

                      {/* Label + sub */}
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-[13px] font-semibold leading-tight truncate', active ? 'text-white' : '')}>{item.label}</p>
                        {sub && (
                          <p className={cn('text-[10px] leading-tight truncate mt-0.5', active ? 'text-blue-300/50' : 'text-white/20')}>{sub}</p>
                        )}
                      </div>

                      {/* Badge or active dot */}
                      {bc && badge ? (
                        <span
                          className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0"
                          style={{ background: bc.bg, color: bc.text, border: `1px solid ${bc.border}`, boxShadow: bc.glow }}
                        >
                          {badge}
                        </span>
                      ) : active ? (
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 ml-1"
                          style={{ background: '#60a5fa', boxShadow: '0 0 6px rgba(96,165,250,0.8)' }} />
                      ) : null}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Bottom section ───────────────────────────────────────────────── */}
        <div className="flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>

          {/* Account & subscription */}
          <div className="px-2 pt-2 space-y-0.5">
            {BOTTOM_NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(href)
              return (
                <Link key={href} href={href} onClick={onClose}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all',
                    active ? 'text-blue-300 bg-blue-500/10 border border-blue-500/15' : 'text-white/35 hover:text-white/65 hover:bg-white/5',
                  )}
                >
                  <Icon size={13} className="flex-shrink-0" />
                  {label}
                  {active && <span className="ml-auto w-1 h-1 rounded-full bg-blue-400" />}
                </Link>
              )
            })}
          </div>

          {/* Help + version */}
          <div className="px-2 py-1.5 flex items-center justify-between">
            <a href="mailto:support@pilot-plus.fr"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-white/22 hover:text-white/55 hover:bg-white/5 transition-all">
              <HelpCircle size={11} />Aide & support
            </a>
            <a href="https://pilot-plus.fr/changelog" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[9px] text-white/15 hover:text-white/35 transition-colors px-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              v1.0
            </a>
          </div>

          {/* User card */}
          {user ? (
            <div className="mx-2.5 mb-3 rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02))',
                border: '1px solid rgba(255,255,255,0.07)',
              }}>
              <Link href="/account" onClick={onClose}
                className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/4 transition-colors group">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-extrabold flex-shrink-0 select-none"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', boxShadow: '0 0 10px rgba(59,130,246,0.3)' }}>
                  {user.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-white/80 truncate leading-tight">{user.name}</p>
                  <p className="text-[9px] text-white/28 truncate mt-0.5">{user.email}</p>
                </div>
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: tierCfg.bg, color: tierCfg.text, border: `1px solid ${tierCfg.border}` }}>
                  {tierCfg.label}
                </span>
              </Link>
              {/* Logout */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} className="px-1 py-1">
                <button onClick={handleSignOut}
                  className="flex items-center gap-2 px-2.5 py-1.5 w-full rounded-xl text-[11px] font-medium text-white/25 hover:text-white/60 hover:bg-white/5 transition-all">
                  <LogOut size={11} className="flex-shrink-0" />
                  Déconnexion
                  <ChevronRight size={9} className="ml-auto opacity-40" />
                </button>
              </div>
            </div>
          ) : (
            <div className="mx-2.5 mb-3 rounded-2xl px-3 py-2.5 flex items-center gap-2.5 animate-pulse"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-8 h-8 rounded-full bg-white/8" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2 bg-white/8 rounded w-20" />
                <div className="h-1.5 bg-white/5 rounded w-28" />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
