'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ProjectFullView } from '@/components/project/ProjectFullView'
import type { Project, ProjectAnalysis, ProjectScore } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2, Lock, ExternalLink } from 'lucide-react'

interface ShareData {
  project: Project
  analysis: ProjectAnalysis | null
  score: ProjectScore | null
}

export default function SharePage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<ShareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/share/${token}`)
      .then(r => {
        if (!r.ok) throw new Error('Lien invalide ou expiré')
        return r.json()
      })
      .then((d: ShareData) => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [token])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-base)] gap-3">
        <Loader2 className="animate-spin text-blue-400" size={28} />
        <p className="text-white/30 text-sm">Chargement du projet…</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-base)] gap-3">
        <Lock size={28} className="text-white/20" />
        <p className="text-white/50 text-sm">{error ?? 'Lien invalide ou expiré'}</p>
        <Link href="/login" className="mt-2 text-xs text-blue-400 hover:text-blue-300">
          Accéder à PILOT+ →
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="border-b border-white/5 bg-[var(--bg-surface)] px-4 md:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-6 w-24 flex-shrink-0">
            <Image
              src="/logo/pilot-plus.png"
              alt="PILOT+"
              fill
              className="object-contain object-left brightness-0 invert"
              priority
            />
          </div>
          <span className="text-white/15 hidden sm:block">|</span>
          <span className="text-white/40 text-xs truncate hidden sm:block">
            Partagé en lecture seule
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ExternalLink size={12} />
            Créer mon compte
          </Link>
        </div>
      </div>

      {/* ── Project title bar ────────────────────────────────────────── */}
      <div className="bg-[var(--bg-surface)] border-b border-white/5 px-4 md:px-8 py-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">Projet partagé</p>
          <h1 className="text-lg font-bold text-white">{data.project.name}</h1>
          <p className="text-xs text-white/40 mt-0.5">
            {data.project.client} · {data.project.location}
          </p>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
        <ProjectFullView
          project={data.project}
          analysis={data.analysis}
          score={data.score}
          variant="dark"
        />
      </div>

      {/* ── Footer CTA ───────────────────────────────────────────────── */}
      <div className="border-t border-white/5 bg-[var(--bg-surface)] px-6 py-10 text-center">
        <p className="text-white/30 text-sm mb-1">
          Partagé via <strong className="text-white/50">PILOT+</strong>
        </p>
        <p className="text-white/20 text-xs mb-5">
          Copilot IA pour l&apos;analyse DCE et décision Go/No Go — équipes commerciales solaire
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Essayer PILOT+ gratuitement
        </Link>
      </div>

    </div>
  )
}
