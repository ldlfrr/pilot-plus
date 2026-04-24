'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ProjectFullView } from '@/components/project/ProjectFullView'
import type { Project, ProjectAnalysis, ProjectScore } from '@/types'
import { Loader2, Printer, X, AlertCircle } from 'lucide-react'

interface ProjectData {
  project: Project
  analyses: ProjectAnalysis[]
  score: ProjectScore | null
}

export default function PrintPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [printed, setPrinted] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Projet introuvable ou accès refusé')
        return r.json()
      })
      .then((d: ProjectData) => {
        setData(d)
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [id])

  // Auto-trigger print after fonts/images have had time to load
  useEffect(() => {
    if (data && !printed) {
      const timer = setTimeout(() => {
        window.print()
        setPrinted(true)
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [data, printed])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white gap-3">
        <Loader2 className="animate-spin text-blue-600" size={28} />
        <p className="text-gray-400 text-sm">Préparation du PDF…</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white gap-3">
        <AlertCircle className="text-red-500" size={28} />
        <p className="text-gray-500">{error ?? 'Erreur de chargement'}</p>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen">

      {/* ── Controls bar (hidden on print) ───────────────────────────── */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-sm font-semibold text-gray-800">{data.project.name}</span>
          <span className="ml-2 text-xs text-gray-400">— Aperçu avant impression</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setPrinted(false); setTimeout(() => window.print(), 100) }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-500 transition-colors shadow"
          >
            <Printer size={14} />
            Imprimer / Enregistrer PDF
          </button>
          <button
            onClick={() => window.close()}
            className="p-2 text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            title="Fermer"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-8 py-10">
        <ProjectFullView
          project={data.project}
          analysis={data.analyses[0] ?? null}
          score={data.score}
          variant="light"
        />
      </div>

    </div>
  )
}
