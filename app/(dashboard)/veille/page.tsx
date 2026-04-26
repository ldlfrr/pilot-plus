'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Radio, Play, Loader2, AlertCircle, Plus, X,
  Clock, Zap, Filter, RotateCcw,
  ExternalLink, MapPin, Tag, Building2, PackagePlus,
  Trash2, ChevronDown, CheckCircle2, ArrowUpRight,
  CalendarDays, Inbox, ChevronRight, CheckSquare, Square,
  TrendingUp, Target, Sparkles, BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { VeilleRunGroup } from '@/app/api/veille/history/route'

// ── Types ─────────────────────────────────────────────────────────────────────

interface VeilleSettings {
  keywords:      string[]
  regions:       string[]
  types_marche:  string[]
  montant_min:   number
  montant_max:   number
  last_run_at:   string | null
}

// ── Constants ─────────────────────────────────────────────────────────────────

const REGIONS_FR = [
  { code: '01', label: 'Ain' },           { code: '02', label: 'Aisne' },
  { code: '03', label: 'Allier' },        { code: '06', label: 'Alpes-Maritimes' },
  { code: '13', label: 'Bouches-du-Rhône' },{ code: '14', label: 'Calvados' },
  { code: '21', label: "Côte-d'Or" },     { code: '25', label: 'Doubs' },
  { code: '31', label: 'Haute-Garonne' }, { code: '33', label: 'Gironde' },
  { code: '34', label: 'Hérault' },       { code: '35', label: 'Ille-et-Vilaine' },
  { code: '38', label: 'Isère' },         { code: '44', label: 'Loire-Atlantique' },
  { code: '45', label: 'Loiret' },        { code: '49', label: 'Maine-et-Loire' },
  { code: '54', label: 'Meurthe-et-Moselle' },{ code: '57', label: 'Moselle' },
  { code: '59', label: 'Nord' },          { code: '62', label: 'Pas-de-Calais' },
  { code: '63', label: 'Puy-de-Dôme' },  { code: '67', label: 'Bas-Rhin' },
  { code: '68', label: 'Haut-Rhin' },    { code: '69', label: 'Rhône' },
  { code: '75', label: 'Paris' },         { code: '76', label: 'Seine-Maritime' },
  { code: '77', label: 'Seine-et-Marne' },{ code: '78', label: 'Yvelines' },
  { code: '83', label: 'Var' },           { code: '84', label: 'Vaucluse' },
  { code: '92', label: 'Hauts-de-Seine' },{ code: '93', label: 'Seine-Saint-Denis' },
  { code: '94', label: 'Val-de-Marne' },
]

const TYPES_MARCHE = ['Travaux', 'Services', 'Fournitures']
const QUICK_KW = [
  'photovoltaïque', 'solaire', 'ENR', 'IRVE', 'LED',
  'efficacité énergétique', 'rénovation thermique', 'pompe à chaleur',
  'isolation', 'CVC', 'génie civil', 'VRD', 'charpente',
]

function daysLeft(deadline: string | null): number | null {
  if (!deadline) return null
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
}

function urgencyStyle(dLeft: number | null): { text: string; bg: string; label: string } | null {
  if (dLeft === null) return null
  if (dLeft < 0)  return { text: 'text-white/30', bg: 'bg-white/5 border-white/10',   label: 'Expiré' }
  if (dLeft === 0) return { text: 'text-red-300',  bg: 'bg-red-500/15 border-red-500/30', label: "Auj." }
  if (dLeft <= 3) return { text: 'text-red-300',  bg: 'bg-red-500/15 border-red-500/25', label: `J-${dLeft}` }
  if (dLeft <= 7) return { text: 'text-amber-300',bg: 'bg-amber-500/15 border-amber-500/25', label: `J-${dLeft}` }
  return { text: 'text-blue-300', bg: 'bg-blue-500/12 border-blue-500/20', label: `J-${dLeft}` }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function VeillePage() {
  const [settings, setSettings] = useState<VeilleSettings>({
    keywords: [], regions: [], types_marche: [],
    montant_min: 0, montant_max: 5000000, last_run_at: null,
  })
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [running, setRunning] = useState(false)
  const [runMsg,  setRunMsg]  = useState<{ ok: boolean; text: string } | null>(null)

  const [kwInput,    setKwInput]    = useState('')
  const [filterOpen, setFilterOpen] = useState(false)

  const [groups,        setGroups]        = useState<VeilleRunGroup[]>([])
  const [feedLoading,   setFeedLoading]   = useState(true)
  const [collapsed,     setCollapsed]     = useState<Set<string>>(new Set())
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
  const toggleRegion  = (code: string) => save({
    regions: settings.regions.includes(code)
      ? settings.regions.filter(r => r !== code)
      : [...settings.regions, code],
  })
  const toggleType = (t: string) => save({
    types_marche: settings.types_marche.includes(t)
      ? settings.types_marche.filter(x => x !== t)
      : [...settings.types_marche, t],
  })

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
          : `Aucune nouvelle annonce (${total_found} analysées · ${skipped} déjà connues)`,
      })
      setSettings(s => ({ ...s, last_run_at: new Date().toISOString() }))
      await loadFeed()
    } catch (err) {
      setRunMsg({ ok: false, text: err instanceof Error ? err.message : 'Erreur inconnue' })
    } finally {
      setRunning(false)
    }
  }

  // ── Actions ────────────────────────────────────────────────────────────────

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
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

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

  // ── Stats ──────────────────────────────────────────────────────────────────

  const totalPending  = groups.reduce((s, g) => s + g.results.filter(r => r.status === 'pending').length, 0)
  const totalImported = groups.reduce((s, g) => s + g.results.filter(r => r.status === 'imported').length, 0)
  const totalResults  = groups.reduce((s, g) => s + g.results.length, 0)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-0 h-full animate-fade-in">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-5 md:px-7"
        style={{ background: 'rgba(8,14,34,0.85)', borderBottom: '1px solid rgba(255,255,255,0.055)', backdropFilter: 'blur(20px)' }}>
        <div className="h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Radio size={15} className="text-blue-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white leading-none">Veille BOAMP</h1>
                <span className="hidden sm:flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-400">
                  <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-white/30 mt-0.5 truncate">
                {settings.last_run_at
                  ? `Dernière recherche : ${new Date(settings.last_run_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                  : 'Surveillance automatique des consultations publiques'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {saving && (
              <span className="hidden md:flex items-center gap-1 text-[10px] text-white/20">
                <Loader2 size={9} className="animate-spin" />Sauvegarde
              </span>
            )}
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
                  : 'bg-white/5 border-white/8 text-white/50 hover:text-white hover:bg-white/8',
              )}
            >
              <Filter size={12} />Critères
              {settings.keywords.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
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
                : <><Play size={12} fill="currentColor" />Lancer la veille</>}
            </button>
          </div>
        </div>
      </div>

      {/* ── Scrollable body ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="p-5 md:p-7 space-y-5 max-w-5xl mx-auto">

          {/* ── Flash message ──────────────────────────────────────────── */}
          {runMsg && (
            <div className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm',
              runMsg.ok
                ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-300'
                : 'bg-red-500/8 border-red-500/20 text-red-300',
            )}>
              {runMsg.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              <span className="flex-1">{runMsg.text}</span>
              <button onClick={() => setRunMsg(null)} className="text-white/20 hover:text-white/50 transition-colors">
                <X size={13} />
              </button>
            </div>
          )}

          {/* ── Stats bar (shown when results exist) ────────────────────── */}
          {!feedLoading && groups.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: BarChart3,  label: 'Annonces totales', value: totalResults,  color: 'text-white'       },
                { icon: Clock,      label: 'En attente',       value: totalPending,  color: 'text-amber-400'   },
                { icon: CheckCircle2,label: 'Importées',        value: totalImported, color: 'text-emerald-400' },
                { icon: TrendingUp, label: 'Recherches',       value: groups.length, color: 'text-blue-400'    },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="rounded-2xl px-4 py-3.5 flex items-center gap-3"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Icon size={14} className={cn('flex-shrink-0', color)} />
                  <div>
                    <p className={cn('text-lg font-extrabold tabular-nums leading-none', color)}>{value}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Criteria panel ─────────────────────────────────────────── */}
          {filterOpen && !settingsLoading && (
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(8,14,34,0.70)', border: '1px solid rgba(59,130,246,0.15)', backdropFilter: 'blur(12px)' }}>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-2">
                  <Filter size={14} className="text-blue-400" />
                  <span className="text-sm font-semibold text-white">Critères de recherche</span>
                </div>
                <div className="flex items-center gap-3">
                  {settings.keywords.length > 0 && (
                    <span className="text-[11px] text-blue-400/70">
                      {settings.keywords.length} mot{settings.keywords.length > 1 ? 's' : ''}-clé{settings.keywords.length > 1 ? 's' : ''} actif{settings.keywords.length > 1 ? 's' : ''}
                    </span>
                  )}
                  <button onClick={() => setFilterOpen(false)} className="text-white/25 hover:text-white/60 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* ── Keywords ─────────────────────────────────────────── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center">
                      <Zap size={11} className="text-amber-400" />
                    </div>
                    <span className="text-xs font-bold text-white/75 uppercase tracking-wider">Mots-clés</span>
                  </div>

                  {settings.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {settings.keywords.map(kw => (
                        <span key={kw} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/12 border border-blue-500/20 text-[11px] text-blue-300 font-medium">
                          {kw}
                          <button onClick={() => removeKeyword(kw)} className="text-blue-400/40 hover:text-red-400 transition-colors ml-0.5">
                            <X size={9} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mb-3">
                    <input
                      type="text" value={kwInput}
                      onChange={e => setKwInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                      placeholder="Ajouter un mot-clé…"
                      className="flex-1 px-3 py-2 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition-colors"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
                    />
                    <button onClick={addKeyword}
                      className="px-2.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors">
                      <Plus size={13} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_KW.filter(s => !settings.keywords.includes(s)).slice(0, 8).map(s => (
                      <button key={s} onClick={() => save({ keywords: [...settings.keywords, s] })}
                        className="text-[10px] px-2 py-1 rounded-lg bg-white/4 border border-white/8 text-white/30 hover:text-white/65 hover:bg-white/7 transition-all">
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Departments ──────────────────────────────────────── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-violet-500/15 flex items-center justify-center">
                      <MapPin size={11} className="text-violet-400" />
                    </div>
                    <span className="text-xs font-bold text-white/75 uppercase tracking-wider">Départements</span>
                    <div className="ml-auto flex items-center gap-1.5">
                      {settings.regions.length === REGIONS_FR.length ? (
                        <button onClick={() => save({ regions: [] })}
                          className="flex items-center gap-1 text-[9px] text-violet-400/70 hover:text-violet-300 transition-colors">
                          <CheckSquare size={9} />Tout déselect.
                        </button>
                      ) : (
                        <button onClick={() => save({ regions: REGIONS_FR.map(r => r.code) })}
                          className="flex items-center gap-1 text-[9px] text-white/25 hover:text-violet-300 transition-colors">
                          <Square size={9} />Tout
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-0.5 max-h-44 overflow-y-auto pr-1 scrollbar-hide">
                    {REGIONS_FR.map(({ code, label }) => {
                      const active = settings.regions.includes(code)
                      return (
                        <button key={code} onClick={() => toggleRegion(code)}
                          className={cn(
                            'flex items-center gap-1 px-2 py-1.5 rounded-md text-left transition-all text-[10px]',
                            active
                              ? 'bg-violet-500/15 text-violet-300'
                              : 'text-white/28 hover:text-white/55 hover:bg-white/4',
                          )}>
                          <span className="font-mono text-[8px] text-white/15 w-4 flex-shrink-0">{code}</span>
                          <span className="truncate">{label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* ── Type de marché ────────────────────────────────────── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                      <Tag size={11} className="text-emerald-400" />
                    </div>
                    <span className="text-xs font-bold text-white/75 uppercase tracking-wider">Type de marché</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {TYPES_MARCHE.map(t => {
                      const active = settings.types_marche.includes(t)
                      return (
                        <button key={t} onClick={() => toggleType(t)}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left',
                            active
                              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                              : 'bg-white/3 border-white/7 text-white/38 hover:border-white/12 hover:text-white/60',
                          )}>
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
                      <p className="text-[10px] text-white/20 px-1">Tous types inclus par défaut</p>
                    )}
                  </div>

                  {/* Hint */}
                  <div className="mt-4 p-3 rounded-xl flex items-start gap-2.5"
                    style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
                    <Sparkles size={11} className="text-blue-400/60 mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] text-white/30 leading-relaxed">
                      Plus vous ajoutez de mots-clés précis, plus la veille sera ciblée et pertinente pour votre profil.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Empty state ─────────────────────────────────────────────── */}
          {!feedLoading && groups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                  style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                  <Inbox size={28} className="text-blue-400/40" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
                  <Radio size={11} className="text-white" />
                </div>
              </div>
              <div className="text-center max-w-sm">
                <p className="text-base font-bold text-white/60 mb-2">Votre radar est prêt</p>
                <p className="text-sm text-white/30 leading-relaxed">
                  Configurez vos mots-clés via le bouton <strong className="text-white/50">Critères</strong> puis
                  lancez la première recherche pour scanner le BOAMP en temps réel.
                </p>
              </div>
              {settings.keywords.length === 0 ? (
                <button
                  onClick={() => setFilterOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all"
                >
                  <Filter size={14} />Configurer mes critères
                </button>
              ) : (
                <button
                  onClick={runVeille}
                  disabled={running}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all"
                >
                  {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
                  Lancer ma première veille
                </button>
              )}
            </div>
          )}

          {/* ── Loading ──────────────────────────────────────────────────── */}
          {feedLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={22} className="animate-spin text-white/20" />
            </div>
          )}

          {/* ── Results feed ─────────────────────────────────────────────── */}
          {!feedLoading && groups.map(group => {
            const isCollapsed = collapsed.has(group.id)
            const pending     = group.results.filter(r => r.status === 'pending').length
            const imported    = group.results.filter(r => r.status === 'imported').length
            const runDate     = new Date(group.run_at)

            return (
              <div key={group.id} className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>

                {/* Group header */}
                <div className="flex items-center">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="flex-1 flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left min-w-0"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                      <CalendarDays size={14} className="text-white/30" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <p className="text-sm font-bold text-white/80 capitalize">
                          {runDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                        <span className="text-xs text-white/20">
                          {runDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-white/25">
                          {group.total_found} annonce{group.total_found !== 1 ? 's' : ''} analysée{group.total_found !== 1 ? 's' : ''}
                        </span>
                        {pending > 0 && (
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-500/12 border border-amber-500/20 px-2 py-0.5 rounded-md">
                            {pending} en attente
                          </span>
                        )}
                        {imported > 0 && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 px-2 py-0.5 rounded-md">
                            {imported} ajouté{imported !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={14} className={cn(
                      'text-white/20 flex-shrink-0 transition-transform duration-200',
                      !isCollapsed && 'rotate-90',
                    )} />
                  </button>

                  <button
                    onClick={(e) => deleteGroup(group.id, e)}
                    disabled={deletingGroup === group.id}
                    className="flex-shrink-0 mr-4 p-2 rounded-lg text-white/15 hover:text-red-400 hover:bg-red-500/8 transition-all disabled:opacity-40"
                  >
                    {deletingGroup === group.id
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Trash2 size={13} />}
                  </button>
                </div>

                {/* Result cards */}
                {!isCollapsed && (
                  <div className="px-4 pb-4 space-y-2.5 border-t border-white/[0.05] pt-4">
                    {group.results.length === 0 && !group.error && (
                      <p className="text-[11px] text-white/20 italic py-2 px-1">Aucun nouveau résultat (doublons ou déjà connus).</p>
                    )}

                    {group.error && (
                      <div className="flex items-start gap-2.5 p-4 bg-red-500/6 border border-red-500/15 rounded-xl">
                        <AlertCircle size={13} className="text-red-400/70 flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-red-300/60 font-mono break-all leading-relaxed">{group.error}</p>
                      </div>
                    )}

                    {group.results.map(result => {
                      const url       = result.idweb ? `https://www.boamp.fr/avis/detail/${result.idweb}` : null
                      const dLeft     = daysLeft(result.offer_deadline)
                      const isLoading = actionLoading === result.id
                      const isDone    = result.status === 'imported'
                      const urg       = urgencyStyle(dLeft)

                      return (
                        <div key={result.id}
                          className={cn(
                            'group rounded-2xl transition-all',
                            isDone ? 'opacity-50 hover:opacity-70' : 'hover:border-white/12',
                          )}
                          style={{
                            background: isDone ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.03)',
                            border: isDone ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,255,255,0.08)',
                          }}
                        >
                          <div className="p-4">
                            {/* Title + BOAMP link */}
                            <div className="flex items-start gap-3 mb-3">
                              <div className={cn(
                                'w-1 self-stretch rounded-full flex-shrink-0 mt-0.5',
                                isDone ? 'bg-emerald-500/30' : 'bg-amber-500/50',
                              )} />
                              <p className={cn(
                                'flex-1 text-sm font-semibold leading-snug',
                                isDone ? 'text-white/45' : 'text-white/85',
                              )}>
                                {result.name}
                              </p>
                              {url && (
                                <a href={url} target="_blank" rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/8 border border-blue-500/15 text-blue-400/65 text-[10px] font-semibold hover:bg-blue-500/18 hover:text-blue-300 transition-all whitespace-nowrap">
                                  BOAMP <ExternalLink size={9} />
                                </a>
                              )}
                            </div>

                            {/* Meta chips */}
                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3 ml-4">
                              <span className="flex items-center gap-1.5 text-[11px] text-white/30">
                                <Building2 size={10} className="text-white/18" />{result.client}
                              </span>
                              <span className="flex items-center gap-1.5 text-[11px] text-white/30">
                                <MapPin size={10} className="text-white/18" />{result.location}
                              </span>
                              <span className="flex items-center gap-1.5 text-[11px] text-white/25">
                                <Tag size={10} className="text-white/18" />
                                {result.consultation_type}
                                {result.procedure_type && ` · ${result.procedure_type}`}
                              </span>
                            </div>

                            {/* Description */}
                            {result.description && (
                              <p className="ml-4 mb-3 text-[11px] text-white/32 leading-relaxed line-clamp-2 pl-3"
                                style={{ borderLeft: '2px solid rgba(255,255,255,0.07)' }}>
                                {result.description}
                              </p>
                            )}

                            {/* Footer: deadline + actions */}
                            <div className="flex items-center justify-between gap-3 ml-4 flex-wrap">
                              <div className="flex items-center gap-2.5">
                                {urg && (
                                  <span className={cn('text-[10px] font-extrabold px-2.5 py-1 rounded-lg border tabular-nums', urg.text, urg.bg)}>
                                    {urg.label}
                                  </span>
                                )}
                                {result.offer_deadline && (
                                  <span className="text-[10px] text-white/20">
                                    {new Date(result.offer_deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                )}
                                {result.idweb && (
                                  <span className="text-[9px] text-white/12 font-mono">#{result.idweb}</span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0">
                                {isDone ? (
                                  result.project_id ? (
                                    <Link href={`/projects/${result.project_id}`}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold hover:bg-emerald-500/18 transition-all">
                                      <CheckCircle2 size={11} />Voir le projet <ArrowUpRight size={9} />
                                    </Link>
                                  ) : (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/8 border border-emerald-500/12 text-emerald-500/50 text-[11px]">
                                      <CheckCircle2 size={11} />Importé
                                    </span>
                                  )
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleAction(result.id, 'import')}
                                      disabled={isLoading}
                                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.97] text-white text-[11px] font-semibold transition-all disabled:opacity-50 shadow-sm shadow-emerald-600/20"
                                    >
                                      {isLoading ? <Loader2 size={11} className="animate-spin" /> : <PackagePlus size={11} />}
                                      Ajouter au pipeline
                                    </button>
                                    <button
                                      onClick={() => handleAction(result.id, 'dismiss')}
                                      disabled={isLoading}
                                      title="Ignorer"
                                      className="p-1.5 rounded-xl text-white/18 hover:text-red-400 hover:bg-red-500/8 border border-transparent hover:border-red-500/15 transition-all disabled:opacity-50"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </>
                                )}
                              </div>
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
    </div>
  )
}
