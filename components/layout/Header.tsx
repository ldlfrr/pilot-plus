import { createClient } from '@/lib/supabase/server'

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
    <header className="h-14 border-b border-white/5 bg-[var(--bg-surface)] flex items-center justify-between px-6 flex-shrink-0">
      <div className="min-w-0">
        <h1 className="text-base font-semibold text-white truncate">{title}</h1>
        {description && (
          <p className="text-xs text-white/40 mt-0.5 truncate">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {action}
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
          {initial}
        </div>
      </div>
    </header>
  )
}
