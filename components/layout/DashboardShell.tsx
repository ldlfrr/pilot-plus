'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Menu } from 'lucide-react'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar on route change (click link)
  useEffect(() => {
    setSidebarOpen(false)
  }, [])

  return (
    <div className="flex h-screen bg-[#0f1117] overflow-hidden">

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
      <main className="flex-1 md:ml-60 flex flex-col min-h-0 overflow-y-auto w-full">

        {/* Mobile top bar */}
        <div className="md:hidden h-12 flex items-center gap-3 px-4 bg-[#13161e] border-b border-white/5 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-bold text-white">PILOT+</span>
        </div>

        {children}
      </main>
    </div>
  )
}
