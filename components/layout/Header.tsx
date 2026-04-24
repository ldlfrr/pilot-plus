import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { NotificationBell } from './NotificationBell'

interface HeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export async function Header({ title, description, action }: HeaderProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const initial = user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <header className="h-14 border-b border-white/5 bg-[var(--bg-surface)] flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      <div className="min-w-0">
        <h1 className="text-base font-semibold text-white truncate">{title}</h1>
        {description && (
          <p className="text-xs text-white/40 mt-0.5 truncate">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {action}
        {/* Bell only on desktop (mobile has its own top bar) */}
        <div className="hidden md:block">
          <NotificationBell />
        </div>
        <Link
          href="/account"
          title="Mon compte"
          className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white text-sm font-bold transition-colors"
        >
          {initial}
        </Link>
      </div>
    </header>
  )
}
