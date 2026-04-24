'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Radio, Play, Loader2, AlertCircle, Plus, X,
  Clock, Zap, Filter, RotateCcw, Info,
  ExternalLink, MapPin, Tag, Building2, PackagePlus,
  Trash2, ChevronDown, ChevronUp, CheckCircle2, ArrowUpRight,
  CalendarDays, Inbox, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { UserAvatarLink } from '@/components/layout/UserAvatarLink'
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
const QUICK_KW = ['photovoltaïque', 'solaire', 'ENR', 'IRVE', 'LED', 'efficacité énergétique', 'rénovation thermique', 'pompe à chaleur']

function daysLeftLabel(deadline: string | null) {
  if (!deadline) return null
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
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

  const [kwInput, setKwInput]     = useState('')
  const [showAllDeps, setShowAllDeps] = useState(false)

  const [groups, setGroups]             = useState<VeilleRunGroup[]>([])
  const [feedLoading, setFeedLoading]   = useState(true)
  const [collapsed, setCollapsed]       = useState<Set<string>>(new Set())
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
    if (r.ok) setGroups((await r.json()).groups ?? [])
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
  const toggleRegion  = (code: string) => save({ regions: settings.regions.includes(code) ? settings.regions.filter(r => r !== code) : [...settings.regions, code] })
  const toggleType    = (t: string)    => save({ types_marche: settings.types_marche.includes(t) ? settings.types_marche.filter(x => x !== t) : [...settings.types_marche, t] })

  // ── Run ────────────────────────────────────────────────────────────────────

  async function runVeille() {
    setRunning(true); setRunMsg(null)
    try {
      const r    = await fetch('/api/veille/run', { method: 'POST' })
      const json = await r.json().catch(() => ({ error: 'Réponse serveur invalide' }))
      if (!r.ok || json.error) throw new Error(json.error ?? 'Erreur veille')
      const { total_found, added, skipped } = json
      setRunMsg({
        ok: true,
        text: added > 0
          ? `${added} nouvelle${added > 1 ? 's' : ''} annonce${added > 1 ? 's' : ''} trouvée${added > 1 ? 's' : ''} sur ${total_found} analysées`
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

  const toggleGroup = (id: string) =>
    setCollapsed(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })

  // ── Derived ────────────────────────────────────────────────────────────────

  const totalPending  = groups.reduce((s, g) => s + g.results.filter(r => r.status === 'pending').length, 0)
  const displayedDeps = showAllDeps ? REGIONS_FR : REGIONS_FR.slice(0, 18)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--bg-base)]">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="h-14 border-b border-white/5 bg-[var(--bg-surface)] flex items-center justify-between px-4 md:px-6 flex-shrink-0 gap-3">

        {/* Left: icon + title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/25 to-blue-600/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Radio size={15} className="text-blue-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-white leading-none">Veille BOAMP</h1>
            <p className="text-[11px] text-white/35 mt-0.5 hidden sm:block">Consultations publiques automatiques</p>
          </div>
        </div>

        {/* Right: status + actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {saving && (
            <span className="hidden md:flex items-center gap-1 text-[11px] text-white/25">
              <Loader2 size={10} className="animate-spin" />Sauvegarde…
            </span>
          )}
          {settings.last_run_at && (
            <span className="hidden lg:flex items-center gap-1.5 text-[11px] text-white/30 bg-white/4 border border-white/6 rounded-lg px-2.5 py-1.5">
              <Clock size={10} className="text-white/20" />
              {new Date(settings.last_run_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {totalPending > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/20">
              {totalPending} en attente
            </span>
          )}
          <button
            onClick={runVeille}
            disabled={running || settings.keywords.length === 0}
            title={settings.keywords.length === 0 ? 'Ajoutez au moins un mot-clé' : undefined}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-all shadow-lg shadow-blue-600/20"
          >
            {running
              ? <><Loader2 size={12} className="animate-spin" /><span className="hidden sm:inline">Recherche…</span></>
              : <><Play size={12} fill="currentColor" /><span className="hidden sm:inline">Lancer la veille</span></>
            }
          </button>
          {/* Bell (desktop only — mobile has it in the shell top bar) */}
          <div className="hidden md:block">
            <NotificationBell />
          </div>
          <UserAvatarLink />
        </div>
      </div>

      {/* ── Flash message ─────────────────────────────────────────────────── */}
      {runMsg && (
        <div className={cn(
          'mx-4 md:mx-6 mt-3 flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm border',
          runMsg.ok
            ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-300'
            : 'bg-red-500/8 border-red-500/20 text-red-300',
        )}>
          {runMsg.ok ? <CheckCircle2 size={14} className="flex-shrink-0" /> : <AlertCircle size={14} className="flex-shrink-0" />}
          <span className="flex-1 text-sm">{runMsg.text}</span>
          <button onClick={() => setRunMsg(null)} className="text-white/20 hover:text-white/50 transition-colors ml-auto">
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── Split layout ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ══ LEFT SIDEBAR ════════════════════════════════════════════════ */}
        <aside className="hidden lg:flex flex-col w-[340px] xl:w-[380px] flex-shrink-0 border-r border-white/5 overflow-y-auto">
          <div className="p-6 space-y-7">

            {/* Info banner */}
            <div className="flex items-start gap-2.5 p-3.5 bg-blue-500/6 border border-blue-500/12 rounded-xl">
              <Info size={13} className="text-blue-400/70 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-white/45 leading-relaxed">
                Les annonces trouvées sont stockées ici. Ajoutez celles qui vous intéressent à vos projets.
              </p>
            </div>

            {/* ── Keywords ── */}
            {!settingsLoading && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-md bg-amber-500/15 flex items-center justify-center">
                    <Zap size={11} className="text-amber-400" />
                  </div>
                  <span className="text-xs font-semibold text-white/80">Mots-clés</span>
                  {settings.keywords.length > 0 && (
                    <span className="ml-auto text-[10px] text-white/25 tabular-nums">{settings.keywords.length}</span>
                  )}
                </div>

                {/* Current keywords */}
                {settings.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {settings.keywords.map(kw => (
                      <span key={kw} className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/12 border border-blue-500/20 text-xs text-blue-300 font-medium">
                        {kw}
                        <button onClick={() => removeKeyword(kw)} className="text-blue-400/40 hover:text-red-400 transition-colors">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {settings.keywords.length === 0 && (
                  <p className="text-[11px] text-white/20 italic mb-3">Aucun mot-clé configuré</p>
                )}

                {/* Input */}
                <div className="flex gap-1.5">
                  <input
                    type="text" value={kwInput}
                    onChange={e => setKwInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    placeholder="Ajouter un mot-clé…"
                    className="flex-1 px-3 py-2 bg-[var(--bg-base)] border border-white/8 rounded-lg text-xs text-white placeholder-white/20 focus:outline-none focus:border-blue-500/40 transition-colors"
                  />
                  <button
                    onClick={addKeyword}
                    className="px-2.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                  >
                    <Plus size={13} />
                  </button>
                </div>

                {/* Quick-add suggestions */}
                {QUICK_KW.filter(s => !settings.keywords.includes(s)).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {QUICK_KW.filter(s => !settings.keywords.includes(s)).map(s => (
                      <button key={s} onClick={() => save({ keywords: [...settings.keywords, s] })}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-white/4 border border-white/8 text-white/35 hover:text-white/60 hover:bg-white/7 hover:border-white/14 transition-all">
                        + {s}
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}

            <div className="h-px bg-white/5" />

            {/* ── Departments ── */}
            {!settingsLoading && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-md bg-violet-500/15 flex items-center justify-center">
                    <Filter size={11} className="text-violet-400" />
                  </div>
                  <span className="text-xs font-semibold text-white/80">Départements</span>
                  {settings.regions.length > 0 ? (
                    <button onClick={() => save({ regions: [] })} className="ml-auto flex items-center gap-0.5 text-[10px] text-white/25 hover:text-red-400/70 transition-colors">
                      <RotateCcw size={9} />Effacer
                    </button>
                  ) : (
                    <span className="ml-auto text-[10px] text-white/20">Tous</span>
                  )}
                </div>

                {/* Active region pills — compact horizontal scroll */}
                {settings.regions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3 max-h-24 overflow-y-auto pr-1">
                    {settings.regions.map(code => {
                      const reg = REGIONS_FR.find(r => r.code === code)
                      return reg ? (
                        <span key={code} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-500/12 border border-violet-500/20 text-[11px] text-violet-300/80 font-medium whitespace-nowrap">
                          {reg.label}
                          <button onClick={() => toggleRegion(code)} className="text-violet-400/40 hover:text-red-400 ml-0.5 transition-colors"><X size={9} /></button>
                        </span>
                      ) : null
                    })}
                  </div>
                )}

                {/* Department grid — 3 columns */}
                <div className="grid grid-cols-3 gap-1">
                  {displayedDeps.map(({ code, label }) => {
                    const active = settings.regions.includes(code)
                    return (
                      <button key={code} onClick={() => toggleRegion(code)}
                        className={cn(
                          'flex items-center gap-1 px-2 py-1.5 rounded-lg text-left transition-all text-[11px]',
                          active
                            ? 'bg-violet-500/15 border border-violet-500/25 text-violet-300'
                            : 'text-white/30 hover:text-white/60 hover:bg-white/4 border border-transparent',
                        )}
                      >
                        <span className="font-mono text-[9px] text-white/15 w-3.5 flex-shrink-0">{code}</span>
                        <span className="truncate text-[10px]">{label}</span>
                      </button>
                    )
                  })}
                </div>

                {REGIONS_FR.length > 18 && (
                  <button onClick={() => setShowAllDeps(v => !v)}
                    className="mt-2 flex items-center gap-1 text-[10px] text-white/25 hover:text-white/50 transition-colors">
                    {showAllDeps
                      ? <><ChevronUp size={9} />Réduire la liste</>
                      : <><ChevronDown size={9} />Voir {REGIONS_FR.length - 18} autres</>
                    }
                  </button>
                )}
              </section>
            )}

            <div className="h-px bg-white/5" />

            {/* ── Type de marché ── */}
            {!settingsLoading && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-md bg-emerald-500/15 flex items-center justify-center">
                    <Tag size={11} className="text-emerald-400" />
                  </div>
                  <span className="text-xs font-semibold text-white/80">Type de marché</span>
                  {settings.types_marche.length === 0 && <span className="ml-auto text-[10px] text-white/20">Tous</span>}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {TYPES_MARCHE.map(t => {
                    const active = settings.types_marche.includes(t)
                    return (
                      <button key={t} onClick={() => toggleType(t)}
                        className={cn(
                          'px-3.5 py-2 rounded-xl text-xs font-medium border transition-all',
                          active
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                            : 'bg-white/4 border-white/8 text-white/40 hover:border-white/15 hover:text-white/65',
                        )}
                      >{t}</button>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Warning if no keywords */}
            {settings.keywords.length === 0 && !settingsLoading && (
              <div className="flex items-start gap-2.5 p-3.5 bg-amber-500/8 border border-amber-500/18 rounded-xl">
                <AlertCircle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-200/65 leading-relaxed">
                  Ajoutez au moins un mot-clé pour activer la veille automatique.
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* ══ RIGHT — Feed ════════════════════════════════════════════════ */}
        <main className="flex-1 overflow-y-auto">

          {feedLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 size={18} className="animate-spin text-white/20" />
            </div>

          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-24">
              <div className="w-16 h-16 rounded-2xl bg-white/4 border border-white/6 flex items-center justify-center">
                <Inbox size={24} className="text-white/15" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white/40">Aucune veille lancée</p>
                <p className="text-xs text-white/20 mt-1">Configurez vos mots-clés et lancez la première veille.</p>
              </div>
              {settings.keywords.length > 0 && (
                <button
                  onClick={runVeille}
                  disabled={running}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <Play size={13} fill="currentColor" />Lancer maintenant
                </button>
              )}
            </div>

          ) : (
            <div className="p-4 md:p-6 space-y-4">
              {groups.map(group => {
                const isCollapsed = collapsed.has(group.id)
                const pending  = group.results.filter(r => r.status === 'pending').length
                const imported = group.results.filter(r => r.status === 'imported').length
                const runDate  = new Date(group.run_at)

                const dateLabel = runDate.toLocaleDateString('fr-FR', {
                  weekday: 'long', day: 'numeric', month: 'long',
                })
                const timeLabel = runDate.toLocaleTimeString('fr-FR', {
                  hour: '2-digit', minute: '2-digit',
                })

                return (
                  <div
                    key={group.id}
                    className="rounded-2xl border border-white/7 overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.02)' }}
                  >
                    {/* ── Group header ── */}
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/2 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/4 border border-white/6 flex items-center justify-center flex-shrink-0">
                        <CalendarDays size={14} className="text-white/30" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-semibold text-white/75 capitalize">{dateLabel}</p>
                          <span className="text-[11px] text-white/25">{timeLabel}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[10px] text-white/25">
                            {group.total_found} annonce{group.total_found !== 1 ? 's' : ''} analysée{group.total_found !== 1 ? 's' : ''}
                          </span>
                          {pending > 0 && (
                            <span className="text-[10px] font-bold text-amber-300 bg-amber-500/12 border border-amber-500/20 px-1.5 py-0.5 rounded-md">
                              {pending} en attente
                            </span>
                          )}
                          {imported > 0 && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 px-1.5 py-0.5 rounded-md">
                              {imported} ajouté{imported !== 1 ? 's' : ''}
                            </span>
                          )}
                          {group.error && (
                            <span className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/15 px-1.5 py-0.5 rounded-md">Erreur API</span>
                          )}
                        </div>
                      </div>

                      <ChevronRight size={14} className={cn(
                        'text-white/20 flex-shrink-0 transition-transform duration-150',
                        !isCollapsed && 'rotate-90',
                      )} />
                    </button>

                    {/* ── Error detail ── */}
                    {!isCollapsed && group.error && (
                      <div className="mx-5 mb-4 flex items-start gap-2.5 p-3.5 bg-red-500/6 border border-red-500/15 rounded-xl">
                        <AlertCircle size={13} className="text-red-400/70 flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-red-300/60 font-mono break-all leading-relaxed">{group.error}</p>
                      </div>
                    )}

                    {/* ── Empty run ── */}
                    {!isCollapsed && group.results.length === 0 && !group.error && (
                      <p className="px-5 pb-5 text-[11px] text-white/20 italic">
                        Aucun résultat pour ce passage (doublons ou déjà connus).
                      </p>
                    )}

                    {/* ── Result cards ── */}
                    {!isCollapsed && group.results.length > 0 && (
                      <div className="px-3 pb-3 space-y-2">
                        {group.results.map(result => {
                          const url       = result.idweb ? `https://www.boamp.fr/avis/detail/${result.idweb}` : null
                          const dLeft     = daysLeftLabel(result.offer_deadline)
                          const isLoading = actionLoading === result.id
                          const isDone    = result.status === 'imported'

                          const urgencyColor =
                            dLeft === null         ? null
                            : dLeft < 0            ? 'text-white/20'
                            : dLeft <= 3           ? 'text-red-300'
                            : dLeft <= 7           ? 'text-amber-300'
                            :                        'text-blue-300'

                          const urgencyBg =
                            dLeft === null         ? null
                            : dLeft < 0            ? 'bg-white/4 border-white/8'
                            : dLeft <= 3           ? 'bg-red-500/15 border-red-500/25'
                            : dLeft <= 7           ? 'bg-amber-500/15 border-amber-500/25'
                            :                        'bg-blue-500/12 border-blue-500/20'

                          return (
                            <div
                              key={result.id}
                              className={cn(
                                'group rounded-xl border p-4 transition-all duration-150',
                                isDone
                                  ? 'border-white/5 bg-white/1 opacity-60 hover:opacity-80'
                                  : 'border-white/8 bg-[var(--bg-base)] hover:border-white/12 hover:bg-white/3',
                              )}
                            >
                              {/* Top row: title + BOAMP link */}
                              <div className="flex items-start gap-3 mb-3">
                                <div className={cn(
                                  'w-1 self-stretch rounded-full flex-shrink-0',
                                  isDone ? 'bg-emerald-500/40' : 'bg-amber-500/50',
                                )} />
                                <div className="flex-1 min-w-0">
                                  <p className={cn(
                                    'text-sm font-medium leading-snug',
                                    isDone ? 'text-white/50' : 'text-white/90',
                                  )}>
                                    {result.name}
                                  </p>
                                </div>
                                {url && (
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Voir l'annonce sur BOAMP.fr"
                                    onClick={e => e.stopPropagation()}
                                    className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/8 border border-blue-500/15 text-blue-400/70 text-[10px] font-medium hover:bg-blue-500/18 hover:text-blue-300 transition-all whitespace-nowrap"
                                  >
                                    BOAMP <ExternalLink size={9} />
                                  </a>
                                )}
                              </div>

                              {/* Meta chips */}
                              <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-3 ml-4">
                                <span className="flex items-center gap-1.5 text-[11px] text-white/35">
                                  <Building2 size={10} className="text-white/20 flex-shrink-0" />
                                  {result.client}
                                </span>
                                <span className="flex items-center gap-1.5 text-[11px] text-white/35">
                                  <MapPin size={10} className="text-white/20 flex-shrink-0" />
                                  {result.location}
                                </span>
                                <span className="flex items-center gap-1.5 text-[11px] text-white/30">
                                  <Tag size={10} className="text-white/20 flex-shrink-0" />
                                  {result.consultation_type}
                                  {result.procedure_type && <span className="text-white/15">· {result.procedure_type}</span>}
                                </span>
                              </div>

                              {/* Description excerpt */}
                              {result.description && (
                                <p className="ml-4 mb-3 text-[11px] text-white/35 leading-relaxed line-clamp-2 border-l border-white/6 pl-2.5">
                                  {result.description}
                                </p>
                              )}

                              {/* Bottom row: deadline badge + actions */}
                              <div className="flex items-center justify-between gap-3 ml-4 flex-wrap">

                                {/* Deadline info */}
                                <div className="flex items-center gap-2">
                                  {dLeft !== null && urgencyBg && urgencyColor && (
                                    <span className={cn(
                                      'text-[10px] font-extrabold px-2 py-1 rounded-md border tabular-nums',
                                      urgencyColor, urgencyBg,
                                    )}>
                                      {dLeft < 0 ? 'Expiré' : dLeft === 0 ? "Aujourd'hui" : `J-${dLeft}`}
                                    </span>
                                  )}
                                  {result.offer_deadline && (
                                    <span className="text-[10px] text-white/22">
                                      Limite : {new Date(result.offer_deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                  )}
                                  {result.idweb && (
                                    <span className="text-[10px] text-white/12 font-mono">Réf. {result.idweb}</span>
                                  )}
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  {isDone ? (
                                    result.project_id ? (
                                      <Link
                                        href={`/projects/${result.project_id}`}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/18 transition-all"
                                      >
                                        <CheckCircle2 size={11} />Voir le projet <ArrowUpRight size={10} />
                                      </Link>
                                    ) : (
                                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/8 border border-emerald-500/15 text-emerald-500/60 text-[11px]">
                                        <CheckCircle2 size={11} />Importé
                                      </span>
                                    )
                                  ) : (
                                    <button
                                      onClick={() => handleAction(result.id, 'import')}
                                      disabled={isLoading}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-[0.97] text-white text-[11px] font-semibold transition-all disabled:opacity-50 shadow-sm shadow-emerald-600/25"
                                    >
                                      {isLoading ? <Loader2 size={11} className="animate-spin" /> : <PackagePlus size={11} />}
                                      Ajouter
                                    </button>
                                  )}
                                  {!isDone && (
                                    <button
                                      onClick={() => handleAction(result.id, 'dismiss')}
                                      disabled={isLoading}
                                      title="Ignorer cette annonce"
                                      className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/15 transition-all disabled:opacity-50"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
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
