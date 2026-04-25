'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FileUpload } from '@/components/projects/FileUpload'
import { ScoreDisplay } from '@/components/analysis/ScoreDisplay'
import { SyntheseTab }         from '@/components/project/tabs/SyntheseTab'
import { SyntheseCorpTab }     from '@/components/project/tabs/SyntheseCorpTab'
import { BesoinClientTab }     from '@/components/project/tabs/BesoinClientTab'
import { PiecesTab }           from '@/components/project/tabs/PiecesTab'
import { SpecificitesTab }     from '@/components/project/tabs/SpecificitesTab'
import { ActionsTab }          from '@/components/project/tabs/ActionsTab'
import { MapTab }              from '@/components/project/tabs/MapTab'
import { ResponsePlanTab }     from '@/components/project/tabs/ResponsePlanTab'
import { CommentsTab }         from '@/components/project/tabs/CommentsTab'
import { IntervenantsTab }     from '@/components/project/tabs/IntervenantsTab'
import { ChiffrageTab }        from '@/components/project/tabs/ChiffrageTab'
import { ChecklistRemiseTab }  from '@/components/project/tabs/ChecklistRemiseTab'
import { MemoireTechniqueTab } from '@/components/project/tabs/MemoireTechniqueTab'
import { MembresProjetTab }    from '@/components/project/tabs/MembresProjetTab'
import { WorkflowStepper }     from '@/components/project/WorkflowStepper'
import {
  Cpu, Target, Trash2, Pencil, Loader2, AlertCircle, CheckCircle,
  Share2, FilePlus, Calendar, MapPin, Building, Hash,
  FileText, Users, ListChecks, Wrench, BarChart3, Layers,
  Copy, X, ExternalLink, Link as LinkIcon, Lock, ArrowRight,
  ClipboardList, Map, Trophy, XCircle, Flag, TrendingUp,
  BookOpen, MessageSquare, Calculator, ClipboardCheck, FileDown,
  FolderOpen,
} from 'lucide-react'
import { ExportMenu } from '@/components/projects/ExportMenu'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import type { Project, ProjectFile, ProjectAnalysis, ProjectScore, TaskStates, SubscriptionTier, ProjectOutcome, Intervenant, ChiffrageData, ChecklistRemise } from '@/types'

type Tab = 'synthese' | 'corp' | 'map' | 'besoin' | 'pieces' | 'specificites' | 'gonogo' | 'actions' | 'documents' | 'plan' | 'comments' | 'intervenants' | 'chiffrage' | 'checklist' | 'memoire' | 'membres'
type TabGroup = 'analyse' | 'reponse' | 'commercial' | 'equipe'

interface ProjectData {
  project: Project
  files: ProjectFile[]
  analyses: ProjectAnalysis[]
  score: ProjectScore | null
}

const EMPTY_TASK_STATES: TaskStates = { pieces: {}, actions: {} }

const ENTERPRISE_TIERS = new Set(['enterprise', 'lifetime'])

const VERDICT_CFG = {
  GO:       { label: 'GO',         bg: 'bg-emerald-500/20 border-emerald-500/40', text: 'text-emerald-400' },
  A_ETUDIER:{ label: 'A ÉTUDIER',  bg: 'bg-amber-500/20 border-amber-500/40',    text: 'text-amber-400' },
  NO_GO:    { label: 'NO GO',      bg: 'bg-red-500/20 border-red-500/40',         text: 'text-red-400' },
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [data, setData]       = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('synthese')

  const [analyzing, setAnalyzing] = useState(false)
  const [scoring, setScoring]     = useState(false)
  const [actionError, setActionError]     = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const [shareLoading, setShareLoading] = useState(false)
  const [shareUrl, setShareUrl]         = useState<string | null>(null)
  const [copyOk, setCopyOk]             = useState(false)

  // ── Share with team ──────────────────────────────────────────────────────────
  interface TeamBasic { id: string; name: string }
  const [teamShareOpen,   setTeamShareOpen]   = useState(false)
  const [myTeams,         setMyTeams]         = useState<TeamBasic[]>([])
  const [teamsLoaded,     setTeamsLoaded]     = useState(false)
  const [sharingTeamId,   setSharingTeamId]   = useState<string | null>(null)
  const [teamShareDone,   setTeamShareDone]   = useState<Set<string>>(new Set())

  // ── Clôture panel ────────────────────────────────────────────────────────────
  const [cloturePanelOpen, setCloturePanelOpen] = useState(false)
  const [cloturingOutcome, setCloturingOutcome] = useState<Exclude<ProjectOutcome, 'pending'>>('won')
  const [cloturingLossReason, setCloturingLossReason] = useState('')
  const [cloturingCa, setCloturingCa]   = useState('')
  const [cloturing, setCloturing]       = useState(false)

  interface UserLimits { tier: SubscriptionTier; analyses_used: number; analyses_limit: number | null }
  const [userLimits, setUserLimits] = useState<UserLimits | null>(null)

  // ── Current user role on this project ────────────────────────────────────────
  const [projectRole, setProjectRole] = useState<'owner' | 'editor' | 'viewer' | 'avant_vente'>('owner')

  // ── Pipeline state (synced from task_states) ─────────────────────────────────
  const [intervenants, setIntervenants] = useState<Intervenant[]>([])
  const [chiffrage,    setChiffrage]    = useState<ChiffrageData | null>(null)
  const [checklist,    setChecklist]    = useState<ChecklistRemise | null>(null)
  const [memoireText,  setMemoireText]  = useState<string>('')
  const [briefLoading,  setBriefLoading]  = useState(false)
  const [briefError,    setBriefError]    = useState<string | null>(null)
  const [pipelineStage, setPipelineStage] = useState<import('@/types').PipelineStage | undefined>(undefined)

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${id}`)
      if (!res.ok) throw new Error('Projet introuvable')
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchProject()
    fetch('/api/user/limits').then(r => r.json()).then(setUserLimits).catch(() => {})
    // Detect current user's role on this project
    fetch(`/api/projects/${id}/members/me`)
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j?.role) setProjectRole(j.role) })
      .catch(() => {})
  }, [fetchProject, id])

  // Sync pipeline fields from task_states after load
  useEffect(() => {
    if (!data) return
    const ts = (data.project.task_states ?? {}) as TaskStates
    setIntervenants  (ts.intervenants      ?? [])
    setChiffrage     (ts.chiffrage         ?? null)
    setChecklist     (ts.checklist         ?? null)
    setMemoireText   (ts.memoire_technique ?? '')
    setPipelineStage (ts.pipeline_stage)
  }, [data])

  async function callApi(url: string) {
    const res  = await fetch(url, { method: 'POST' })
    const text = await res.text()
    let json: Record<string, unknown> = {}
    try { json = text ? JSON.parse(text) : {} } catch {
      throw new Error(`Réponse invalide${text ? `: ${text.slice(0, 120)}` : ''}`)
    }
    if (!res.ok && json.code === 'LIMIT_REACHED') {
      // Refresh limits after a blocked call
      fetch('/api/user/limits').then(r => r.json()).then(setUserLimits).catch(() => {})
    }
    return { ok: res.ok, json }
  }

  async function handleAnalyze() {
    setAnalyzing(true); setActionError(null); setActionSuccess(null)
    try {
      const { ok, json } = await callApi(`/api/projects/${id}/analyze`)
      if (!ok) throw new Error((json.error as string) ?? 'Erreur analyse')
      await fetchProject()
      // Refresh limits counter
      fetch('/api/user/limits').then(r => r.json()).then(setUserLimits).catch(() => {})
      setActiveTab('synthese')
      setActionSuccess('Analyse IA terminée.')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erreur')
    } finally { setAnalyzing(false) }
  }

  async function handleScore() {
    setScoring(true); setActionError(null); setActionSuccess(null)
    try {
      const { ok, json } = await callApi(`/api/projects/${id}/score`)
      if (!ok) throw new Error((json.error as string) ?? 'Erreur scoring')
      await fetchProject()
      setActiveTab('gonogo')
      setActionSuccess('Score Go/No Go calculé.')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erreur')
    } finally { setScoring(false) }
  }

  function handleAddDoc() {
    setActiveTab('documents')
  }

  async function handleShare() {
    if (shareUrl) { setShareUrl(null); return }   // toggle off
    setShareLoading(true)
    try {
      const res = await fetch(`/api/projects/${id}/share`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur')
      setShareUrl(json.url)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Impossible de créer le lien')
    } finally { setShareLoading(false) }
  }

  async function copyShareUrl() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopyOk(true)
      setTimeout(() => setCopyOk(false), 2000)
    } catch { /* clipboard blocked */ }
  }

  async function handleDelete() {
    if (!confirm('Supprimer ce projet ? Action irréversible.')) return
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    if (res.ok) router.push('/projects')
  }

  async function handleCloture() {
    setCloturing(true); setActionError(null); setActionSuccess(null)
    try {
      const body: Record<string, unknown> = { outcome: cloturingOutcome }
      if (cloturingOutcome === 'lost' && cloturingLossReason.trim()) body.loss_reason = cloturingLossReason.trim()
      if (cloturingOutcome === 'won'  && cloturingCa.trim()) body.ca_amount = parseFloat(cloturingCa.replace(',', '.'))
      const res  = await fetch(`/api/projects/${id}/outcome`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json.error as string) ?? 'Erreur clôture')
      }
      await fetchProject()
      setCloturePanelOpen(false)
      setActionSuccess(
        cloturingOutcome === 'won'  ? '🏆 Projet marqué comme Gagné !' :
        cloturingOutcome === 'lost' ? 'Projet marqué comme Perdu.' :
                                     'Projet abandonné.'
      )
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erreur')
    } finally { setCloturing(false) }
  }

  async function openTeamShareDropdown() {
    setTeamShareOpen(v => !v)
    if (!teamsLoaded) {
      fetch('/api/team')
        .then(r => r.json())
        .then(d => {
          setMyTeams((d.teams ?? []).map((t: { id: string; name: string }) => ({ id: t.id, name: t.name })))
          setTeamsLoaded(true)
        })
        .catch(() => { setTeamsLoaded(true) })
    }
  }

  async function handleShareWithTeam(teamId: string) {
    setSharingTeamId(teamId)
    try {
      const res = await fetch('/api/team/projects', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ teamId, projectId: id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur')
      setTeamShareDone(prev => new Set([...prev, teamId]))
      setActionSuccess('Projet partagé avec l\'équipe ✓')
      setTimeout(() => setTeamShareOpen(false), 1200)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erreur')
      setTeamShareOpen(false)
    } finally {
      setSharingTeamId(null)
    }
  }

  async function handleBriefAvantVente() {
    setBriefLoading(true); setBriefError(null)
    try {
      const res = await fetch(`/api/projects/${id}/brief-avant-vente`, { method: 'POST' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(json.error ?? 'Erreur génération')
      }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `Brief_AvantVente_${id.slice(0, 8)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setBriefError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setBriefLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-0 animate-pulse">
        <div className="bg-[var(--bg-surface)] border-b border-white/5 px-4 md:px-6 py-4 flex-shrink-0">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-56 bg-white/8 rounded-lg" />
              <div className="h-5 w-16 bg-white/5 rounded-full" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3.5 w-24 bg-white/5 rounded" />
              <div className="h-3.5 w-20 bg-white/5 rounded" />
            </div>
            <div className="flex items-center gap-2">
              {[24, 20, 20, 20, 20, 7, 7].map((w, i) => (
                <div key={i} className="h-7 bg-white/5 rounded-lg" style={{ width: w * 4 }} />
              ))}
            </div>
          </div>
          <div className="flex gap-0.5">
            {[80, 64, 48, 96, 112, 88, 72, 72, 80].map((w, i) => (
              <div key={i} className="h-9 bg-white/5 rounded-sm" style={{ width: w }} />
            ))}
          </div>
        </div>
        <div className="flex-1 p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-white/4 rounded-xl border border-white/6" />)}
          </div>
          <div className="h-48 bg-white/4 rounded-xl border border-white/6" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center flex-1 h-full">
        <div className="text-center">
          <AlertCircle size={28} className="mx-auto text-red-400 mb-2" />
          <p className="text-white/60">{error ?? 'Projet introuvable'}</p>
        </div>
      </div>
    )
  }

  const { project, files, analyses, score } = data
  const latestAnalysis = analyses[0] ?? null
  const verdict = score?.verdict
  const verdictCfg = verdict ? VERDICT_CFG[verdict] : null
  const taskStates: TaskStates = (project.task_states as TaskStates) ?? EMPTY_TASK_STATES

  // ── Freemium limits ──────────────────────────────────────────────────────────
  const isFree = userLimits?.tier === 'free'
  const analysesLimitReached = isFree &&
    userLimits !== null &&
    (userLimits.analyses_limit !== null) &&
    (userLimits.analyses_used >= userLimits.analyses_limit)
  const FREE_LOCKED_TABS: Tab[] = ['besoin', 'pieces', 'specificites', 'gonogo', 'actions']
  const isTabLocked = (tabId: Tab) => isFree && FREE_LOCKED_TABS.includes(tabId)
  // ────────────────────────────────────────────────────────────────────────────

  interface TabDef { id: Tab; label: string; icon: typeof FileText }
  const TAB_GROUPS: {
    id:             TabGroup
    label:          string
    icon:           typeof FileText
    activeGroupCls: string
    activeSubColor: string
    tabs:           TabDef[]
  }[] = [
    {
      id: 'analyse',
      label: 'Analyse IA',
      icon: Cpu,
      activeGroupCls: 'bg-blue-500/12 border-blue-500/30 text-blue-400',
      activeSubColor: 'text-blue-400',
      tabs: [
        { id: 'synthese',     label: 'Synthèse',           icon: FileText    },
        { id: 'besoin',       label: 'Besoin client',       icon: Users       },
        { id: 'specificites', label: 'Spécificités',        icon: Wrench      },
        { id: 'map',          label: 'Carte',               icon: Map         },
        { id: 'gonogo',       label: 'Go / No Go',          icon: BarChart3   },
        { id: 'actions',      label: 'Actions',             icon: Target      },
      ],
    },
    {
      id: 'reponse',
      label: 'Dossier',
      icon: FolderOpen,
      activeGroupCls: 'bg-violet-500/12 border-violet-500/30 text-violet-400',
      activeSubColor: 'text-violet-400',
      tabs: [
        { id: 'plan',         label: 'Plan de réponse',     icon: BookOpen    },
        { id: 'memoire',      label: 'Mémoire technique',   icon: FileText    },
        { id: 'corp',         label: 'Synthèse Corporate',  icon: ClipboardList },
        { id: 'pieces',       label: 'Pièces à fournir',    icon: ListChecks  },
        { id: 'documents',    label: 'Documents',           icon: Layers      },
      ],
    },
    {
      id: 'commercial',
      label: 'Commercial',
      icon: TrendingUp,
      activeGroupCls: 'bg-amber-500/12 border-amber-500/30 text-amber-400',
      activeSubColor: 'text-amber-400',
      tabs: [
        { id: 'intervenants', label: 'Intervenants',        icon: Users        },
        { id: 'chiffrage',    label: 'Chiffrage',           icon: Calculator   },
        { id: 'checklist',    label: 'Checklist remise',    icon: ClipboardCheck },
      ],
    },
    {
      id: 'equipe',
      label: 'Équipe',
      icon: Users,
      activeGroupCls: 'bg-emerald-500/12 border-emerald-500/30 text-emerald-400',
      activeSubColor: 'text-emerald-400',
      tabs: [
        { id: 'comments',     label: 'Commentaires',        icon: MessageSquare },
        { id: 'membres',      label: 'Membres',             icon: Users         },
      ],
    },
  ]

  // Derive the active group from the active tab
  const activeGroupObj = TAB_GROUPS.find(g => g.tabs.some(t => t.id === activeTab)) ?? TAB_GROUPS[0]

  // Active group derived from active tab — no extra state needed

  return (
    <div className="flex flex-col min-h-0 animate-fade-in">

      {/* ── Project header ──────────────────────────────────────────────── */}
      <div data-print-hide className="bg-[var(--bg-surface)] border-b border-white/5 px-4 md:px-6 py-4 flex-shrink-0">
        <div className="flex flex-col gap-3 mb-4">
          {/* Title + badges */}
          <div className="flex items-start gap-3 flex-wrap">
            <h1 className="text-lg md:text-xl font-bold text-white leading-tight">{project.name}</h1>
            {verdictCfg && (
              <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full border mt-0.5', verdictCfg.bg, verdictCfg.text)}>
                {verdictCfg.label}
              </span>
            )}
            {score && (
              <span className={cn('text-lg font-extrabold mt-0.5', verdictCfg?.text ?? 'text-white/50')}>
                {score.total_score}/100
              </span>
            )}
          </div>
          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-white/40 flex-wrap">
            <span className="flex items-center gap-1.5"><Building size={12} />{project.client}</span>
            <span className="flex items-center gap-1.5"><MapPin size={12} />{project.location}</span>
            {project.offer_deadline && (
              <span className="flex items-center gap-1.5 text-amber-400/70">
                <Calendar size={12} />
                Limite : {new Date(project.offer_deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            )}
            {latestAnalysis?.result?.ref_ao && latestAnalysis.result.ref_ao !== 'NON PRÉCISÉ' && (
              <span className="flex items-center gap-1.5"><Hash size={12} />Réf : {latestAnalysis.result.ref_ao}</span>
            )}
            {(project as Project & { source_url?: string }).source_url && (
              <a
                href={(project as Project & { source_url?: string }).source_url!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all font-medium"
              >
                <ExternalLink size={11} />
                Voir l&apos;annonce BOAMP
              </a>
            )}
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
            <ExportMenu
              projectId={id}
              projectName={project.name}
              userTier={userLimits?.tier ?? 'free'}
            />
            {/* Brief Avant-Vente — enterprise only */}
            {ENTERPRISE_TIERS.has(userLimits?.tier ?? '') ? (
              <button
                onClick={handleBriefAvantVente}
                disabled={briefLoading || analyses.length === 0}
                title="Générer le Brief Avant-Vente (1 page PDF)"
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-xs font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {briefLoading ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
                Brief AV
              </button>
            ) : null}
            <button
              onClick={handleShare}
              disabled={shareLoading}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 border text-xs font-medium rounded-lg transition-all',
                shareUrl
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'
              )}
            >
              {shareLoading
                ? <Loader2 size={13} className="animate-spin" />
                : shareUrl ? <LinkIcon size={13} /> : <Share2 size={13} />}
              {shareUrl ? 'Masquer le lien' : 'Partager'}
            </button>
            {/* Share with team */}
            <div className="relative">
              <button
                onClick={openTeamShareDropdown}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 border text-xs font-medium rounded-lg transition-all',
                  teamShareOpen
                    ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white',
                )}
              >
                <FolderOpen size={13} />
                Équipe
              </button>
              {teamShareOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setTeamShareOpen(false)} />
                  <div className="absolute left-0 top-full mt-1.5 w-56 rounded-xl shadow-2xl z-50 overflow-hidden"
                  style={{ background: 'rgba(12,18,38,0.98)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(20px)' }}>
                  <div className="p-1.5">
                    <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-white/20">
                      Partager avec une équipe
                    </p>
                    {!teamsLoaded ? (
                      <div className="flex justify-center py-3">
                        <Loader2 size={14} className="animate-spin text-white/30" />
                      </div>
                    ) : myTeams.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-white/30">Vous n'appartenez à aucune équipe</p>
                    ) : (
                      myTeams.map(team => {
                        const done = teamShareDone.has(team.id)
                        return (
                          <button
                            key={team.id}
                            onClick={() => !done && handleShareWithTeam(team.id)}
                            disabled={sharingTeamId === team.id || done}
                            className={cn(
                              'w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg transition-all text-left',
                              done ? 'text-emerald-400 opacity-60 cursor-default' : 'hover:bg-white/6 text-white/70 hover:text-white',
                            )}
                          >
                            {sharingTeamId === team.id
                              ? <Loader2 size={11} className="animate-spin flex-shrink-0" />
                              : done
                              ? <CheckCircle size={11} className="flex-shrink-0 text-emerald-400" />
                              : <FolderOpen size={11} className="flex-shrink-0 text-white/30" />}
                            <span className="font-medium truncate">{team.name}</span>
                            {done && <span className="ml-auto text-[10px] text-emerald-400/60">Partagé</span>}
                          </button>
                        )
                      })
                    )}
                  </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleAddDoc}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-medium rounded-lg transition-all"
            >
              <FilePlus size={13} />Ajouter doc
            </button>
            {analysesLimitReached ? (
              <Link
                href="/subscription"
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold rounded-lg hover:bg-amber-500/25 transition-colors"
              >
                <Lock size={13} />
                Limite atteinte — Upgrader
              </Link>
            ) : (
              <button
                onClick={handleAnalyze}
                disabled={analyzing || files.filter(f => f.extraction_status === 'done').length === 0}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors"
              >
                {analyzing ? <Loader2 size={13} className="animate-spin" /> : <Cpu size={13} />}
                {analyzing ? 'Analyse...' : 'Analyser'}
              </button>
            )}
            {isFree ? (
              <Link
                href="/subscription"
                className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 text-white/30 text-xs font-semibold rounded-lg cursor-not-allowed"
                onClick={e => e.preventDefault()}
                title="Disponible à partir du plan Basic"
              >
                <Lock size={13} />
                Scorer
              </Link>
            ) : (
              <button
                onClick={handleScore}
                disabled={scoring || analyses.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors"
              >
                {scoring ? <Loader2 size={13} className="animate-spin" /> : <Target size={13} />}
                {scoring ? 'Scoring...' : 'Scorer'}
              </button>
            )}
            {/* Clôturer button — only if still pending */}
            {project.outcome === 'pending' ? (
              <button
                onClick={() => setCloturePanelOpen(v => !v)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 border text-xs font-medium rounded-lg transition-all',
                  cloturePanelOpen
                    ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'
                )}
              >
                <Flag size={13} />Clôturer
              </button>
            ) : (
              /* outcome badge */
              <span className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold',
                project.outcome === 'won'       && 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
                project.outcome === 'lost'      && 'bg-red-500/15 border-red-500/30 text-red-400',
                project.outcome === 'abandoned' && 'bg-white/5 border-white/15 text-white/40',
              )}>
                {project.outcome === 'won'       && <><Trophy size={12} />Gagné</>}
                {project.outcome === 'lost'      && <><XCircle size={12} />Perdu</>}
                {project.outcome === 'abandoned' && <><X size={12} />Abandonné</>}
              </span>
            )}
            <button
              onClick={() => router.push(`/projects/${id}/edit`)}
              className="p-2 text-white/30 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-all"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-white/30 hover:text-red-400 border border-white/10 rounded-lg hover:bg-red-950/30 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Clôture panel */}
        {cloturePanelOpen && project.outcome === 'pending' && (
          <div className="mb-3 bg-[var(--bg-card)] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-white/80 flex items-center gap-2">
                <Flag size={14} className="text-violet-400" />Clôturer le projet
              </span>
              <button onClick={() => setCloturePanelOpen(false)} className="p-1 text-white/30 hover:text-white/60 transition-colors">
                <X size={14} />
              </button>
            </div>

            {/* Outcome selector */}
            <div className="flex gap-2 mb-3">
              {([
                { value: 'won',       label: 'Gagné',     icon: Trophy,   color: 'emerald' },
                { value: 'lost',      label: 'Perdu',     icon: XCircle,  color: 'red'     },
                { value: 'abandoned', label: 'Abandonné', icon: X,        color: 'white'   },
              ] as const).map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => setCloturingOutcome(value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all flex-1 justify-center',
                    cloturingOutcome === value
                      ? color === 'emerald' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : color === 'red'   ? 'bg-red-500/20 border-red-500/50 text-red-300'
                        :                    'bg-white/15 border-white/30 text-white/80'
                      : 'bg-white/4 border-white/8 text-white/40 hover:text-white/60 hover:border-white/15'
                  )}
                >
                  <Icon size={12} />{label}
                </button>
              ))}
            </div>

            {/* Conditional fields */}
            {cloturingOutcome === 'won' && (
              <div className="mb-3">
                <label className="text-xs text-white/40 mb-1 block">CA remporté (€) — optionnel</label>
                <div className="relative">
                  <TrendingUp size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="number"
                    min="0"
                    placeholder="ex : 125000"
                    value={cloturingCa}
                    onChange={e => setCloturingCa(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
            )}
            {cloturingOutcome === 'lost' && (
              <div className="mb-3">
                <label className="text-xs text-white/40 mb-1 block">Raison de la perte — optionnel</label>
                <select
                  value={cloturingLossReason}
                  onChange={e => setCloturingLossReason(e.target.value)}
                  className="w-full bg-[var(--bg-base)] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 outline-none focus:border-red-500/50"
                >
                  <option value="">Choisir une raison...</option>
                  <option value="Prix trop élevé">Prix trop élevé</option>
                  <option value="Offre insuffisante">Offre insuffisante</option>
                  <option value="Concurrent mieux positionné">Concurrent mieux positionné</option>
                  <option value="Délai non respecté">Délai non respecté</option>
                  <option value="Hors périmètre technique">Hors périmètre technique</option>
                  <option value="Client non convaincu">Client non convaincu</option>
                  <option value="Projet annulé">Projet annulé</option>
                  <option value="Manque de références">Manque de références</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            )}

            <button
              onClick={handleCloture}
              disabled={cloturing}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all',
                cloturingOutcome === 'won'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : cloturingOutcome === 'lost'
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-white/10 hover:bg-white/15 text-white/70',
                cloturing && 'opacity-60 cursor-not-allowed'
              )}
            >
              {cloturing ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />}
              {cloturing ? 'Enregistrement...' : 'Confirmer la clôture'}
            </button>
          </div>
        )}

        {/* Share panel */}
        {shareUrl && (
          <div className="mb-3 flex items-center gap-2 bg-blue-950/30 border border-blue-500/30 rounded-lg px-3 py-2.5">
            <LinkIcon size={13} className="text-blue-400 flex-shrink-0" />
            <input
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent text-xs text-white/60 outline-none min-w-0"
              onFocus={e => e.target.select()}
            />
            <button
              onClick={copyShareUrl}
              title="Copier le lien"
              className="flex items-center gap-1 px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs transition-colors flex-shrink-0"
            >
              {copyOk ? <CheckCircle size={12} /> : <Copy size={12} />}
              {copyOk ? 'Copié !' : 'Copier'}
            </button>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Ouvrir dans un nouvel onglet"
              className="p-1.5 text-white/30 hover:text-white/70 transition-colors flex-shrink-0"
            >
              <ExternalLink size={13} />
            </a>
            <button
              onClick={() => setShareUrl(null)}
              className="p-1.5 text-white/20 hover:text-white/50 transition-colors flex-shrink-0"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Feedback */}
        {briefError && (
          <div className="mb-3 flex items-center gap-2 text-sm text-red-400 bg-red-950/30 border border-red-800/40 rounded-lg px-3.5 py-2.5">
            <AlertCircle size={14} className="flex-shrink-0" />
            {briefError}
            <button onClick={() => setBriefError(null)} className="ml-auto text-white/30 hover:text-white/60"><X size={12} /></button>
          </div>
        )}
        {actionError && (
          <div className={cn(
            'mb-3 flex items-center gap-2 text-sm rounded-lg px-3.5 py-2.5',
            actionError.includes('49€') || actionError.includes('plan')
              ? 'text-amber-400 bg-amber-950/30 border border-amber-800/40'
              : 'text-red-400 bg-red-950/30 border border-red-800/40'
          )}>
            {actionError.includes('49€') || actionError.includes('plan')
              ? <Lock size={14} className="flex-shrink-0" />
              : <AlertCircle size={14} className="flex-shrink-0" />}
            <span>{actionError}</span>
            {(actionError.includes('49€') || actionError.includes('plan')) && (
              <Link href="/subscription" className="ml-auto flex-shrink-0 text-xs font-semibold underline hover:text-amber-300">
                Voir les offres →
              </Link>
            )}
          </div>
        )}
        {actionSuccess && (
          <div className="mb-3 flex items-center gap-2 text-sm text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 rounded-lg px-3.5 py-2.5">
            <CheckCircle size={14} />{actionSuccess}
          </div>
        )}

        {/* Workflow stepper */}
        <WorkflowStepper
          projectId={id}
          stage={pipelineStage}
          currentRole={projectRole}
          onStageChange={setPipelineStage}
        />

        {/* ── Grouped tab navigation ─────────────────────────────────── */}
        {/* Level 1 — section groups */}
        <div className="flex items-center gap-1.5 mb-1.5 overflow-x-auto scrollbar-hide">
          {TAB_GROUPS.map(group => {
            const Icon = group.icon
            const isActive = group.id === activeGroupObj.id
            return (
              <button
                key={group.id}
                onClick={() => {
                  if (!isActive) {
                    // Switch to first tab of this group
                    setActiveTab(group.tabs[0].id)
                  }
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap flex-shrink-0',
                  isActive
                    ? group.activeGroupCls
                    : 'bg-white/3 border-white/6 text-white/35 hover:text-white/60 hover:border-white/15 hover:bg-white/5',
                )}
              >
                <Icon size={12} />
                {group.label}
              </button>
            )
          })}
        </div>

        {/* Level 2 — sub-tabs within active group */}
        <div className="flex gap-0 -mb-px overflow-x-auto scrollbar-hide">
          {activeGroupObj.tabs.map(({ id: tabId, label, icon: Icon }) => {
            const locked = isTabLocked(tabId)
            const isActive = !locked && activeTab === tabId
            return (
              <button
                key={tabId}
                data-tab-btn
                data-active={isActive.toString()}
                onClick={() => !locked && setActiveTab(tabId)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium whitespace-nowrap transition-colors',
                  locked
                    ? 'text-white/20 cursor-default'
                    : isActive
                      ? cn('font-semibold', activeGroupObj.activeSubColor)
                      : 'text-white/40 hover:text-white/70',
                )}
              >
                {locked
                  ? <Lock size={11} className="flex-shrink-0" />
                  : <Icon size={12} className="flex-shrink-0" />}
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Tab content — all mounted, hidden via display:none for instant switching */}
      <div className="flex-1 overflow-y-auto">

        <div style={{ display: activeTab === 'synthese' ? 'block' : 'none' }} className="p-4 md:p-6">
          {latestAnalysis
            ? <SyntheseTab result={latestAnalysis.result} />
            : <EmptyAnalysis onAnalyze={handleAnalyze} analyzing={analyzing} />}
        </div>

        <div style={{ display: activeTab === 'corp' ? 'block' : 'none' }} className="p-4 md:p-6">
          <SyntheseCorpTab projectId={id} analysisResult={latestAnalysis?.result ?? null} />
        </div>

        <div style={{ display: activeTab === 'map' ? 'block' : 'none' }} className="p-4 md:p-6">
          <MapTab project={project} analysisResult={latestAnalysis?.result ?? null} isActive={activeTab === 'map'} />
        </div>

        <div style={{ display: activeTab === 'besoin' ? 'block' : 'none' }} className="p-4 md:p-6">
          {isFree ? <UpgradePrompt tabName="Besoin client" /> : (
            latestAnalysis
              ? <BesoinClientTab result={latestAnalysis.result} />
              : <EmptyAnalysis onAnalyze={handleAnalyze} analyzing={analyzing} />
          )}
        </div>

        <div style={{ display: activeTab === 'pieces' ? 'block' : 'none' }} className="p-4 md:p-6">
          {isFree ? <UpgradePrompt tabName="Pièces à fournir" /> : (
            latestAnalysis
              ? <PiecesTab result={latestAnalysis.result} projectId={id} initialStates={taskStates} />
              : <EmptyAnalysis onAnalyze={handleAnalyze} analyzing={analyzing} />
          )}
        </div>

        <div style={{ display: activeTab === 'specificites' ? 'block' : 'none' }} className="p-4 md:p-6">
          {isFree ? <UpgradePrompt tabName="Spécificités techniques" /> : (
            latestAnalysis
              ? <SpecificitesTab result={latestAnalysis.result} />
              : <EmptyAnalysis onAnalyze={handleAnalyze} analyzing={analyzing} />
          )}
        </div>

        <div style={{ display: activeTab === 'gonogo' ? 'block' : 'none' }} className="p-4 md:p-6">
          {isFree ? <UpgradePrompt tabName="Score Go / No Go" /> : (
            score
              ? <ScoreDisplay score={score} />
              : (
                <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-10 text-center">
                  <Target size={28} className="mx-auto text-white/20 mb-3" />
                  <p className="text-white/50 text-sm">
                    {analyses.length === 0
                      ? 'Lancez d\'abord l\'analyse IA, puis cliquez sur Scorer.'
                      : 'Cliquez sur "Scorer" pour calculer le Go/No Go.'}
                  </p>
                </div>
              )
          )}
        </div>

        <div style={{ display: activeTab === 'actions' ? 'block' : 'none' }} className="p-4 md:p-6">
          {isFree ? <UpgradePrompt tabName="Actions recommandées" /> : (
            latestAnalysis
              ? <ActionsTab result={latestAnalysis.result} projectId={id} initialStates={taskStates} />
              : <EmptyAnalysis onAnalyze={handleAnalyze} analyzing={analyzing} />
          )}
        </div>

        <div style={{ display: activeTab === 'documents' ? 'block' : 'none' }} className="p-4 md:p-6 max-w-2xl">
          <FileUpload
            projectId={project.id}
            existingFiles={files}
            onFilesChange={updated => setData(prev => prev ? { ...prev, files: updated } : prev)}
          />
        </div>

        <div style={{ display: activeTab === 'plan' ? 'block' : 'none' }} className="p-4 md:p-6">
          <ResponsePlanTab
            projectId={id}
            hasAnalysis={latestAnalysis !== null}
          />
        </div>

        <div style={{ display: activeTab === 'comments' ? 'block' : 'none' }} className="p-4 md:p-6">
          <CommentsTab projectId={id} />
        </div>

        {/* ── Pipeline commercial tabs ──────────────────────────────────── */}
        <div style={{ display: activeTab === 'intervenants' ? 'block' : 'none' }} className="p-4 md:p-6">
          <IntervenantsTab
            projectId={id}
            intervenants={intervenants}
            onChange={setIntervenants}
          />
        </div>

        <div style={{ display: activeTab === 'chiffrage' ? 'block' : 'none' }} className="p-4 md:p-6">
          <ChiffrageTab
            projectId={id}
            chiffrage={chiffrage}
            onChange={setChiffrage}
          />
        </div>

        <div style={{ display: activeTab === 'checklist' ? 'block' : 'none' }} className="p-4 md:p-6">
          <ChecklistRemiseTab
            projectId={id}
            checklist={checklist}
            offerDeadline={project.offer_deadline}
            onChange={setChecklist}
          />
        </div>

        <div style={{ display: activeTab === 'memoire' ? 'block' : 'none' }} className="p-4 md:p-6">
          <MemoireTechniqueTab
            projectId={id}
            hasAnalysis={latestAnalysis !== null}
            initialText={memoireText}
            userTier={userLimits?.tier ?? 'free'}
            onChange={setMemoireText}
          />
        </div>

        <div style={{ display: activeTab === 'membres' ? 'block' : 'none' }} className="p-4 md:p-6">
          <MembresProjetTab
            projectId={id}
            currentRole={projectRole}
          />
        </div>

      </div>
    </div>
  )
}

function UpgradePrompt({ tabName }: { tabName: string }) {
  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="bg-[var(--bg-card)] border border-white/8 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
          <Lock size={20} className="text-amber-400" />
        </div>
        <h3 className="text-white font-semibold mb-1">{tabName}</h3>
        <p className="text-white/50 text-sm mb-1">
          Cette section est disponible à partir du plan <strong className="text-white/70">Basic</strong>.
        </p>
        <p className="text-white/30 text-xs mb-6">
          Le plan gratuit inclut 1 analyse et l&apos;accès à l&apos;onglet Synthèse uniquement.
        </p>
        <Link
          href="/subscription"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Voir les offres
          <ArrowRight size={14} />
        </Link>
        <p className="text-white/20 text-xs mt-3">À partir de 49€/mois · Sans engagement</p>
      </div>
    </div>
  )
}

function EmptyAnalysis({ onAnalyze, analyzing }: { onAnalyze: () => void; analyzing: boolean }) {
  return (
    <div className="bg-[var(--bg-card)] border border-dashed border-white/10 rounded-xl p-10 text-center">
      <Cpu size={28} className="mx-auto text-white/20 mb-3" />
      <p className="text-white/50 text-sm mb-4">
        Uploadez des fichiers et lancez l&apos;analyse IA pour voir cette vue.
      </p>
      <button
        onClick={onAnalyze}
        disabled={analyzing}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Cpu size={14} />}
        {analyzing ? 'Analyse en cours...' : 'Lancer l\'analyse IA'}
      </button>
    </div>
  )
}
