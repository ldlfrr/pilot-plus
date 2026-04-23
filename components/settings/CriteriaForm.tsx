'use client'

import { useState } from 'react'
import { Plus, X, Save, CheckCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { CompanyCriteria } from '@/types'

// ─── Preset options ───────────────────────────────────────────────────────────

const ZONES_GEO_OPTIONS = [
  'Île-de-France','Auvergne-Rhône-Alpes','Provence-Alpes-Côte d\'Azur',
  'Occitanie','Nouvelle-Aquitaine','Grand Est','Hauts-de-France',
  'Normandie','Bretagne','Pays de la Loire','Centre-Val de Loire',
  'Bourgogne-Franche-Comté','Corse','DOM-TOM','National',
]

const TYPES_PROJETS_OPTIONS = [
  'Toiture industrielle','Toiture commerciale','Toiture agricole (agrivoltaïsme)',
  'Ombrière parking','Centrale au sol','Toiture tertiaire',
  'Façade intégrée (BIPV)','Flottant (floating PV)','Serre photovoltaïque',
]

const CERTIFICATIONS_OPTIONS = [
  'QualiPV Bat','QualiPV Elec','RGE','Qualifelec ENR',
  'AISBL','Quali\'EnR','IRVE','ISO 9001','ISO 14001',
  'MASE','OHSAS 18001','CSPE','CONSUEL agréé',
]

const SECTEURS_OPTIONS = [
  'Industrie','Collectivités territoriales','Tertiaire / bureaux',
  'Grande distribution','Logistique / entrepôts','Agriculture',
  'Enseignement','Santé','Hôtellerie','Particuliers',
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 mt-6 first:mt-0">
      {children}
    </h3>
  )
}

function Tooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex ml-1.5 cursor-help">
      <Info size={13} className="text-slate-300 hover:text-slate-500" />
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
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
              onChange(
                active ? selected.filter((s) => s !== opt) : [...selected, opt]
              )
            }
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
              active
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
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
    if (v && !values.includes(v)) {
      onChange([...values, v])
    }
    setInput('')
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder={placeholder ?? 'Ajouter...'}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
        >
          <Plus size={15} />
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100"
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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm text-slate-700 font-medium flex items-center">
          {label}
          <Tooltip text={tooltip} />
        </label>
        <span
          className={cn(
            'text-xs font-bold px-2 py-0.5 rounded-full',
            value <= 1 ? 'bg-slate-100 text-slate-500' :
            value === 2 ? 'bg-blue-50 text-blue-600' :
            value === 3 ? 'bg-indigo-50 text-indigo-600' :
            value === 4 ? 'bg-amber-50 text-amber-700' :
            'bg-red-50 text-red-600'
          )}
        >
          ×{value} — {levels.find((l) => l.v === value)?.label}
        </span>
      </div>
      <div className="flex gap-1">
        {levels.map(({ v }) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              'flex-1 h-8 rounded-md text-xs font-semibold transition-all border',
              value === v
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-400 border-slate-200 hover:border-blue-300'
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
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <form onSubmit={handleSave} className="space-y-1">

      {/* ── 1. Géographie ─────────────────────────────────────────── */}
      <SectionTitle>Périmètre géographique</SectionTitle>
      <p className="text-xs text-slate-400 mb-3">
        Régions où votre entreprise intervient habituellement.
      </p>
      <MultiSelect
        options={ZONES_GEO_OPTIONS}
        selected={criteria.zones_geo}
        onChange={(v) => update('zones_geo', v)}
      />

      {/* ── 2. Types de projets ───────────────────────────────────── */}
      <SectionTitle>Types de projets maîtrisés</SectionTitle>
      <p className="text-xs text-slate-400 mb-3">
        Typologies pour lesquelles vous avez des références et une expertise reconnue.
      </p>
      <MultiSelect
        options={TYPES_PROJETS_OPTIONS}
        selected={criteria.types_projets}
        onChange={(v) => update('types_projets', v)}
      />

      {/* ── 3. Capacités techniques ───────────────────────────────── */}
      <SectionTitle>Capacités techniques</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center">
            Puissance min (kWc)
            <Tooltip text="Taille minimale de projet que vous acceptez de traiter" />
          </label>
          <input
            type="number"
            min={1}
            value={criteria.puissance_min_kwc}
            onChange={(e) => update('puissance_min_kwc', Number(e.target.value))}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center">
            Puissance max (kWc)
            <Tooltip text="Au-delà, le projet dépasse votre capacité technique ou financière" />
          </label>
          <input
            type="number"
            min={1}
            value={criteria.puissance_max_kwc}
            onChange={(e) => update('puissance_max_kwc', Number(e.target.value))}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center">
            Capacité mensuelle (kWc)
            <Tooltip text="Volume de puissance installable par mois avec vos équipes actuelles" />
          </label>
          <input
            type="number"
            min={1}
            value={criteria.capacite_mensuelle_kwc}
            onChange={(e) => update('capacite_mensuelle_kwc', Number(e.target.value))}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* ── 4. Certifications ─────────────────────────────────────── */}
      <SectionTitle>Certifications & qualifications</SectionTitle>
      <p className="text-xs text-slate-400 mb-3">
        Certifications actuellement détenues par votre entreprise.
      </p>
      <MultiSelect
        options={CERTIFICATIONS_OPTIONS}
        selected={criteria.certifications}
        onChange={(v) => update('certifications', v)}
      />

      {/* ── 5. Secteurs clients ───────────────────────────────────── */}
      <SectionTitle>Secteurs clients ciblés</SectionTitle>
      <p className="text-xs text-slate-400 mb-3">
        Segments de marché où vous êtes le plus compétitif.
      </p>
      <MultiSelect
        options={SECTEURS_OPTIONS}
        selected={criteria.secteurs_clients}
        onChange={(v) => update('secteurs_clients', v)}
      />

      {/* ── 6. Rentabilité ────────────────────────────────────────── */}
      <SectionTitle>Marge minimale acceptée</SectionTitle>
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={2}
          max={30}
          step={0.5}
          value={criteria.rentabilite_min_pct}
          onChange={(e) => update('rentabilite_min_pct', Number(e.target.value))}
          className="flex-1 accent-blue-600"
        />
        <span className="text-2xl font-bold text-blue-600 tabular-nums w-16 text-right">
          {criteria.rentabilite_min_pct}%
        </span>
      </div>
      <p className="text-xs text-slate-400 mt-1">
        Un projet dont la marge estimée est inférieure pénalisera le score Rentabilité.
      </p>

      {/* ── 7. Points forts ───────────────────────────────────────── */}
      <SectionTitle>Points forts de l'entreprise</SectionTitle>
      <p className="text-xs text-slate-400 mb-3">
        Arguments différenciants que l'IA prend en compte pour évaluer la probabilité de gain.
      </p>
      <TagsInput
        values={criteria.points_forts}
        onChange={(v) => update('points_forts', v)}
        placeholder="Ex: Délais de livraison courts, SAV réactif..."
      />

      {/* ── 8. Pondérations ───────────────────────────────────────── */}
      <SectionTitle>Pondérations des critères</SectionTitle>
      <p className="text-xs text-slate-400 mb-4">
        Ajustez l'importance relative de chaque critère selon la stratégie de votre entreprise.
        Un critère ×5 pèse 5 fois plus qu'un critère ×1 dans le score final.
      </p>
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-5">
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

        {/* Score preview */}
        <div className="pt-3 border-t border-slate-200">
          <p className="text-xs text-slate-500 mb-2 font-medium">Aperçu de la pondération</p>
          <div className="flex gap-1">
            {[
              { label: 'Rent.', poids: criteria.poids_rentabilite },
              { label: 'Compl.', poids: criteria.poids_complexite },
              { label: 'Align.', poids: criteria.poids_alignement },
              { label: 'Prob.', poids: criteria.poids_probabilite },
              { label: 'Charge', poids: criteria.poids_charge },
            ].map(({ label, poids }) => {
              const total =
                criteria.poids_rentabilite +
                criteria.poids_complexite +
                criteria.poids_alignement +
                criteria.poids_probabilite +
                criteria.poids_charge
              const pct = Math.round((poids / total) * 100)
              return (
                <div key={label} className="flex-1 text-center">
                  <div className="text-xs font-bold text-blue-700">{pct}%</div>
                  <div
                    className="bg-blue-500 rounded-sm mx-auto mt-0.5 transition-all"
                    style={{ height: `${pct * 1.5}px`, maxHeight: '60px', minHeight: '4px' }}
                  />
                  <div className="text-[10px] text-slate-400 mt-1 truncate">{label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── 9. Notes ──────────────────────────────────────────────── */}
      <SectionTitle>Notes complémentaires</SectionTitle>
      <textarea
        value={criteria.notes}
        onChange={(e) => update('notes', e.target.value)}
        rows={3}
        placeholder="Informations supplémentaires que l'IA doit prendre en compte lors du scoring..."
        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
      />

      {/* ── Save bar ──────────────────────────────────────────────── */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 -mx-6 px-6 py-4 mt-6 flex items-center justify-between gap-4">
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
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Save size={15} />
          {saving ? 'Enregistrement...' : 'Enregistrer les critères'}
        </button>
      </div>
    </form>
  )
}
