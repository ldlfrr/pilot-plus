'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useRef, useTransition } from 'react'
import { Search, X } from 'lucide-react'

export function ProjectsSearchInput({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()
  const ref = useRef<HTMLInputElement>(null)

  function submit(q: string) {
    const p = new URLSearchParams(params.toString())
    if (q) p.set('q', q)
    else p.delete('q')
    startTransition(() => router.push(`/projects?${p.toString()}`))
  }

  return (
    <div className="relative flex items-center">
      <Search size={13} className="absolute left-3 text-white/30 pointer-events-none" style={{ opacity: pending ? 0.5 : 1 }} />
      <input
        ref={ref}
        type="search"
        defaultValue={defaultValue}
        placeholder="Rechercher un projet..."
        onChange={e => submit(e.target.value)}
        className="w-48 md:w-64 bg-white/5 border border-white/10 rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-blue-500/40 focus:bg-white/8 transition-all"
      />
      {defaultValue && (
        <button
          onClick={() => { if (ref.current) ref.current.value = ''; submit('') }}
          className="absolute right-2.5 text-white/25 hover:text-white/60 transition-colors"
        >
          <X size={11} />
        </button>
      )}
    </div>
  )
}
