'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Radio, Play, Loader2, AlertCircle, Plus, X,
  Clock, Zap, Filter, RotateCcw, Info,
  ExternalLink, MapPin, Tag, Building2, PackagePlus,
  Trash2, ChevronDown, ChevronUp, CheckCircle2, ArrowUpRight,
  CalendarDays, Inbox,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { VeilleRunGroup } from '@/app/api/veille/history/route'

// ── Types ─────────────────────────────────────────────────────────────────────

interface VeilleSettings {
  keywords: string[]
  regions: string[]
  types_marche: string[]
  montant_min: number
  montant_max: number
  last_run_at: string | null
}

// ── Constants ─────────────────────────────────────────────────────────────────

const REGIONS_FR = [
  { code: '01', label: 'Ain' }, { code: '02', label: 'Aisne' }, { code: '03', label: 'Allier' },
  { code: '06', label: 'Alpes-Maritimes' }, { code: '13', label: 'Bouches-du-Rhône' },
  { code: '14', label: 'Calvados' }, { code: '21', label: "Côte-d'Or" },
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
const QUICK_KW = ['photovoltaïque','solaire','ENR','IRVE','LED','efficacité énergétique','rénovation thermique','pompe à chaleur']

function boampUrl(idweb: string | null) {
  return idweb ? `https://www.boamp.fr/avis/detail/${idweb}` : null
}

function daysLeftLabel(deadline: string | null) {
  if (!deadline) return null
  const d = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
  return d
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function VeillePage() {
  const [settings, setSettings] = useState<VeilleSettings>({
    keywords: [], regions: [], types_marche: [],
    montant_min: 0, montant_max: 5000000, last_run_at: null,
  })
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [running, setRunning] = useState(false)
  const [runMsg, setRunMsg]   = useState<{ ok: boolean; text: string } | null>(null)

  const [kwInput, setKwInput] = useState('')
  const [showAllDeps, setShowAllDeps] = useState(false)

  // Results feed grouped by run
  const [groups, setGroups]         = useState<VeilleRunGroup[]>([])
  const [feedLoading, setFeedLoading] = useState(true)
  const [collapsed, setCollapsed]     = useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // ── Loaders ────────────────────────────────────────────────────────────────

  const loadSettings = useCallback(async () => {
    const r = await fetch('/api/veille/settings')
    if (r.ok) setSettings(await r.json())
    setSettingsLoading(false)
  }, [])

  const loadFeed = useCallback(async () => {
    setFeedLoading(true)
    const r = await fetch('/api/veille/history')
    if (r.ok) {
      const json = await r.json()
      setGroups(json.groups ?? [])
    }
    setFeedLoading(false)
  }, [])

  useEffect(() => { loadSettings(); loadFeed() }, [loadSettings, loadFeed])

  // ── Settings helpers ───────────────────────────────────────────────────────

  async function save(patch: Partial<VeilleSettings>) {
    setSettings(s => ({ ...s, ...patch }))
    setSaving(true)
    await fetch('/api/veille/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    setSaving(false)
  }

  function addKeyword() {
    const kw = kwInput.trim()
    if (kw && !settings.keywords.includes(kw)) save({ keywords: [...settings.keywords, kw] })
    setKwInput('')
  }
  const removeKeyword = (kw: string) => save({ keywords: settings.keywords.filter(k => k !== kw) })
  const toggleRegion = (code: string) => {
    const next = settings.regions.includes(code)
      ? settings.regions.filter(r => r !== code) : [...settings.regions, code]
    save({ regions: next })
  }
  const toggleType = (t: string) => {
    const next = settings.types_marche.includes(t)
      ? settings.types_marche.filter(x => x !== t) : [...settings.types_marche, t]
    save({ types_marche: next })
  }

  // ── Run ────────────────────────────────────────────────────────────────────

  async function runVeille() {
    setRunning(true); setRunMsg(null)
    try {
      const r   = await fetch('/api/veille/run', { method: 'POST' })
      const json = await r.json()
      if (!r.ok) throw new Error(json.error ?? 'Erreur veille')
      const { total_found, added, skipped } = json
      setRunMsg({
        ok: true,
        text: added > 0
          ? `${added} nouvelle${added > 1 ? 's' : ''} annonce${added > 1 ? 's' : ''} trouvée${added > 1 ? 's' : ''} sur ${total_found} — ${skipped} doublon${skipped !== 1 ? 's' : ''} ignoré${skipped !== 1 ? 's' : ''}`
          : `Aucune nouvelle annonce (${total_found} analysées, ${skipped} déjà connues)`,
      })
      setSettings(s => ({ ...s, last_run_at: new Date().toISOString() }))
      await loadFeed()
    } catch (err) {
      setRunMsg({ ok: false, text: err instanceof Error ? err.message : 'Erreur inconnue' })
    } finally {
      setRunning(false)
    }
  }

  // ── Result actions ─────────────────────────────────────────────────────────

  async function handleAction(resultId: string, action: 'import' | 'dismiss') {
    setActionLoading(resultId)
    try {
      const r    = await fetch(`/api/veille/results/${resultId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await r.json()
      if (!r.ok) return

      setGroups(prev => prev.map(group => ({
        ...group,
        results: action === 'dismiss'
          ? group.results.filter(res => res.id !== resultId)
          : group.results.map(res =>
              res.id === resultId
                ? { ...res, status: 'imported' as const, project_id: json.project_id }
                : res
            ),
      })))
    } finally {
      setActionLoading(null)
    }
  }

  const toggleGroup = (id: string) => {
    setCollapsed(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const totalPending   = groups.reduce((s, g) => s + g.results.filter(r => r.status === 'pending').length, 0)
  const displayedDeps  = showAllDeps ? REGIONS_FR : REGIONS_FR.slice(0, 16)

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="h-14 border-b border-white/5 bg-[var(--bg-surface)] flex items-center justify-between px-4 md:px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
            <Radio size={14} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white leading-none">Veille BOAMP</h1>
            <p className="text-[11px] text-white/40 mt-0.5">Consultations publiques automatiques</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saving && <span className="text-[11px] text-white/30 animate-pulse flex items-center gap-1"><Loader2 size={10} className="animate-spin" />Sauvegarde…</span>}
          {settings.last_run_at && (
            <span className="text-[11px] text-white/30 hidden md:flex items-center gap-1">
              <Clock size={10} />
              {new Date(settings.last_run_at).toLocaleString('fr-FR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
            </span>
          )}
          {totalPending > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/25">
              {totalPending} en attente
            </span>
          )}
          <button
            onClick={runVeille}
            disabled={running || settings.keywords.length === 0}
            title={settings.keywords.length === 0 ? 'Ajoutez au moins un mot-clé' : undefined}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors"
          >
            {running ? <><Loader2 size={13} className="animate-spin" />Recherche…</> : <><Play size={13} />Lancer la veille</>}
          </button>
        </div>
      </div>

      {/* ── Run flash message ─────────────────────────────────────────────── */}
      {runMsg && (
        <div className={cn(
          'mx-4 md:mx-6 mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border',
          runMsg.ok
            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
            : 'bg-red-500/10 border-red-500/25 text-red-300',
        )}>
          {runMsg.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {runMsg.text}
          <button onClick={() => setRunMsg(null)} className="ml-auto text-white/25 hover:text-white/60"><X size={12} /></button>
        </div>
      )}

      {/* ── Split layout ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ══ LEFT — Settings (sticky scroll) ══════════════════════════════ */}
        <aside className="hidden lg:flex flex-col w-72 xl:w-80 flex-shrink-0 border-r border-white/5 overflow-y-auto bg-[var(--bg-surface)]">
          <div className="p-4 space-y-5">

            {/* Info */}
            <div className="flex items-start gap-2 p-3 bg-blue-500/8 border border-blue-500/15 rounded-xl">
              <Info size={13} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-white/50 leading-relaxed">
                La veille stocke les annonces BOAMP. Choisissez celles à ajouter à vos projets.
              </p>
            </div>

            {/* Keywords */}
            {!settingsLoading && (
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <Zap size={12} className="text-amber-400" />
                  <span className="text-xs font-semibold text-white">Mots-clés</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
                  {settings.keywords.length === 0 && (
                    <span className="text-[11px] text-white/25 italic">Aucun mot-clé</span>
                  )}
                  {settings.keywords.map(kw => (
                    <span key={kw} className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/25 text-[11px] text-blue-300 font-medium">
                      {kw}
                      <button onClick={() => removeKeyword(kw)} className="text-blue-400/50 hover:text-blue-300 transition-colors"><X size={10} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text" value={kwInput}
                    onChange={e => setKwInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    placeholder="Ajouter un mot-clé…"
                    className="flex-1 px-2.5 py-1.5 bg-[var(--bg-base)] border border-white/10 rounded-lg text-xs text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                  <button onClick={addKeyword} className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"><Plus size={13} /></button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {QUICK_KW.filter(s => !settings.keywords.includes(s)).map(s => (
                    <button key={s} onClick={() => save({ keywords: [...settings.keywords, s] })}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-white/4 border border-white/8 text-white/35 hover:text-white/60 hover:border-white/15 transition-all">
                      +{s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Departments */}
            {!settingsLoading && (
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <Filter size={12} className="text-violet-400" />
                  <span className="text-xs font-semibold text-white">Départements</span>
                  <button onClick={() => save({ regions: [] })} className="ml-auto text-[10px] text-white/25 hover:text-white/50 flex items-center gap-0.5">
                    <RotateCcw size={8} />Effacer
                  </button>
                </div>
                {settings.regions.length === 0 && (
                  <p className="text-[11px] text-white/25 italic mb-2">Tous les départements</p>
                )}
                {settings.regions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {settings.regions.map(code => {
                      const reg = REGIONS_FR.find(r => r.code === code)
                      return reg ? (
                        <span key={code} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-violet-500/15 border border-violet-500/25 text-[10px] text-violet-300">
                          {reg.label}<button onClick={() => toggleRegion(code)} className="text-violet-400/50 hover:text-violet-300 ml-0.5"><X size={9} /></button>
                        </span>
                      ) : null
                    })}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-0.5">
                  {displayedDeps.map(({ code, label }) => {
                    const active = settings.regions.includes(code)
                    return (
                      <button key={code} onClick={() => toggleRegion(code)}
                        className={cn(
                          'flex items-center gap-1 px-1.5 py-1 rounded text-[11px] text-left transition-all',
                          active ? 'bg-violet-500/15 text-violet-300' : 'text-white/35 hover:text-white/60 hover:bg-white/4',
                        )}
                      >
                        <span className="font-bold text-[9px] text-white/20 w-4 flex-shrink-0">{code}</span>
                        <span className="truncate">{label}</span>
                      </button>
                    )
                  })}
                </div>
                {REGIONS_FR.length > 16 && (
                  <button onClick={() => setShowAllDeps(v => !v)}
                    className="mt-1 text-[10px] text-white/30 hover:text-white/50 flex items-center gap-1">
                    {showAllDeps ? <><ChevronUp size={9} />Réduire</> : <><ChevronDown size={9} />Voir les {REGIONS_FR.length - 16} autres</>}
                  </button>
                )}
              </div>
            )}

            {/* Types */}
            {!settingsLoading && (
              <div>
                <p className="text-xs font-semibold text-white mb-2">Type de marché</p>
                <div className="flex flex-wrap gap-1.5">
                  {TYPES_MARCHE.map(t => {
                    const active = settings.types_marche.includes(t)
                    return (
                      <button key={t} onClick={() => toggleType(t)}
                        className={cn(
                          'px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all',
                          active ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-white/4 border-white/8 text-white/40 hover:border-white/15',
                        )}
                      >{t}</button>
                    )
                  })}
                  {settings.types_marche.length === 0 && <span className="text-[11px] text-white/25 italic">Tous types</span>}
                </div>
              </div>
            )}

            {/* Budget */}
            {!settingsLoading && (
              <div>
                <p className="text-xs font-semibold text-white mb-2">Montant estimé</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-white/35 block mb-1">Min (€)</label>
                    <input type="number" min={0} value={settings.montant_min}
                      onChange={e => save({ montant_min: parseInt(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 bg-[var(--bg-base)] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/35 block mb-1">Max (€)</label>
                    <input type="number" min={0} value={settings.montant_max}
                      onChange={e => save({ montant_max: parseInt(e.target.value) || 5000000 })}
                      className="w-full px-2.5 py-1.5 bg-[var(--bg-base)] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-white/20 mt-1.5">0 / 5 000 000 = pas de filtre</p>
              </div>
            )}

            {settings.keywords.length === 0 && !settingsLoading && (
              <div className="flex items-start gap-2 p-3 bg-amber-500/8 border border-amber-500/20 rounded-xl">
                <AlertCircle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-200/70">Ajoutez un mot-clé pour lancer la veille.</p>
              </div>
            )}
          </div>
        </aside>

        {/* ══ RIGHT — Results feed ══════════════════════════════════════════ */}
        <main className="flex-1 overflow-y-auto">

          {feedLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 size={20} className="animate-spin text-white/20" />
            </div>

          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-24">
              <div className="w-14 h-14 rounded-2xl bg-white/4 flex items-center justify-center">
                <Inbox size={22} className="text-white/20" />
              </div>
              <p className="text-sm font-medium text-white/40">Aucune veille lancée</p>
              <p className="text-xs text-white/25">Configurez vos mots-clés et lancez une veille.</p>
            </div>

          ) : (
            <div className="p-4 md:p-6 space-y-6">
              {groups.map(group => {
                const isCollapsed = collapsed.has(group.id)
                const pending = group.results.filter(r => r.status === 'pending').length
                const imported = group.results.filter(r => r.status === 'imported').length
                const dateLabel = new Date(group.run_at).toLocaleString('fr-FR', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })

                return (
                  <div key={group.id} className="bg-[var(--bg-card)] border border-white/8 rounded-2xl overflow-hidden">

                    {/* Group header */}
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/3 transition-colors text-left"
                    >
                      <CalendarDays size={14} className="text-white/30 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white/70 capitalize">{dateLabel}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] text-white/30">{group.total_found} annonce{group.total_found !== 1 ? 's' : ''} trouvée{group.total_found !== 1 ? 's' : ''}</span>
                          {pending > 0 && (
                            <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded">
                              {pending} en attente
                            </span>
                          )}
                          {imported > 0 && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              {imported} ajouté{imported !== 1 ? 's' : ''}
                            </span>
                          )}
                          {group.error && (
                            <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">Erreur</span>
                          )}
                        </div>
                      </div>
                      {isCollapsed
                        ? <ChevronDown size={14} className="text-white/25 flex-shrink-0" />
                        : <ChevronUp size={14} className="text-white/25 flex-shrink-0" />
                      }
                    </button>

                    {/* Error detail */}
                    {!isCollapsed && group.error && (
                      <div className="mx-5 mb-3 p-3 bg-red-500/8 border border-red-500/15 rounded-xl">
                        <p className="text-xs text-red-300/70 font-mono break-all">{group.error}</p>
                      </div>
                    )}

                    {/* Results list */}
                    {!isCollapsed && group.results.length === 0 && (
                      <div className="px-5 pb-5 text-xs text-white/25 italic">
                        Aucun résultat pour ce passage (doublons ou déjà connus).
                      </div>
                    )}

                    {!isCollapsed && group.results.length > 0 && (
                      <div className="divide-y divide-white/4">
                        {group.results.map(result => {
                          const url       = boampUrl(result.idweb)
                          const dLeft     = daysLeftLabel(result.offer_deadline)
                          const isLoading = actionLoading === result.id
                          const isDone    = result.status === 'imported'

                          return (
                            <div key={result.id}
                              className={cn(
                                'px-5 py-4 transition-colors',
                                isDone ? 'opacity-55 hover:opacity-70' : 'hover:bg-white/2',
                              )}
                            >
                              <div className="flex items-start gap-3">
                                {/* Status stripe */}
                                <div className={cn(
                                  'w-0.5 self-stretch rounded-full flex-shrink-0 mt-1',
                                  isDone ? 'bg-emerald-500/50' : 'bg-amber-500/50',
                                )} />

                                <div className="flex-1 min-w-0 space-y-2">

                                  {/* Title + BOAMP link */}
                                  <div className="flex items-start gap-2">
                                    <p className="flex-1 text-sm font-medium text-white/90 leading-snug">
                                      {result.name}
                                    </p>
                                    {url && (
                                      <a href={url} target="_blank" rel="noopener noreferrer"
                                        title="Voir l'annonce sur BOAMP.fr"
                                        className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-medium hover:bg-blue-500/20 transition-all mt-0.5 whitespace-nowrap"
                                      >
                                        BOAMP <ExternalLink size={9} />
                                      </a>
                                    )}
                                  </div>

                                  {/* Meta */}
                                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                                    <span className="flex items-center gap-1 text-[11px] text-white/40">
                                      <Building2 size={10} className="text-white/20" />{result.client}
                                    </span>
                                    <span className="flex items-center gap-1 text-[11px] text-white/40">
                                      <MapPin size={10} className="text-white/20" />{result.location}
                                    </span>
                                    <span className="flex items-center gap-1 text-[11px] text-white/40">
                                      <Tag size={10} className="text-white/20" />{result.consultation_type}
                                    </span>
                                    {result.procedure_type && (
                                      <span className="flex items-center gap-1 text-[11px] text-white/35">
                                        <span className="text-white/15">·</span>{result.procedure_type}
                                      </span>
                                    )}
                                    {result.montant_estime && result.montant_estime !== '0' && (
                                      <span className="flex items-center gap-1 text-[11px] text-violet-300/70">
                                        ~{Number(result.montant_estime).toLocaleString('fr-FR')} €
                                      </span>
                                    )}
                                  </div>

                                  {/* Description */}
                                  {result.description && (
                                    <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2 border-l-2 border-white/8 pl-2">
                                      {result.description}
                                    </p>
                                  )}

                                  {/* Deadline + ref */}
                                  <div className="flex items-center gap-3 flex-wrap">
                                    {dLeft !== null && (
                                      <span className={cn(
                                        'text-[10px] font-extrabold px-2 py-0.5 rounded-md tabular-nums',
                                        dLeft < 0    ? 'bg-white/5 text-white/20'
                                        : dLeft <= 3  ? 'bg-red-500/20 text-red-300'
                                        : dLeft <= 7  ? 'bg-amber-500/20 text-amber-300'
                                        :               'bg-blue-500/15 text-blue-300',
                                      )}>
                                        {dLeft < 0 ? 'Expiré' : dLeft === 0 ? "Aujourd'hui" : `J-${dLeft}`}
                                      </span>
                                    )}
                                    {result.offer_deadline && (
                                      <span className="text-[10px] text-white/25">
                                        Limite : {new Date(result.offer_deadline).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
                                      </span>
                                    )}
                                    {result.idweb && (
                                      <span className="text-[10px] text-white/15 font-mono ml-auto">
                                        Réf. {result.idweb}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex flex-col gap-1.5 flex-shrink-0 min-w-[110px]">
                                  {isDone ? (
                                    result.project_id ? (
                                      <Link
                                        href={`/projects/${result.project_id}`}
                                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/20 transition-all"
                                      >
                                        <CheckCircle2 size={11} />Voir le projet <ArrowUpRight size={10} />
                                      </Link>
                                    ) : (
                                      <span className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
                                        <CheckCircle2 size={11} />Importé
                                      </span>
                                    )
                                  ) : (
                                    <button
                                      onClick={() => handleAction(result.id, 'import')}
                                      disabled={isLoading}
                                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium hover:bg-emerald-600/35 transition-all disabled:opacity-50"
                                    >
                                      {isLoading ? <Loader2 size={11} className="animate-spin" /> : <PackagePlus size={11} />}
                                      Ajouter
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleAction(result.id, 'dismiss')}
                                    disabled={isLoading}
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/4 border border-white/8 text-white/30 text-[11px] font-medium hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-300 transition-all disabled:opacity-50"
                                  >
                                    <Trash2 size={11} />
                                    Supprimer
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
