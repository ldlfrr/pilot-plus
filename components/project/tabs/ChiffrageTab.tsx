'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Calculator, Check, Loader2, Euro, Calendar, FileText, TrendingUp,
  Upload, File, FileSpreadsheet, FileType2, Trash2, Download, AlertCircle, RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { ChiffrageData, ChiffrageStatus } from '@/types'

const STATUSES: { value: ChiffrageStatus; label: string; color: string; bg: string; dot: string }[] = [
  { value: 'a_chiffrer', label: 'À chiffrer',  color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', dot: '#64748b' },
  { value: 'en_cours',   label: 'En cours',    color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  dot: '#f59e0b' },
  { value: 'chiffre',    label: 'Chiffré',     color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  dot: '#3b82f6' },
  { value: 'valide',     label: 'Validé ✓',    color: '#34d399', bg: 'rgba(52,211,153,0.12)',  dot: '#10b981' },
]

interface ProjectFile {
  name:       string
  size:       number
  created_at: string
  mime_type:  string
  url:        string
  path:       string
}

function fileIcon(mime: string) {
  if (mime.includes('pdf'))        return <FileType2 size={15} className="text-red-400"  />
  if (mime.includes('sheet') || mime.includes('csv') || mime.includes('excel')) return <FileSpreadsheet size={15} className="text-emerald-400" />
  return <File size={15} className="text-blue-400" />
}

function fmtSize(bytes: number) {
  if (bytes < 1024)       return `${bytes} o`
  if (bytes < 1048576)    return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / 1048576).toFixed(1)} Mo`
}

interface ChiffrageTabProps {
  projectId: string
  chiffrage: ChiffrageData | null
  onChange:  (updated: ChiffrageData) => void
}

const DEFAULT: ChiffrageData = { status: 'a_chiffrer' }

export function ChiffrageTab({ projectId, chiffrage, onChange }: ChiffrageTabProps) {
  const [data,    setData]    = useState<ChiffrageData>(chiffrage ?? DEFAULT)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [dirty,   setDirty]   = useState(false)

  // Documents
  const [files,        setFiles]        = useState<ProjectFile[]>([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [filesError,   setFilesError]   = useState<string | null>(null)
  const [uploading,    setUploading]    = useState(false)
  const [dragOver,     setDragOver]     = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setData(chiffrage ?? DEFAULT)
    setDirty(false)
  }, [chiffrage])

  const fetchFiles = useCallback(async () => {
    setFilesLoading(true); setFilesError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/files?folder=chiffrage`)
      if (!res.ok) throw new Error('Erreur chargement')
      const json = await res.json()
      setFiles(json.files ?? [])
    } catch (err) {
      setFilesError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setFilesLoading(false)
    }
  }, [projectId])

  useEffect(() => { fetchFiles() }, [fetchFiles])

  function update(patch: Partial<ChiffrageData>) {
    setData(prev => ({ ...prev, ...patch }))
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    const payload: ChiffrageData = { ...data, updated_at: new Date().toISOString() }
    try {
      await fetch(`/api/projects/${projectId}/pipeline`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ chiffrage: payload }),
      })
      onChange(payload)
      setSaved(true)
      setDirty(false)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  async function uploadFiles(fileList: FileList | File[]) {
    const arr = Array.from(fileList)
    if (!arr.length) return
    setUploading(true); setFilesError(null)
    try {
      for (const f of arr) {
        const form = new FormData()
        form.append('file', f)
        form.append('folder', 'chiffrage')
        const res = await fetch(`/api/projects/${projectId}/files`, { method: 'POST', body: form })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          throw new Error((j as { error?: string }).error ?? 'Erreur upload')
        }
      }
      await fetchFiles()
    } catch (err) {
      setFilesError(err instanceof Error ? err.message : 'Erreur upload')
    } finally {
      setUploading(false)
    }
  }

  async function deleteFile(path: string) {
    const encoded = encodeURIComponent(path)
    const res = await fetch(`/api/projects/${projectId}/files?path=${encoded}`, { method: 'DELETE' })
    if (res.ok) setFiles(prev => prev.filter(f => f.path !== path))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files)
  }

  const currentStatus = STATUSES.find(s => s.value === data.status) ?? STATUSES[0]
  const statusIdx     = STATUSES.findIndex(s => s.value === data.status)

  return (
    <div className="max-w-xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calculator size={16} className="text-blue-400" />
            Suivi de chiffrage
          </h2>
          <p className="text-xs text-white/40 mt-0.5">Avancement financier du projet</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <Check size={12} />Sauvegardé
            </span>
          )}
          {dirty && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              Sauvegarder
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-white/50">Progression</p>
          <span className="text-xs font-bold" style={{ color: currentStatus.color }}>
            {currentStatus.label}
          </span>
        </div>
        <div className="flex gap-1.5">
          {STATUSES.map((s, i) => (
            <div
              key={s.value}
              className="h-1.5 flex-1 rounded-full transition-all duration-500"
              style={{ background: i <= statusIdx ? s.dot : 'rgba(255,255,255,0.06)' }}
            />
          ))}
        </div>
      </div>

      {/* Status selector */}
      <div>
        <label className="text-[10px] font-bold text-white/35 uppercase tracking-wider mb-2 block">
          Statut du chiffrage
        </label>
        <div className="grid grid-cols-2 gap-2">
          {STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => update({ status: s.value })}
              className={cn(
                'flex items-center gap-2.5 px-3 py-3 rounded-xl border text-sm font-medium transition-all',
                data.status === s.value ? 'text-white' : 'border-white/8 bg-white/3 text-white/40 hover:text-white/70'
              )}
              style={data.status === s.value ? { background: s.bg, borderColor: s.color + '40', color: s.color } : {}}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.dot }} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="text-[10px] font-bold text-white/35 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Euro size={10} />Montant estimé (€)
        </label>
        <div className="relative">
          <TrendingUp size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            type="number" min="0" step="1000" placeholder="ex : 125 000"
            value={data.montant ?? ''}
            onChange={e => update({ montant: e.target.value ? parseFloat(e.target.value) : undefined })}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/40 transition-colors"
          />
          {data.montant != null && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(data.montant)}
            </span>
          )}
        </div>
      </div>

      {/* Deadline */}
      <div>
        <label className="text-[10px] font-bold text-white/35 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Calendar size={10} />Date limite de chiffrage
        </label>
        <input
          type="date"
          value={data.deadline ?? ''}
          onChange={e => update({ deadline: e.target.value || undefined })}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/40 transition-colors"
          style={{ colorScheme: 'dark' }}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="text-[10px] font-bold text-white/35 uppercase tracking-wider mb-2 flex items-center gap-1">
          <FileText size={10} />Notes & commentaires
        </label>
        <textarea
          rows={3}
          placeholder="Remarques sur le chiffrage, hypothèses, points à clarifier..."
          value={data.notes ?? ''}
          onChange={e => update({ notes: e.target.value || undefined })}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/40 transition-colors resize-none"
        />
      </div>

      {/* ── Documents chiffrage ─────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(8,8,28,0.72)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>

        {/* Section header */}
        <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/28">Documents chiffrage</p>
            <p className="text-[10px] text-white/20 mt-0.5">Chiffrage, mémoire technique — accessibles à toute l'équipe</p>
          </div>
          <button onClick={fetchFiles} disabled={filesLoading}
            className="p-1.5 rounded-lg text-white/20 hover:text-white/50 transition-colors disabled:opacity-30">
            <RefreshCw size={12} className={filesLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Drop zone */}
        <div className="p-4">
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'relative flex flex-col items-center justify-center gap-2 px-6 py-7 rounded-xl border-2 border-dashed cursor-pointer transition-all',
              dragOver
                ? 'border-blue-500/60 bg-blue-500/08'
                : 'border-white/10 hover:border-blue-500/30 hover:bg-white/[0.02]',
            )}>
            {uploading ? (
              <Loader2 size={22} className="text-blue-400 animate-spin" />
            ) : (
              <Upload size={22} className={dragOver ? 'text-blue-400' : 'text-white/20'} />
            )}
            <div className="text-center">
              <p className="text-xs font-semibold text-white/50">
                {uploading ? 'Envoi en cours…' : dragOver ? 'Déposez ici' : 'Cliquez ou déposez vos fichiers'}
              </p>
              <p className="text-[10px] text-white/20 mt-0.5">PDF, Excel, Word, CSV — max 50 Mo</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.png,.jpg,.zip"
              onChange={e => { if (e.target.files) uploadFiles(e.target.files); e.target.value = '' }}
            />
          </div>
        </div>

        {/* Files list */}
        {filesError && (
          <div className="mx-4 mb-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-950/30 border border-red-500/20">
            <AlertCircle size={12} className="text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-400">{filesError}</p>
          </div>
        )}

        {files.length > 0 && (
          <div className="divide-y mx-0 mb-2" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            {files.map(f => (
              <div key={f.path} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors group">
                <div className="flex-shrink-0">{fileIcon(f.mime_type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white/75 truncate">{f.name}</p>
                  <p className="text-[10px] text-white/25 mt-0.5">
                    {fmtSize(f.size)}
                    {f.created_at && ` · ${new Date(f.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {f.url && (
                    <a href={f.url} target="_blank" rel="noopener noreferrer" download={f.name}
                      className="p-1.5 rounded-lg text-white/30 hover:text-blue-400 hover:bg-blue-950/30 transition-all"
                      title="Télécharger">
                      <Download size={13} />
                    </a>
                  )}
                  <button
                    onClick={() => deleteFile(f.path)}
                    className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-950/30 transition-all"
                    title="Supprimer">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!filesLoading && files.length === 0 && !filesError && (
          <p className="px-5 pb-4 text-[10px] text-white/18 text-center">Aucun document déposé</p>
        )}
      </div>

      {/* Last updated */}
      {data.updated_at && (
        <p className="text-[10px] text-white/20">
          Dernière mise à jour : {new Date(data.updated_at).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
          })}
        </p>
      )}
    </div>
  )
}
