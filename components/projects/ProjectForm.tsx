'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Project, CreateProjectPayload } from '@/types'

const CONSULTATION_TYPES = [
  'Appel d\'offres public',
  'Appel d\'offres privé',
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

export function ProjectForm({ initialData, mode, projectId }: ProjectFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<CreateProjectPayload>({
    name: initialData?.name ?? '',
    client: initialData?.client ?? '',
    consultation_type: initialData?.consultation_type ?? '',
    location: initialData?.location ?? '',
    offer_deadline: initialData?.offer_deadline ?? '',
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url =
        mode === 'create' ? '/api/projects' : `/api/projects/${projectId}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
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
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Nom du projet */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Nom du projet <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="Ex: Installation PV toiture 500 kWc"
        />
      </div>

      {/* Client */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Client <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="client"
          value={form.client}
          onChange={handleChange}
          required
          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="Ex: Société ABC"
        />
      </div>

      {/* Type de consultation */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Type de consultation <span className="text-red-500">*</span>
        </label>
        <select
          name="consultation_type"
          value={form.consultation_type}
          onChange={handleChange}
          required
          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
        >
          <option value="">Sélectionner...</option>
          {CONSULTATION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Localisation */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Localisation <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="location"
          value={form.location}
          onChange={handleChange}
          required
          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="Ex: Lyon (69)"
        />
      </div>

      {/* Date de remise */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Date de remise des offres
        </label>
        <input
          type="date"
          name="offer_deadline"
          value={form.offer_deadline ?? ''}
          onChange={handleChange}
          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
        >
          {loading
            ? mode === 'create'
              ? 'Création...'
              : 'Enregistrement...'
            : mode === 'create'
            ? 'Créer le projet'
            : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
