import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Upload, PlusCircle, FolderOpen, BarChart3,
  CheckCircle, XCircle, Clock, TrendingUp,
  Calendar, Flame, AlertTriangle, ArrowRight,
  Building, MapPin, ChevronRight, Sparkles,
  Star, Activity,
} from 'lucide-react'
import type { ProjectWithScore, GoNoGoVerdict } from '@/types'
import { cn } from '@/lib/utils/cn'
import { UserAvatarLink } from '@/components/layout/UserAvatarLink'
import { NotificationBell } from '@/components/layout/NotificationBell'

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

  const fileCountsRes = await supabase
    .from('project_files').select('project_id')
    .in('project_id', projects.map(p => p.id))
  const fileCounts = new Map<string, number>()
  for (const f of fileCountsRes.data ?? [])
    fileCounts.set(f.project_id, (fileCounts.get(f.project_id) ?? 0) + 1)

  const enriched: ProjectWithScore[] = projects.map(p => ({
    ...p,
    score: scoreMap.get(p.id) ?? null,
    file_count: fileCounts.get(p.id) ?? 0,
  }))

  const total        = projects.length
  const go           = scores.filter(s => s.verdict === 'GO').length
  const nogo         = scores.filter(s => s.verdict === 'NO_GO').length
  const tauxTransfo  = total > 0 ? Math.round((go / total) * 100) : 0
  const enCours      = projects.filter(p => p.status !== 'scored').length
  const thisMonth    = new Date(); thisMonth.setDate(1); thisMonth.setHours(0,0,0,0)
  const goThisMonth  = scores.filter(s => s.verdict === 'GO' && new Date(s.created_at) >= thisMonth).length

  const now = Date.now()
  const upcoming = projects
    .filter(p => p.offer_deadline && p.outcome === 'pending')
    .map(p => ({
      ...p,
      daysLeft: Math.ceil((new Date(p.offer_deadline!).getTime() - now) / 86400000),
      scoreInfo: scoreMap.get(p.id)
        ? { total_score: scoreMap.get(p.id)!.total_score as number, verdict: scoreMap.get(p.id)!.verdict as GoNoGoVerdict }
        : null,
    }))
    .filter(p => p.daysLeft >= 0 && p.daysLeft <= 60)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 10)

  return {
    projects: enriched,
    recent: enriched.slice(0, 6),
    stats: { total, go, nogo, tauxTransfo, enCours, goThisMonth },
    userName: profileRes.data?.full_name ?? null,
    upcoming,
  }
}

export default async function AccueilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { recent, stats, userName, upcoming } = await getAccueilData(user.id)
  const urgentCount  = upcoming.filter(p => p.daysLeft <= 3).length
  const warningCount = upcoming.filter(p => p.daysLeft > 3 && p.daysLeft <= 7).length
  const name     = userName ?? user.email?.split('@')[0] ?? 'vous'
  const greeting = getGreeting()

  return (
    <div className="flex flex-col min-h-0 animate-fade-in">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div
        className="h-14 flex items-center justify-between px-4 md:px-6 flex-shrink-0"
        style={{
          background: 'rgba(8,14,34,0.60)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.055)',
        }}
      >
        <p className="text-xs text-white/35 capitalize font-medium">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <UserAvatarLink />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

        {/* ── Welcome hero ─────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl p-6 md:p-8"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.08) 50%, rgba(8,14,34,0.6) 100%)',
            border: '1px solid rgba(59,130,246,0.18)',
            boxShadow: '0 4px 32px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.07)',
          }}
        >
          {/* Decorative glow */}
          <div
            className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at top right, rgba(59,130,246,0.12) 0%, transparent 65%)',
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-blue-300 uppercase tracking-widest"
                style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)' }}
              >
                <Sparkles size={9} />
                Copilot IA
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-1">
              {greeting},{' '}
              <span className="text-gradient-blue">{name}</span>
            </h1>
            <p className="text-white/45 text-sm">
              Voici un aperçu de votre activité commerciale.
            </p>
          </div>
        </div>

        {/* ── Quick actions ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5">
          <Link
            href="/projects/new"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all btn-primary"
          >
            <Upload size={14} />Importer un DCE
          </Link>
          {[
            { href: '/projects/new', icon: PlusCircle, label: 'Créer un projet' },
            { href: '/projects',     icon: FolderOpen, label: 'Mes projets' },
            { href: '/dashboard',    icon: BarChart3,  label: 'Dashboard' },
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white transition-all btn-secondary"
            >
              <Icon size={14} />{label}
            </Link>
          ))}
        </div>

        {/* ── KPI cards ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            {
              label: 'Projets', value: stats.total, sub: 'total cumulé',
              icon: FolderOpen, iconColor: 'text-blue-400',
              accent: 'rgba(59,130,246,0.10)',
              border: 'rgba(59,130,246,0.15)',
            },
            {
              label: 'GO', value: stats.go,
              sub: stats.goThisMonth > 0 ? `+${stats.goThisMonth} ce mois` : 'validés',
              icon: CheckCircle, iconColor: 'text-emerald-400',
              accent: 'rgba(16,185,129,0.10)',
              border: 'rgba(16,185,129,0.18)',
              valueColor: 'text-emerald-400',
            },
            {
              label: 'No Go', value: stats.nogo, sub: 'refusés',
              icon: XCircle, iconColor: 'text-red-400',
              accent: 'rgba(239,68,68,0.08)',
              border: 'rgba(239,68,68,0.15)',
              valueColor: 'text-red-400',
            },
            {
              label: 'Taux transfo.', value: `${stats.tauxTransfo}%`, sub: 'GO / total',
              icon: TrendingUp, iconColor: 'text-violet-400',
              accent: 'rgba(139,92,246,0.10)',
              border: 'rgba(139,92,246,0.15)',
              valueColor: 'text-violet-400',
            },
            {
              label: 'En cours', value: stats.enCours, sub: 'à traiter',
              icon: Clock, iconColor: 'text-amber-400',
              accent: 'rgba(245,158,11,0.10)',
              border: 'rgba(245,158,11,0.15)',
              valueColor: 'text-amber-400',
            },
          ].map(({ label, value, sub, icon: Icon, iconColor, accent, border, valueColor }) => (
            <div
              key={label}
              className="rounded-2xl p-4 flex flex-col gap-2.5"
              style={{
                background: `linear-gradient(135deg, ${accent} 0%, rgba(12,20,40,0.6) 100%)`,
                border: `1px solid ${border}`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">{label}</p>
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', iconColor)}
                  style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <Icon size={14} />
                </div>
              </div>
              <p className={cn('text-3xl font-extrabold tabular-nums leading-none', valueColor ?? 'text-white')}>{value}</p>
              <p className="text-[11px] text-white/35">{sub}</p>
            </div>
          ))}
        </div>

        {/* ── Alerts ───────────────────────────────────────────────────── */}
        {urgentCount > 0 && (
          <div
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl animate-fade-in"
            style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.05))',
              border: '1px solid rgba(239,68,68,0.22)',
              boxShadow: '0 4px 20px rgba(239,68,68,0.08)',
            }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(239,68,68,0.20)', boxShadow: '0 0 12px rgba(239,68,68,0.25)' }}>
              <Flame size={16} className="text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-300 leading-none">
                {urgentCount === 1 ? '1 échéance' : `${urgentCount} échéances`} dans moins de 3 jours !
              </p>
              <p className="text-xs text-red-400/55 mt-0.5 truncate">
                {upcoming.filter(p => p.daysLeft <= 3).map(p => p.name).join(', ')}
              </p>
            </div>
            <Link href="/dashboard"
              className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 flex-shrink-0 transition-colors">
              Voir <ChevronRight size={12} />
            </Link>
          </div>
        )}

        {urgentCount === 0 && warningCount > 0 && (
          <div
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl animate-fade-in"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.10), rgba(245,158,11,0.04))',
              border: '1px solid rgba(245,158,11,0.20)',
              boxShadow: '0 4px 20px rgba(245,158,11,0.06)',
            }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(245,158,11,0.18)', boxShadow: '0 0 12px rgba(245,158,11,0.20)' }}>
              <AlertTriangle size={16} className="text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-300 leading-none">
                {warningCount === 1 ? '1 échéance' : `${warningCount} échéances`} cette semaine
              </p>
              <p className="text-xs text-amber-400/55 mt-0.5 truncate">
                {upcoming.filter(p => p.daysLeft <= 7).map(p => p.name).join(', ')}
              </p>
            </div>
            <Link href="/dashboard"
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 flex-shrink-0 transition-colors">
              Voir <ChevronRight size={12} />
            </Link>
          </div>
        )}

        {/* ── Deadlines table ──────────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.035) 0%, rgba(12,20,40,0.5) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          <div className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(245,158,11,0.15)' }}>
                <Calendar size={13} className="text-amber-400" />
              </div>
              <span className="text-sm font-semibold text-white">Prochaines échéances</span>
              {upcoming.length > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.20)' }}
                >
                  {upcoming.length}
                </span>
              )}
            </div>
            <Link href="/dashboard"
              className="flex items-center gap-1 text-xs text-white/35 hover:text-white/65 transition-colors font-medium">
              Tableau complet <ChevronRight size={11} />
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Calendar size={20} className="text-white/20" />
              </div>
              <p className="text-sm text-white/40">Aucune échéance dans les 60 prochains jours</p>
              <p className="text-xs text-white/22 mt-1">Ajoutez une date limite à vos projets</p>
              <Link href="/projects" className="mt-4 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Gérer mes projets →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/4">
              {upcoming.map(p => {
                const isUrgent  = p.daysLeft <= 3
                const isWarning = p.daysLeft <= 7
                const isSoon    = p.daysLeft <= 14
                const badgeStyle = isUrgent
                  ? { bg: 'rgba(239,68,68,0.18)',  text: '#fca5a5', border: 'rgba(239,68,68,0.25)' }
                  : isWarning
                  ? { bg: 'rgba(245,158,11,0.18)', text: '#fcd34d', border: 'rgba(245,158,11,0.25)' }
                  : isSoon
                  ? { bg: 'rgba(59,130,246,0.15)', text: '#93c5fd', border: 'rgba(59,130,246,0.20)' }
                  : { bg: 'rgba(255,255,255,0.05)', text: 'rgba(255,255,255,0.40)', border: 'rgba(255,255,255,0.08)' }

                const verdictCfg: Record<GoNoGoVerdict, React.CSSProperties> = {
                  GO:        { backgroundColor: 'rgba(16,185,129,0.15)', color: '#6ee7b7' },
                  A_ETUDIER: { backgroundColor: 'rgba(245,158,11,0.15)', color: '#fcd34d' },
                  NO_GO:     { backgroundColor: 'rgba(239,68,68,0.15)',  color: '#fca5a5' },
                }
                const verdictLabels: Record<GoNoGoVerdict, string> = { GO: 'GO', A_ETUDIER: '~', NO_GO: 'NG' }

                return (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className={cn(
                      'flex items-center gap-4 px-5 py-3.5 hover:bg-white/3 transition-all group',
                      isUrgent && 'bg-red-500/3',
                    )}
                  >
                    <span
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-extrabold tabular-nums flex-shrink-0 w-14 justify-center"
                      style={{ background: badgeStyle.bg, color: badgeStyle.text, border: `1px solid ${badgeStyle.border}` }}
                    >
                      {isUrgent && <Flame size={9} />}
                      {p.daysLeft === 0 ? 'Auj.' : `${p.daysLeft}j`}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/80 group-hover:text-white truncate transition-colors leading-none">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-white/32 mt-0.5 flex items-center gap-2">
                        <span className="flex items-center gap-1"><Building size={9} />{p.client}</span>
                        <span className="hidden sm:flex items-center gap-1"><MapPin size={9} />{p.location}</span>
                      </p>
                    </div>

                    <span className="text-xs text-white/35 hidden sm:block flex-shrink-0 font-medium">
                      {new Date(p.offer_deadline!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>

                    <div className="flex-shrink-0 w-10 text-center">
                      {p.scoreInfo ? (
                        <span
                          className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold"
                          style={verdictCfg[p.scoreInfo.verdict as GoNoGoVerdict]}
                        >
                          {verdictLabels[p.scoreInfo.verdict as GoNoGoVerdict]}
                        </span>
                      ) : <span className="text-[10px] text-white/18">—</span>}
                    </div>

                    <ArrowRight size={13} className="text-white/15 group-hover:text-white/45 transition-colors flex-shrink-0" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Recent projects ──────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-blue-400" />
              <h2 className="text-sm font-bold text-white">Projets récents</h2>
            </div>
            <Link href="/projects" className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Voir tout →
            </Link>
          </div>

          {recent.length === 0 ? (
            <div
              className="rounded-2xl p-10 text-center"
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px dashed rgba(255,255,255,0.10)',
              }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <FolderOpen size={22} className="text-blue-400/60" />
              </div>
              <p className="text-white/45 text-sm mb-5">Aucun projet pour l&apos;instant</p>
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-all btn-primary"
              >
                <PlusCircle size={14} />Créer un projet
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {recent.map((p, i) => (
                <RichProjectCard key={p.id} project={p} index={i} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RichProjectCard({ project, index }: { project: ProjectWithScore; index: number }) {
  const verdict = project.score?.verdict
  const score   = project.score?.total_score
  const isFavorite = (score ?? 0) >= 80

  const verdictCfg = {
    GO:        { label: 'GO',         bg: 'rgba(16,185,129,0.15)', text: '#6ee7b7', border: 'rgba(16,185,129,0.22)' },
    A_ETUDIER: { label: 'À analyser', bg: 'rgba(245,158,11,0.15)', text: '#fcd34d', border: 'rgba(245,158,11,0.22)' },
    NO_GO:     { label: 'NO GO',      bg: 'rgba(239,68,68,0.15)',  text: '#fca5a5', border: 'rgba(239,68,68,0.22)' },
  }
  const cfg = verdict ? verdictCfg[verdict] : null

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group rounded-2xl p-4 flex flex-col gap-3 transition-all card-hover animate-fade-in"
      style={{
        animationDelay: `${index * 40}ms`,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(12,20,40,0.5) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            {isFavorite && (
              <Star size={10} className="flex-shrink-0" style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.6))' }} />
            )}
            <h3 className="text-sm font-semibold text-white/85 truncate group-hover:text-white transition-colors">
              {project.name}
            </h3>
          </div>
          <p className="text-xs text-blue-400/70 truncate">{project.client}</p>
        </div>
        {cfg && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
            style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
          >
            {cfg.label}
          </span>
        )}
      </div>

      <div
        className="flex items-center justify-between text-xs pt-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.30)' }}
      >
        <span>{new Date(project.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        <div className="flex items-center gap-3">
          {(project.file_count ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <FolderOpen size={10} />
              {project.file_count}
            </span>
          )}
          {score != null && (
            <span
              className="font-extrabold tabular-nums"
              style={{
                color: verdict === 'GO' ? '#6ee7b7' : verdict === 'NO_GO' ? '#fca5a5' : '#fcd34d',
                textShadow: verdict === 'GO' ? '0 0 8px rgba(16,185,129,0.4)' : 'none',
              }}
            >
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
