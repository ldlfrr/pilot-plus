'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import {
  Home, FolderOpen, PlusCircle, BarChart3, Building2,
  LogOut, User, CreditCard, Radio, HelpCircle,
  ChevronRight, ExternalLink, Users, Mail, UserSearch, FileDown,
  Kanban, CalendarDays,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// ── Nav definitions ───────────────────────────────────────────────────────────

const MAIN_NAV = [
  { href: '/accueil',   label: 'Accueil',     icon: Home      },
  { href: '/projects',  label: 'Mes projets', icon: FolderOpen },
  { href: '/pipeline',  label: 'Pipeline',    icon: Kanban     },
  { href: '/calendrier',label: 'Calendrier',  icon: CalendarDays },
]

const PROSPECTION_NAV = [
  { href: '/veille',          label: 'Veille BOAMP',    icon: Radio,       badge: 'Live' },
  { href: '/enrichment',      label: 'Find contacts',   icon: UserSearch,  badge: 'IA'   },
  { href: '/email-campaigns', label: 'Campagnes email', icon: Mail,        badge: 'IA'   },
]

const ANALYSE_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3, badge: null },
  { href: '/export',    label: 'Export',    icon: FileDown,  badge: null },
]

const CONFIG_NAV = [
  { href: '/settings', label: 'Mon entreprise', icon: Building2, badge: null },
  { href: '/team',     label: 'Équipe',          icon: Users,     badge: null },
]

const BOTTOM_NAV = [
  { href: '/account',      label: 'Mon compte', icon: User },
  { href: '/subscription', label: 'Abonnement', icon: CreditCard },
]

// ── Tier helpers ──────────────────────────────────────────────────────────────

const TIER_LABELS: Record<string, string> = {
  free: 'Gratuit', basic: 'Basic', pro: 'Pro', enterprise: 'Entreprise', lifetime: 'Lifetime',
}
const TIER_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  free:       { bg: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.35)', glow: 'none' },
  basic:      { bg: 'rgba(59,130,246,0.15)',  text: '#93c5fd', glow: '0 0 8px rgba(59,130,246,0.25)' },
  pro:        { bg: 'rgba(139,92,246,0.18)',  text: '#c4b5fd', glow: '0 0 8px rgba(139,92,246,0.30)' },
  enterprise: { bg: 'rgba(139,92,246,0.18)',  text: '#c4b5fd', glow: '0 0 8px rgba(139,92,246,0.30)' },
  lifetime:   { bg: 'rgba(245,158,11,0.18)',  text: '#fcd34d', glow: '0 0 8px rgba(245,158,11,0.35)' },
}

interface SidebarProps { open?: boolean; onClose?: () => void }
interface UserInfo { initials: string; name: string; email: string; tier: string }

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
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

  const tierCfg = TIER_COLORS[user?.tier ?? 'free'] ?? TIER_COLORS.free

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 w-60 flex flex-col z-30',
        'transition-transform duration-250 ease-out',
        'md:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
      style={{
        background: 'linear-gradient(180deg, rgba(8,14,34,0.98) 0%, rgba(5,9,20,0.99) 100%)',
        borderRight: '1px solid rgba(255,255,255,0.055)',
        backdropFilter: 'blur(24px)',
      }}
    >

      {/* ── Logo ────────────────────────────────────────────────────────── */}
      <div
        className="h-16 flex items-center justify-between px-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <Link href="/accueil" onClick={onClose} className="flex flex-col gap-0.5 group">
          <p className="text-[22px] font-extrabold text-white tracking-tight leading-none">
            PILOT<span className="text-blue-400" style={{ textShadow: '0 0 20px rgba(96,165,250,0.6)' }}>+</span>
          </p>
          <p className="text-[9px] text-white/25 font-semibold tracking-[0.14em] uppercase whitespace-nowrap">
            Décidez · Exécutez · Gagnez
          </p>
        </Link>
      </div>

      {/* ── CTA Nouveau projet ───────────────────────────────────────────── */}
      <div className="px-3 pt-3.5">
        <Link
          href="/projects/new"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3.5 py-2.5 w-full rounded-xl text-white text-sm font-semibold transition-all group btn-primary"
        >
          <PlusCircle size={15} className="flex-shrink-0" />
          <span>Nouveau projet</span>
          <span className="ml-auto text-[9px] font-medium text-blue-200/50 hidden lg:block group-hover:text-blue-200/70 transition-colors">⌘ N</span>
        </Link>
      </div>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 pt-4 pb-2 overflow-y-auto scrollbar-hide">

        {/* ── Section renderer ───────────────────────────────────────────── */}
        {([
          { label: 'Principal',    items: MAIN_NAV },
          { label: 'Prospection',  items: PROSPECTION_NAV },
          { label: 'Analyse',      items: ANALYSE_NAV },
          { label: 'Configuration',items: CONFIG_NAV },
        ] as const).map(({ label, items }) => (
          <div key={label} className="mb-4">
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/18 px-2 mb-1.5">{label}</p>
            <div className="space-y-0.5">
              {(items as ReadonlyArray<{ href: string; label: string; icon: React.ElementType; badge?: string | null }>).map(({ href, label: lbl, icon: Icon, badge }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                      active
                        ? 'text-white'
                        : 'text-white/45 hover:text-white/85 hover:bg-white/5',
                    )}
                    style={active ? {
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.06))',
                      border: '1px solid rgba(59,130,246,0.18)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                    } : {}}
                  >
                    <div className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
                      active ? 'bg-blue-500/20 text-blue-400' : 'text-white/35 group-hover:text-white/60',
                    )}>
                      <Icon size={14} />
                    </div>
                    <span>{lbl}</span>
                    {badge ? (
                      <span
                        className="ml-auto text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wide animate-pulse"
                        style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}
                      >
                        {badge}
                      </span>
                    ) : active ? (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--accent)', boxShadow: '0 0 6px rgba(59,130,246,0.8)' }} />
                    ) : null}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Bottom ──────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>

        {/* Account + subscription */}
        <div className="px-3 pt-2.5 pb-1 space-y-0.5">
          {BOTTOM_NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                  active
                    ? 'text-blue-400 bg-blue-500/10'
                    : 'text-white/35 hover:text-white/65 hover:bg-white/5',
                )}
              >
                <Icon size={13} className="flex-shrink-0" />
                {label}
                {active && <span className="ml-auto w-1 h-1 rounded-full bg-blue-400" style={{ boxShadow: '0 0 4px rgba(96,165,250,0.8)' }} />}
              </Link>
            )
          })}
        </div>

        {/* Help row */}
        <div className="px-3 pb-2 flex items-center justify-between">
          <a
            href="mailto:support@pilot-plus.fr"
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] text-white/22 hover:text-white/55 hover:bg-white/5 transition-all"
          >
            <HelpCircle size={12} />
            Aide & support
          </a>
          <a
            href="https://pilot-plus.fr/changelog"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[9px] text-white/15 hover:text-white/35 transition-colors px-1"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            v1.0
            <ExternalLink size={8} />
          </a>
        </div>

        {/* User card */}
        {user ? (
          <div
            className="mx-3 mb-3 rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            <Link
              href="/account"
              onClick={onClose}
              className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/4 transition-colors"
            >
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-extrabold flex-shrink-0 select-none"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
                  boxShadow: '0 0 12px rgba(59,130,246,0.35)',
                }}
              >
                {user.initials}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white/80 truncate leading-none">{user.name}</p>
                <p className="text-[9px] text-white/28 truncate mt-0.5">{user.email}</p>
              </div>
              {/* Tier badge */}
              <span
                className="text-[8px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{
                  background: tierCfg.bg,
                  color: tierCfg.text,
                  boxShadow: tierCfg.glow,
                }}
              >
                {TIER_LABELS[user.tier] ?? user.tier}
              </span>
            </Link>

            {/* Sign out */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} className="px-1 py-1">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-2.5 py-1.5 w-full rounded-xl text-[11px] font-medium text-white/22 hover:text-white/55 hover:bg-white/5 transition-all"
              >
                <LogOut size={11} className="flex-shrink-0" />
                Déconnexion
                <ChevronRight size={9} className="ml-auto opacity-50" />
              </button>
            </div>
          </div>
        ) : (
          <div className="mx-3 mb-3 rounded-2xl px-3 py-2.5 flex items-center gap-2.5 animate-pulse"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-8 h-8 rounded-full skeleton" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2 skeleton rounded w-20" />
              <div className="h-1.5 skeleton rounded w-28" />
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
