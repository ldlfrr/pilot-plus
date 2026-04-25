'use client'

import { useState } from 'react'
import {
  Plus, X, Info, MapPin, Briefcase, Award, Users,
  Star, Globe, Euro, BarChart3, Check, Sparkles,
  Building2, Zap, Target, SlidersHorizontal, FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { CompanyCriteria } from '@/types'

// ── Universal data ─────────────────────────────────────────────────────────────

const ZONES_GEO = [
  'Île-de-France', 'Auvergne-Rhône-Alpes', "Provence-Alpes-Côte d'Azur",
  'Occitanie', 'Nouvelle-Aquitaine', 'Grand Est', 'Hauts-de-France',
  'Normandie', 'Bretagne', 'Pays de la Loire', 'Centre-Val de Loire',
  'Bourgogne-Franche-Comté', 'Corse', 'DOM-TOM', 'National',
]

const EFFECTIFS_OPTIONS = ['1 – 5', '6 – 20', '21 – 50', '51 – 200', '201 – 500', '500+']
const CA_OPTIONS = ['< 500 k€', '500 k€ – 2 M€', '2 – 10 M€', '10 – 50 M€', '50 – 200 M€', '200 M€+']
const DELAI_OPTIONS = ['< 1 mois', '1 – 3 mois', '3 – 6 mois', '6 – 12 mois', '> 12 mois']

const TYPES_PROJETS_SUGGESTIONS = [
  'Travaux publics', 'Bâtiment / Construction', 'Réhabilitation',
  'Maintenance', 'Étude / Conseil', 'Fournitures',
  'Services informatiques', 'Prestations intellectuelles',
  'Formation', 'Nettoyage / Entretien',
  'Sécurité / Surveillance', 'Transport / Logistique',
  'Génie civil', 'Infrastructure réseaux', 'Énergie / ENR',
  'Environnement', 'Numérique / IT', 'Santé / Médical',
  'Alimentaire / Restauration', 'Événementiel',
]

const SECTEURS_CLIENTS = [
  'Collectivités territoriales', 'État / Établissements publics',
  'Industrie', 'Tertiaire / Bureaux', 'Grande distribution',
  'Santé / Hôpitaux', 'Enseignement', 'Logistique / Entrepôts',
  'Hôtellerie / Restauration', 'Agriculture',
  'Bailleurs sociaux / Promoteurs', 'Syndics / Copropriétés',
  'PME / Entreprises privées', 'Particuliers',
  'Associations / ONG',
]

const CERTIFICATIONS_SUGGESTIONS = [
  'ISO 9001', 'ISO 14001', 'ISO 45001', 'ISO 50001',
  'RGE', 'Qualibat', 'Qualifelec', 'QualiPV Bat', 'QualiPV Elec',
  'IRVE P1', 'IRVE P2', 'MASE', 'COFRAC',
  'BREEAM', 'HQE', 'OPQIBI', 'AFNOR',
  'Certification SS3', 'Certification SS4',
]

const POINTS_FORTS_SUGGESTIONS = [
  'Expertise technique reconnue', 'Prix compétitif',
  'Réactivité et flexibilité', 'Références similaires',
  'Équipe expérimentée', 'Certifications spécifiques',
  'Proximité géographique', 'Capacité financière',
  'Innovation & R&D', 'Service après-vente',
]

// ── Atoms ──────────────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, color, label, sub }: { icon: React.ElementType; color: string; label: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
        <Icon size={18} />
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

function FieldLabel({ children, tooltip }: { children: React.ReactNode; tooltip?: string }) {
  return (
    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-white/45 uppercase tracking-wider mb-2">
      {children}
      {tooltip && (
        <span className="group relative inline-flex cursor-help">
          <Info size={10} className="text-white/20 hover:text-white/50 transition-colors" />
          <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-xl bg-[var(--bg-surface)] border border-white/10 px-3 py-2 text-[11px] text-white/60 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl leading-relaxed normal-case tracking-normal font-normal">
            {tooltip}
          </span>
        </span>
      )}
    </label>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 rounded-xl bg-white/4 border border-white/8 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/30 transition-all"
    />
  )
}

function SelectInput({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string
}) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3.5 py-2.5 rounded-xl bg-white/4 border border-white/8 text-sm text-white/80 focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/30 transition-all appearance-none cursor-pointer"
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='rgba(255,255,255,0.3)' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '16px' }}
    >
      {placeholder && <option value="" className="bg-[#13161e] text-white/40">{placeholder}</option>}
      {options.map(o => <option key={o} value={o} className="bg-[#13161e] text-white">{o}</option>)}
    </select>
  )
}

function NumberInput({ value, onChange, placeholder, min, max, suffix }: {
  value: number; onChange: (v: number) => void; placeholder?: string; min?: number; max?: number; suffix?: string
}) {
  return (
    <div className="relative">
      <input
        type="number" min={min} max={max}
        value={value || ''}
        onChange={e => onChange(Number(e.target.value))}
        placeholder={placeholder ?? '0'}
        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white/4 border border-white/8 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/30 transition-all"
      />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 text-xs pointer-events-none">{suffix}</span>}
    </div>
  )
}

// Chip row for multi-select
function ChipGrid({ options, selected, onChange, colorActive = 'bg-blue-600 text-white border-blue-600/80' }: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void; colorActive?: string
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = selected.includes(opt)
        return (
          <button key={opt} type="button"
            onClick={() => onChange(active ? selected.filter(s => s !== opt) : [...selected, opt])}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
              active
                ? colorActive
                : 'bg-white/3 text-white/50 border-white/8 hover:border-white/25 hover:text-white/75 hover:bg-white/6',
            )}
          >
            {active && <Check size={9} className="inline mr-1" />}{opt}
          </button>
        )
      })}
    </div>
  )
}

// Free-text tag input with optional suggestions
function TagsInput({ values, onChange, placeholder, suggestions }: {
  values: string[]; onChange: (v: string[]) => void; placeholder?: string; suggestions?: string[]
}) {
  const [input, setInput] = useState('')
  function add(v?: string) {
    const val = (v ?? input).trim()
    if (val && !values.includes(val)) onChange([...values, val])
    if (!v) setInput('')
  }
  const filteredSuggestions = (suggestions ?? []).filter(s => !values.includes(s))
  return (
    <div className="space-y-3">
      {/* Selected tags */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map(v => (
            <span key={v} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600/20 border border-blue-500/35 text-xs font-medium text-blue-300">
              {v}
              <button type="button" onClick={() => onChange(values.filter(x => x !== v))} className="text-blue-400/60 hover:text-blue-300 transition-colors">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder ?? 'Ajouter…'}
          className="flex-1 px-3.5 py-2 rounded-xl bg-white/4 border border-white/8 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/30 transition-all"
        />
        <button type="button" onClick={() => add()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/6 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-medium transition-all">
          <Plus size={12} />Ajouter
        </button>
      </div>
      {/* Suggestions */}
      {filteredSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filteredSuggestions.slice(0, 12).map(s => (
            <button key={s} type="button" onClick={() => add(s)}
              className="px-2.5 py-1 rounded-lg bg-white/3 border border-white/8 text-[11px] text-white/35 hover:border-white/25 hover:text-white/60 hover:bg-white/6 transition-all">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Weight slider component
function WeightSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const pct = Math.round((value / 5) * 100)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/60">{label}</span>
        <span className="text-xs font-bold text-blue-400 tabular-nums">{value}/5</span>
      </div>
      <div className="relative h-1.5 bg-white/8 rounded-full">
        <div className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-200"
          style={{ width: `${pct}%` }} />
        <input type="range" min={1} max={5} step={1} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
        />
      </div>
      <div className="flex justify-between text-[9px] text-white/20">
        <span>Faible</span><span>Fort</span>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface CriteriaFormProps {
  criteria:   CompanyCriteria
  activeTab:  'profil' | 'perimetre' | 'capacites' | 'scoring'
  onUpdate:   <K extends keyof CompanyCriteria>(key: K, value: CompanyCriteria[K]) => void
}

export function CriteriaForm({ criteria, activeTab, onUpdate }: CriteriaFormProps) {
  return (
    <div className="p-5 md:p-8 max-w-3xl space-y-6">

      {/* ── PROFIL ENTREPRISE ─────────────────────────────────────────────── */}
      {activeTab === 'profil' && (
        <>
          <SectionHeader icon={Building2} color="bg-blue-500/15 text-blue-400" label="Profil entreprise" sub="Identité et informations générales" />

          <Card>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-4">Identité légale</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Raison sociale</FieldLabel>
                <TextInput value={criteria.raison_sociale ?? ''} onChange={v => onUpdate('raison_sociale', v)} placeholder="Ex: ACME SAS" />
              </div>
              <div>
                <FieldLabel>SIREN</FieldLabel>
                <TextInput value={criteria.siren ?? ''} onChange={v => onUpdate('siren', v)} placeholder="123 456 789" />
              </div>
              <div>
                <FieldLabel>Secteur d'activité</FieldLabel>
                <TextInput value={criteria.secteur_principal ?? ''} onChange={v => onUpdate('secteur_principal', v)} placeholder="Ex: BTP, Énergie, IT, Conseil…" />
              </div>
              <div>
                <FieldLabel>Année de création</FieldLabel>
                <TextInput value={criteria.annee_creation ?? ''} onChange={v => onUpdate('annee_creation', v)} placeholder="Ex: 2012" />
              </div>
              <div>
                <FieldLabel>Site web</FieldLabel>
                <TextInput type="url" value={criteria.site_web ?? ''} onChange={v => onUpdate('site_web', v)} placeholder="https://www.acme.fr" />
              </div>
            </div>
          </Card>

          <Card>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-4">Taille & Chiffre d'affaires</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Effectifs</FieldLabel>
                <SelectInput value={criteria.effectifs ?? ''} onChange={v => onUpdate('effectifs', v)} options={EFFECTIFS_OPTIONS} placeholder="Choisir…" />
              </div>
              <div>
                <FieldLabel>CA annuel</FieldLabel>
                <SelectInput value={criteria.ca_annuel ?? ''} onChange={v => onUpdate('ca_annuel', v)} options={CA_OPTIONS} placeholder="Choisir…" />
              </div>
            </div>
          </Card>

          <Card>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-4">Description</p>
            <FieldLabel>Présentation courte <span className="normal-case font-normal tracking-normal ml-1 text-white/20">(utilisée dans le scoring IA)</span></FieldLabel>
            <textarea
              value={criteria.description_courte ?? ''}
              onChange={e => onUpdate('description_courte', e.target.value)}
              rows={4}
              placeholder="Décrivez votre entreprise, vos métiers principaux, vos points différenciants…"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/4 border border-white/8 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/30 transition-all resize-none"
            />
          </Card>
        </>
      )}

      {/* ── PÉRIMÈTRE ─────────────────────────────────────────────────────── */}
      {activeTab === 'perimetre' && (
        <>
          <SectionHeader icon={MapPin} color="bg-emerald-500/15 text-emerald-400" label="Périmètre & marchés" sub="Zones géographiques, types de projets et clients cibles" />

          <Card>
            <FieldLabel>
              <Globe size={11} />Zones géographiques
              <span className="ml-auto text-[10px] text-white/20 normal-case font-normal tracking-normal">
                {criteria.zones_geo.length} sélectionnée{criteria.zones_geo.length > 1 ? 's' : ''}
              </span>
            </FieldLabel>
            <ChipGrid
              options={ZONES_GEO}
              selected={criteria.zones_geo}
              onChange={v => onUpdate('zones_geo', v)}
              colorActive="bg-emerald-600/80 text-white border-emerald-500/80"
            />
          </Card>

          <Card>
            <FieldLabel>
              <Briefcase size={11} />Types de marchés ciblés
            </FieldLabel>
            <div className="mb-4">
              <ChipGrid
                options={['Public', 'Privé', 'Mixte']}
                selected={criteria.marche_type === 'public' ? ['Public'] : criteria.marche_type === 'prive' ? ['Privé'] : ['Mixte']}
                onChange={v => {
                  const last = v[v.length - 1]
                  onUpdate('marche_type', last === 'Public' ? 'public' : last === 'Privé' ? 'prive' : 'mixte')
                }}
                colorActive="bg-blue-600/80 text-white border-blue-500/80"
              />
            </div>

            <FieldLabel><Star size={11} />Types de projets / prestations</FieldLabel>
            <TagsInput
              values={criteria.types_projets}
              onChange={v => onUpdate('types_projets', v)}
              placeholder="Ajouter un type de projet…"
              suggestions={TYPES_PROJETS_SUGGESTIONS}
            />
          </Card>

          <Card>
            <FieldLabel>
              <Users size={11} />Secteurs clients cibles
            </FieldLabel>
            <ChipGrid
              options={SECTEURS_CLIENTS}
              selected={criteria.secteurs_clients}
              onChange={v => onUpdate('secteurs_clients', v)}
              colorActive="bg-violet-600/80 text-white border-violet-500/80"
            />
            {/* Custom secteur client */}
            <div className="mt-4">
              <TagsInput
                values={criteria.secteurs_clients.filter(s => !SECTEURS_CLIENTS.includes(s))}
                onChange={v => {
                  const standard = criteria.secteurs_clients.filter(s => SECTEURS_CLIENTS.includes(s))
                  onUpdate('secteurs_clients', [...standard, ...v])
                }}
                placeholder="Ajouter un secteur spécifique…"
              />
            </div>
          </Card>
        </>
      )}

      {/* ── CAPACITÉS ─────────────────────────────────────────────────────── */}
      {activeTab === 'capacites' && (
        <>
          <SectionHeader icon={Zap} color="bg-amber-500/15 text-amber-400" label="Capacités" sub="Taille de marchés, délais et volume d'activité" />

          <Card>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-4">Taille de contrat acceptée</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel tooltip="Budget minimum en dessous duquel vous ne répondez pas aux appels d'offres">
                  <Euro size={11} />Budget min (€)
                </FieldLabel>
                <NumberInput
                  value={criteria.budget_min_eur ?? 0}
                  onChange={v => onUpdate('budget_min_eur', v)}
                  placeholder="ex: 50000"
                  suffix="€"
                />
              </div>
              <div>
                <FieldLabel tooltip="Budget maximum au-delà duquel vous ne répondez pas (0 = pas de limite)">
                  <Euro size={11} />Budget max (€)
                </FieldLabel>
                <NumberInput
                  value={criteria.budget_max_eur ?? 0}
                  onChange={v => onUpdate('budget_max_eur', v)}
                  placeholder="ex: 5000000"
                  suffix="€"
                />
              </div>
            </div>
            <p className="text-[10px] text-white/20 mt-2">Laissez à 0 pour indiquer pas de limite. Ces valeurs influencent directement le score Go/No Go.</p>
          </Card>

          <Card>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-4">Capacité de production</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel tooltip="Nombre de projets actifs que vous pouvez gérer en parallèle">
                  <BarChart3 size={11} />Projets simultanés max
                </FieldLabel>
                <NumberInput
                  value={criteria.nb_projets_simultanees ?? 3}
                  onChange={v => onUpdate('nb_projets_simultanees', v)}
                  placeholder="ex: 5"
                  min={1}
                />
              </div>
              <div>
                <FieldLabel>
                  <BarChart3 size={11} />Volume mensuel cible
                </FieldLabel>
                <NumberInput
                  value={criteria.capacite_mensuelle_kwc ?? 0}
                  onChange={v => onUpdate('capacite_mensuelle_kwc', v)}
                  placeholder="ex: 1000"
                  suffix="k€"
                />
              </div>
              <div>
                <FieldLabel>Délai d'exécution habituel</FieldLabel>
                <SelectInput
                  value={criteria.delai_execution ?? ''}
                  onChange={v => onUpdate('delai_execution', v)}
                  options={DELAI_OPTIONS}
                  placeholder="Choisir…"
                />
              </div>
            </div>
          </Card>

          <Card>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-4">Capacités techniques</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel tooltip="Valeur minimale d'un contrat exprimée dans l'unité principale de votre activité">
                  Capacité min / projet
                </FieldLabel>
                <NumberInput
                  value={criteria.puissance_min_kwc ?? 0}
                  onChange={v => onUpdate('puissance_min_kwc', v)}
                  placeholder="ex: 50"
                />
              </div>
              <div>
                <FieldLabel tooltip="Capacité maximale par projet (0 = pas de limite)">
                  Capacité max / projet
                </FieldLabel>
                <NumberInput
                  value={criteria.puissance_max_kwc ?? 0}
                  onChange={v => onUpdate('puissance_max_kwc', v)}
                  placeholder="ex: 5000"
                />
              </div>
            </div>
            <p className="text-[10px] text-white/20 mt-2">Ces champs sont libres — utilisez-les pour toute unité : kWc, m², bornes, jours/homme, etc.</p>
          </Card>
        </>
      )}

      {/* ── SCORING GO/NO GO ──────────────────────────────────────────────── */}
      {activeTab === 'scoring' && (
        <>
          <SectionHeader icon={Target} color="bg-violet-500/15 text-violet-400" label="Scoring Go/No Go" sub="Certifications, pondérations et critères de sélection" />

          <Card>
            <FieldLabel>
              <Award size={11} />Certifications & Agréments
            </FieldLabel>
            <div className="mb-3">
              <ChipGrid
                options={CERTIFICATIONS_SUGGESTIONS}
                selected={criteria.certifications}
                onChange={v => onUpdate('certifications', v)}
                colorActive="bg-violet-600/80 text-white border-violet-500/80"
              />
            </div>
            <TagsInput
              values={criteria.certifications.filter(c => !CERTIFICATIONS_SUGGESTIONS.includes(c))}
              onChange={v => {
                const standard = criteria.certifications.filter(c => CERTIFICATIONS_SUGGESTIONS.includes(c))
                onUpdate('certifications', [...standard, ...v])
              }}
              placeholder="Autre certification…"
            />
          </Card>

          <Card>
            <FieldLabel>
              <Star size={11} />Points forts & différenciateurs
            </FieldLabel>
            <div className="mb-3">
              <ChipGrid
                options={POINTS_FORTS_SUGGESTIONS}
                selected={criteria.points_forts}
                onChange={v => onUpdate('points_forts', v)}
                colorActive="bg-amber-600/80 text-white border-amber-500/80"
              />
            </div>
            <TagsInput
              values={criteria.points_forts.filter(p => !POINTS_FORTS_SUGGESTIONS.includes(p))}
              onChange={v => {
                const standard = criteria.points_forts.filter(p => POINTS_FORTS_SUGGESTIONS.includes(p))
                onUpdate('points_forts', [...standard, ...v])
              }}
              placeholder="Autre point fort…"
            />
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <FieldLabel><SlidersHorizontal size={11} />Pondérations scoring</FieldLabel>
              <span className="text-[10px] text-white/25 normal-case font-normal tracking-normal">Importance de chaque critère de 1 à 5</span>
            </div>
            <div className="space-y-5">
              <WeightSlider label="Rentabilité / Marges" value={criteria.poids_rentabilite} onChange={v => onUpdate('poids_rentabilite', v)} />
              <WeightSlider label="Complexité technique" value={criteria.poids_complexite} onChange={v => onUpdate('poids_complexite', v)} />
              <WeightSlider label="Alignement stratégique" value={criteria.poids_alignement} onChange={v => onUpdate('poids_alignement', v)} />
              <WeightSlider label="Probabilité de gain" value={criteria.poids_probabilite} onChange={v => onUpdate('poids_probabilite', v)} />
              <WeightSlider label="Charge de travail" value={criteria.poids_charge} onChange={v => onUpdate('poids_charge', v)} />
            </div>
          </Card>

          <Card>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-4">Seuils & Filtres</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel tooltip="En dessous de ce taux de marge, le projet sera signalé en rouge dans le scoring">
                  Rentabilité minimum (%)
                </FieldLabel>
                <NumberInput
                  value={criteria.rentabilite_min_pct}
                  onChange={v => onUpdate('rentabilite_min_pct', v)}
                  placeholder="ex: 8"
                  min={0} max={100}
                  suffix="%"
                />
              </div>
            </div>
          </Card>

          <Card>
            <FieldLabel>
              <X size={11} />Mots-clés d'exclusion
              <span className="ml-1 text-[10px] text-white/20 normal-case font-normal tracking-normal">Les projets contenant ces mots ne seront pas recommandés</span>
            </FieldLabel>
            <TagsInput
              values={criteria.mots_cles_exclusion ?? []}
              onChange={v => onUpdate('mots_cles_exclusion', v)}
              placeholder="Ex: amiante, nucléaire, export…"
            />
          </Card>

          <Card>
            <FieldLabel><FileText size={11} />Notes internes</FieldLabel>
            <textarea
              value={criteria.notes ?? ''}
              onChange={e => onUpdate('notes', e.target.value)}
              rows={4}
              placeholder="Notes libres sur votre stratégie commerciale, contraintes particulières…"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/4 border border-white/8 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/30 transition-all resize-none"
            />
          </Card>
        </>
      )}
    </div>
  )
}
