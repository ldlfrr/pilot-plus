'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FileUpload } from '@/components/projects/FileUpload'
import { ScoreDisplay } from '@/components/analysis/ScoreDisplay'
import { SyntheseTab }    from '@/components/project/tabs/SyntheseTab'
import { BesoinClientTab } from '@/components/project/tabs/BesoinClientTab'
import { PiecesTab }       from '@/components/project/tabs/PiecesTab'
import { SpecificitesTab } from '@/components/project/tabs/SpecificitesTab'
import { ActionsTab }      from '@/components/project/tabs/ActionsTab'
import {
  Cpu, Target, Trash2, Pencil, Loader2, AlertCircle, CheckCircle,
  Download, Share2, FilePlus, Calendar, MapPin, Building, Hash,
  FileText, Users, ListChecks, Wrench, BarChart3, Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Project, ProjectFile, ProjectAnalysis, ProjectScore, TaskStates } from '@/types'

type Tab = 'synthese' | 'besoin' | 'pieces' | 'specificites' | 'gonogo' | 'actions' | 'documents'

interface ProjectData {
  project: Project
  files: ProjectFile[]
  analyses: ProjectAnalysis[]
  score: ProjectScore | null
}

const EMPTY_TASK_STATES: TaskStates = { pieces: {}, actions: {} }

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

  useEffect(() => { fetchProject() }, [fetchProject])

  async function callApi(url: string) {
    const res  = await fetch(url, { method: 'POST' })
    const text = await res.text()
    let json: Record<string, unknown> = {}
    try { json = text ? JSON.parse(text) : {} } catch {
      throw new Error(`Réponse invalide${text ? `: ${text.slice(0, 120)}` : ''}`)
    }
    return { ok: res.ok, json }
  }

  async function handleAnalyze() {
    setAnalyzing(true); setActionError(null); setActionSuccess(null)
    try {
      const { ok, json } = await callApi(`/api/projects/${id}/analyze`)
      if (!ok) throw new Error((json.error as string) ?? 'Erreur analyse')
      await fetchProject()
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

  async function handleDelete() {
    if (!confirm('Supprimer ce projet ? Action irréversible.')) return
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    if (res.ok) router.push('/projects')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 h-full">
        <Loader2 size={24} className="animate-spin text-blue-400" />
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

  const TABS: { id: Tab; label: string; icon: typeof FileText }[] = [
    { id: 'synthese',     label: 'Synthèse',        icon: FileText },
    { id: 'besoin',       label: 'Besoin client',   icon: Users },
    { id: 'pieces',       label: 'Pièces à fournir',icon: ListChecks },
    { id: 'specificites', label: 'Spécificités',    icon: Wrench },
    { id: 'gonogo',       label: 'Go / No Go',      icon: BarChart3 },
    { id: 'actions',      label: 'Actions',          icon: Target },
    { id: 'documents',    label: 'Documents',        icon: Layers },
  ]

  return (
    <div className="flex flex-col min-h-0 animate-fade-in">

      {/* ── Project header ──────────────────────────────────────────────── */}
      <div className="bg-[#13161e] border-b border-white/5 px-4 md:px-6 py-4 flex-shrink-0">
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
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-medium rounded-lg transition-all">
              <Download size={13} />Export PDF
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-medium rounded-lg transition-all">
              <Share2 size={13} />Partager
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-medium rounded-lg transition-all">
              <FilePlus size={13} />Ajouter doc
            </button>
            <button
              onClick={handleAnalyze}
              disabled={analyzing || files.filter(f => f.extraction_status === 'done').length === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {analyzing ? <Loader2 size={13} className="animate-spin" /> : <Cpu size={13} />}
              {analyzing ? 'Analyse...' : 'Analyser'}
            </button>
            <button
              onClick={handleScore}
              disabled={scoring || analyses.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {scoring ? <Loader2 size={13} className="animate-spin" /> : <Target size={13} />}
              {scoring ? 'Scoring...' : 'Scorer'}
            </button>
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

        {/* Feedback */}
        {actionError && (
          <div className="mb-3 flex items-center gap-2 text-sm text-red-400 bg-red-950/30 border border-red-800/40 rounded-lg px-3.5 py-2.5">
            <AlertCircle size={14} />{actionError}
          </div>
        )}
        {actionSuccess && (
          <div className="mb-3 flex items-center gap-2 text-sm text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 rounded-lg px-3.5 py-2.5">
            <CheckCircle size={14} />{actionSuccess}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-0.5 -mb-px overflow-x-auto scrollbar-hide">
          {TABS.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap',
                activeTab === tabId
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-white/40 hover:text-white/70'
              )}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content — all mounted, hidden via display:none for instant switching */}
      <div className="flex-1 overflow-y-auto">

        <div style={{ display: activeTab === 'synthese' ? 'block' : 'none' }} className="p-4 md:p-6">
          {latestAnalysis
            ? <SyntheseTab result={latestAnalysis.result} />
            : <EmptyAnalysis onAnalyze={handleAnalyze} analyzing={analyzing} />}
        </div>

        <div style={{ display: activeTab === 'besoin' ? 'block' : 'none' }} className="p-4 md:p-6">
          {latestAnalysis
            ? <BesoinClientTab result={latestAnalysis.result} />
            : <EmptyAnalysis onAnalyze={handleAnalyze} analyzing={analyzing} />}
        </div>

        <div style={{ display: activeTab === 'pieces' ? 'block' : 'none' }} className="p-4 md:p-6">
          {latestAnalysis
            ? <PiecesTab result={latestAnalysis.result} projectId={id} initialStates={taskStates} />
            : <EmptyAnalysis onAnalyze={handleAnalyze} analyzing={analyzing} />}
        </div>

        <div style={{ display: activeTab === 'specificites' ? 'block' : 'none' }} className="p-4 md:p-6">
          {latestAnalysis
            ? <SpecificitesTab result={latestAnalysis.result} />
            : <EmptyAnalysis onAnalyze={handleAnalyze} analyzing={analyzing} />}
        </div>

        <div style={{ display: activeTab === 'gonogo' ? 'block' : 'none' }} className="p-4 md:p-6">
          {score
            ? <ScoreDisplay score={score} />
            : (
              <div className="bg-[#1a1d2e] border border-white/8 rounded-xl p-10 text-center">
                <Target size={28} className="mx-auto text-white/20 mb-3" />
                <p className="text-white/50 text-sm">
                  {analyses.length === 0
                    ? 'Lancez d\'abord l\'analyse IA, puis cliquez sur Scorer.'
                    : 'Cliquez sur "Scorer" pour calculer le Go/No Go.'}
                </p>
              </div>
            )}
        </div>

        <div style={{ display: activeTab === 'actions' ? 'block' : 'none' }} className="p-4 md:p-6">
          {latestAnalysis
            ? <ActionsTab result={latestAnalysis.result} projectId={id} initialStates={taskStates} />
            : <EmptyAnalysis onAnalyze={handleAnalyze} analyzing={analyzing} />}
        </div>

        <div style={{ display: activeTab === 'documents' ? 'block' : 'none' }} className="p-4 md:p-6 max-w-2xl">
          <FileUpload
            projectId={project.id}
            existingFiles={files}
            onFilesChange={updated => setData(prev => prev ? { ...prev, files: updated } : prev)}
          />
        </div>

      </div>
    </div>
  )
}

function EmptyAnalysis({ onAnalyze, analyzing }: { onAnalyze: () => void; analyzing: boolean }) {
  return (
    <div className="bg-[#1a1d2e] border border-dashed border-white/10 rounded-xl p-10 text-center">
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
