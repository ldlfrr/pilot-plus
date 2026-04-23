'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { ProjectFile } from '@/types'

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

interface UploadingFile {
  id: string // local key
  file: File
  status: 'uploading' | 'done' | 'error'
  error?: string
}

interface FileUploadProps {
  projectId: string
  existingFiles: ProjectFile[]
  onFilesChange: (files: ProjectFile[]) => void
}

export function FileUpload({ projectId, existingFiles, onFilesChange }: FileUploadProps) {
  const [dragging, setDragging] = useState(false)
  const [uploadQueue, setUploadQueue] = useState<UploadingFile[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Use a ref to accumulate saved files without stale closure issues
  const savedFilesRef = useRef<ProjectFile[]>(existingFiles)

  // Keep ref in sync whenever parent updates existingFiles
  savedFilesRef.current = existingFiles

  function updateQueueItem(id: string, patch: Partial<UploadingFile>) {
    setUploadQueue((q) => q.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }

  const uploadFile = useCallback(
    async (localId: string, file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        updateQueueItem(localId, {
          status: 'error',
          error: 'Format non supporté (PDF ou DOCX uniquement)',
        })
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        updateQueueItem(localId, {
          status: 'error',
          error: 'Fichier trop volumineux (max 50 Mo)',
        })
        return
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', projectId)

      try {
        const res = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        })

        const text = await res.text()
        let data: { file?: ProjectFile; error?: string } = {}
        try {
          data = text ? JSON.parse(text) : {}
        } catch {
          throw new Error('Réponse serveur invalide')
        }

        if (!res.ok) throw new Error(data.error ?? 'Erreur upload')

        if (data.file) {
          // Accumulate safely via ref — no stale closure
          const next = [...savedFilesRef.current, data.file]
          savedFilesRef.current = next
          onFilesChange(next)
        }

        updateQueueItem(localId, { status: 'done' })
      } catch (err) {
        updateQueueItem(localId, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Erreur inconnue',
        })
      }
    },
    [projectId, onFilesChange]
  )

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return

    const newItems: UploadingFile[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      status: 'uploading',
    }))

    setUploadQueue((q) => [...q, ...newItems])
    newItems.forEach(({ id, file }) => uploadFile(id, file))
  }

  async function deleteFile(fileId: string) {
    const res = await fetch(`/api/files/${fileId}`, { method: 'DELETE' })
    if (res.ok) {
      const next = savedFilesRef.current.filter((f) => f.id !== fileId)
      savedFilesRef.current = next
      onFilesChange(next)
    }
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
          dragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Upload
          size={28}
          className={cn(
            'mx-auto mb-3 transition-colors',
            dragging ? 'text-blue-500' : 'text-slate-300'
          )}
        />
        <p className="text-sm font-medium text-slate-700">
          Glissez vos fichiers ici ou{' '}
          <span className="text-blue-600">cliquez pour parcourir</span>
        </p>
        <p className="text-xs text-slate-400 mt-1">PDF, DOCX — max 50 Mo par fichier</p>
      </div>

      {/* Upload queue — only show in-progress or errored */}
      {uploadQueue.filter((u) => u.status !== 'done').length > 0 && (
        <div className="space-y-2">
          {uploadQueue
            .filter((u) => u.status !== 'done')
            .map(({ id, file, status, error }) => (
              <div
                key={id}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
              >
                <FileText size={16} className="text-slate-400 flex-shrink-0" />
                <span className="text-sm text-slate-700 truncate flex-1">{file.name}</span>
                <span className="text-xs text-slate-400 flex-shrink-0">
                  {(file.size / 1024 / 1024).toFixed(1)} Mo
                </span>
                {status === 'uploading' && (
                  <Loader2 size={16} className="text-blue-500 animate-spin flex-shrink-0" />
                )}
                {status === 'error' && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <AlertCircle size={16} className="text-red-500" />
                    {error && <span className="text-xs text-red-500">{error}</span>}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Saved files */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Fichiers ({existingFiles.length})
          </p>
          {existingFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200"
            >
              <FileText size={16} className="text-blue-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 truncate">{file.filename}</p>
                <p className="text-xs text-slate-400">
                  {(file.file_size / 1024 / 1024).toFixed(1)} Mo ·{' '}
                  {file.extraction_status === 'done'
                    ? 'Texte extrait'
                    : file.extraction_status === 'pending'
                    ? 'En attente d\'extraction'
                    : 'Erreur extraction'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {file.extraction_status === 'done' && (
                  <CheckCircle size={14} className="text-emerald-500" />
                )}
                {file.extraction_status === 'pending' && (
                  <Loader2 size={14} className="text-blue-400 animate-spin" />
                )}
                {file.extraction_status === 'error' && (
                  <AlertCircle size={14} className="text-red-500" />
                )}
                <button
                  onClick={() => deleteFile(file.id)}
                  className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                  title="Supprimer ce fichier"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
