import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Layout minimal pour les pages imprimables (/print/*)
 * — pas de sidebar, pas de header applicatif.
 * — protège l'accès : auth requise.
 */
export default async function PrintLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <div className="bg-white text-slate-900 min-h-screen">{children}</div>
}
