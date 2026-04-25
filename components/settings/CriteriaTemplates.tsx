'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import {
  BookMarked, Plus, Trash2, Download, Loader2, CheckCircle,
  AlertCircle, Clock, ChevronRight,
} from 'lucide-react'
import type { CompanyCriteria } from '@/types'

interface CriteriaTemplate {
  id: string
  name: string
  description: string
  criteria: CompanyCriteria
  created_at: string
}

interface CriteriaTemplatesProps {
  currentCriteria: CompanyCriteria
  onLoad: (criteria: CompanyCriteria) => void
}

export function CriteriaTemplates({ currentCriteria, onLoad }: CriteriaTemplatesProps) {
  const [templates, setTemplates]   = useState<CriteriaTemplate[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [loadingId, setLoadingId]   = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError]           = useState<string | null>(null)
  const [success, setSuccess]       = useState<string | null>(null)

  const [showForm, setShowForm]   = useState(false)
  const [newName, setNewName]     = useState('')
  const [newDesc, setNewDesc]     = useState('')

  useEffect(() => {
    fetch('/api/settings/templates')
      .then(r => r.json())
      .then(d => setTemplates(d.templates ?? []))
      .catch(() => setError('Impossible de charger les templates'))
      .finally(() => setLoading(false))
  }, [])

  function flash(msg: string, isError = false) {
    if (isError) { setError(msg); setTimeout(() => setError(null), 4000) }
    else { setSuccess(msg); setTimeout(() => setSuccess(null), 3000) }
  }

  async function handleSave() {
    if (!newName.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/settings/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim(), criteria: currentCriteria }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      setTemplates(prev => [...prev, data.template])
      setNewName(''); setNewDesc(''); setShowForm(false)
      flash('Template sauvegardé !')
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Erreur', true)
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await fetch('/api/settings/templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setTemplates(prev => prev.filter(t => t.id !== id))
      flash('Template supprimé')
    } catch {
      flash('Impossible de supprimer', true)
    } finally { setDeletingId(null) }
  }

  function handleLoad(template: CriteriaTemplate) {
    setLoadingId(template.id)
    onLoad(template.criteria)
    setTimeout(() => {
      setLoadingId(null)
      flash(`Critères "${template.name}" chargés — pensez à sauvegarder`)
    }, 500)
  }

  return (
    <div className="p-5 md:p-8 max-w-2xl space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">Templates de critères</h2>
          <p className="text-xs text-white/40 mt-0.5">
            Sauvegardez plusieurs profils d&apos;entreprise et chargez-les en un clic
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all',
            showForm
              ? 'bg-white/10 text-white/60'
              : 'bg-blue-600 hover:bg-blue-500 text-white',
          )}
        >
          <Plus size={13} />{showForm ? 'Annuler' : 'Nouveau template'}
        </button>
      </div>

      {/* Feedback */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertCircle size={13} />{error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
          <CheckCircle size={13} />{success}
        </div>
      )}

      {/* Save form */}
      {showForm && (
        <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-white/60">
            Enregistrer les critères actuels comme nouveau template
          </p>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Nom du template *"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/8 rounded-lg text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all"
            />
            <input
              type="text"
              placeholder="Description (optionnelle)"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/8 rounded-lg text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !newName.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-all"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <BookMarked size={14} />}
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      )}

      {/* Template list */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={20} className="animate-spin text-white/20" />
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-dashed border-white/10 rounded-xl p-10 text-center">
          <BookMarked size={28} className="mx-auto text-white/15 mb-3" />
          <p className="text-white/35 text-sm">Aucun template enregistré</p>
          <p className="text-white/20 text-xs mt-1">
            Créez un template pour réutiliser vos critères sur d&apos;autres projets
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map(t => (
            <div
              key={t.id}
              className="group flex items-center gap-3 p-4 bg-[var(--bg-card)] border border-white/8 rounded-xl hover:border-white/12 transition-all"
            >
              {/* Icon */}
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                <BookMarked size={15} className="text-blue-400" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white/80">{t.name}</p>
                {t.description && (
                  <p className="text-xs text-white/35 truncate mt-0.5">{t.description}</p>
                )}
                <p className="text-[10px] text-white/20 flex items-center gap-1 mt-1">
                  <Clock size={9} />
                  {new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleLoad(t)}
                  disabled={loadingId === t.id}
                  title="Charger ces critères"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs font-medium rounded-lg transition-all"
                >
                  {loadingId === t.id
                    ? <Loader2 size={11} className="animate-spin" />
                    : <Download size={11} />}
                  Charger
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  disabled={deletingId === t.id}
                  title="Supprimer"
                  className="w-7 h-7 flex items-center justify-center bg-red-500/8 hover:bg-red-500/15 text-red-400/60 hover:text-red-400 rounded-lg transition-all"
                >
                  {deletingId === t.id
                    ? <Loader2 size={11} className="animate-spin" />
                    : <Trash2 size={11} />}
                </button>
              </div>

              <ChevronRight size={12} className="text-white/15 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
