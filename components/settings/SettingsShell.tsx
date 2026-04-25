'use client'

import { useState } from 'react'
import {
  Building2, Map, Zap, Target, FileText,
  CheckCircle, AlertCircle, Loader2, Save,
  ChevronRight, BookMarked,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { CriteriaForm } from './CriteriaForm'
import { CompanyDocImport } from './CompanyDocImport'
import { CriteriaTemplates } from './CriteriaTemplates'
import type { CompanyCriteria } from '@/types'

type Tab = 'profil' | 'perimetre' | 'capacites' | 'scoring' | 'import' | 'templates'

const TABS: { id: Tab; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'profil',    label: 'Profil entreprise',  icon: Building2, description: 'Identité & informations' },
  { id: 'perimetre', label: 'Périmètre & marchés', icon: Map,       description: 'Géographie & secteurs' },
  { id: 'capacites', label: 'Capacités',           icon: Zap,       description: 'Techniques & commerciales' },
  { id: 'scoring',   label: 'Scoring Go/No Go',    icon: Target,    description: 'Critères & pondérations' },
  { id: 'import',    label: 'Import document',     icon: FileText,  description: 'PDF ou Word comme base' },
  { id: 'templates', label: 'Templates',           icon: BookMarked, description: 'Profils sauvegardés' },
]

interface SettingsShellProps {
  initialCriteria: CompanyCriteria
  initialMode: 'form' | 'document'
  initialDocName: string | null
}

export function SettingsShell({ initialCriteria, initialMode, initialDocName }: SettingsShellProps) {
  const [activeTab, setActiveTab] = useState<Tab>(
    initialMode === 'document' ? 'import' : 'profil'
  )
  const [criteria, setCriteria] = useState<CompanyCriteria>(initialCriteria)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState<string | null>(null)

  function updateCriteria<K extends keyof CompanyCriteria>(key: K, value: CompanyCriteria[K]) {
    setCriteria(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true); setError(null); setSaved(false)
    try {
      const res = await fetch('/api/settings/criteria', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criteria }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur sauvegarde')
      setSaved(true)
      setTimeout(() => setSaved(false), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally { setSaving(false) }
  }

  // Completion score per tab
  function tabCompletion(tab: Tab): number {
    switch (tab) {
      case 'profil': {
        const fields = [criteria.raison_sociale, criteria.siren, criteria.description_courte, criteria.effectifs, criteria.secteur_principal]
        return Math.round((fields.filter(f => f && f.trim()).length / fields.length) * 100)
      }
      case 'perimetre': {
        const score = (criteria.zones_geo.length > 0 ? 34 : 0) + (criteria.types_projets.length > 0 ? 33 : 0) + (criteria.secteurs_clients.length > 0 ? 33 : 0)
        return score
      }
      case 'capacites': {
        const fields = [criteria.puissance_min_kwc, criteria.puissance_max_kwc, criteria.capacite_mensuelle_kwc]
        return fields.every(f => f > 0) ? 100 : 40
      }
      case 'scoring': {
        const score = (criteria.certifications.length > 0 ? 25 : 0) + (criteria.points_forts.length > 0 ? 25 : 0) + 50
        return score
      }
      case 'import': return initialDocName ? 100 : 0
      case 'templates': return 100
    }
  }

  return (
    <div className="flex flex-col min-h-0 h-full">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="px-5 md:px-8 pt-6 pb-4 border-b border-white/5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Mon entreprise</h1>
            <p className="text-sm text-white/40 mt-0.5">
              Configurez votre profil pour un scoring Go/No Go personnalisé et précis
            </p>
          </div>
          {/* Global save button */}
          {activeTab !== 'import' && activeTab !== 'templates' && (
            <button
              onClick={handleSave}
              disabled={saving}
              className={cn(
                'flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
                saved
                  ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-400'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20',
                saving && 'opacity-70 cursor-not-allowed',
              )}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
              {saving ? 'Enregistrement…' : saved ? 'Enregistré !' : 'Enregistrer'}
            </button>
          )}
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            <AlertCircle size={14} />{error}
          </div>
        )}
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Left nav ──────────────────────────────────────────────────── */}
        <aside className="hidden md:flex flex-col w-52 border-r border-white/5 py-4 gap-0.5 flex-shrink-0 overflow-y-auto scrollbar-hide">
          {TABS.map(({ id, label, icon: Icon, description }) => {
            const pct = tabCompletion(id)
            const active = activeTab === id
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'group flex items-center gap-3 mx-2 px-3 py-3 rounded-xl text-left transition-all',
                  active
                    ? 'bg-blue-600/15 border border-blue-500/20'
                    : 'hover:bg-white/4 border border-transparent',
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
                  active ? 'bg-blue-600/30 text-blue-400' : 'bg-white/5 text-white/30 group-hover:text-white/60',
                )}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-xs font-semibold truncate', active ? 'text-blue-400' : 'text-white/60 group-hover:text-white/80')}>
                    {label}
                  </p>
                  <p className="text-[9px] text-white/25 truncate mt-0.5">{description}</p>
                  {/* Mini progress */}
                  <div className="mt-1.5 h-0.5 bg-white/8 rounded-full overflow-hidden w-full">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', pct === 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-blue-500' : 'bg-transparent')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                {active && <ChevronRight size={10} className="text-blue-400 flex-shrink-0" />}
              </button>
            )
          })}

          {/* Overall completion */}
          <div className="mx-2 mt-4 px-3 py-3 rounded-xl bg-white/3 border border-white/6">
            <p className="text-[9px] text-white/30 font-semibold uppercase tracking-wider mb-2">Complétion globale</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round(TABS.filter(t => t.id !== 'import' && t.id !== 'templates').reduce((acc, t) => acc + tabCompletion(t.id), 0) / 4)}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-white/40 tabular-nums">
                {Math.round(TABS.filter(t => t.id !== 'import' && t.id !== 'templates').reduce((acc, t) => acc + tabCompletion(t.id), 0) / 4)}%
              </span>
            </div>
          </div>
        </aside>

        {/* ── Mobile tabs ───────────────────────────────────────────────── */}
        <div className="md:hidden border-b border-white/5 overflow-x-auto scrollbar-hide flex-shrink-0 w-full">
          <div className="flex gap-0 px-3 py-2 w-max">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                  activeTab === id ? 'bg-blue-600/15 text-blue-400' : 'text-white/40 hover:text-white/70',
                )}
              >
                <Icon size={12} />{label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ───────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {activeTab !== 'import' && activeTab !== 'templates' && (
            <CriteriaForm
              criteria={criteria}
              activeTab={activeTab}
              onUpdate={updateCriteria}
            />
          )}
          {activeTab === 'import' && (
            <div className="p-5 md:p-8">
              <CompanyDocImport initialDocName={initialDocName} />
            </div>
          )}
          {activeTab === 'templates' && (
            <CriteriaTemplates
              currentCriteria={criteria}
              onLoad={(loaded) => {
                setCriteria(loaded)
                setSaved(false)
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
