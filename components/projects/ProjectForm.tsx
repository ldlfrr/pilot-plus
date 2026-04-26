'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2, Building2, MapPin, Calendar, FileText,
  Briefcase, ArrowRight, AlertCircle, ChevronDown,
  CheckCircle2, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Project, CreateProjectPayload } from '@/types'

// ── Constants ─────────────────────────────────────────────────────────────────

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

const TYPE_COLORS: Record<string, { dot: string; text: string }> = {
  "Appel d'offres ouvert":    { dot: '#60a5fa', text: '#93c5fd' },
  "Appel d'offres restreint": { dot: '#a78bfa', text: '#c4b5fd' },
  'Consultation restreinte':  { dot: '#fbbf24', text: '#fde68a' },
  'Marché négocié':           { dot: '#34d399', text: '#6ee7b7' },
  'Gré à gré':                { dot: '#f472b6', text: '#fbcfe8' },
  'MAPA (procédure adaptée)': { dot: '#22d3ee', text: '#a5f3fc' },
  'Dialogue compétitif':      { dot: '#fb923c', text: '#fed7aa' },
  'Autre':                    { dot: '#6b7280', text: '#9ca3af' },
}

// ── Shared styles ──────────────────────────────────────────────────────────────

const INPUT_BASE: React.CSSProperties = {
  background: 'rgba(8, 14, 34, 0.72)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: 'white',
}
const INPUT_FOCUS: React.CSSProperties = {
  background: 'rgba(8, 14, 40, 0.90)',
  border: '1px solid rgba(59,130,246,0.50)',
  boxShadow: '0 0 0 3px rgba(59,130,246,0.10)',
}
const INPUT_FILLED: React.CSSProperties = {
  background: 'rgba(8, 14, 34, 0.72)',
  border: '1px solid rgba(255,255,255,0.14)',
  color: 'white',
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface ProjectFormProps {
  initialData?: Partial<Project>
  mode: 'create' | 'edit'
  projectId?: string
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function FormField({
  num, icon: Icon, label, required, hint, children, filled,
}: {
  num: number
  icon: React.ElementType
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
  filled?: boolean
}) {
  return (
    <div className="group relative flex gap-4 items-start">
      {/* Step indicator */}
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5 transition-all duration-200',
        filled
          ? 'bg-blue-600/90 text-white shadow-sm shadow-blue-600/40'
          : 'bg-white/5 text-white/25 border border-white/10',
      )}>
        {filled ? <CheckCircle2 size={12} /> : num}
      </div>

      {/* Field content */}
      <div className="flex-1 min-w-0">
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-white/45 mb-2 uppercase tracking-wider">
          <Icon size={10} className="flex-shrink-0" />
          {label}
          {required && <span className="text-red-400/70 normal-case font-bold">*</span>}
        </label>
        {children}
        {hint && (
          <p className="text-[10px] text-white/22 mt-1.5 flex items-center gap-1">
            <Sparkles size={8} className="text-blue-400/40" />{hint}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

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

  const [focused, setFocused] = useState<keyof CreateProjectPayload | null>(null)

  function set(key: keyof CreateProjectPayload, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function inputStyle(key: keyof CreateProjectPayload): React.CSSProperties {
    if (focused === key) return INPUT_FOCUS
    if (form[key]) return INPUT_FILLED
    return INPUT_BASE
  }

  const isValid = form.name.trim() && form.client.trim() && form.consultation_type && form.location.trim()

  const filledCount = [form.name, form.client, form.consultation_type, form.location].filter(Boolean).length
  const progressPct = Math.round((filledCount / 4) * 100)

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

  const sharedInputCls = 'w-full px-4 py-3 rounded-xl text-sm placeholder:text-white/20 focus:outline-none transition-all duration-150'

  return (
    <form onSubmit={handleSubmit} className="space-y-1">

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-white/30 font-medium">
            {filledCount} / 4 champs requis remplis
          </span>
          <span className="text-[11px] font-bold" style={{ color: progressPct === 100 ? '#34d399' : '#60a5fa' }}>
            {progressPct}%
          </span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPct}%`,
              background: progressPct === 100
                ? 'linear-gradient(90deg, #10b981, #34d399)'
                : 'linear-gradient(90deg, #2563eb, #60a5fa)',
            }}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="space-y-5">

        {/* 1 - Project name */}
        <FormField num={1} icon={FileText} label="Nom du projet" required
          hint="Soyez précis : ce nom apparaîtra dans tous vos exports"
          filled={!!form.name}>
          <input
            type="text"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            onFocus={() => setFocused('name')}
            onBlur={() => setFocused(null)}
            required
            placeholder="Ex: Réhabilitation énergétique bâtiment A — Lot 2"
            className={sharedInputCls}
            style={inputStyle('name')}
          />
        </FormField>

        {/* 2 - Client */}
        <FormField num={2} icon={Building2} label="Client / Maître d'ouvrage" required
          filled={!!form.client}>
          <input
            type="text"
            value={form.client}
            onChange={e => set('client', e.target.value)}
            onFocus={() => setFocused('client')}
            onBlur={() => setFocused(null)}
            required
            placeholder="Ex: Mairie de Lyon, Société ABC…"
            className={sharedInputCls}
            style={inputStyle('client')}
          />
        </FormField>

        {/* 3 - Consultation type */}
        <FormField num={3} icon={Briefcase} label="Type de consultation" required
          filled={!!form.consultation_type}>
          <div className="relative">
            <select
              value={form.consultation_type}
              onChange={e => set('consultation_type', e.target.value)}
              onFocus={() => setFocused('consultation_type')}
              onBlur={() => setFocused(null)}
              required
              className={cn(sharedInputCls, 'appearance-none pr-10 cursor-pointer')}
              style={{
                ...inputStyle('consultation_type'),
                color: form.consultation_type
                  ? (TYPE_COLORS[form.consultation_type]?.text ?? 'white')
                  : 'rgba(255,255,255,0.20)',
              }}
            >
              <option value="" style={{ background: '#0b1530', color: 'rgba(255,255,255,0.4)' }}>
                Sélectionner le type…
              </option>
              {CONSULTATION_TYPES.map(t => (
                <option key={t} value={t} style={{ background: '#0b1530', color: 'white' }}>
                  {t}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
            {form.consultation_type && (
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full pointer-events-none opacity-0"
                style={{ opacity: 0 }}
              />
            )}
          </div>
          {/* Selected type pill */}
          {form.consultation_type && (
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: TYPE_COLORS[form.consultation_type]?.dot ?? '#6b7280' }}
              />
              <span className="text-[11px] font-medium" style={{ color: TYPE_COLORS[form.consultation_type]?.text ?? '#9ca3af' }}>
                {form.consultation_type}
              </span>
            </div>
          )}
        </FormField>

        {/* 4 - Location */}
        <FormField num={4} icon={MapPin} label="Localisation" required
          hint="Département, ville ou région"
          filled={!!form.location}>
          <div className="relative">
            <MapPin size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
            <input
              type="text"
              value={form.location}
              onChange={e => set('location', e.target.value)}
              onFocus={() => setFocused('location')}
              onBlur={() => setFocused(null)}
              required
              placeholder="Ex: Lyon (69), Île-de-France…"
              className={cn(sharedInputCls, 'pl-10')}
              style={inputStyle('location')}
            />
          </div>
        </FormField>

        {/* 5 - Deadline (optional) */}
        <FormField num={5} icon={Calendar} label="Date limite de remise des offres"
          filled={!!form.offer_deadline}>
          <div className="relative">
            <Calendar size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
            <input
              type="date"
              value={form.offer_deadline ?? ''}
              onChange={e => set('offer_deadline', e.target.value)}
              onFocus={() => setFocused('offer_deadline')}
              onBlur={() => setFocused(null)}
              className={cn(sharedInputCls, 'pl-10')}
              style={{ ...inputStyle('offer_deadline'), colorScheme: 'dark' }}
            />
          </div>
        </FormField>

      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 text-sm px-4 py-3 rounded-xl mt-4"
          style={{ background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.22)' }}>
          <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-red-300 text-xs leading-relaxed">{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-5">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.10)',
            color: 'rgba(255,255,255,0.50)',
          }}
          onMouseEnter={e => {
            Object.assign(e.currentTarget.style, { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.80)' })
          }}
          onMouseLeave={e => {
            Object.assign(e.currentTarget.style, { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.50)' })
          }}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading || !isValid}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all relative overflow-hidden group"
          style={{
            background: isValid && !loading
              ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)'
              : 'rgba(255,255,255,0.05)',
            border: isValid && !loading
              ? '1px solid rgba(59,130,246,0.40)'
              : '1px solid rgba(255,255,255,0.07)',
            color: isValid && !loading ? 'white' : 'rgba(255,255,255,0.22)',
            boxShadow: isValid && !loading ? '0 4px 16px rgba(59,130,246,0.28)' : 'none',
            cursor: !isValid || loading ? 'not-allowed' : 'pointer',
          }}
        >
          {(isValid && !loading) && (
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' }} />
          )}
          <span className="relative flex items-center gap-2">
            {loading ? (
              <><Loader2 size={14} className="animate-spin" />{mode === 'create' ? 'Création…' : 'Enregistrement…'}</>
            ) : (
              <>{mode === 'create' ? 'Créer le projet' : 'Enregistrer'}<ArrowRight size={14} /></>
            )}
          </span>
        </button>
      </div>

    </form>
  )
}
