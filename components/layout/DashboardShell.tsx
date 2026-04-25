'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sidebar } from './Sidebar'
import { NotificationBell } from './NotificationBell'
import { FloatingShapes } from '@/components/ui/FloatingShapes'
import { Menu } from 'lucide-react'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setSidebarOpen(false)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>

      {/* ── Floating micro-shapes ────────────────────────────────────────── */}
      <FloatingShapes />

      {/* ── Animated background orbs ─────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
        {/* Orb 1 — blue top-left */}
        <div
          className="absolute animate-orb-1 gpu"
          style={{
            top: '-10%',
            left: '-5%',
            width: '55vw',
            height: '55vw',
            maxWidth: 800,
            maxHeight: 800,
            borderRadius: '50%',
            background: 'radial-gradient(circle at center, var(--orb-1) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        {/* Orb 2 — purple bottom-right */}
        <div
          className="absolute animate-orb-2 gpu"
          style={{
            bottom: '-15%',
            right: '-10%',
            width: '50vw',
            height: '50vw',
            maxWidth: 700,
            maxHeight: 700,
            borderRadius: '50%',
            background: 'radial-gradient(circle at center, var(--orb-2) 0%, transparent 70%)',
            filter: 'blur(70px)',
          }}
        />
        {/* Orb 3 — cyan center */}
        <div
          className="absolute animate-orb-3 gpu"
          style={{
            top: '35%',
            left: '40%',
            width: '35vw',
            height: '35vw',
            maxWidth: 500,
            maxHeight: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle at center, var(--orb-3) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main className="flex-1 md:ml-60 flex flex-col min-h-0 overflow-y-auto w-full relative z-10">

        {/* Mobile top bar */}
        <div
          data-print-hide
          className="md:hidden h-13 flex items-center gap-3 px-4 flex-shrink-0"
          style={{
            background: 'rgba(8,14,34,0.85)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            height: 52,
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/8 transition-all"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                boxShadow: '0 0 12px rgba(59,130,246,0.4)',
              }}
            >
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
        <footer
          data-print-hide
          className="flex-shrink-0 px-4 md:px-6 py-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          <p className="text-[10px] text-white/15">© {new Date().getFullYear()} Pilot Plus</p>
          {[
            { href: '/mentions-legales',             label: 'Mentions légales' },
            { href: '/politique-de-confidentialite', label: 'Confidentialité' },
            { href: '/cgu',                          label: 'CGU' },
            { href: '/cgv',                          label: 'CGV' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              target="_blank"
              className="text-[10px] text-white/20 hover:text-white/50 transition-colors"
            >
              {label}
            </Link>
          ))}
        </footer>
      </main>
    </div>
  )
}
