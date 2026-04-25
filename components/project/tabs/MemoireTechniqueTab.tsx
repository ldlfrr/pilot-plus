'use client'

import { useState, useRef } from 'react'
import {
  BookOpen, Cpu, Loader2, Download, Copy, Check, RefreshCw, Pencil, Save, X,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface MemoireTechniqueTabProps {
  projectId:          string
  hasAnalysis:        boolean
  initialText?:       string
  userTier:           string
  onChange?:          (text: string) => void
}

const PRO_TIERS = new Set(['pro', 'enterprise', 'lifetime'])

export function MemoireTechniqueTab({
  projectId,
  hasAnalysis,
  initialText,
  userTier,
  onChange,
}: MemoireTechniqueTabProps) {
  const [text,       setText]       = useState(initialText ?? '')
  const [generating, setGenerating] = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [copied,     setCopied]     = useState(false)
  const [editing,    setEditing]    = useState(false)
  const [editBuf,    setEditBuf]    = useState('')
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const locked = !PRO_TIERS.has(userTier)

  async function handleGenerate() {
    if (locked || !hasAnalysis) return
    setGenerating(true); setError(null)
    try {
      const res  = await fetch(`/api/projects/${projectId}/memoire-technique`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur génération')
      setText(json.memoire_technique)
      onChange?.(json.memoire_technique)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSaveEdit() {
    setSaving(true)
    try {
      await fetch(`/api/projects/${projectId}/pipeline`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ memoire_technique: editBuf }),
      })
      setText(editBuf)
      onChange?.(editBuf)
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `Memoire_Technique_${projectId.slice(0, 8)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  function startEdit() {
    setEditBuf(text)
    setEditing(true)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  // Simple markdown → HTML renderer (minimal)
  function renderMarkdown(md: string) {
    return md
      .replace(/^## (.+)$/gm, '<h2 class="text-sm font-bold text-white/90 mt-5 mb-2">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-xs font-bold text-white/70 mt-3 mb-1">$1</h3>')
      .replace(/^\*\*(.+)\*\*$/gm, '<p class="font-semibold text-white/80">$1</p>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white/90">$1</strong>')
      .replace(/^\- (.+)$/gm, '<li class="ml-4 text-white/60 text-sm">• $1</li>')
      .replace(/\[À COMPLÉTER[^\]]*\]/g, '<span class="text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded text-xs font-semibold">$&</span>')
      .replace(/\[PLACEHOLDER[^\]]*\]/g, '<span class="text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded text-xs font-semibold">$&</span>')
      .replace(/\n\n/g, '<br/><br/>')
  }

  return (
    <div className="max-w-3xl space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen size={16} className="text-blue-400" />
            Mémoire technique IA
          </h2>
          <p className="text-xs text-white/40 mt-0.5">
            Trame de réponse générée par IA — personnalisez avant envoi
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <Check size={12} />Sauvegardé
            </span>
          )}
          {text && !editing && (
            <>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-medium rounded-lg transition-all"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copied ? 'Copié !' : 'Copier'}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-medium rounded-lg transition-all"
              >
                <Download size={12} />
                .md
              </button>
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-medium rounded-lg transition-all"
              >
                <Pencil size={12} />
                Éditer
              </button>
            </>
          )}
          {text && !editing && (
            <button
              onClick={handleGenerate}
              disabled={generating || locked || !hasAnalysis}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white disabled:opacity-40 text-xs font-medium rounded-lg transition-all"
            >
              <RefreshCw size={12} className={generating ? 'animate-spin' : ''} />
              Regénérer
            </button>
          )}
        </div>
      </div>

      {/* Lock banner */}
      {locked && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/8">
          <Cpu size={15} className="text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-400">Plan Pro requis</p>
            <p className="text-xs text-white/40">La génération IA du mémoire est disponible à partir du plan Pro.</p>
          </div>
          <a
            href="/subscription"
            className="ml-auto text-xs font-semibold text-amber-400 underline hover:text-amber-300 flex-shrink-0"
          >
            Upgrader →
          </a>
        </div>
      )}

      {/* No analysis */}
      {!hasAnalysis && !locked && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/4">
          <BookOpen size={15} className="text-white/30 flex-shrink-0" />
          <p className="text-sm text-white/40">Lancez d&apos;abord l&apos;analyse IA du projet.</p>
        </div>
      )}

      {/* Generate CTA — empty state */}
      {!text && hasAnalysis && !locked && !generating && (
        <div className="bg-[var(--bg-card)] border border-white/8 rounded-2xl p-10 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.22)' }}
          >
            <BookOpen size={24} className="text-blue-400" />
          </div>
          <p className="text-sm font-semibold text-white/70 mb-1">Aucun mémoire généré</p>
          <p className="text-xs text-white/30 mb-5 max-w-xs mx-auto">
            L&apos;IA va créer une trame structurée basée sur l&apos;analyse du projet.
          </p>
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Cpu size={14} />
            Générer le mémoire technique
          </button>
        </div>
      )}

      {/* Generating state */}
      {generating && (
        <div className="bg-[var(--bg-card)] border border-blue-500/20 rounded-2xl p-10 text-center">
          <Loader2 size={28} className="animate-spin text-blue-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-white/60">Génération en cours…</p>
          <p className="text-xs text-white/30 mt-1">L&apos;IA rédige votre mémoire technique (30-60s)</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/25 bg-red-500/8 text-sm text-red-400">
          <X size={14} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Edit mode */}
      {editing && (
        <div className="space-y-3">
          <textarea
            ref={textareaRef}
            rows={30}
            value={editBuf}
            onChange={e => setEditBuf(e.target.value)}
            className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 outline-none focus:border-blue-500/40 transition-colors resize-y font-mono leading-relaxed"
            style={{ minHeight: 400 }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Sauvegarder
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white text-xs font-medium rounded-lg transition-colors"
            >
              <X size={12} />Annuler
            </button>
          </div>
        </div>
      )}

      {/* Rendered content */}
      {text && !editing && !generating && (
        <div
          className="bg-[var(--bg-card)] border border-white/8 rounded-2xl px-6 py-5 text-sm text-white/70 leading-relaxed"
          style={{ lineHeight: 1.75 }}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
        />
      )}
    </div>
  )
}
