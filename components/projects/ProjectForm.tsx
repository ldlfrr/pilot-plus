'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2, Building2, MapPin, Calendar, FileText,
  Briefcase, ArrowRight, Check, AlertCircle, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Project, CreateProjectPayload } from '@/types'

const CONSULTATION_TYPES = [
  "Appel d'offres ouvert",
  "Appel d'offres restreint",
  'Consultation restreinte',
  'Marché négocié',
  'Gré à gré',
  'MAPA (procédure adaptée)',
  'Dialogue compétitif',
  'Autre',
]

const CONSULTATION_TYPE_COLORS: Record<string, string> = {
  "Appel d'offres ouvert":   'text-blue-400',
  "Appel d'offres restreint":'text-violet-400',
  'Consultation restreinte': 'text-amber-400',
  'Marché négocié':          'text-emerald-400',
  'Gré à gré':               'text-pink-400',
  'MAPA (procédure adaptée)':'text-cyan-400',
  'Dialogue compétitif':     'text-orange-400',
  'Autre':                   'text-white/40',
}

interface ProjectFormProps {
  initialData?: Partial<Project>
  mode: 'create' | 'edit'
  projectId?: string
}

function FieldRow({
  icon: Icon, label, required, children, hint,
}: {
  icon: React.ElementType
  label: string
  required?: boolean
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="group">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-white/50 mb-2 uppercase tracking-wide">
        <Icon size={11} className="text-white/30" />
        {label}
        {required && <span className="text-red-400 ml-0.5 normal-case">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-white/20 mt-1.5">{hint}</p>}
    </div>
  )
}

const inputCls = cn(
  'w-full px-4 py-3 rounded-xl bg-white/4 border border-white/8 text-sm text-white',
  'placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500/40',
  'focus:border-blue-500/30 transition-all',
)

export function ProjectForm({ initialData, mode, projectId }: ProjectFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const [form, setForm] = useState<CreateProjectPayload>({
    name:              initialData?.name              ?? '',
    client:            initialData?.client            ?? '',
    consultation_type: initialData?.consultation_type ?? '',
    location:          initialData?.location          ?? '',
    offer_deadline:    initialData?.offer_deadline    ?? '',
  })

  function set(key: keyof CreateProjectPayload, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const isValid = form.name.trim() && form.client.trim() && form.consultation_type && form.location.trim()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
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

      {/* Nom du projet */}
      <FieldRow icon={FileText} label="Nom du projet" required hint="Soyez précis : ce nom apparaîtra dans tous les exports">
        <input
          type="text" value={form.name}
          onChange={e => set('name', e.target.value)}
          required placeholder="Ex: Réhabilitation énergétique bâtiment A — Lot 2"
          className={inputCls}
        />
      </FieldRow>

      {/* Client */}
      <FieldRow icon={Building2} label="Client / Maître d'ouvrage" required>
        <input
          type="text" value={form.client}
          onChange={e => set('client', e.target.value)}
          required placeholder="Ex: Mairie de Lyon, Société ABC…"
          className={inputCls}
        />
      </FieldRow>

      {/* Type de consultation */}
      <FieldRow icon={Briefcase} label="Type de consultation" required>
        <div className="relative">
          <select
            value={form.consultation_type}
            onChange={e => set('consultation_type', e.target.value)}
            required
            className={cn(inputCls, 'pr-10 appearance-none cursor-pointer',
              form.consultation_type ? CONSULTATION_TYPE_COLORS[form.consultation_type] ?? 'text-white' : 'text-white/20'
            )}
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='rgba(255,255,255,0.25)' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
          >
            <option value="" className="bg-[#13161e] text-white/40">Sélectionner le type…</option>
            {CONSULTATION_TYPES.map(t => (
              <option key={t} value={t} className="bg-[#13161e] text-white">{t}</option>
            ))}
          </select>
        </div>
      </FieldRow>

      {/* Localisation */}
      <FieldRow icon={MapPin} label="Localisation" required hint="Département, ville ou région">
        <div className="relative">
          <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
          <input
            type="text" value={form.location}
            onChange={e => set('location', e.target.value)}
            required placeholder="Ex: Lyon (69), Île-de-France, 75…"
            className={cn(inputCls, 'pl-10')}
          />
        </div>
      </FieldRow>

      {/* Date de remise */}
      <FieldRow icon={Calendar} label="Date limite de remise des offres">
        <div className="relative">
          <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
          <input
            type="date" value={form.offer_deadline ?? ''}
            onChange={e => set('offer_deadline', e.target.value)}
            className={cn(inputCls, 'pl-10')}
            style={{ colorScheme: 'dark' }}
          />
        </div>
      </FieldRow>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button" onClick={() => router.back()}
          className="flex-1 py-3 border border-white/10 text-white/50 hover:text-white hover:border-white/25 rounded-xl text-sm font-medium hover:bg-white/4 transition-all"
        >
          Annuler
        </button>
        <button
          type="submit" disabled={loading || !isValid}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all',
            isValid && !loading
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25'
              : 'bg-white/6 text-white/25 cursor-not-allowed border border-white/8',
          )}
        >
          {loading ? (
            <><Loader2 size={15} className="animate-spin" />{mode === 'create' ? 'Création…' : 'Enregistrement…'}</>
          ) : (
            <>{mode === 'create' ? 'Créer le projet' : 'Enregistrer'}<ArrowRight size={15} /></>
          )}
        </button>
      </div>
    </form>
  )
}
