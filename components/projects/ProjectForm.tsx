'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import type { Project, CreateProjectPayload } from '@/types'

const CONSULTATION_TYPES = [
  "Appel d'offres public",
  "Appel d'offres privé",
  'Gré à gré',
  'Marché négocié',
  'Consultation restreinte',
  'Autre',
]

interface ProjectFormProps {
  initialData?: Partial<Project>
  mode: 'create' | 'edit'
  projectId?: string
}

const inputCls = 'w-full px-3.5 py-2.5 bg-[var(--bg-base)] border border-white/10 rounded-lg text-sm text-white placeholder-white/25 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all'
const labelCls = 'block text-xs font-medium text-white/60 mb-1.5'

export function ProjectForm({ initialData, mode, projectId }: ProjectFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const [form, setForm] = useState<CreateProjectPayload>({
    name:              initialData?.name              ?? '',
    client:            initialData?.client            ?? '',
    consultation_type: initialData?.consultation_type ?? '',
    location:          initialData?.location          ?? '',
    offer_deadline:    initialData?.offer_deadline    ?? '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const url    = mode === 'create' ? '/api/projects' : `/api/projects/${projectId}`
      const method = mode === 'create' ? 'POST' : 'PUT'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Une erreur est survenue')
      }
      const { project } = await res.json()
      router.push(`/projects/${project.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Nom du projet <span className="text-red-400">*</span></label>
        <input
          type="text" name="name" value={form.name} onChange={handleChange} required
          placeholder="Ex: Installation PV toiture 500 kWc"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Client <span className="text-red-400">*</span></label>
        <input
          type="text" name="client" value={form.client} onChange={handleChange} required
          placeholder="Ex: Société ABC"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Type de consultation <span className="text-red-400">*</span></label>
        <select
          name="consultation_type" value={form.consultation_type} onChange={handleChange} required
          className={inputCls}
          style={{ colorScheme: 'dark' }}
        >
          <option value="">Sélectionner…</option>
          {CONSULTATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>Localisation <span className="text-red-400">*</span></label>
        <input
          type="text" name="location" value={form.location} onChange={handleChange} required
          placeholder="Ex: Lyon (69)"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Date de remise des offres</label>
        <input
          type="date" name="offer_deadline" value={form.offer_deadline ?? ''} onChange={handleChange}
          className={inputCls}
          style={{ colorScheme: 'dark' }}
        />
      </div>

      {error && (
        <div className="text-red-300 text-sm bg-red-500/10 border border-red-500/25 rounded-lg px-3.5 py-2.5">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button" onClick={() => router.back()}
          className="flex-1 py-2.5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 rounded-lg text-sm font-medium hover:bg-white/5 transition-all"
        >
          Annuler
        </button>
        <button
          type="submit" disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading
            ? (mode === 'create' ? 'Création…' : 'Enregistrement…')
            : (mode === 'create' ? 'Créer le projet' : 'Enregistrer')}
        </button>
      </div>
    </form>
  )
}
