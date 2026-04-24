'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import {
  Home,
  FolderOpen,
  PlusCircle,
  BarChart3,
  Building2,
  LogOut,
  User,
  CreditCard,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/accueil',      label: 'Accueil',         icon: Home },
  { href: '/projects/new', label: 'Nouveau projet',   icon: PlusCircle },
  { href: '/projects',     label: 'Mes projets',      icon: FolderOpen },
  { href: '/dashboard',    label: 'Dashboard',        icon: BarChart3 },
  { href: '/settings',     label: 'Mon entreprise',   icon: Building2 },
]

const BOTTOM_NAV = [
  { href: '/account',      label: 'Mon compte',       icon: User },
  { href: '/subscription', label: 'Mon abonnement',   icon: CreditCard },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function isActive(href: string) {
    if (href === '/accueil')   return pathname === '/accueil'
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside className={cn(
      'fixed inset-y-0 left-0 w-60 bg-[var(--bg-surface)] border-r border-white/5 flex flex-col z-30',
      'transition-transform duration-150 ease-out',
      'md:translate-x-0',
      open ? 'translate-x-0' : '-translate-x-full'
    )}>

      {/* Logo + tagline */}
      <div className="h-16 flex items-center px-5 border-b border-white/5">
        <div className="flex flex-col gap-0.5">
          <div className="relative h-7 w-28">
            <Image
              src="/logo/pilot-plus.png"
              alt="PILOT+"
              fill
              className="object-contain object-left brightness-0 invert"
              priority
            />
          </div>
          <p className="text-[10px] text-white/30 font-medium tracking-wide pl-0.5">
            Décidez. Exécutez. Gagnez.
          </p>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/20'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon size={16} className="flex-shrink-0" />
              {label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 pb-3 border-t border-white/5 pt-3 space-y-0.5">
        {BOTTOM_NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              isActive(href)
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            )}
          >
            <Icon size={16} className="flex-shrink-0" />
            {label}
          </Link>
        ))}

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-white/30 hover:text-white hover:bg-white/5 transition-all"
        >
          <LogOut size={16} className="flex-shrink-0" />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
