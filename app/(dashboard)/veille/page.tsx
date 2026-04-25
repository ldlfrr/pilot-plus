'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Radio, Play, Loader2, AlertCircle, Plus, X,
  Clock, Zap, Filter, RotateCcw,
  ExternalLink, MapPin, Tag, Building2, PackagePlus,
  Trash2, ChevronDown, CheckCircle2, ArrowUpRight,
  CalendarDays, Inbox, ChevronRight, CheckSquare, Square,
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

  const [kwInput, setKwInput] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)

  const [groups, setGroups]           = useState<VeilleRunGroup[]>([])
  const [feedLoading, setFeedLoading] = useState(true)
  const [collapsed, setCollapsed]     = useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deletingGroup, setDeletingGroup] = useState<string | null>(null)

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

  async function deleteGroup(groupId: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Supprimer cette veille et toutes ses annonces ?')) return
    setDeletingGroup(groupId)
    try {
      await fetch(`/api/veille/history/${groupId}`, { method: 'DELETE' })
      setGroups(prev => prev.filter(g => g.id !== groupId))
    } finally {
      setDeletingGroup(null)
    }
  }

  const totalPending = groups.reduce((s, g) => s + g.results.filter(r => r.status === 'pending').length, 0)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-full bg-[var(--bg-base)]">

      {/* ── Sticky top bar ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 gap-3 flex-shrink-0"
        style={{ background: 'rgba(8,14,34,0.92)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>

        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Radio size={16} className="text-blue-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white leading-none">Veille BOAMP</h1>
            <p className="text-[11px] text-white/35 mt-0.5">
              {settings.last_run_at
                ? `Dernière recherche : ${new Date(settings.last_run_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                : 'Consultations publiques automatiques'}
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {saving && <span className="hidden md:flex items-center gap-1 text-[11px] text-white/25"><Loader2 size={10} className="animate-spin" />Sauvegarde…</span>}
          {totalPending > 0 && (
            <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/20">
              {totalPending} en attente
            </span>
          )}
          <button
            onClick={() => setFilterOpen(v => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all',
              filterOpen
                ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                : 'bg-white/5 border-white/8 text-white/50 hover:text-white hover:bg-white/10',
            )}
          >
            <Filter size={13} />
            <span>Critères</span>
            {settings.keywords.length > 0 && (
              <span className="ml-0.5 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                {settings.keywords.length}
              </span>
            )}
          </button>
          <button
            onClick={runVeille}
            disabled={running || settings.keywords.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-all shadow-lg shadow-blue-600/20"
          >
            {running
              ? <><Loader2 size={12} className="animate-spin" />Recherche…</>
              : <><Play size={12} fill="currentColor" />Lancer la veille</>
            }
          </button>
          <div className="hidden md:block"><NotificationBell /></div>
          <UserAvatarLink />
        </div>
      </div>

      {/* ── Flash message ─────────────────────────────────────────────────── */}
      {runMsg && (
        <div className={cn(
          'mx-6 mt-5 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm',
          runMsg.ok
            ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-300'
            : 'bg-red-500/8 border-red-500/20 text-red-300',
        )}>
          {runMsg.ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          <span className="flex-1">{runMsg.text}</span>
          <button onClick={() => setRunMsg(null)} className="text-white/20 hover:text-white/50 transition-colors">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Criteria panel (collapsible) ──────────────────────────────────── */}
      {filterOpen && !settingsLoading && (
        <div className="mx-6 mt-5 bg-[var(--bg-card)] border border-white/8 rounded-2xl overflow-hidden">
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Keywords */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <Zap size={12} className="text-amber-400" />
                </div>
                <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Mots-clés</span>
                {settings.keywords.length > 0 && <span className="ml-auto text-[11px] text-white/30">{settings.keywords.length} actif{settings.keywords.length > 1 ? 's' : ''}</span>}
              </div>

              {settings.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {settings.keywords.map(kw => (
                    <span key={kw} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/12 border border-blue-500/20 text-xs text-blue-300 font-medium">
                      {kw}
                      <button onClick={() => removeKeyword(kw)} className="text-blue-400/40 hover:text-red-400 transition-colors"><X size={10} /></button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mb-4">
                <input
                  type="text" value={kwInput}
                  onChange={e => setKwInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  placeholder="Ajouter un mot-clé…"
                  className="flex-1 px-3 py-2 bg-[var(--bg-base)] border border-white/8 rounded-lg text-xs text-white placeholder-white/20 focus:outline-none focus:border-blue-500/40 transition-colors"
                />
                <button onClick={addKeyword} className="px-2.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                  <Plus size={13} />
                </button>
              </div>

              {QUICK_KW.filter(s => !settings.keywords.includes(s)).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_KW.filter(s => !settings.keywords.includes(s)).map(s => (
                    <button key={s} onClick={() => save({ keywords: [...settings.keywords, s] })}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-white/4 border border-white/8 text-white/35 hover:text-white/60 hover:bg-white/7 transition-all">
                      + {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Departments */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-violet-500/15 flex items-center justify-center">
                  <Filter size={12} className="text-violet-400" />
                </div>
                <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Départements</span>
                <div className="ml-auto flex items-center gap-2">
                  {settings.regions.length === REGIONS_FR.length ? (
                    <button onClick={() => save({ regions: [] })} className="flex items-center gap-1 text-[10px] text-violet-400/70 hover:text-violet-300 transition-colors font-medium">
                      <CheckSquare size={10} />Tout déselect.
                    </button>
                  ) : (
                    <button onClick={() => save({ regions: REGIONS_FR.map(r => r.code) })} className="flex items-center gap-1 text-[10px] text-white/30 hover:text-violet-300 transition-colors font-medium">
                      <Square size={10} />Tout
                    </button>
                  )}
                  {settings.regions.length > 0 && settings.regions.length < REGIONS_FR.length && (
                    <button onClick={() => save({ regions: [] })} className="flex items-center gap-0.5 text-[10px] text-white/20 hover:text-red-400/70 transition-colors">
                      <RotateCcw size={9} />Effacer
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-0.5 max-h-48 overflow-y-auto pr-1"
                style={{ scrollbarWidth: 'none' }}>
                {REGIONS_FR.map(({ code, label }) => {
                  const active = settings.regions.includes(code)
                  return (
                    <button key={code} onClick={() => toggleRegion(code)}
                      className={cn(
                        'flex items-center gap-1 px-2 py-1.5 rounded-md text-left transition-all',
                        active
                          ? 'bg-violet-500/15 text-violet-300'
                          : 'text-white/30 hover:text-white/60 hover:bg-white/4',
                      )}
                    >
                      <span className="font-mono text-[9px] text-white/15 w-4 flex-shrink-0">{code}</span>
                      <span className="truncate text-[10px]">{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Type de marché */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <Tag size={12} className="text-emerald-400" />
                </div>
                <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Type de marché</span>
              </div>
              <div className="flex flex-col gap-2">
                {TYPES_MARCHE.map(t => {
                  const active = settings.types_marche.includes(t)
                  return (
                    <button key={t} onClick={() => toggleType(t)}
                      className={cn(
                        'flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left',
                        active
                          ? 'bg-emerald-500/12 border-emerald-500/25 text-emerald-300'
                          : 'bg-white/3 border-white/7 text-white/40 hover:border-white/14 hover:text-white/65',
                      )}
                    >
                      <div className={cn(
                        'w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
                        active ? 'border-emerald-400 bg-emerald-400' : 'border-white/20',
                      )}>
                        {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      {t}
                    </button>
                  )
                })}
                {settings.types_marche.length === 0 && (
                  <p className="text-[11px] text-white/25 px-1 mt-1">Tous types inclus</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Results feed ─────────────────────────────────────────────────────── */}
      <div className="flex-1 px-6 pt-6 pb-10 space-y-4">

        {feedLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 size={20} className="animate-spin text-white/20" />
          </div>

        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <Inbox size={24} className="text-blue-400/40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white/45">Aucune veille lancée</p>
              <p className="text-xs text-white/25 mt-1.5 leading-relaxed">
                Configurez vos mots-clés via le bouton Critères<br />et lancez la première recherche.
              </p>
            </div>
            {settings.keywords.length > 0 && (
              <button onClick={runVeille} disabled={running} className="btn-primary flex items-center gap-2">
                <Play size={13} fill="currentColor" />Lancer maintenant
              </button>
            )}
          </div>

        ) : groups.map(group => {
          const isCollapsed = collapsed.has(group.id)
          const pending  = group.results.filter(r => r.status === 'pending').length
          const imported = group.results.filter(r => r.status === 'imported').length
          const runDate  = new Date(group.run_at)

          return (
            <div key={group.id} className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>

              {/* Group header */}
              <div className="flex items-center">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="flex-1 flex items-center gap-4 px-6 py-5 hover:bg-white/2 transition-colors text-left min-w-0"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center flex-shrink-0">
                    <CalendarDays size={15} className="text-white/30" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <p className="text-sm font-bold text-white/80 capitalize">
                        {runDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                      <span className="text-xs text-white/25">
                        {runDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                      <span className="text-[11px] text-white/25">
                        {group.total_found} annonce{group.total_found !== 1 ? 's' : ''} analysée{group.total_found !== 1 ? 's' : ''}
                      </span>
                      {pending > 0 && (
                        <span className="text-[11px] font-bold text-amber-300 bg-amber-500/12 border border-amber-500/20 px-2 py-0.5 rounded-md">
                          {pending} en attente
                        </span>
                      )}
                      {imported > 0 && (
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 px-2 py-0.5 rounded-md">
                          {imported} ajouté{imported !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={15} className={cn('text-white/20 flex-shrink-0 transition-transform duration-200', !isCollapsed && 'rotate-90')} />
                </button>

                <button
                  onClick={(e) => deleteGroup(group.id, e)}
                  disabled={deletingGroup === group.id}
                  className="flex-shrink-0 mr-5 p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/8 transition-all disabled:opacity-40"
                >
                  {deletingGroup === group.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>

              {/* Result cards */}
              {!isCollapsed && (
                <div className="px-5 pb-5 space-y-3 border-t border-white/5 pt-4">
                  {group.results.length === 0 && !group.error && (
                    <p className="text-[11px] text-white/20 italic py-2">Aucun résultat pour ce passage (doublons ou déjà connus).</p>
                  )}
                  {group.error && (
                    <div className="flex items-start gap-2.5 p-4 bg-red-500/6 border border-red-500/15 rounded-xl">
                      <AlertCircle size={13} className="text-red-400/70 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-red-300/60 font-mono break-all leading-relaxed">{group.error}</p>
                    </div>
                  )}

                  {group.results.map(result => {
                    const url       = result.idweb ? `https://www.boamp.fr/avis/detail/${result.idweb}` : null
                    const dLeft     = daysLeftLabel(result.offer_deadline)
                    const isLoading = actionLoading === result.id
                    const isDone    = result.status === 'imported'

                    const urgencyColor = dLeft === null ? null : dLeft < 0 ? 'text-white/20' : dLeft <= 3 ? 'text-red-300' : dLeft <= 7 ? 'text-amber-300' : 'text-blue-300'
                    const urgencyBg    = dLeft === null ? null : dLeft < 0 ? 'bg-white/4 border-white/8' : dLeft <= 3 ? 'bg-red-500/15 border-red-500/25' : dLeft <= 7 ? 'bg-amber-500/15 border-amber-500/25' : 'bg-blue-500/12 border-blue-500/20'

                    return (
                      <div key={result.id}
                        className={cn('group rounded-2xl p-5 transition-all', isDone && 'opacity-55 hover:opacity-75')}
                        style={isDone
                          ? { background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }
                          : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }
                        }
                      >
                        {/* Title row */}
                        <div className="flex items-start gap-4 mb-4">
                          <div className={cn('w-1 self-stretch rounded-full flex-shrink-0 mt-0.5', isDone ? 'bg-emerald-500/40' : 'bg-amber-500/50')} />
                          <p className={cn('flex-1 text-sm font-semibold leading-snug', isDone ? 'text-white/50' : 'text-white/90')}>
                            {result.name}
                          </p>
                          {url && (
                            <a href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                              className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/8 border border-blue-500/15 text-blue-400/70 text-[10px] font-semibold hover:bg-blue-500/18 hover:text-blue-300 transition-all whitespace-nowrap">
                              BOAMP <ExternalLink size={9} />
                            </a>
                          )}
                        </div>

                        {/* Meta */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4 ml-5">
                          <span className="flex items-center gap-1.5 text-[11px] text-white/35"><Building2 size={11} className="text-white/20" />{result.client}</span>
                          <span className="flex items-center gap-1.5 text-[11px] text-white/35"><MapPin size={11} className="text-white/20" />{result.location}</span>
                          <span className="flex items-center gap-1.5 text-[11px] text-white/30"><Tag size={11} className="text-white/20" />{result.consultation_type}{result.procedure_type && ` · ${result.procedure_type}`}</span>
                        </div>

                        {result.description && (
                          <p className="ml-5 mb-4 text-[11px] text-white/35 leading-relaxed line-clamp-2 pl-3 border-l border-white/6">
                            {result.description}
                          </p>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between gap-3 ml-5 flex-wrap">
                          <div className="flex items-center gap-2.5">
                            {dLeft !== null && urgencyBg && urgencyColor && (
                              <span className={cn('text-[10px] font-extrabold px-2.5 py-1 rounded-lg border tabular-nums', urgencyColor, urgencyBg)}>
                                {dLeft < 0 ? 'Expiré' : dLeft === 0 ? "Aujourd'hui" : `J-${dLeft}`}
                              </span>
                            )}
                            {result.offer_deadline && (
                              <span className="text-[11px] text-white/22">
                                Limite : {new Date(result.offer_deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                            {result.idweb && <span className="text-[10px] text-white/12 font-mono">Réf. {result.idweb}</span>}
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isDone ? (
                              result.project_id ? (
                                <Link href={`/projects/${result.project_id}`}
                                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold hover:bg-emerald-500/18 transition-all">
                                  <CheckCircle2 size={12} />Voir le projet <ArrowUpRight size={10} />
                                </Link>
                              ) : (
                                <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/8 border border-emerald-500/15 text-emerald-500/60 text-[11px]">
                                  <CheckCircle2 size={12} />Importé
                                </span>
                              )
                            ) : (
                              <button onClick={() => handleAction(result.id, 'import')} disabled={isLoading}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.97] text-white text-[11px] font-semibold transition-all disabled:opacity-50 shadow-sm shadow-emerald-600/20">
                                {isLoading ? <Loader2 size={11} className="animate-spin" /> : <PackagePlus size={11} />}
                                Ajouter
                              </button>
                            )}
                            {!isDone && (
                              <button onClick={() => handleAction(result.id, 'dismiss')} disabled={isLoading}
                                title="Ignorer"
                                className="p-2 rounded-xl text-white/20 hover:text-red-400 hover:bg-red-500/8 border border-transparent hover:border-red-500/15 transition-all disabled:opacity-50">
                                <Trash2 size={13} />
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
    </div>
  )
}
