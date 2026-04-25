'use client'

import { useState } from 'react'
import {
  Plus, X, Info, MapPin, Wrench, Award, Users, TrendingUp,
  Star, SlidersHorizontal, FileText, Building2, Zap, Target,
  Globe, Briefcase, BarChart3, Euro, Layers, AlertTriangle,
  Sun, Wind, HardHat, Activity, Leaf, Check, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { CompanyCriteria } from '@/types'

// ── Geographic zones (universal) ──────────────────────────────────────────────

const ZONES_GEO = [
  'Île-de-France', 'Auvergne-Rhône-Alpes', "Provence-Alpes-Côte d'Azur",
  'Occitanie', 'Nouvelle-Aquitaine', 'Grand Est', 'Hauts-de-France',
  'Normandie', 'Bretagne', 'Pays de la Loire', 'Centre-Val de Loire',
  'Bourgogne-Franche-Comté', 'Corse', 'DOM-TOM', 'National',
]

const EFFECTIFS_OPTIONS = ['1 – 5', '6 – 20', '21 – 50', '51 – 200', '201 – 500', '500+']
const CA_OPTIONS = ['< 500 k€', '500 k€ – 2 M€', '2 – 10 M€', '10 – 50 M€', '50 – 200 M€', '200 M€+']
const DELAI_OPTIONS = ['< 1 mois', '1 – 3 mois', '3 – 6 mois', '6 – 12 mois', '> 12 mois']

// ── Sector configuration ───────────────────────────────────────────────────────

interface SectorConfig {
  label:               string
  icon:                React.ElementType
  iconColor:           string   // classes for icon container
  activeCard:          string   // classes for selected card border/bg
  badgeCls:            string   // mini badge pill
  types_projets:       string[]
  certifications:      string[]
  secteurs_clients:    string[]
  cap_unit:            string
  cap_min_label:       string
  cap_max_label:       string
  cap_mensuelle_label: string
}

const SECTOR_CONFIG: Record<string, SectorConfig> = {
  'Photovoltaïque': {
    label: 'Photovoltaïque',
    icon: Sun,
    iconColor: 'bg-amber-500/15 text-amber-400',
    activeCard: 'border-amber-500/40 bg-amber-500/8',
    badgeCls: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
    types_projets: [
      'Toiture industrielle', 'Toiture commerciale', 'Toiture agricole (agrivoltaïsme)',
      'Ombrière parking', 'Centrale au sol', 'Toiture tertiaire',
      'Façade intégrée (BIPV)', 'Flottant (floating PV)', 'Serre photovoltaïque',
      'Résidentiel collectif', 'Bâtiment public', 'Infrastructure routière',
    ],
    certifications: [
      'QualiPV Bat', 'QualiPV Elec', 'RGE', 'Qualifelec ENR',
      "Quali'EnR", 'CONSUEL agréé', 'ISO 9001', 'ISO 14001', 'Qualibat',
    ],
    secteurs_clients: [
      'Industrie', 'Collectivités territoriales', 'Tertiaire / bureaux',
      'Grande distribution', 'Logistique / entrepôts', 'Agriculture',
      'Enseignement', 'Santé', 'Hôtellerie', 'Particuliers', 'Promoteurs',
    ],
    cap_unit: 'kWc',
    cap_min_label: 'Puissance min acceptée',
    cap_max_label: 'Puissance max acceptée',
    cap_mensuelle_label: 'Capacité mensuelle',
  },
  'IRVE': {
    label: 'IRVE',
    icon: Zap,
    iconColor: 'bg-cyan-500/15 text-cyan-400',
    activeCard: 'border-cyan-500/40 bg-cyan-500/8',
    badgeCls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
    types_projets: [
      'Borne AC résidentiel (T2)', 'Borne AC tertiaire', 'Borne DC rapide (≥ 50 kW)',
      'Borne DC ultra-rapide (≥ 150 kW)', 'Station de charge collective',
      'Parking public / privé', 'Autoroute / aire de service', 'Fleet B2B',
    ],
    certifications: [
      'IRVE P1', 'IRVE P2', 'RGE IRVE', 'Qualifelec IRVE',
      'Qualibat', 'ISO 9001', 'AFNOR NF C 15-100',
    ],
    secteurs_clients: [
      'Collectivités / Mairies', 'Syndics de copropriété', 'Entreprises / Flottes',
      'Grande distribution', 'Hôtellerie', 'Promoteurs',
      'Opérateurs de mobilité', 'Bailleurs sociaux',
    ],
    cap_unit: 'bornes',
    cap_min_label: 'Nb bornes min / projet',
    cap_max_label: 'Nb bornes max / projet',
    cap_mensuelle_label: 'Bornes installées / mois',
  },
  'Désamiantage': {
    label: 'Désamiantage',
    icon: HardHat,
    iconColor: 'bg-red-500/15 text-red-400',
    activeCard: 'border-red-500/40 bg-red-500/8',
    badgeCls: 'bg-red-500/15 text-red-300 border-red-500/25',
    types_projets: [
      'Retrait toiture fibrociment', 'Retrait amiante sol', 'Retrait amiante mur / plafond',
      'Encapsulage / confinement', 'Démolition avant rénovation',
      'Désamiantage industriel', 'Traitement avant déconstruction', 'Dalles vinyle-amiante',
    ],
    certifications: [
      'Certification SS3 (sous-section 3)', 'Certification SS4 (sous-section 4)',
      'Qualibat 1552', 'MASE', 'ISO 9001', 'ISO 14001', 'ISO 45001',
    ],
    secteurs_clients: [
      'Industrie', 'Collectivités territoriales', 'Bailleurs sociaux',
      'Tertiaire / bureaux', 'Particuliers', 'Syndics de copropriété', 'Promoteurs',
    ],
    cap_unit: 'm²',
    cap_min_label: 'Surface min / chantier',
    cap_max_label: 'Surface max / chantier',
    cap_mensuelle_label: 'Surface traitée / mois',
  },
  'Éolien': {
    label: 'Éolien',
    icon: Wind,
    iconColor: 'bg-sky-500/15 text-sky-400',
    activeCard: 'border-sky-500/40 bg-sky-500/8',
    badgeCls: 'bg-sky-500/15 text-sky-300 border-sky-500/25',
    types_projets: [
      'Éolien terrestre < 100 kW', 'Éolien terrestre 100 – 1000 kW',
      'Éolien terrestre > 1 MW', 'Micro-éolien urbain',
      'Repowering / Remplacement', 'Éolien flottant (offshore)',
    ],
    certifications: [
      'Qualifelec ENR', 'RGE', 'Qualibat', 'MASE', 'ISO 9001', 'ISO 14001',
    ],
    secteurs_clients: [
      'Collectivités territoriales', 'Agriculteurs', 'Industriels',
      'Développeurs énergétiques', 'SEM / SEML', 'Communautés énergétiques',
    ],
    cap_unit: 'kW',
    cap_min_label: 'Puissance min acceptée',
    cap_max_label: 'Puissance max acceptée',
    cap_mensuelle_label: 'Capacité installée / mois',
  },
  'BTP / Génie civil': {
    label: 'BTP / Génie civil',
    icon: Building2,
    iconColor: 'bg-stone-500/15 text-stone-400',
    activeCard: 'border-stone-500/40 bg-stone-500/8',
    badgeCls: 'bg-stone-500/15 text-stone-300 border-stone-500/25',
    types_projets: [
      'Terrassement / VRD', 'Construction neuve gros œuvre', 'Réhabilitation',
      'Démolition', 'Charpente-couverture', 'Étanchéité',
      'Maçonnerie', 'Second œuvre', 'Travaux spéciaux',
    ],
    certifications: [
      'Qualibat', 'ISO 9001', 'ISO 14001', 'MASE', 'ISO 45001', 'COFRAC',
    ],
    secteurs_clients: [
      'Collectivités territoriales', 'Promoteurs', 'Bailleurs sociaux',
      'Industrie', 'Agriculture', 'Particuliers', 'Syndics',
    ],
    cap_unit: 'm²',
    cap_min_label: 'Surface min / chantier',
    cap_max_label: 'Surface max / chantier',
    cap_mensuelle_label: 'Surface construite / mois',
  },
  'Électricité / CVC': {
    label: 'Électricité / CVC',
    icon: Activity,
    iconColor: 'bg-violet-500/15 text-violet-400',
    activeCard: 'border-violet-500/40 bg-violet-500/8',
    badgeCls: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
    types_projets: [
      'Installation électrique tertiaire', 'Installation industrielle HTA / HTB',
      'CVC résidentiel', 'CVC tertiaire', 'Climatisation / Froid',
      'Ventilation VMC / VMC double flux', 'Pompe à chaleur', 'Chauffage biomasse',
      'Géothermie', 'Désenfumage',
    ],
    certifications: [
      'Qualifelec', 'RGE', 'Qualibat', 'IRVE P1', 'IRVE P2',
      'PGN / PGP gaz', 'ISO 9001', 'COFRAC',
    ],
    secteurs_clients: [
      'Industrie', 'Collectivités territoriales', 'Tertiaire / bureaux',
      'Résidentiel collectif', 'Grande distribution', 'Santé', 'Hôtellerie',
    ],
    cap_unit: 'kW',
    cap_min_label: 'Puissance min / chantier',
    cap_max_label: 'Puissance max / chantier',
    cap_mensuelle_label: 'Capacité installée / mois',
  },
  'Efficacité énergétique': {
    label: 'Efficacité énergétique',
    icon: Leaf,
    iconColor: 'bg-emerald-500/15 text-emerald-400',
    activeCard: 'border-emerald-500/40 bg-emerald-500/8',
    badgeCls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    types_projets: [
      'Audit énergétique', 'CPE (Contrat de performance énergétique)',
      'Isolation thermique ITE / ITI', 'Remplacement éclairage LED',
      'GTB / GTC / Automate bâtiment', 'Smart building / BMS',
      'Récupération chaleur', 'Stockage énergie (BESS)',
    ],
    certifications: [
      'RGE', 'Qualibat', 'ISO 50001', 'ISO 9001', 'ISO 14001', 'BREEAM', 'HQE',
    ],
    secteurs_clients: [
      'Industrie', 'Collectivités territoriales', 'Tertiaire / bureaux',
      'Hôpitaux / Santé', 'Logistique / entrepôts', 'Hôtellerie', 'Copropriétés',
    ],
    cap_unit: 'kWh/an',
    cap_min_label: 'Économies min estimées',
    cap_max_label: 'Économies max estimées',
    cap_mensuelle_label: 'Volume traité / mois',
  },
  'Multi-activité': {
    label: 'Multi-activité',
    icon: Layers,
    iconColor: 'bg-blue-500/15 text-blue-400',
    activeCard: 'border-blue-500/40 bg-blue-500/8',
    badgeCls: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
    types_projets: [
      'Photovoltaïque', 'IRVE / Mobilité électrique', 'Désamiantage',
      'Éolien', 'BTP / Génie civil', 'Électricité tertiaire / industrielle',
      'CVC', 'Efficacité énergétique', 'Réhabilitation multi-lots', 'Autre',
    ],
    certifications: [
      'RGE', 'QualiPV Bat', 'QualiPV Elec', 'Qualifelec', 'IRVE P1', 'IRVE P2',
      'Qualibat', 'MASE', 'ISO 9001', 'ISO 14001', 'ISO 45001', 'ISO 50001',
      'Certification SS3', 'Certification SS4', 'COFRAC', 'BREEAM', 'HQE',
    ],
    secteurs_clients: [
      'Industrie', 'Collectivités territoriales', 'Tertiaire / bureaux',
      'Grande distribution', 'Logistique / entrepôts', 'Agriculture',
      'Enseignement', 'Santé', 'Hôtellerie', 'Particuliers', 'Promoteurs',
      'Bailleurs sociaux', 'Syndics de copropriété',
    ],
    cap_unit: '€',
    cap_min_label: 'Budget min / projet',
    cap_max_label: 'Budget max / projet',
    cap_mensuelle_label: 'Volume mensuel',
  },
}

const SECTOR_KEYS = Object.keys(SECTOR_CONFIG)

function getSector(secteur: string | undefined): SectorConfig {
  return SECTOR_CONFIG[secteur ?? ''] ?? SECTOR_CONFIG['Photovoltaïque']
}

// ── Shared atoms ──────────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon, color, label, sub,
}: { icon: React.ElementType; color: string; label: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-sm font-bold text-white">{label}</p>
        <p className="text-xs text-white/35 mt-0.5">{sub}</p>
      </div>
    </div>
  )
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-[var(--bg-card)] border border-white/8 rounded-2xl p-5 md:p-6', className)}>
      {children}
    </div>
  )
}

function Divider() {
  return <div className="h-px bg-white/5 my-6" />
}

function Label({ children, tooltip }: { children: React.ReactNode; tooltip?: string }) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
      {children}
      {tooltip && (
        <span className="group relative inline-flex cursor-help">
          <Info size={11} className="text-white/20 hover:text-white/50 transition-colors" />
          <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-xl bg-[var(--bg-surface)] border border-white/10 px-3 py-2 text-[11px] text-white/60 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl leading-relaxed">
            {tooltip}
          </span>
        </span>
      )}
    </label>
  )
}

function TextInput({
  value, onChange, placeholder, type = 'text', prefix,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string
  type?: string; prefix?: string
}) {
  return (
    <div className="relative flex items-center">
      {prefix && <span className="absolute left-3 text-white/25 text-sm pointer-events-none">{prefix}</span>}
      <input
        type={type}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full py-2.5 rounded-xl bg-white/5 border border-white/8 text-sm text-white',
          'placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all',
          prefix ? 'pl-7 pr-3' : 'px-3',
        )}
      />
    </div>
  )
}

function NumberInput({
  value, onChange, placeholder, min, max, suffix,
}: {
  value: number; onChange: (v: number) => void; placeholder?: string
  min?: number; max?: number; suffix?: string
}) {
  return (
    <div className="relative flex items-center">
      <input
        type="number"
        min={min}
        max={max}
        value={value || ''}
        onChange={e => onChange(Number(e.target.value))}
        placeholder={placeholder ?? '0'}
        className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-white/5 border border-white/8 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all"
      />
      {suffix && <span className="absolute right-3 text-white/25 text-xs pointer-events-none">{suffix}</span>}
    </div>
  )
}

function SelectInput({
  value, onChange, options, placeholder,
}: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string
}) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/8 text-sm text-white/80 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all appearance-none cursor-pointer"
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='rgba(255,255,255,0.3)' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '16px' }}
    >
      {placeholder && <option value="" className="bg-[#13161e] text-white/40">{placeholder}</option>}
      {options.map(o => <option key={o} value={o} className="bg-[#13161e] text-white">{o}</option>)}
    </select>
  )
}

function Chips({
  options, selected, onChange, colorActive = 'bg-blue-600 text-white border-blue-600',
}: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void; colorActive?: string
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = selected.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(active ? selected.filter(s => s !== opt) : [...selected, opt])}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
              active
                ? colorActive
                : 'bg-white/4 text-white/50 border-white/8 hover:border-blue-400/40 hover:text-white/80 hover:bg-white/8',
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
  values, onChange, placeholder,
}: { values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
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
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder ?? 'Ajouter et appuyer sur Entrée…'}
          className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/8 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all"
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"
        >
          <Plus size={15} />
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map(v => (
            <span key={v} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/15 text-blue-300 text-xs font-medium rounded-full border border-blue-500/20">
              {v}
              <button type="button" onClick={() => onChange(values.filter(s => s !== v))} className="hover:text-red-400 transition-colors">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function WeightSelector({
  label, value, onChange, tooltip,
}: { label: string; value: number; onChange: (v: number) => void; tooltip: string }) {
  const LEVELS = [
    { v: 1, label: 'Faible',   color: 'from-white/20 to-white/10' },
    { v: 2, label: 'Bas',      color: 'from-blue-500/60 to-blue-600/40' },
    { v: 3, label: 'Normal',   color: 'from-blue-500 to-blue-600' },
    { v: 4, label: 'Élevé',    color: 'from-amber-500 to-amber-600' },
    { v: 5, label: 'Critique', color: 'from-red-500 to-red-600' },
  ]
  const current = LEVELS.find(l => l.v === value)
  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <label className="text-sm font-medium text-white/70 flex items-center gap-1.5">
          {label}
          <span className="group relative cursor-help">
            <Info size={11} className="text-white/20 hover:text-white/50 transition-colors" />
            <span className="pointer-events-none absolute bottom-full left-0 mb-2 w-52 rounded-xl bg-[var(--bg-surface)] border border-white/10 px-3 py-2 text-[11px] text-white/55 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl leading-relaxed">
              {tooltip}
            </span>
          </span>
        </label>
        <span className={cn(
          'text-xs font-bold px-2.5 py-1 rounded-full tabular-nums',
          value === 1 ? 'bg-white/8 text-white/40' :
          value === 2 ? 'bg-blue-500/15 text-blue-400' :
          value === 3 ? 'bg-blue-600/20 text-blue-300' :
          value === 4 ? 'bg-amber-500/15 text-amber-400' :
                        'bg-red-500/15 text-red-400',
        )}>
          ×{value} — {current?.label}
        </span>
      </div>
      <div className="flex gap-1.5">
        {LEVELS.map(({ v, label: lbl }) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              'flex-1 h-9 rounded-lg text-xs font-bold transition-all border',
              value === v
                ? `bg-gradient-to-b ${LEVELS[v - 1].color} text-white border-transparent shadow-sm`
                : 'bg-white/4 text-white/30 border-white/8 hover:border-white/20 hover:text-white/60',
            )}
          >
            ×{v}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Sector selector card ──────────────────────────────────────────────────────

function SectorPicker({
  value, onChange,
}: { value: string | undefined; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {SECTOR_KEYS.map(key => {
        const cfg = SECTOR_CONFIG[key]
        const Icon = cfg.icon
        const active = value === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              'relative flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all text-center',
              active
                ? cn('border-white/20', cfg.activeCard)
                : 'border-white/7 bg-white/3 hover:bg-white/6 hover:border-white/15',
            )}
          >
            {active && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-white/90 rounded-full flex items-center justify-center">
                <Check size={9} className="text-black" />
              </span>
            )}
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', cfg.iconColor)}>
              <Icon size={15} />
            </div>
            <span className={cn('text-[11px] font-semibold leading-tight', active ? 'text-white' : 'text-white/55')}>
              {cfg.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── Sector context banner (shown in non-profil tabs) ─────────────────────────

function SectorBanner({ secteur }: { secteur: string | undefined }) {
  if (!secteur) return null
  const cfg = getSector(secteur)
  const Icon = cfg.icon
  return (
    <div className={cn(
      'flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-medium',
      cfg.badgeCls,
    )}>
      <Icon size={13} />
      <span>Critères adaptés pour le secteur <strong>{cfg.label}</strong> — unité : <strong>{cfg.cap_unit}</strong></span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

type Tab = 'profil' | 'perimetre' | 'capacites' | 'scoring' | 'import'

interface CriteriaFormProps {
  criteria: CompanyCriteria
  activeTab: Tab
  onUpdate: <K extends keyof CompanyCriteria>(key: K, value: CompanyCriteria[K]) => void
}

export function CriteriaForm({ criteria, activeTab, onUpdate }: CriteriaFormProps) {
  if (activeTab === 'import') return null

  const sector = getSector(criteria.secteur_principal)
  const totalPoids = criteria.poids_rentabilite + criteria.poids_complexite +
    criteria.poids_alignement + criteria.poids_probabilite + criteria.poids_charge

  return (
    <div className="p-5 md:p-8 space-y-5 animate-fade-in">

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'profil' && (
        <>
          {/* Sector picker — prominent, at the top */}
          <Card>
            <SectionHeader
              icon={Sparkles}
              color="bg-blue-500/15 text-blue-400"
              label="Secteur d'activité"
              sub="Définit les certifications, types de projets et unités de capacité proposés dans le formulaire"
            />
            <SectorPicker
              value={criteria.secteur_principal}
              onChange={v => onUpdate('secteur_principal', v)}
            />
            {!criteria.secteur_principal && (
              <p className="mt-3 text-[11px] text-amber-400/70 flex items-center gap-1.5">
                <AlertTriangle size={11} />
                Choisissez un secteur pour afficher des critères adaptés à votre activité.
              </p>
            )}
          </Card>

          {/* Company identity */}
          <Card>
            <SectionHeader icon={Building2} color="bg-blue-500/15 text-blue-400" label="Identité de l'entreprise" sub="Informations légales et administratives" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Raison sociale</Label>
                <TextInput value={criteria.raison_sociale ?? ''} onChange={v => onUpdate('raison_sociale', v)} placeholder="Acme SAS" />
              </div>
              <div>
                <Label tooltip="Numéro SIREN (9 chiffres) ou SIRET (14 chiffres)">SIREN / SIRET</Label>
                <TextInput value={criteria.siren ?? ''} onChange={v => onUpdate('siren', v)} placeholder="123 456 789" />
              </div>
              <div>
                <Label>Site web</Label>
                <TextInput value={criteria.site_web ?? ''} onChange={v => onUpdate('site_web', v)} placeholder="https://www.acme.fr" prefix="🌐" />
              </div>
              <div>
                <Label>Année de création</Label>
                <TextInput value={criteria.annee_creation ?? ''} onChange={v => onUpdate('annee_creation', v)} placeholder="2012" type="number" />
              </div>
              <div>
                <Label>Effectifs</Label>
                <SelectInput
                  value={criteria.effectifs ?? ''}
                  onChange={v => onUpdate('effectifs', v)}
                  options={EFFECTIFS_OPTIONS}
                  placeholder="Nombre de salariés…"
                />
              </div>
              <div>
                <Label tooltip="Chiffre d'affaires annuel (dernier exercice clos)">CA annuel</Label>
                <SelectInput
                  value={criteria.ca_annuel ?? ''}
                  onChange={v => onUpdate('ca_annuel', v)}
                  options={CA_OPTIONS}
                  placeholder="Tranche de CA…"
                />
              </div>
            </div>
          </Card>

          {/* Company description */}
          <Card>
            <SectionHeader icon={FileText} color="bg-violet-500/15 text-violet-400" label="Présentation de l'entreprise" sub="Description transmise à l'IA à chaque scoring" />
            <div className="space-y-2">
              <Label tooltip="Ce texte est lu par l'IA lors de chaque scoring. Décrivez votre positionnement, vos forces et votre stratégie.">
                Description & positionnement
              </Label>
              <textarea
                value={criteria.description_courte ?? ''}
                onChange={e => onUpdate('description_courte', e.target.value)}
                rows={5}
                placeholder={
                  criteria.secteur_principal === 'IRVE'
                    ? "Ex : Entreprise spécialisée dans l'installation de bornes de recharge pour véhicules électriques. Certifiée IRVE P2. Présente en Île-de-France et PACA."
                    : criteria.secteur_principal === 'Désamiantage'
                    ? "Ex : Entreprise certifiée SS3 et SS4 intervenant sur des chantiers de désamiantage industriels et tertiaires depuis 2010. Présente sur toute la région Grand Est."
                    : "Ex : Entreprise spécialisée dans l'installation de panneaux solaires en toiture industrielle et commerciale depuis 2015. Présente principalement en Île-de-France. Certifiée RGE et QualiPV Elec."
                }
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 resize-none leading-relaxed transition-all"
              />
              <p className="text-[10px] text-white/25 text-right tabular-nums">
                {(criteria.description_courte ?? '').length} / 600 caractères
              </p>
            </div>
          </Card>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'perimetre' && (
        <>
          <SectorBanner secteur={criteria.secteur_principal} />

          <Card>
            <SectionHeader icon={MapPin} color="bg-blue-500/15 text-blue-400" label="Périmètre géographique" sub="Régions où votre entreprise intervient habituellement" />
            <Chips options={ZONES_GEO} selected={criteria.zones_geo} onChange={v => onUpdate('zones_geo', v)} />
            {criteria.zones_geo.length > 0 && (
              <p className="text-[11px] text-white/30 mt-3">
                {criteria.zones_geo.length} région{criteria.zones_geo.length > 1 ? 's' : ''} sélectionnée{criteria.zones_geo.length > 1 ? 's' : ''}
              </p>
            )}
          </Card>

          <Card>
            <SectionHeader
              icon={Wrench}
              color="bg-violet-500/15 text-violet-400"
              label="Types de projets maîtrisés"
              sub="Typologies avec références et expertise reconnue"
            />
            {!criteria.secteur_principal && (
              <p className="text-xs text-white/35 mb-3 italic">
                Sélectionnez un secteur dans l'onglet Profil pour voir des types de projets adaptés.
              </p>
            )}
            <Chips
              options={sector.types_projets}
              selected={criteria.types_projets}
              onChange={v => onUpdate('types_projets', v)}
            />
            {/* Custom tag input for additional project types */}
            <Divider />
            <p className="text-[11px] text-white/30 mb-3 font-medium">Ajouter d'autres types de projets</p>
            <TagsInput
              values={criteria.types_projets.filter(t => !sector.types_projets.includes(t))}
              onChange={custom => onUpdate('types_projets', [
                ...criteria.types_projets.filter(t => sector.types_projets.includes(t)),
                ...custom,
              ])}
              placeholder="Autre type de projet… (Entrée)"
            />
          </Card>

          <Card>
            <SectionHeader icon={Users} color="bg-emerald-500/15 text-emerald-400" label="Secteurs clients ciblés" sub="Segments de marché où vous êtes le plus compétitif" />
            {!criteria.secteur_principal && (
              <p className="text-xs text-white/35 mb-3 italic">
                Sélectionnez un secteur dans l'onglet Profil pour voir des clients adaptés.
              </p>
            )}
            <Chips
              options={sector.secteurs_clients}
              selected={criteria.secteurs_clients}
              onChange={v => onUpdate('secteurs_clients', v)}
            />
          </Card>

          <Card>
            <SectionHeader icon={Briefcase} color="bg-amber-500/15 text-amber-400" label="Type de marché" sub="Nature des appels d'offres que vous ciblez" />
            <div className="flex gap-3">
              {([
                { value: 'public',  label: 'Marchés publics',  sub: 'Collectivités, État, EPCI' },
                { value: 'prive',   label: 'Marchés privés',   sub: 'Entreprises, promoteurs' },
                { value: 'mixte',   label: 'Les deux',         sub: 'Sans préférence' },
              ] as const).map(({ value, label, sub }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onUpdate('marche_type', value)}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1.5 px-3 py-3.5 rounded-xl border text-center transition-all',
                    criteria.marche_type === value
                      ? 'bg-blue-600/15 border-blue-500/40 text-blue-400'
                      : 'bg-white/3 border-white/8 text-white/40 hover:border-white/20 hover:text-white/70',
                  )}
                >
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-[10px] text-white/35">{sub}</p>
                </button>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'capacites' && (
        <>
          <SectorBanner secteur={criteria.secteur_principal} />

          {/* Technical capacity */}
          <Card>
            <SectionHeader
              icon={sector.icon}
              color={sector.iconColor}
              label="Capacités techniques"
              sub={`Plage de ${sector.cap_unit} et volume mensuel que vous pouvez absorber`}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label tooltip="Taille minimale de projet acceptée">{sector.cap_min_label}</Label>
                <NumberInput
                  value={criteria.puissance_min_kwc}
                  onChange={v => onUpdate('puissance_min_kwc', v)}
                  suffix={sector.cap_unit}
                  min={0}
                />
              </div>
              <div>
                <Label tooltip="Au-delà, le projet dépasse votre capacité ou financement">{sector.cap_max_label}</Label>
                <NumberInput
                  value={criteria.puissance_max_kwc}
                  onChange={v => onUpdate('puissance_max_kwc', v)}
                  suffix={sector.cap_unit}
                  min={0}
                />
              </div>
              <div>
                <Label tooltip="Volume que vous pouvez traiter par mois avec vos équipes">{sector.cap_mensuelle_label}</Label>
                <NumberInput
                  value={criteria.capacite_mensuelle_kwc}
                  onChange={v => onUpdate('capacite_mensuelle_kwc', v)}
                  suffix={sector.cap_unit}
                  min={0}
                />
              </div>
            </div>

            {/* Visual range bar */}
            {criteria.puissance_max_kwc > criteria.puissance_min_kwc && (
              <div className="mt-4 p-3 bg-white/3 rounded-xl border border-white/6">
                <p className="text-[10px] text-white/35 mb-2">Fenêtre d&apos;acceptation</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-white/40 tabular-nums w-20 text-right truncate">
                    {criteria.puissance_min_kwc.toLocaleString('fr-FR')} {sector.cap_unit}
                  </span>
                  <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500/60 to-amber-400 rounded-full" style={{ width: '100%' }} />
                  </div>
                  <span className="text-white/40 tabular-nums w-20 truncate">
                    {criteria.puissance_max_kwc.toLocaleString('fr-FR')} {sector.cap_unit}
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* Financial capacity */}
          <Card>
            <SectionHeader icon={Euro} color="bg-emerald-500/15 text-emerald-400" label="Capacité financière" sub="Valeur des marchés que vous pouvez adresser" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label tooltip="Montant minimal de marché acceptable (en €)">Budget min acceptable</Label>
                <NumberInput value={criteria.budget_min_eur ?? 0} onChange={v => onUpdate('budget_min_eur', v)} suffix="€" min={0} />
              </div>
              <div>
                <Label tooltip="Montant maximal de marché que vous pouvez financer et exécuter">Budget max acceptable</Label>
                <NumberInput value={criteria.budget_max_eur ?? 0} onChange={v => onUpdate('budget_max_eur', v)} suffix="€" min={0} />
              </div>
            </div>
          </Card>

          {/* Operations */}
          <Card>
            <SectionHeader icon={Layers} color="bg-indigo-500/15 text-indigo-400" label="Organisation & charge" sub="Contraintes opérationnelles de votre équipe" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label tooltip="Combien de projets en parallèle votre équipe peut-elle gérer ?">Projets simultanés max</Label>
                <NumberInput value={criteria.nb_projets_simultanees ?? 3} onChange={v => onUpdate('nb_projets_simultanees', v)} min={1} max={50} />
              </div>
              <div>
                <Label tooltip="Délai moyen entre la signature et la mise en service">Délai moyen d'exécution</Label>
                <SelectInput
                  value={criteria.delai_execution ?? ''}
                  onChange={v => onUpdate('delai_execution', v)}
                  options={DELAI_OPTIONS}
                  placeholder="Choisir une durée…"
                />
              </div>
            </div>
          </Card>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'scoring' && (
        <>
          <SectorBanner secteur={criteria.secteur_principal} />

          {/* Certifications — dynamic per sector */}
          <Card>
            <SectionHeader icon={Award} color="bg-emerald-500/15 text-emerald-400" label="Certifications & qualifications" sub="Qualifications actuellement détenues par votre entreprise" />
            {!criteria.secteur_principal && (
              <p className="text-xs text-white/35 mb-3 italic">
                Sélectionnez un secteur dans l'onglet Profil pour voir des certifications adaptées.
              </p>
            )}
            <Chips
              options={sector.certifications}
              selected={criteria.certifications}
              onChange={v => onUpdate('certifications', v)}
              colorActive="bg-emerald-600/20 text-emerald-300 border-emerald-500/40"
            />
            {/* Custom certifications */}
            <Divider />
            <p className="text-[11px] text-white/30 mb-3 font-medium">Ajouter d'autres certifications</p>
            <TagsInput
              values={criteria.certifications.filter(c => !sector.certifications.includes(c))}
              onChange={custom => onUpdate('certifications', [
                ...criteria.certifications.filter(c => sector.certifications.includes(c)),
                ...custom,
              ])}
              placeholder="Autre certification… (Entrée)"
            />
          </Card>

          {/* Min margin */}
          <Card>
            <SectionHeader icon={TrendingUp} color="bg-rose-500/15 text-rose-400" label="Marge minimale acceptée" sub="Un projet sous ce seuil pénalisera le score Rentabilité" />
            <div className="flex items-center gap-5">
              <input
                type="range"
                min={2}
                max={35}
                step={0.5}
                value={criteria.rentabilite_min_pct}
                onChange={e => onUpdate('rentabilite_min_pct', Number(e.target.value))}
                className="flex-1 h-2 rounded-full cursor-pointer accent-rose-500"
              />
              <div className="flex items-baseline gap-1 w-24 justify-end flex-shrink-0">
                <span className="text-4xl font-extrabold text-rose-400 tabular-nums">{criteria.rentabilite_min_pct}</span>
                <span className="text-xl font-bold text-rose-500/60">%</span>
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-white/25 mt-1">
              <span>2 %</span><span>35 %</span>
            </div>
          </Card>

          {/* Key strengths */}
          <Card>
            <SectionHeader icon={Star} color="bg-amber-500/15 text-amber-400" label="Points forts de l'entreprise" sub="Arguments différenciants pris en compte pour la probabilité de gain" />
            <TagsInput
              values={criteria.points_forts}
              onChange={v => onUpdate('points_forts', v)}
              placeholder="Ex : Délais courts, SAV réactif, référence locale… (Entrée)"
            />
          </Card>

          {/* Exclusion keywords */}
          <Card>
            <SectionHeader icon={AlertTriangle} color="bg-red-500/15 text-red-400" label="Mots-clés d'exclusion" sub="Termes dans un DCE qui déclenchent automatiquement un NO GO" />
            <TagsInput
              values={criteria.mots_cles_exclusion ?? []}
              onChange={v => onUpdate('mots_cles_exclusion', v)}
              placeholder="Ex : Amiante, nucléaire, offshore… (Entrée)"
            />
          </Card>

          {/* Score weights */}
          <Card>
            <SectionHeader icon={SlidersHorizontal} color="bg-indigo-500/15 text-indigo-400" label="Pondérations des critères" sub="Ajustez l'importance relative de chaque critère dans le score final" />
            <div className="space-y-5">
              <WeightSelector label="Rentabilité"         value={criteria.poids_rentabilite}  onChange={v => onUpdate('poids_rentabilite', v)}  tooltip="Importance du potentiel de marge dans la décision" />
              <WeightSelector label="Complexité"          value={criteria.poids_complexite}   onChange={v => onUpdate('poids_complexite', v)}   tooltip="Importance de la simplicité d'exécution (score inversé : complexe = pénalisé)" />
              <WeightSelector label="Alignement capacité" value={criteria.poids_alignement}   onChange={v => onUpdate('poids_alignement', v)}   tooltip="Adéquation entre les exigences du projet et vos capacités réelles" />
              <WeightSelector label="Probabilité de gain" value={criteria.poids_probabilite}  onChange={v => onUpdate('poids_probabilite', v)}  tooltip="Vos chances de remporter le marché (références, position concurrentielle)" />
              <WeightSelector label="Charge interne"      value={criteria.poids_charge}       onChange={v => onUpdate('poids_charge', v)}       tooltip="Légèreté en ressources humaines requises (score inversé : charge lourde = pénalisé)" />
            </div>

            {/* Weight distribution bars */}
            <Divider />
            <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider mb-3">Répartition des poids</p>
            <div className="flex gap-2 items-end h-20">
              {[
                { key: 'Rent.',   poids: criteria.poids_rentabilite,  color: 'bg-rose-500' },
                { key: 'Compl.',  poids: criteria.poids_complexite,   color: 'bg-amber-500' },
                { key: 'Align.',  poids: criteria.poids_alignement,   color: 'bg-blue-500' },
                { key: 'Prob.',   poids: criteria.poids_probabilite,  color: 'bg-emerald-500' },
                { key: 'Charge',  poids: criteria.poids_charge,       color: 'bg-violet-500' },
              ].map(({ key, poids, color }) => {
                const pct = Math.round((poids / totalPoids) * 100)
                return (
                  <div key={key} className="flex-1 flex flex-col items-center justify-end gap-1">
                    <span className="text-[10px] font-bold text-white/60 tabular-nums">{pct}%</span>
                    <div
                      className={cn('w-full rounded-t-md transition-all duration-300 opacity-80', color)}
                      style={{ height: `${Math.max(6, pct * 0.6)}px` }}
                    />
                    <span className="text-[9px] text-white/30 truncate w-full text-center">{key}</span>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* AI notes */}
          <Card>
            <SectionHeader icon={BarChart3} color="bg-blue-500/15 text-blue-400" label="Notes pour l'IA" sub="Contexte supplémentaire transmis à Claude lors de chaque scoring" />
            <textarea
              value={criteria.notes}
              onChange={e => onUpdate('notes', e.target.value)}
              rows={5}
              placeholder="Ex : Nous sommes en forte croissance, ciblons des marchés publics supérieurs à 1 M€, avons des difficultés de recrutement en 2024 et n'acceptons plus les projets à plus de 300 km de Paris."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 resize-none leading-relaxed transition-all"
            />
            <p className="text-[10px] text-white/25 text-right mt-1 tabular-nums">
              {criteria.notes.length} / 800 caractères
            </p>
          </Card>
        </>
      )}
    </div>
  )
}
