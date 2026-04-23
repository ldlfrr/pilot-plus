'use client'

import { useEffect, useState } from 'react'
import { Printer, ArrowLeft, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PrintTriggerProps {
  projectId: string
  autoPrint?: boolean
}

/**
 * Barre d'actions flottante sur la page d'export.
 * — masquée à l'impression grâce à la classe `no-print`
 * — déclenche window.print() automatiquement si ?auto=1
 */
export function PrintTrigger({ projectId, autoPrint = false }: PrintTriggerProps) {
  const router = useRouter()
  const [printed, setPrinted] = useState(false)

  useEffect(() => {
    if (!autoPrint || printed) return
    // petite temporisation pour laisser le DOM se peindre
    const t = setTimeout(() => {
      window.print()
      setPrinted(true)
    }, 450)
    return () => clearTimeout(t)
  }, [autoPrint, printed])

  return (
    <div className="no-print fixed top-4 right-4 z-50 flex items-center gap-2 bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2">
      <button
        onClick={() => router.push(`/projects/${projectId}`)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <ArrowLeft size={14} />
        Retour
      </button>
      <div className="w-px h-5 bg-slate-200" />
      <button
        onClick={() => window.print()}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Download size={14} />
        Télécharger le PDF
      </button>
      <button
        onClick={() => window.print()}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
        title="Imprimer"
      >
        <Printer size={14} />
      </button>
    </div>
  )
}
