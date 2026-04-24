'use client'

import { useState, useRef } from 'react'
import {
  Upload, FileText, Trash2, CheckCircle2, AlertCircle,
  CloudUpload, Loader2, Info, FileCheck, Sparkles, ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface CompanyDocImportProps {
  initialDocName: string | null
}

const TIPS = [
  'Zones géographiques d\'intervention (régions, départements)',
  'Types de projets maîtrisés et références récentes',
  'Certifications détenues (RGE, QualiPV, Qualifelec…)',
  'Capacités techniques et volumétrie mensuelle',
  'Secteurs clients prioritaires et positionnement tarifaire',
  'Points différenciants et arguments commerciaux clés',
]

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
    <div className="space-y-5">

      {/* How it works banner */}
      <div className="flex gap-3 bg-blue-500/8 border border-blue-500/15 rounded-xl p-4">
        <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles size={14} className="text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white/80 mb-1">Mode document — comment ça fonctionne ?</p>
          <p className="text-xs text-white/45 leading-relaxed">
            Importez un PDF ou Word décrivant votre entreprise (capacités, zones, certifications, stratégie…).
            L&apos;IA lira ce document à chaque scoring Go/No Go pour évaluer l&apos;adéquation — en complément ou
            en remplacement du formulaire.
          </p>
        </div>
      </div>

      {/* Current document or drop zone */}
      {docName ? (
        <div className="bg-white/4 border border-emerald-500/20 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
              <FileCheck size={20} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Actif
                </span>
                <span className="text-xs text-white/30">Utilisé pour le scoring IA</span>
              </div>
              <p className="text-sm font-semibold text-white/80 truncate">{docName}</p>
              {success && (
                <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1.5">
                  <CheckCircle2 size={11} />
                  Document importé et extrait avec succès
                </p>
              )}
            </div>
            <button
              onClick={handleDelete}
              className="flex-shrink-0 p-2 text-white/25 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Supprimer le document"
            >
              <Trash2 size={15} />
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-white/6">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 text-xs text-white/35 hover:text-blue-400 transition-colors"
            >
              <Upload size={12} />
              Remplacer par un autre document
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={cn(
            'relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all',
            isDragging
              ? 'border-blue-500/50 bg-blue-500/8'
              : 'border-white/10 bg-white/2 hover:border-blue-500/30 hover:bg-blue-500/5',
            uploading && 'pointer-events-none opacity-60'
          )}
        >
          {uploading ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-blue-500/15 flex items-center justify-center">
                <Loader2 size={28} className="text-blue-400 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white/70">Extraction en cours…</p>
                <p className="text-xs text-white/30 mt-1">Lecture du document par l&apos;IA, veuillez patienter</p>
              </div>
            </>
          ) : (
            <>
              <div className={cn(
                'w-16 h-16 rounded-2xl flex items-center justify-center transition-all',
                isDragging ? 'bg-blue-500/20' : 'bg-white/5'
              )}>
                <CloudUpload size={28} className={cn(
                  'transition-colors',
                  isDragging ? 'text-blue-400' : 'text-white/25'
                )} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white/70">
                  {isDragging ? 'Déposez le fichier ici' : 'Glissez-déposez votre document'}
                </p>
                <p className="text-xs text-white/30 mt-1">ou cliquez pour parcourir — PDF ou Word (.docx) — max 20 Mo</p>
              </div>
              <div className="flex gap-2 mt-1">
                {['PDF', 'DOCX', 'DOC'].map((fmt) => (
                  <span key={fmt} className="text-[10px] font-bold bg-white/5 border border-white/10 text-white/35 px-2.5 py-1 rounded-md tracking-wider">
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
        <div className="flex items-start gap-3 bg-red-500/8 border border-red-500/20 rounded-xl p-4">
          <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Tips card */}
      <div className="bg-white/3 border border-white/6 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={14} className="text-white/30" />
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
            Conseils pour un document efficace
          </p>
        </div>
        <ul className="space-y-2.5">
          {TIPS.map((tip) => (
            <li key={tip} className="flex items-start gap-2.5 text-xs text-white/45 leading-relaxed">
              <div className="w-1 h-1 rounded-full bg-blue-500/50 flex-shrink-0 mt-1.5" />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Privacy note */}
      <div className="flex items-start gap-2.5 px-1">
        <Info size={12} className="text-white/20 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-white/20 leading-relaxed">
          Votre document est stocké chiffré sur nos serveurs européens et n&apos;est utilisé que pour
          générer vos scores Go/No Go personnalisés. Il n&apos;est jamais partagé.
        </p>
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
