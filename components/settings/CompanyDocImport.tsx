'use client'

import { useState, useRef } from 'react'
import {
  Upload, FileText, Trash2, CheckCircle2, AlertCircle,
  CloudUpload, Loader2, Info, FileCheck
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface CompanyDocImportProps {
  initialDocName: string | null
}

export function CompanyDocImport({ initialDocName }: CompanyDocImportProps) {
  const [docName, setDocName]       = useState<string | null>(initialDocName)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [success, setSuccess]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const fileInputRef                = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ]
    if (!allowed.includes(file.type)) {
      setError('Format non supporté. Utilisez un fichier PDF ou Word (.docx).')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('Fichier trop volumineux (max 20 Mo).')
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(false)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/settings/company-document', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur upload')

      setDocName(data.company_document_name)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'import')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete() {
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/settings/company-document', { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Erreur suppression')
      }
      setDocName(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-6">

      {/* Info banner */}
      <div className="flex gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
        <Info size={17} className="text-indigo-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-indigo-800 leading-relaxed">
          <span className="font-semibold block mb-0.5">Comment ça fonctionne ?</span>
          Importez un document Word ou PDF décrivant votre entreprise (capacités, zones d&apos;intervention,
          certifications, stratégie commerciale…). Ce document sera lu par l&apos;IA à chaque scoring
          Go/No Go pour évaluer l&apos;adéquation du projet avec votre profil — en remplacement du formulaire.
        </div>
      </div>

      {/* Current document */}
      {docName ? (
        <div className="bg-white rounded-xl border border-emerald-200 p-5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl flex-shrink-0">
              <FileCheck size={22} className="text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  Actif
                </span>
                <span className="text-xs text-slate-400">Utilisé pour le scoring IA</span>
              </div>
              <p className="text-sm font-semibold text-slate-900 truncate">{docName}</p>
              {success && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  Document importé avec succès
                </p>
              )}
            </div>
            <button
              onClick={handleDelete}
              className="flex-shrink-0 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Supprimer le document"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* Replace option */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors"
            >
              <Upload size={14} />
              Remplacer par un autre document
            </button>
          </div>
        </div>
      ) : (
        /* Drop zone */
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={cn(
            'relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all',
            isDragging
              ? 'border-blue-400 bg-blue-50'
              : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50',
            uploading && 'pointer-events-none opacity-70'
          )}
        >
          {uploading ? (
            <>
              <div className="p-4 bg-blue-100 rounded-full">
                <Loader2 size={28} className="text-blue-600 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Extraction en cours…</p>
                <p className="text-xs text-slate-400 mt-1">Lecture du document, veuillez patienter</p>
              </div>
            </>
          ) : (
            <>
              <div className={cn(
                'p-4 rounded-full transition-colors',
                isDragging ? 'bg-blue-100' : 'bg-slate-100'
              )}>
                <CloudUpload size={28} className={cn(
                  'transition-colors',
                  isDragging ? 'text-blue-600' : 'text-slate-400'
                )} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {isDragging ? 'Déposez le fichier ici' : 'Glissez-déposez ou cliquez pour importer'}
                </p>
                <p className="text-xs text-slate-400 mt-1">PDF ou Word (.docx) — max 20 Mo</p>
              </div>
              <div className="flex gap-3 mt-1">
                {['PDF', 'DOCX', 'DOC'].map((fmt) => (
                  <span key={fmt} className="text-xs bg-white border border-slate-200 text-slate-500 font-medium px-2.5 py-1 rounded-md">
                    {fmt}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Tips */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
        <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">
          Conseils pour un document efficace
        </p>
        <ul className="space-y-2.5">
          {[
            'Zones géographiques d\'intervention (régions, départements)',
            'Types de projets maîtrisés et références récentes',
            'Certifications détenues (RGE, QualiPV, Qualifelec…)',
            'Capacités techniques et volumétrie mensuelle',
            'Secteurs clients prioritaires et positionnement tarifaire',
            'Points différenciants et arguments commerciaux clés',
          ].map((tip) => (
            <li key={tip} className="flex items-start gap-2 text-xs text-slate-500">
              <FileText size={12} className="text-slate-300 flex-shrink-0 mt-0.5" />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
