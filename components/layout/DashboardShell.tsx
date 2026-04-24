'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sidebar } from './Sidebar'
import { NotificationBell } from './NotificationBell'
import { Menu } from 'lucide-react'


export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar on route change (click link)
  useEffect(() => {
    setSidebarOpen(false)
  }, [])

  return (
    <div className="flex h-screen bg-[var(--bg-base)] overflow-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main className="flex-1 md:ml-60 flex flex-col min-h-0 overflow-y-auto w-full relative">

        {/* Mobile top bar */}
        <div data-print-hide className="md:hidden h-12 flex items-center gap-3 px-4 bg-[var(--bg-surface)] border-b border-white/5 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu size={20} />
          </button>
          {/* Logo mobile */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[9px] font-black tracking-tighter select-none">P+</span>
            </div>
            <span className="text-sm font-extrabold text-white tracking-tight">
              PILOT<span className="text-blue-400">+</span>
            </span>
          </div>
          <div className="ml-auto">
            <NotificationBell />
          </div>
        </div>

        {children}

        {/* Legal footer */}
        <footer data-print-hide className="flex-shrink-0 border-t border-white/4 px-4 md:px-6 py-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          <p className="text-[10px] text-white/15">© {new Date().getFullYear()} Pilot Plus</p>
          <Link href="/mentions-legales"             target="_blank" className="text-[10px] text-white/20 hover:text-white/50 transition-colors">Mentions légales</Link>
          <Link href="/politique-de-confidentialite" target="_blank" className="text-[10px] text-white/20 hover:text-white/50 transition-colors">Confidentialité</Link>
          <Link href="/cgu"                          target="_blank" className="text-[10px] text-white/20 hover:text-white/50 transition-colors">CGU</Link>
          <Link href="/cgv"                          target="_blank" className="text-[10px] text-white/20 hover:text-white/50 transition-colors">CGV</Link>
        </footer>
      </main>
    </div>
  )
}
