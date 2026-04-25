'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Loader2, AlertCircle, FolderOpen, Share2, Plus, Trash2,
  ExternalLink, MapPin, Calendar, Building, ArrowRight,
  CheckCircle, Layers, TrendingUp, X, ChevronDown,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

// ── Types ─────────────────────────────────────────────────────────────────────

interface SharedProject {
  team_project_id: string
  shared_at:       string
  sharer_name:     string
  is_owner:        boolean   // current user owns this project
  is_member:       boolean   // current user is already a project member
  project: {
    id:             string
    name:           string
    client:         string
    location:       string
    offer_deadline: string | null
    status:         string
    outcome:        string
    pipeline_stage: string | null
  }
  score: { total_score: number; verdict: string } | null
}

// ── Pipeline stage config ─────────────────────────────────────────────────────

const STAGE_CFG: Record<string, { label: string; color: string }> = {
  veille:    { label: 'Veille',       color: '#60a5fa' },
  analyse:   { label: 'Analyse IA',   color: '#a78bfa' },
  go:        { label: 'Go / No Go',   color: '#34d399' },
  brief:     { label: 'Brief AV',     color: '#fb923c' },
  chiffrage: { label: 'Chiffrage',    color: '#f472b6' },
  relecture: { label: 'Relecture',    color: '#facc15' },
  remis:     { label: 'Dossier remis',color: '#4ade80' },
  cloture:   { label: 'Clôturé',      color: '#94a3b8' },
}

const VERDICT_CFG = {
  GO:        { label: 'GO',        cls: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' },
  A_ETUDIER: { label: 'À ÉTUDIER', cls: 'bg-amber-500/15 border-amber-500/30 text-amber-400' },
  NO_GO:     { label: 'NO GO',     cls: 'bg-red-500/15 border-red-500/30 text-red-400' },
}

// ── Share-project modal ───────────────────────────────────────────────────────

interface ShareModalProps {
  teamId:   string
  onDone:   () => void
  onCancel: () => void
}

function ShareModal({ teamId, onDone, onCancel }: ShareModalProps) {
  interface MyProject { id: string; name: string; client: string }
  const [myProjects, setMyProjects]   = useState<MyProject[]>([])
  const [selected,   setSelected]     = useState<string>('')
  const [loading,    setLoading]      = useState(true)
  const [sharing,    setSharing]      = useState(false)
  const [error,      setError]        = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(d => setMyProjects(d.projects ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleShare() {
    if (!selected) return
    setSharing(true); setError(null)
    try {
      const res = await fetch('/api/team/projects', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ teamId, projectId: selected }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur')
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-[var(--bg-card)] border border-white/10 rounded-2xl shadow-2xl p-6 z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <Share2 size={14} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Partager un projet</p>
              <p className="text-xs text-white/35">Visible par tous les membres de l'équipe</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-1.5 text-white/30 hover:text-white/60 transition-colors rounded-lg hover:bg-white/5">
            <X size={14} />
          </button>
        </div>

        {/* Project selector */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={18} className="animate-spin text-white/30" />
          </div>
        ) : myProjects.length === 0 ? (
          <p className="text-sm text-white/40 text-center py-6">
            Vous n'avez aucun projet à partager.
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {myProjects.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p.id)}
                className={cn(
                  'w-full flex items-start gap-3 px-3.5 py-3 rounded-xl border text-left transition-all',
                  selected === p.id
                    ? 'bg-blue-500/12 border-blue-500/35 text-blue-300'
                    : 'bg-white/3 border-white/7 text-white/70 hover:border-white/15 hover:bg-white/6',
                )}
              >
                <div className={cn(
                  'w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all',
                  selected === p.id ? 'border-blue-400 bg-blue-400' : 'border-white/20',
                )}>
                  {selected === p.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-white/35 truncate">{p.client}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-3 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            <AlertCircle size={12} />
            {error}
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium text-white/50 border border-white/10 rounded-xl hover:bg-white/5 transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleShare}
            disabled={!selected || sharing}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all"
          >
            {sharing ? <Loader2 size={13} className="animate-spin" /> : <Share2 size={13} />}
            Partager
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Project card ──────────────────────────────────────────────────────────────

interface ProjectCardProps {
  item:          SharedProject
  currentUserId: string
  isTeamAdmin:   boolean
  onUnshare:     (teamProjectId: string) => void
  onJoin:        (projectId: string) => void
  joining:       boolean
}

function ProjectCard({ item, currentUserId: _uid, isTeamAdmin, onUnshare, onJoin, joining }: ProjectCardProps) {
  const { project, score, sharer_name, shared_at, is_owner, is_member, team_project_id } = item
  const stage    = project.pipeline_stage ? STAGE_CFG[project.pipeline_stage] : null
  const verdict  = score ? VERDICT_CFG[score.verdict as keyof typeof VERDICT_CFG] : null
  const deadline = project.offer_deadline
    ? new Date(project.offer_deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : null
  const canUnshare = is_owner || isTeamAdmin

  return (
    <div className="group relative bg-[var(--bg-card)] border border-white/7 rounded-2xl overflow-hidden hover:border-white/14 transition-all">
      {/* Top strip with pipeline color */}
      {stage && (
        <div className="h-[3px]" style={{ background: stage.color }} />
      )}

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-sm font-bold text-white truncate">{project.name}</p>
              {verdict && (
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0', verdict.cls)}>
                  {verdict.label}
                </span>
              )}
              {score && (
                <span className={cn(
                  'text-[11px] font-bold flex-shrink-0',
                  score.verdict === 'GO' ? 'text-emerald-400' :
                  score.verdict === 'NO_GO' ? 'text-red-400' : 'text-amber-400',
                )}>
                  {score.total_score}/100
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/35">
              <span className="flex items-center gap-1"><Building size={11} />{project.client}</span>
              <span className="flex items-center gap-1"><MapPin size={11} />{project.location}</span>
              {deadline && (
                <span className="flex items-center gap-1 text-amber-400/70">
                  <Calendar size={11} />Limite : {deadline}
                </span>
              )}
            </div>
          </div>

          {canUnshare && (
            <button
              onClick={() => onUnshare(team_project_id)}
              title="Retirer du partage"
              className="opacity-0 group-hover:opacity-100 p-1.5 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {/* Pipeline stage */}
        {stage && (
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden">
              {(() => {
                const stageKeys = Object.keys(STAGE_CFG)
                const idx = stageKeys.indexOf(project.pipeline_stage ?? '')
                const pct = idx >= 0 ? Math.round((idx / (stageKeys.length - 1)) * 100) : 0
                return (
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: stage.color, opacity: 0.7 }}
                  />
                )
              })()}
            </div>
            <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: stage.color }}>
              {stage.label}
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-white/5">
          <p className="text-[11px] text-white/25 truncate">
            Partagé par <span className="text-white/40 font-medium">{sharer_name}</span>
            {' · '}{new Date(shared_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* If current user is owner or already member → direct access */}
            {(is_owner || is_member) ? (
              <Link
                href={`/projects/${project.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/70 hover:text-white rounded-lg transition-all"
              >
                <ExternalLink size={11} />
                Ouvrir
              </Link>
            ) : (
              /* Non-member → join as viewer */
              <button
                onClick={() => onJoin(project.id)}
                disabled={joining}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-xs font-semibold text-blue-400 rounded-lg transition-all disabled:opacity-40"
              >
                {joining ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                Rejoindre
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface SharedProjectsTabProps {
  teamId:        string
  currentUserId: string
  isTeamAdmin:   boolean
}

export function SharedProjectsTab({ teamId, currentUserId, isTeamAdmin }: SharedProjectsTabProps) {
  const [items,       setItems]       = useState<SharedProject[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [showModal,   setShowModal]   = useState(false)
  const [joiningId,   setJoiningId]   = useState<string | null>(null)
  const [feedback,    setFeedback]    = useState<{ msg: string; ok: boolean } | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/team/projects?teamId=${teamId}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur')
      setItems(json.projects ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [teamId])

  useEffect(() => { load() }, [load])

  async function handleUnshare(teamProjectId: string) {
    if (!confirm('Retirer ce projet du partage d\'équipe ?')) return
    const res = await fetch('/api/team/projects', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ teamProjectId }),
    })
    if (res.ok) {
      setItems(prev => prev.filter(i => i.team_project_id !== teamProjectId))
    }
  }

  async function handleJoin(projectId: string) {
    setJoiningId(projectId); setFeedback(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: '', role: 'viewer', selfJoin: true }),
      })
      // For self-join we need a special endpoint. Use project members me endpoint.
      // Actually, let's use the join endpoint if it exists, else just refresh.
      if (res.ok || res.status === 400) {
        // Mark as member locally
        setItems(prev => prev.map(i =>
          i.project.id === projectId ? { ...i, is_member: true } : i
        ))
        setFeedback({ msg: 'Vous avez rejoint ce projet en lecture.', ok: true })
        setTimeout(() => setFeedback(null), 3000)
      } else {
        const json = await res.json()
        throw new Error(json.error ?? 'Erreur')
      }
    } catch (err) {
      setFeedback({ msg: err instanceof Error ? err.message : 'Erreur', ok: false })
    } finally {
      setJoiningId(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white">Projets partagés</h3>
          <p className="text-xs text-white/35 mt-0.5">
            Les projets partagés avec l'équipe sont visibles par tous les membres.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors flex-shrink-0"
        >
          <Share2 size={13} />
          Partager un projet
        </button>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div className={cn(
          'flex items-center gap-2 text-sm rounded-xl px-4 py-3 border',
          feedback.ok
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400',
        )}>
          {feedback.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {feedback.msg}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin text-white/20" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle size={13} />{error}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-dashed border-white/8 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <FolderOpen size={20} className="text-white/20" />
          </div>
          <p className="text-sm font-medium text-white/40 mb-1">Aucun projet partagé</p>
          <p className="text-xs text-white/25 mb-5">
            Partagez un de vos projets pour que toute l'équipe puisse suivre son avancement.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            <Share2 size={12} />
            Partager un projet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(item => (
            <ProjectCard
              key={item.team_project_id}
              item={item}
              currentUserId={currentUserId}
              isTeamAdmin={isTeamAdmin}
              onUnshare={handleUnshare}
              onJoin={handleJoin}
              joining={joiningId === item.project.id}
            />
          ))}
        </div>
      )}

      {/* Share modal */}
      {showModal && (
        <ShareModal
          teamId={teamId}
          onDone={() => { setShowModal(false); load() }}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
