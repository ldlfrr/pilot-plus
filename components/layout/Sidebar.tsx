'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import {
  Home, FolderOpen, PlusCircle, BarChart3, Building2,
  LogOut, User, CreditCard, Radio, HelpCircle, Zap,
  ChevronRight, Settings2, ExternalLink,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { NotificationBell } from './NotificationBell'

// ── Nav definitions ───────────────────────────────────────────────────────────

const MAIN_NAV = [
  { href: '/accueil',  label: 'Accueil',       icon: Home,       shortcut: null },
  { href: '/projects', label: 'Mes projets',    icon: FolderOpen, shortcut: null },
]

const TOOLS_NAV = [
  { href: '/dashboard', label: 'Dashboard',      icon: BarChart3,  badge: null },
  { href: '/veille',    label: 'Veille BOAMP',   icon: Radio,      badge: 'Live' },
  { href: '/settings',  label: 'Mon entreprise', icon: Building2,  badge: null },
]

const BOTTOM_NAV = [
  { href: '/account',      label: 'Mon compte',    icon: User },
  { href: '/subscription', label: 'Abonnement',    icon: CreditCard },
]

// ── Tier helpers ──────────────────────────────────────────────────────────────

const TIER_LABELS: Record<string, string> = {
  free: 'Gratuit', basic: 'Basic', pro: 'Pro', enterprise: 'Entreprise', lifetime: 'Lifetime',
}
const TIER_COLORS: Record<string, string> = {
  free:       'bg-white/8 text-white/40 border-white/10',
  basic:      'bg-blue-500/15 text-blue-400 border-blue-500/25',
  pro:        'bg-blue-600/20 text-blue-300 border-blue-500/35',
  enterprise: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  lifetime:   'bg-amber-500/15 text-amber-400 border-amber-500/25',
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

interface UserInfo {
  initials: string
  name: string
  email: string
  tier: string
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<UserInfo | null>(null)

  // Load user info for the bottom card
  useEffect(() => {
    async function loadUser() {
      try {
        const r = await fetch('/api/user/profile')
        if (!r.ok) return
        const d = await r.json()
        const name: string = d.full_name || d.email?.split('@')[0] || '?'
        const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
        setUser({ initials, name, email: d.email, tier: d.subscription_tier ?? 'free' })
      } catch { /* silent */ }
    }
    loadUser()
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

  return (
    <aside className={cn(
      'fixed inset-y-0 left-0 w-60 bg-[var(--bg-surface)] border-r border-white/5 flex flex-col z-30',
      'transition-transform duration-200 ease-out',
      'md:translate-x-0',
      open ? 'translate-x-0' : '-translate-x-full',
    )}>

      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/5 flex-shrink-0">
        <Link href="/accueil" onClick={onClose} className="flex items-center gap-2.5 group">
          {/* Icon mark */}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-600/30 group-hover:shadow-blue-500/40 transition-shadow">
            <span className="text-white text-[11px] font-black tracking-tighter select-none">P+</span>
          </div>
          {/* Wordmark */}
          <div className="leading-none">
            <p className="text-[13px] font-extrabold text-white tracking-tight leading-none">
              PILOT<span className="text-blue-400">+</span>
            </p>
            <p className="text-[8.5px] text-white/25 font-medium tracking-wider mt-0.5 uppercase">
              Décidez · Exécutez · Gagnez
            </p>
          </div>
        </Link>
        {/* Bell on desktop */}
        <div className="hidden md:block">
          <NotificationBell />
        </div>
      </div>

      {/* ── CTA: Nouveau projet ──────────────────────────────────────────── */}
      <div className="px-3 pt-3">
        <Link
          href="/projects/new"
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-2.5 w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-sm shadow-blue-600/20 hover:shadow-blue-500/30 group"
        >
          <PlusCircle size={15} className="flex-shrink-0" />
          <span>Nouveau projet</span>
          <span className="ml-auto text-[9px] font-medium text-blue-300/60 hidden lg:block group-hover:text-blue-200/60 transition-colors">⌘ N</span>
        </Link>
      </div>

      {/* ── Main nav ──────────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 pt-4 pb-2 space-y-0.5 overflow-y-auto scrollbar-hide">

        {/* Section: Principal */}
        <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 px-2 mb-2">Principal</p>
        {MAIN_NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-600/15'
                  : 'text-white/50 hover:text-white/90 hover:bg-white/5',
              )}
            >
              <Icon size={15} className="flex-shrink-0" />
              <span>{label}</span>
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />}
            </Link>
          )
        })}

        {/* Section: Outils */}
        <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 px-2 pt-4 mb-2">Outils</p>
        {TOOLS_NAV.map(({ href, label, icon: Icon, badge }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-600/15'
                  : 'text-white/50 hover:text-white/90 hover:bg-white/5',
              )}
            >
              <Icon size={15} className="flex-shrink-0" />
              <span>{label}</span>
              {badge && (
                <span className="ml-auto text-[8px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 uppercase tracking-wide animate-pulse">
                  {badge}
                </span>
              )}
              {active && !badge && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />}
            </Link>
          )
        })}

      </nav>

      {/* ── Bottom section ────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-white/5">

        {/* Account + subscription */}
        <div className="px-3 pt-3 pb-1 space-y-0.5">
          {BOTTOM_NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                isActive(href)
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-600/15'
                  : 'text-white/35 hover:text-white/70 hover:bg-white/5',
              )}
            >
              <Icon size={13} className="flex-shrink-0" />
              {label}
              {isActive(href) && <span className="ml-auto w-1 h-1 rounded-full bg-blue-400" />}
            </Link>
          ))}
        </div>

        {/* Help + status row */}
        <div className="px-3 pb-2 flex items-center justify-between">
          <a
            href="mailto:support@pilot-plus.fr"
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] text-white/25 hover:text-white/60 hover:bg-white/5 transition-all"
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
          <div className="mx-3 mb-3 rounded-xl border border-white/8 bg-white/3 overflow-hidden">
            <Link
              href="/account"
              onClick={onClose}
              className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-colors"
            >
              {/* Avatar */}
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-[10px] font-extrabold flex-shrink-0 select-none">
                {user.initials}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white/80 truncate leading-none">{user.name}</p>
                <p className="text-[9px] text-white/30 truncate mt-0.5">{user.email}</p>
              </div>
              {/* Tier badge */}
              <span className={cn('text-[8px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0', TIER_COLORS[user.tier])}>
                {TIER_LABELS[user.tier] ?? user.tier}
              </span>
            </Link>

            {/* Sign out row */}
            <div className="border-t border-white/6 px-1 py-1">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-2.5 py-1.5 w-full rounded-lg text-[11px] font-medium text-white/25 hover:text-white/60 hover:bg-white/5 transition-all"
              >
                <LogOut size={11} className="flex-shrink-0" />
                Déconnexion
                <ChevronRight size={9} className="ml-auto" />
              </button>
            </div>
          </div>
        ) : (
          /* Skeleton while loading */
          <div className="mx-3 mb-3 rounded-xl border border-white/6 bg-white/2 px-3 py-2.5 flex items-center gap-2.5 animate-pulse">
            <div className="w-7 h-7 rounded-full bg-white/8" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2 bg-white/8 rounded w-20" />
              <div className="h-1.5 bg-white/5 rounded w-28" />
            </div>
          </div>
        )}

      </div>
    </aside>
  )
}
