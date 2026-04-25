import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Upload, PlusCircle, FolderOpen, BarChart3,
  CheckCircle, XCircle, Clock, TrendingUp,
  Calendar, Flame, AlertTriangle, ArrowRight,
  Building, MapPin, ChevronRight, Activity,
  Radio, Target, Zap,
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

  const total       = projects.length
  const go          = scores.filter(s => s.verdict === 'GO').length
  const nogo        = scores.filter(s => s.verdict === 'NO_GO').length
  const tauxTransfo = total > 0 ? Math.round((go / total) * 100) : 0
  const enCours     = projects.filter(p => p.status !== 'scored').length
  const thisMonth   = new Date(); thisMonth.setDate(1); thisMonth.setHours(0,0,0,0)
  const goThisMonth = scores.filter(s => s.verdict === 'GO' && new Date(s.created_at) >= thisMonth).length

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
    recent: enriched.slice(0, 4),
    stats: { total, go, nogo, tauxTransfo, enCours, goThisMonth },
    userName: profileRes.data?.full_name ?? null,
    upcoming,
  }
}

// ── KPI cards config ──────────────────────────────────────────────────────────

function KpiStrip({ stats }: { stats: ReturnType<typeof Object.create> }) {
  const cards = [
    { label: 'Projets',      value: stats.total,              icon: FolderOpen,  glowColor: 'rgba(59,130,246,0.8)',   accentBg: 'rgba(59,130,246,0.10)',  border: 'rgba(59,130,246,0.15)',  valueClass: 'text-white' },
    { label: 'GO',           value: stats.go,                  icon: CheckCircle, glowColor: 'rgba(16,185,129,0.8)',   accentBg: 'rgba(16,185,129,0.10)',  border: 'rgba(16,185,129,0.18)',  valueClass: 'text-emerald-400',
      sub: stats.goThisMonth > 0 ? `+${stats.goThisMonth} ce mois` : 'validés' },
    { label: 'No Go',        value: stats.nogo,                icon: XCircle,     glowColor: 'rgba(239,68,68,0.8)',    accentBg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.15)',   valueClass: 'text-red-400' },
    { label: 'Taux transfo.', value: `${stats.tauxTransfo}%`, icon: TrendingUp,  glowColor: 'rgba(139,92,246,0.8)',   accentBg: 'rgba(139,92,246,0.10)',  border: 'rgba(139,92,246,0.15)',  valueClass: 'text-violet-400' },
    { label: 'En cours',     value: stats.enCours,             icon: Clock,       glowColor: 'rgba(245,158,11,0.8)',   accentBg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.15)',  valueClass: 'text-amber-400' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map(({ label, value, icon: Icon, glowColor, accentBg, border, valueClass, sub }) => (
        <div key={label} className="rounded-2xl p-4 relative overflow-hidden transition-all duration-200 card-hover"
          style={{ background: `linear-gradient(135deg, ${accentBg} 0%, rgba(12,20,40,0.60) 100%)`, border: `1px solid ${border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
          <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`, filter: 'blur(14px)', opacity: 0.25 }} />
          <div className="relative">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/35">{label}</span>
              <Icon size={12} className={valueClass} />
            </div>
            <p className={cn('text-3xl font-extrabold tabular-nums leading-none', valueClass)}>{value}</p>
            {sub && <p className="text-[10px] text-white/28 mt-1.5">{sub}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default async function AccueilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { recent, stats, userName, upcoming } = await getAccueilData(user.id)
  const urgentCount  = upcoming.filter(p => p.daysLeft <= 3).length
  const warningCount = upcoming.filter(p => p.daysLeft > 3 && p.daysLeft <= 7).length
  const name         = userName?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'vous'
  const greeting     = getGreeting()

  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="flex flex-col min-h-0 animate-fade-in">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="h-14 flex items-center justify-between px-4 md:px-6 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.055)', background: 'rgba(8,14,34,0.80)', backdropFilter: 'blur(16px)' }}>
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-xs text-white/35 capitalize font-medium hidden sm:block">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/projects/new" className="btn-primary hidden sm:flex items-center gap-1.5">
            <PlusCircle size={13} />Nouveau projet
          </Link>
          <NotificationBell />
          <UserAvatarLink />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

        {/* ── Welcome card ─────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl px-6 py-5"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.11) 0%, rgba(139,92,246,0.07) 55%, rgba(8,14,34,0.55) 100%)',
            border: '1px solid rgba(59,130,246,0.18)',
            boxShadow: '0 4px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.07)',
          }}>
          {/* Glow top-right */}
          <div className="absolute top-0 right-0 w-56 h-56 pointer-events-none"
            style={{ background: 'radial-gradient(circle at top right, rgba(59,130,246,0.14) 0%, transparent 70%)' }} />
          {/* Accent left border */}
          <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full"
            style={{ background: 'linear-gradient(180deg, transparent, rgba(59,130,246,0.60), transparent)' }} />

          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.20em] text-blue-400/65 mb-2">Tableau de bord</p>
              <h1 className="text-xl md:text-2xl font-extrabold text-white leading-tight">
                {greeting},&nbsp;<span className="text-gradient-blue">{name}</span>
              </h1>
              <p className="text-sm text-white/38 mt-1.5">
                {stats.enCours > 0
                  ? `${stats.enCours} projet${stats.enCours > 1 ? 's' : ''} en cours · ${upcoming.length} échéance${upcoming.length !== 1 ? 's' : ''} à venir`
                  : 'Démarrez en créant votre premier projet DCE.'}
              </p>
            </div>
            {/* Mobile CTA */}
            <Link href="/projects/new" className="btn-primary sm:hidden flex-shrink-0 flex items-center gap-1.5 text-sm">
              <PlusCircle size={14} />Nouveau
            </Link>
          </div>
        </div>

        {/* ── KPI strip ────────────────────────────────────────────────── */}
        <KpiStrip stats={stats} />

        {/* ── Alerts ───────────────────────────────────────────────────── */}
        {urgentCount > 0 && (
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl animate-fade-in"
            style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.05))', border: '1px solid rgba(239,68,68,0.22)', boxShadow: '0 4px 20px rgba(239,68,68,0.08)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(239,68,68,0.20)', boxShadow: '0 0 12px rgba(239,68,68,0.25)' }}>
              <Flame size={16} className="text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-300 leading-none">
                {urgentCount === 1 ? '1 échéance' : `${urgentCount} échéances`} dans moins de 3 jours
              </p>
              <p className="text-xs text-red-400/55 mt-0.5 truncate">
                {upcoming.filter(p => p.daysLeft <= 3).map(p => p.name).join(', ')}
              </p>
            </div>
            <Link href="/dashboard" className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 flex-shrink-0 transition-colors">
              Voir <ChevronRight size={12} />
            </Link>
          </div>
        )}

        {urgentCount === 0 && warningCount > 0 && (
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl animate-fade-in"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.10), rgba(245,158,11,0.04))', border: '1px solid rgba(245,158,11,0.20)', boxShadow: '0 4px 20px rgba(245,158,11,0.06)' }}>
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
            <Link href="/dashboard" className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 flex-shrink-0 transition-colors">
              Voir <ChevronRight size={12} />
            </Link>
          </div>
        )}

        {/* ── Main 2-column ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* ──── LEFT : Deadlines calendar ──────── */}
          <div className="lg:col-span-3 rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 24px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.05)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(245,158,11,0.14)', border: '1px solid rgba(245,158,11,0.20)' }}>
                  <Calendar size={13} className="text-amber-400" />
                </div>
                <span className="text-sm font-semibold text-white">Calendrier des échéances</span>
                {upcoming.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums"
                    style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.22)' }}>
                    {upcoming.length}
                  </span>
                )}
              </div>
              <Link href="/dashboard"
                className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors font-medium">
                Tableau complet <ChevronRight size={11} />
              </Link>
            </div>

            {upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Calendar size={20} className="text-white/18" />
                </div>
                <p className="text-sm text-white/38">Aucune échéance dans les 60 prochains jours</p>
                <p className="text-xs text-white/20 mt-1 mb-5">Ajoutez une date limite à vos projets</p>
                <Link href="/projects"
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
                  Gérer mes projets →
                </Link>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                {upcoming.map(p => {
                  const isUrgent  = p.daysLeft <= 3
                  const isWarning = p.daysLeft <= 7
                  const isSoon    = p.daysLeft <= 14

                  const badgeStyle = isUrgent
                    ? { background: 'rgba(239,68,68,0.18)',  color: '#fca5a5', borderColor: 'rgba(239,68,68,0.28)' }
                    : isWarning
                    ? { background: 'rgba(245,158,11,0.18)', color: '#fcd34d', borderColor: 'rgba(245,158,11,0.28)' }
                    : isSoon
                    ? { background: 'rgba(59,130,246,0.14)', color: '#93c5fd', borderColor: 'rgba(59,130,246,0.22)' }
                    : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.38)', borderColor: 'rgba(255,255,255,0.09)' }

                  const verdictCfg: Record<GoNoGoVerdict, React.CSSProperties> = {
                    GO:        { backgroundColor: 'rgba(16,185,129,0.15)', color: '#6ee7b7' },
                    A_ETUDIER: { backgroundColor: 'rgba(245,158,11,0.15)', color: '#fcd34d' },
                    NO_GO:     { backgroundColor: 'rgba(239,68,68,0.15)',  color: '#fca5a5' },
                  }
                  const verdictLabels: Record<GoNoGoVerdict, string> = { GO: 'GO', A_ETUDIER: '~', NO_GO: 'NG' }

                  return (
                    <Link key={p.id} href={`/projects/${p.id}`}
                      className={cn('flex items-center gap-4 px-5 py-3.5 hover:bg-white/3 transition-all group', isUrgent && 'bg-red-500/3')}>

                      {/* Day badge */}
                      <span className="inline-flex items-center justify-center gap-1 rounded-lg text-[11px] font-extrabold tabular-nums flex-shrink-0 w-14 py-1 border"
                        style={badgeStyle}>
                        {isUrgent && <Flame size={9} />}
                        {p.daysLeft === 0 ? 'Auj.' : `${p.daysLeft}j`}
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/80 group-hover:text-white truncate transition-colors leading-none">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-white/30 mt-0.5 flex items-center gap-2 truncate">
                          <span className="flex items-center gap-1 flex-shrink-0"><Building size={9} />{p.client}</span>
                          <span className="hidden sm:flex items-center gap-1 text-white/20"><MapPin size={9} />{p.location}</span>
                        </p>
                      </div>

                      <span className="text-xs text-white/30 hidden md:block flex-shrink-0 font-medium tabular-nums">
                        {new Date(p.offer_deadline!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>

                      <div className="flex-shrink-0 w-10 text-center">
                        {p.scoreInfo ? (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold"
                            style={verdictCfg[p.scoreInfo.verdict as GoNoGoVerdict]}>
                            {verdictLabels[p.scoreInfo.verdict as GoNoGoVerdict]}
                          </span>
                        ) : <span className="text-[10px] text-white/15">—</span>}
                      </div>

                      <ArrowRight size={12} className="text-white/12 group-hover:text-white/40 transition-colors flex-shrink-0" />
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* ──── RIGHT : Quick actions + Recent ─── */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Quick actions widget */}
            <div className="rounded-2xl p-5"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 20px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30 mb-4">Actions rapides</p>
              <div className="grid grid-cols-2 gap-2.5">
                {/* Primary — Importer DCE */}
                <Link href="/projects/new"
                  className="col-span-2 flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group"
                  style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.22) 0%, rgba(59,130,246,0.12) 100%)', border: '1px solid rgba(59,130,246,0.32)', boxShadow: '0 0 20px rgba(59,130,246,0.10)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(59,130,246,0.25)', border: '1px solid rgba(59,130,246,0.35)' }}>
                    <Upload size={16} className="text-blue-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white leading-none">Importer un DCE</p>
                    <p className="text-[11px] text-blue-300/55 mt-0.5">Analyse IA en moins de 30s</p>
                  </div>
                  <ArrowRight size={14} className="text-blue-400/50 group-hover:text-blue-300 transition-colors flex-shrink-0" />
                </Link>

                {/* Secondary actions — 2-column grid */}
                {[
                  { href: '/projects/new', icon: PlusCircle, label: 'Créer un projet', sub: 'Manuellement',      color: 'rgba(139,92,246,0.14)', border: 'rgba(139,92,246,0.22)', icon_cl: 'text-violet-400' },
                  { href: '/projects',     icon: FolderOpen, label: 'Mes projets',    sub: `${stats.total} total`, color: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.09)', icon_cl: 'text-white/50' },
                  { href: '/dashboard',    icon: BarChart3,  label: 'Dashboard',      sub: 'Statistiques',        color: 'rgba(16,185,129,0.10)',  border: 'rgba(16,185,129,0.18)', icon_cl: 'text-emerald-400' },
                  { href: '/veille',       icon: Radio,      label: 'Veille BOAMP',   sub: 'En direct',           color: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.18)', icon_cl: 'text-amber-400' },
                ].map(({ href, icon: Icon, label, sub, color, border, icon_cl }) => (
                  <Link key={label} href={href}
                    className="flex flex-col gap-2.5 p-3.5 rounded-xl transition-all card-hover group"
                    style={{ background: color, border: `1px solid ${border}` }}>
                    <Icon size={16} className={cn(icon_cl, 'transition-transform group-hover:scale-110')} />
                    <div>
                      <p className="text-xs font-semibold text-white/80 leading-none">{label}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">{sub}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent projects widget */}
            <div className="rounded-2xl overflow-hidden flex-1"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 20px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
              <div className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                  <Activity size={13} className="text-blue-400/70" />
                  <span className="text-sm font-semibold text-white">Projets récents</span>
                </div>
                <Link href="/projects"
                  className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors font-medium">
                  Voir tout <ChevronRight size={11} />
                </Link>
              </div>

              {recent.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.14)' }}>
                    <FolderOpen size={18} className="text-blue-400/50" />
                  </div>
                  <p className="text-sm text-white/35 mb-1">Aucun projet</p>
                  <p className="text-xs text-white/20 mb-4">Créez votre premier DCE</p>
                  <Link href="/projects/new" className="btn-primary text-xs flex items-center gap-1.5">
                    <PlusCircle size={12} />Créer
                  </Link>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  {recent.map((project, i) => (
                    <RecentProjectRow key={project.id} project={project} index={i} />
                  ))}
                </div>
              )}
            </div>

          </div>{/* end right */}
        </div>{/* end 2-col */}
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RecentProjectRow({ project, index }: { project: ProjectWithScore; index: number }) {
  const verdict = project.score?.verdict
  const score   = project.score?.total_score

  const verdictCfg = {
    GO:        { label: 'GO',    bg: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: 'rgba(16,185,129,0.22)' },
    A_ETUDIER: { label: '~',     bg: 'rgba(245,158,11,0.15)', color: '#fcd34d', border: 'rgba(245,158,11,0.22)' },
    NO_GO:     { label: 'NG',    bg: 'rgba(239,68,68,0.15)',  color: '#fca5a5', border: 'rgba(239,68,68,0.22)' },
  }
  const cfg = verdict ? verdictCfg[verdict] : null

  return (
    <Link href={`/projects/${project.id}`}
      className="flex items-center gap-3 px-5 py-3 hover:bg-white/3 transition-all group animate-fade-in"
      style={{ animationDelay: `${index * 40}ms` }}>

      {/* Colored left dot */}
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{
          background: verdict === 'GO' ? '#6ee7b7' : verdict === 'NO_GO' ? '#fca5a5' : verdict === 'A_ETUDIER' ? '#fcd34d' : 'rgba(255,255,255,0.20)',
          boxShadow: verdict === 'GO' ? '0 0 6px rgba(16,185,129,0.5)' : 'none',
        }} />

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white/75 group-hover:text-white truncate transition-colors">
          {project.name}
        </p>
        <p className="text-[10px] text-white/28 truncate mt-0.5">{project.client}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {cfg && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
            {cfg.label}
          </span>
        )}
        {score != null && (
          <span className="text-[10px] font-extrabold tabular-nums"
            style={{ color: verdict === 'GO' ? '#6ee7b7' : verdict === 'NO_GO' ? '#fca5a5' : '#fcd34d' }}>
            {score}
          </span>
        )}
        <ArrowRight size={11} className="text-white/12 group-hover:text-white/35 transition-colors" />
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
