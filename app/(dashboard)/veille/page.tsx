'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Radio, Play, Loader2, CheckCircle, AlertCircle, Plus, X,
  ChevronRight, Clock, Zap, Filter, RotateCcw, ExternalLink,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ── Types ─────────────────────────────────────────────────────────────────────

interface VeilleSettings {
  enabled: boolean
  keywords: string[]
  regions: string[]
  types_marche: string[]
  montant_min: number
  montant_max: number
  last_run_at: string | null
}

interface RunResult {
  total_found: number
  imported: number
  skipped: number
  error: string | null
  projects: { id: string; name: string }[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const REGIONS_FR = [
  { code: '01', label: 'Ain' }, { code: '02', label: 'Aisne' }, { code: '03', label: 'Allier' },
  { code: '06', label: 'Alpes-Maritimes' }, { code: '13', label: 'Bouches-du-Rhône' },
  { code: '14', label: 'Calvados' }, { code: '21', label: 'Côte-d\'Or' },
  { code: '25', label: 'Doubs' }, { code: '31', label: 'Haute-Garonne' },
  { code: '33', label: 'Gironde' }, { code: '34', label: 'Hérault' },
  { code: '35', label: 'Ille-et-Vilaine' }, { code: '38', label: 'Isère' },
  { code: '44', label: 'Loire-Atlantique' }, { code: '45', label: 'Loiret' },
  { code: '49', label: 'Maine-et-Loire' }, { code: '54', label: 'Meurthe-et-Moselle' },
  { code: '57', label: 'Moselle' }, { code: '59', label: 'Nord' },
  { code: '62', label: 'Pas-de-Calais' }, { code: '63', label: 'Puy-de-Dôme' },
  { code: '67', label: 'Bas-Rhin' }, { code: '68', label: 'Haut-Rhin' },
  { code: '69', label: 'Rhône' }, { code: '75', label: 'Paris' },
  { code: '76', label: 'Seine-Maritime' }, { code: '77', label: 'Seine-et-Marne' },
  { code: '78', label: 'Yvelines' }, { code: '83', label: 'Var' },
  { code: '84', label: 'Vaucluse' }, { code: '92', label: 'Hauts-de-Seine' },
  { code: '93', label: 'Seine-Saint-Denis' }, { code: '94', label: 'Val-de-Marne' },
]

const TYPES_MARCHE = ['Travaux', 'Services', 'Fournitures']

// ── Page ─────────────────────────────────────────────────────────────────────

export default function VeillePage() {
  const [settings, setSettings] = useState<VeilleSettings>({
    enabled: false, keywords: [], regions: [], types_marche: [],
    montant_min: 0, montant_max: 5000000, last_run_at: null,
  })
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [running, setRunning]   = useState(false)
  const [result, setResult]     = useState<RunResult | null>(null)
  const [error, setError]       = useState<string | null>(null)

  // Keyword input
  const [kwInput, setKwInput] = useState('')

  const loadSettings = useCallback(async () => {
    const r = await fetch('/api/veille/settings')
    if (r.ok) setSettings(await r.json())
    setLoading(false)
  }, [])

  useEffect(() => { loadSettings() }, [loadSettings])

  async function save(patch: Partial<VeilleSettings>) {
    const next = { ...settings, ...patch }
    setSettings(next)
    setSaving(true)
    await fetch('/api/veille/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    setSaving(false)
  }

  function addKeyword() {
    const kw = kwInput.trim()
    if (kw && !settings.keywords.includes(kw)) {
      save({ keywords: [...settings.keywords, kw] })
    }
    setKwInput('')
  }

  function removeKeyword(kw: string) {
    save({ keywords: settings.keywords.filter(k => k !== kw) })
  }

  function toggleRegion(code: string) {
    const next = settings.regions.includes(code)
      ? settings.regions.filter(r => r !== code)
      : [...settings.regions, code]
    save({ regions: next })
  }

  function toggleType(t: string) {
    const next = settings.types_marche.includes(t)
      ? settings.types_marche.filter(x => x !== t)
      : [...settings.types_marche, t]
    save({ types_marche: next })
  }

  async function runVeille() {
    setRunning(true); setResult(null); setError(null)
    try {
      const r = await fetch('/api/veille/run', { method: 'POST' })
      const json = await r.json()
      if (!r.ok) throw new Error(json.error ?? 'Erreur veille')
      setResult(json)
      setSettings(s => ({ ...s, last_run_at: new Date().toISOString() }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setRunning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-white/30" />
      </div>
    )
  }

  const hasKeywords = settings.keywords.length > 0

  return (
    <div className="flex flex-col min-h-0 animate-fade-in">

      {/* Header */}
      <div className="h-14 border-b border-white/5 bg-[var(--bg-surface)] flex items-center justify-between px-4 md:px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
            <Radio size={14} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white leading-none">Veille BOAMP</h1>
            <p className="text-[11px] text-white/40 mt-0.5">Import automatique de consultations publiques</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saving && <span className="text-xs text-white/30 animate-pulse flex items-center gap-1"><Loader2 size={11} className="animate-spin" />Sauvegarde…</span>}
          {settings.last_run_at && (
            <span className="text-xs text-white/30 hidden sm:flex items-center gap-1">
              <Clock size={11} />
              Dernière veille : {new Date(settings.last_run_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={runVeille}
            disabled={running || !hasKeywords}
            title={!hasKeywords ? 'Ajoutez au moins un mot-clé' : undefined}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors"
          >
            {running
              ? <><Loader2 size={13} className="animate-spin" />Recherche…</>
              : <><Play size={13} />Lancer la veille</>
            }
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 bg-blue-500/8 border border-blue-500/20 rounded-xl">
          <Info size={15} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-white/60 leading-relaxed">
            La veille interroge le <strong className="text-white/80">BOAMP</strong> (Bulletin Officiel des Annonces des Marchés Publics)
            et importe automatiquement les consultations correspondant à vos critères comme projets
            en statut <em>Brouillon</em>. Les doublons sont ignorés automatiquement.
          </div>
        </div>

        {/* Result banner */}
        {result && (
          <div className={cn(
            'p-4 rounded-xl border',
            result.error
              ? 'bg-red-500/10 border-red-500/25'
              : 'bg-emerald-500/10 border-emerald-500/25',
          )}>
            {result.error ? (
              <div className="flex items-center gap-2 text-red-300 text-sm">
                <AlertCircle size={14} />
                <span>{result.error}</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-white/70">{result.total_found} annonces trouvées</span>
                    <span className="text-emerald-400 font-semibold">+{result.imported} importés</span>
                    {result.skipped > 0 && <span className="text-white/40">{result.skipped} ignorés (doublons)</span>}
                  </div>
                </div>
                {result.projects.length > 0 && (
                  <div className="space-y-1 ml-7">
                    {result.projects.slice(0, 5).map(p => (
                      <Link
                        key={p.id}
                        href={`/projects/${p.id}`}
                        className="flex items-center gap-1.5 text-xs text-emerald-300/80 hover:text-emerald-300 transition-colors"
                      >
                        <ChevronRight size={11} />
                        <span className="truncate">{p.name}</span>
                        <ExternalLink size={10} className="flex-shrink-0" />
                      </Link>
                    ))}
                    {result.projects.length > 5 && (
                      <p className="text-xs text-white/30 ml-4">+{result.projects.length - 5} autres…</p>
                    )}
                  </div>
                )}
                {result.total_found === 0 && (
                  <p className="text-xs text-white/40 ml-7">
                    Aucune annonce ne correspond à vos critères sur les 14 derniers jours.
                    Essayez d&apos;élargir vos mots-clés ou régions.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Keywords */}
          <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={14} className="text-amber-400" />
              <h2 className="text-sm font-semibold text-white">Mots-clés</h2>
              <span className="text-[10px] text-white/30 ml-auto">Cherchés dans l&apos;objet du marché</span>
            </div>

            {/* Tag list */}
            <div className="flex flex-wrap gap-2 mb-3 min-h-[36px]">
              {settings.keywords.length === 0 && (
                <span className="text-xs text-white/25 italic">Aucun mot-clé — tous les marchés seront retournés</span>
              )}
              {settings.keywords.map(kw => (
                <span key={kw}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/15 border border-blue-500/25 text-xs text-blue-300 font-medium">
                  {kw}
                  <button onClick={() => removeKeyword(kw)} className="text-blue-400/50 hover:text-blue-300 transition-colors">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>

            {/* Add input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={kwInput}
                onChange={e => setKwInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                placeholder="ex: photovoltaïque, ENR, bornes IRVE…"
                className="flex-1 px-3 py-2 bg-[var(--bg-base)] border border-white/10 rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
              <button
                onClick={addKeyword}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Popular suggestions */}
            <div className="mt-3">
              <p className="text-[10px] text-white/30 mb-2">Suggestions rapides :</p>
              <div className="flex flex-wrap gap-1.5">
                {['photovoltaïque','solaire','ENR','IRVE','LED','efficacité énergétique','rénovation thermique','pompe à chaleur'].map(s => (
                  !settings.keywords.includes(s) && (
                    <button
                      key={s}
                      onClick={() => save({ keywords: [...settings.keywords, s] })}
                      className="text-[10px] px-2 py-1 rounded-md bg-white/4 border border-white/8 text-white/40 hover:text-white/70 hover:border-white/15 transition-all"
                    >
                      + {s}
                    </button>
                  )
                ))}
              </div>
            </div>
          </div>

          {/* Regions */}
          <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={14} className="text-violet-400" />
              <h2 className="text-sm font-semibold text-white">Départements</h2>
              <button
                onClick={() => save({ regions: [] })}
                className="ml-auto text-[10px] text-white/25 hover:text-white/50 transition-colors flex items-center gap-1"
              >
                <RotateCcw size={9} />Tout effacer
              </button>
            </div>
            {settings.regions.length === 0 && (
              <p className="text-xs text-white/25 italic mb-3">Aucun filtre — tous les départements</p>
            )}
            {settings.regions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {settings.regions.map(code => {
                  const reg = REGIONS_FR.find(r => r.code === code)
                  return reg ? (
                    <span key={code} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-violet-500/15 border border-violet-500/25 text-xs text-violet-300">
                      {reg.label}
                      <button onClick={() => toggleRegion(code)} className="text-violet-400/50 hover:text-violet-300"><X size={10} /></button>
                    </span>
                  ) : null
                })}
              </div>
            )}
            <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto pr-1">
              {REGIONS_FR.map(({ code, label }) => {
                const active = settings.regions.includes(code)
                return (
                  <button
                    key={code}
                    onClick={() => toggleRegion(code)}
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-left transition-all',
                      active
                        ? 'bg-violet-500/15 border border-violet-500/25 text-violet-300'
                        : 'bg-white/3 border border-transparent text-white/40 hover:text-white/70 hover:border-white/10',
                    )}
                  >
                    <span className="font-bold text-[10px] text-white/25 w-5 flex-shrink-0">{code}</span>
                    <span className="truncate">{label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Types + Budget */}
          <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-5 lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Types de marché */}
              <div>
                <h2 className="text-sm font-semibold text-white mb-3">Type de marché</h2>
                <div className="flex gap-2 flex-wrap">
                  {TYPES_MARCHE.map(t => {
                    const active = settings.types_marche.includes(t)
                    return (
                      <button
                        key={t}
                        onClick={() => toggleType(t)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-xs font-medium border transition-all',
                          active
                            ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                            : 'bg-white/4 border-white/8 text-white/45 hover:border-white/15',
                        )}
                      >
                        {t}
                      </button>
                    )
                  })}
                  {settings.types_marche.length === 0 && (
                    <span className="text-xs text-white/25 italic self-center">Tous types</span>
                  )}
                </div>
              </div>

              {/* Budget */}
              <div>
                <h2 className="text-sm font-semibold text-white mb-3">Montant estimé</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-white/40 block mb-1">Minimum (€)</label>
                    <input
                      type="number"
                      min={0}
                      value={settings.montant_min}
                      onChange={e => save({ montant_min: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-[var(--bg-base)] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 block mb-1">Maximum (€)</label>
                    <input
                      type="number"
                      min={0}
                      value={settings.montant_max}
                      onChange={e => save({ montant_max: parseInt(e.target.value) || 5000000 })}
                      className="w-full px-3 py-2 bg-[var(--bg-base)] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-white/25 mt-2">
                  Laissez à 0 / 5 000 000 pour ne pas filtrer par montant.
                  Beaucoup d&apos;avis BOAMP ne précisent pas le montant.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call-to-action if no keywords */}
        {!hasKeywords && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/8 border border-amber-500/20">
            <AlertCircle size={15} className="text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-200/70">
              Ajoutez au moins un <strong className="text-amber-300">mot-clé</strong> pour pouvoir lancer la veille.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
