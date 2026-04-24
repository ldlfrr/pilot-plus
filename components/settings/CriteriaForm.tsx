'use client'

import { useState } from 'react'
import {
  Plus, X, Save, CheckCircle, Info,
  MapPin, Wrench, Award, Users, TrendingUp, Star, SlidersHorizontal, FileText, Zap
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { CompanyCriteria } from '@/types'

// ─── Preset options ───────────────────────────────────────────────────────────

const ZONES_GEO_OPTIONS = [
  'Île-de-France', 'Auvergne-Rhône-Alpes', "Provence-Alpes-Côte d'Azur",
  'Occitanie', 'Nouvelle-Aquitaine', 'Grand Est', 'Hauts-de-France',
  'Normandie', 'Bretagne', 'Pays de la Loire', 'Centre-Val de Loire',
  'Bourgogne-Franche-Comté', 'Corse', 'DOM-TOM', 'National',
]

const TYPES_PROJETS_OPTIONS = [
  'Toiture industrielle', 'Toiture commerciale', 'Toiture agricole (agrivoltaïsme)',
  'Ombrière parking', 'Centrale au sol', 'Toiture tertiaire',
  'Façade intégrée (BIPV)', 'Flottant (floating PV)', 'Serre photovoltaïque',
]

const CERTIFICATIONS_OPTIONS = [
  'QualiPV Bat', 'QualiPV Elec', 'RGE', 'Qualifelec ENR',
  'AISBL', "Quali'EnR", 'IRVE', 'ISO 9001', 'ISO 14001',
  'MASE', 'OHSAS 18001', 'CSPE', 'CONSUEL agréé',
]

const SECTEURS_OPTIONS = [
  'Industrie', 'Collectivités territoriales', 'Tertiaire / bureaux',
  'Grande distribution', 'Logistique / entrepôts', 'Agriculture',
  'Enseignement', 'Santé', 'Hôtellerie', 'Particuliers',
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  subtitle,
  children,
  accent = 'blue',
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  children: React.ReactNode
  accent?: 'blue' | 'violet' | 'emerald' | 'amber' | 'rose' | 'indigo'
}) {
  const colors = {
    blue:    { bg: 'bg-blue-50',    icon: 'text-blue-600',    border: 'border-blue-100' },
    violet:  { bg: 'bg-violet-50',  icon: 'text-violet-600',  border: 'border-violet-100' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100' },
    amber:   { bg: 'bg-amber-50',   icon: 'text-amber-600',   border: 'border-amber-100' },
    rose:    { bg: 'bg-rose-50',    icon: 'text-rose-600',    border: 'border-rose-100' },
    indigo:  { bg: 'bg-indigo-50',  icon: 'text-indigo-600',  border: 'border-indigo-100' },
  }
  const c = colors[accent]

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className={cn('flex items-center gap-3 px-6 py-4 border-b', c.border, c.bg)}>
        <div className={cn('p-2 bg-white rounded-xl shadow-sm', c.icon)}>
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="px-6 py-5">
        {children}
      </div>
    </div>
  )
}

function Tooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex ml-1.5 cursor-help">
      <Info size={13} className="text-slate-300 hover:text-slate-500" />
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 rounded-xl bg-slate-800 px-3 py-2.5 text-xs text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg leading-relaxed">
        {text}
      </span>
    </span>
  )
}

function MultiSelect({
  options,
  selected,
  onChange,
}: {
  options: string[]
  selected: string[]
  onChange: (val: string[]) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() =>
              onChange(active ? selected.filter((s) => s !== opt) : [...selected, opt])
            }
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all',
              active
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'
            )}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

function TagsInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[]
  onChange: (val: string[]) => void
  placeholder?: string
}) {
  const [input, setInput] = useState('')

  function add() {
    const v = input.trim()
    if (v && !values.includes(v)) onChange([...values, v])
    setInput('')
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder ?? 'Ajouter…'}
          className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition-colors"
        />
        <button
          type="button"
          onClick={add}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-sm"
        >
          <Plus size={15} />
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100"
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((s) => s !== v))}
                className="hover:text-red-500 transition-colors"
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function WeightSlider({
  label,
  value,
  onChange,
  tooltip,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  tooltip: string
}) {
  const levels = [
    { v: 1, label: 'Faible' },
    { v: 2, label: 'Bas' },
    { v: 3, label: 'Normal' },
    { v: 4, label: 'Élevé' },
    { v: 5, label: 'Critique' },
  ]

  const badgeColors = [
    '',
    'bg-slate-100 text-slate-500',
    'bg-blue-50 text-blue-600',
    'bg-indigo-50 text-indigo-600',
    'bg-amber-50 text-amber-700',
    'bg-red-50 text-red-600',
  ]

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-sm text-slate-700 font-medium flex items-center">
          {label}
          <Tooltip text={tooltip} />
        </label>
        <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', badgeColors[value])}>
          ×{value} — {levels.find((l) => l.v === value)?.label}
        </span>
      </div>
      <div className="flex gap-1.5">
        {levels.map(({ v }) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              'flex-1 h-9 rounded-lg text-xs font-semibold transition-all border',
              value === v
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
            )}
          >
            ×{v}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

interface CriteriaFormProps {
  initialCriteria: CompanyCriteria
}

export function CriteriaForm({ initialCriteria }: CriteriaFormProps) {
  const [criteria, setCriteria] = useState<CompanyCriteria>(initialCriteria)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState<string | null>(null)

  function update<K extends keyof CompanyCriteria>(key: K, value: CompanyCriteria[K]) {
    setCriteria((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const res = await fetch('/api/settings/criteria', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criteria }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur sauvegarde')
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const totalPoids =
    criteria.poids_rentabilite + criteria.poids_complexite +
    criteria.poids_alignement + criteria.poids_probabilite + criteria.poids_charge

  return (
    <form onSubmit={handleSave} className="space-y-4">

      {/* ── 1. Géographie ──────────────────────────────────────────────── */}
      <SectionCard
        icon={<MapPin size={17} />}
        title="Périmètre géographique"
        subtitle="Régions où votre entreprise intervient habituellement"
        accent="blue"
      >
        <MultiSelect
          options={ZONES_GEO_OPTIONS}
          selected={criteria.zones_geo}
          onChange={(v) => update('zones_geo', v)}
        />
      </SectionCard>

      {/* ── 2. Types de projets ────────────────────────────────────────── */}
      <SectionCard
        icon={<Wrench size={17} />}
        title="Types de projets maîtrisés"
        subtitle="Typologies pour lesquelles vous avez des références et une expertise reconnue"
        accent="violet"
      >
        <MultiSelect
          options={TYPES_PROJETS_OPTIONS}
          selected={criteria.types_projets}
          onChange={(v) => update('types_projets', v)}
        />
      </SectionCard>

      {/* ── 3. Capacités techniques ────────────────────────────────────── */}
      <SectionCard
        icon={<Zap size={17} />}
        title="Capacités techniques"
        subtitle="Plage de puissance et volume mensuel que vous pouvez absorber"
        accent="amber"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              key: 'puissance_min_kwc' as const,
              label: 'Puissance min (kWc)',
              tooltip: 'Taille minimale de projet que vous acceptez de traiter',
            },
            {
              key: 'puissance_max_kwc' as const,
              label: 'Puissance max (kWc)',
              tooltip: 'Au-delà, le projet dépasse votre capacité technique ou financière',
            },
            {
              key: 'capacite_mensuelle_kwc' as const,
              label: 'Capacité mensuelle (kWc)',
              tooltip: 'Volume de puissance installable par mois avec vos équipes actuelles',
            },
          ].map(({ key, label, tooltip }) => (
            <div key={key}>
              <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
                {label}
                <Tooltip text={tooltip} />
              </label>
              <input
                type="number"
                min={1}
                value={criteria[key]}
                onChange={(e) => update(key, Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── 4. Certifications ──────────────────────────────────────────── */}
      <SectionCard
        icon={<Award size={17} />}
        title="Certifications & qualifications"
        subtitle="Certifications actuellement détenues par votre entreprise"
        accent="emerald"
      >
        <MultiSelect
          options={CERTIFICATIONS_OPTIONS}
          selected={criteria.certifications}
          onChange={(v) => update('certifications', v)}
        />
      </SectionCard>

      {/* ── 5. Secteurs clients ────────────────────────────────────────── */}
      <SectionCard
        icon={<Users size={17} />}
        title="Secteurs clients ciblés"
        subtitle="Segments de marché où vous êtes le plus compétitif"
        accent="indigo"
      >
        <MultiSelect
          options={SECTEURS_OPTIONS}
          selected={criteria.secteurs_clients}
          onChange={(v) => update('secteurs_clients', v)}
        />
      </SectionCard>

      {/* ── 6. Rentabilité ─────────────────────────────────────────────── */}
      <SectionCard
        icon={<TrendingUp size={17} />}
        title="Marge minimale acceptée"
        subtitle="Un projet sous ce seuil pénalisera le score Rentabilité"
        accent="rose"
      >
        <div className="flex items-center gap-5">
          <input
            type="range"
            min={2}
            max={30}
            step={0.5}
            value={criteria.rentabilite_min_pct}
            onChange={(e) => update('rentabilite_min_pct', Number(e.target.value))}
            className="flex-1 h-2 rounded-full accent-rose-500 cursor-pointer"
          />
          <div className="text-right w-20 flex-shrink-0">
            <span className="text-3xl font-bold text-rose-500 tabular-nums">
              {criteria.rentabilite_min_pct}
            </span>
            <span className="text-lg font-bold text-rose-400">%</span>
          </div>
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-1.5">
          <span>2%</span>
          <span>30%</span>
        </div>
      </SectionCard>

      {/* ── 7. Points forts ────────────────────────────────────────────── */}
      <SectionCard
        icon={<Star size={17} />}
        title="Points forts de l'entreprise"
        subtitle="Arguments différenciants pris en compte pour la probabilité de gain"
        accent="amber"
      >
        <TagsInput
          values={criteria.points_forts}
          onChange={(v) => update('points_forts', v)}
          placeholder="Ex : Délais courts, SAV réactif, référence locale…"
        />
      </SectionCard>

      {/* ── 8. Pondérations ────────────────────────────────────────────── */}
      <SectionCard
        icon={<SlidersHorizontal size={17} />}
        title="Pondérations des critères"
        subtitle="Ajustez l'importance de chaque critère dans le score final"
        accent="indigo"
      >
        <div className="space-y-5">
          <WeightSlider
            label="Rentabilité"
            value={criteria.poids_rentabilite}
            onChange={(v) => update('poids_rentabilite', v)}
            tooltip="Importance du potentiel de marge dans la décision Go/No Go"
          />
          <WeightSlider
            label="Complexité"
            value={criteria.poids_complexite}
            onChange={(v) => update('poids_complexite', v)}
            tooltip="Importance de la simplicité d'exécution. Score inversé : complexe = moins bon score."
          />
          <WeightSlider
            label="Alignement capacité"
            value={criteria.poids_alignement}
            onChange={(v) => update('poids_alignement', v)}
            tooltip="Importance de l'adéquation entre les exigences du projet et vos capacités réelles"
          />
          <WeightSlider
            label="Probabilité de gain"
            value={criteria.poids_probabilite}
            onChange={(v) => update('poids_probabilite', v)}
            tooltip="Importance de vos chances de remporter le marché"
          />
          <WeightSlider
            label="Charge interne"
            value={criteria.poids_charge}
            onChange={(v) => update('poids_charge', v)}
            tooltip="Importance de la légèreté en ressources internes. Score inversé : charge lourde = moins bon score."
          />

          {/* Weight preview bars */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-3">Répartition des pondérations</p>
            <div className="flex gap-2 items-end h-16">
              {[
                { label: 'Rent.', poids: criteria.poids_rentabilite },
                { label: 'Compl.', poids: criteria.poids_complexite },
                { label: 'Align.', poids: criteria.poids_alignement },
                { label: 'Prob.', poids: criteria.poids_probabilite },
                { label: 'Charge', poids: criteria.poids_charge },
              ].map(({ label, poids }) => {
                const pct = Math.round((poids / totalPoids) * 100)
                return (
                  <div key={label} className="flex-1 text-center flex flex-col items-center justify-end gap-1">
                    <span className="text-xs font-bold text-blue-700">{pct}%</span>
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all duration-300"
                      style={{ height: `${Math.max(4, pct * 0.5)}px` }}
                    />
                    <span className="text-[10px] text-slate-400 truncate w-full">{label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── 9. Notes ───────────────────────────────────────────────────── */}
      <SectionCard
        icon={<FileText size={17} />}
        title="Notes complémentaires"
        subtitle="Informations supplémentaires transmises à l'IA lors du scoring"
        accent="blue"
      >
        <textarea
          value={criteria.notes}
          onChange={(e) => update('notes', e.target.value)}
          rows={4}
          placeholder="Ex : Nous sommes en forte croissance et ciblons des marchés publics supérieurs à 1 M€…"
          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors leading-relaxed"
        />
      </SectionCard>

      {/* ── Save bar ───────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t border-slate-200 -mx-0 px-0 py-4 flex items-center justify-between gap-4">
        <div className="text-sm">
          {error && <span className="text-red-500">{error}</span>}
          {saved && (
            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <CheckCircle size={15} />
              Critères enregistrés
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Save size={15} />
          {saving ? 'Enregistrement…' : 'Enregistrer les critères'}
        </button>
      </div>
    </form>
  )
}
