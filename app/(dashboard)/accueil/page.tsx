import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Upload, PlusCircle, FolderOpen, BarChart3,
  CheckCircle, XCircle, Clock, TrendingUp, Star,
} from 'lucide-react'
import type { ProjectWithScore } from '@/types'
import { cn } from '@/lib/utils/cn'

export const metadata: Metadata = { title: 'Accueil — PILOT+' }

async function getAccueilData(userId: string) {
  const supabase = await createClient()

  const [projectsRes, scoresRes, profileRes] = await Promise.all([
    supabase.from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('project_scores').select('*').in(
      'project_id',
      (await supabase.from('projects').select('id').eq('user_id', userId)).data?.map(p => p.id) ?? []
    ),
    supabase.from('profiles').select('full_name').eq('id', userId).single(),
  ])

  const projects = projectsRes.data ?? []
  const scores   = scoresRes.data ?? []

  const scoreMap = new Map(scores.map(s => [s.project_id, s]))

  // File counts per project
  const fileCountsRes = await supabase
    .from('project_files')
    .select('project_id')
    .in('project_id', projects.map(p => p.id))
  const fileCounts = new Map<string, number>()
  for (const f of fileCountsRes.data ?? []) {
    fileCounts.set(f.project_id, (fileCounts.get(f.project_id) ?? 0) + 1)
  }

  const enriched: ProjectWithScore[] = projects.map(p => ({
    ...p,
    score: scoreMap.get(p.id) ?? null,
    file_count: fileCounts.get(p.id) ?? 0,
  }))

  const total     = projects.length
  const go        = scores.filter(s => s.verdict === 'GO').length
  const nogo      = scores.filter(s => s.verdict === 'NO_GO').length
  const tauxTransfo = total > 0 ? Math.round((go / total) * 100) : 0
  const enCours   = projects.filter(p => p.status !== 'scored').length
  // GO this month
  const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0,0,0,0)
  const goThisMonth = scores.filter(s => s.verdict === 'GO' && new Date(s.created_at) >= thisMonth).length

  return {
    projects: enriched,
    recent: enriched.slice(0, 6),
    stats: { total, go, nogo, tauxTransfo, enCours, goThisMonth },
    userName: profileRes.data?.full_name ?? null,
  }
}

export default async function AccueilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { recent, stats, userName } = await getAccueilData(user.id)
  const name = userName ?? user.email?.split('@')[0] ?? 'vous'
  const greeting = getGreeting()

  return (
    <div className="flex flex-col min-h-0 animate-fade-in">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="h-14 border-b border-white/5 bg-[var(--bg-surface)] flex items-center justify-between px-4 md:px-6 flex-shrink-0">
        <div>
          <p className="text-xs text-white/40 capitalize">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
          {(userName ?? user.email ?? '?')[0].toUpperCase()}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">

        {/* ── Welcome ─────────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-white">
            {greeting} {name}, content de vous revoir.
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Voici un aperçu de votre activité commerciale.
          </p>
        </div>

        {/* ── Quick actions ───────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3">
          {[
            { href: '/projects/new', icon: Upload,     label: 'Importer un DCE',  color: 'bg-blue-600 hover:bg-blue-500' },
            { href: '/projects/new', icon: PlusCircle, label: 'Créer un projet',  color: 'bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-white/10' },
            { href: '/projects',     icon: FolderOpen, label: 'Mes projets',      color: 'bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-white/10' },
            { href: '/dashboard',    icon: BarChart3,  label: 'Dashboard',        color: 'bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-white/10' },
          ].map(({ href, icon: Icon, label, color }) => (
            <Link
              key={label}
              href={href}
              className={cn('flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors', color)}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </div>

        {/* ── KPI cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <KpiCard
            label="PROJETS"
            value={stats.total}
            sub="total cumulé"
            icon={<FolderOpen size={18} className="text-white/60" />}
            bg="bg-[var(--bg-card)]"
          />
          <KpiCard
            label="GO"
            value={stats.go}
            sub={stats.goThisMonth > 0 ? `+${stats.goThisMonth} ce mois` : 'scorés GO'}
            subColor="text-emerald-400"
            icon={<CheckCircle size={18} className="text-emerald-400" />}
            bg="bg-emerald-900/30 border-emerald-800/40"
            valueColor="text-emerald-400"
          />
          <KpiCard
            label="NO GO"
            value={stats.nogo}
            sub="refusés"
            icon={<XCircle size={18} className="text-red-400" />}
            bg="bg-red-900/30 border-red-800/40"
            valueColor="text-red-400"
          />
          <KpiCard
            label="TAUX TRANSFO."
            value={`${stats.tauxTransfo}%`}
            sub="GO / total"
            icon={<TrendingUp size={18} className="text-blue-400" />}
            bg="bg-[var(--bg-card)]"
            valueColor="text-blue-400"
          />
          <KpiCard
            label="EN COURS"
            value={stats.enCours}
            sub="à traiter"
            icon={<Clock size={18} className="text-amber-400" />}
            bg="bg-amber-900/20 border-amber-800/30"
            valueColor="text-amber-400"
          />
        </div>

        {/* ── Recent projects ──────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Projets récents</h2>
            <Link href="/projects" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
              Voir tout →
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="bg-[var(--bg-card)] border border-dashed border-white/10 rounded-xl p-10 text-center">
              <FolderOpen size={28} className="mx-auto text-white/20 mb-3" />
              <p className="text-white/50 text-sm mb-4">Aucun projet pour l&apos;instant</p>
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors"
              >
                <PlusCircle size={14} />
                Créer un projet
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {recent.map(p => <RichProjectCard key={p.id} project={p} />)}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, subColor, icon, bg, valueColor,
}: {
  label: string; value: string | number; sub: string; subColor?: string
  icon: React.ReactNode; bg: string; valueColor?: string
}) {
  return (
    <div className={cn('rounded-xl border border-white/8 p-4 flex flex-col gap-2', bg)}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{label}</p>
        {icon}
      </div>
      <p className={cn('text-3xl font-extrabold tabular-nums', valueColor ?? 'text-white')}>{value}</p>
      <p className={cn('text-xs', subColor ?? 'text-white/40')}>{sub}</p>
    </div>
  )
}

function RichProjectCard({ project }: { project: ProjectWithScore }) {
  const verdict = project.score?.verdict
  const score   = project.score?.total_score

  const verdictCfg = {
    GO:       { label: 'GO',         bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    A_ETUDIER:{ label: 'A ANALYSER', bg: 'bg-amber-500/20',   text: 'text-amber-400',   border: 'border-amber-500/30' },
    NO_GO:    { label: 'NO GO',      bg: 'bg-red-500/20',     text: 'text-red-400',      border: 'border-red-500/30' },
  }
  const cfg = verdict ? verdictCfg[verdict] : null

  const isFavorite = (project.score?.total_score ?? 0) >= 80

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group bg-[var(--bg-card)] border border-white/8 hover:border-blue-500/40 rounded-xl p-4 flex flex-col gap-3 transition-all hover:shadow-lg hover:shadow-blue-500/5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {isFavorite && <Star size={11} className="text-amber-400 fill-amber-400 flex-shrink-0" />}
            <h3 className="text-sm font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
              {project.name}
            </h3>
          </div>
          <p className="text-xs text-blue-400/80 truncate">{project.client}</p>
        </div>
        {cfg && (
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5', cfg.bg, cfg.text, cfg.border)}>
            {cfg.label}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-white/40">
        <span>{new Date(project.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        <div className="flex items-center gap-3">
          {(project.file_count ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <FolderOpen size={11} />
              {project.file_count}
            </span>
          )}
          {score !== undefined && score !== null && (
            <span className={cn('font-bold', verdict === 'GO' ? 'text-emerald-400' : verdict === 'NO_GO' ? 'text-red-400' : 'text-amber-400')}>
              {score}/100
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}
