import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Upload, PlusCircle, FolderOpen, BarChart3,
  CheckCircle, XCircle, Clock, TrendingUp,
  Calendar, Flame, AlertTriangle, ArrowRight,
  Building, MapPin, ChevronRight, Activity,
  Radio, Target, Zap, Users, Search,
  FileDown, Bell, Sparkles, Trophy,
} from 'lucide-react'
import type { ProjectWithScore, GoNoGoVerdict } from '@/types'
import { cn } from '@/lib/utils/cn'
import { UserAvatarLink } from '@/components/layout/UserAvatarLink'
import { NotificationBell } from '@/components/layout/NotificationBell'

export const metadata: Metadata = { title: 'Accueil — PILOT+' }

async function getAccueilData(userId: string) {
  const supabase = await createClient()

  const [projectsRes, scoresRes, profileRes, veilleRes] = await Promise.all([
    supabase.from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('project_scores').select('*').in(
      'project_id',
      (await supabase.from('projects').select('id').eq('user_id', userId)).data?.map(p => p.id) ?? []
    ),
    supabase.from('profiles').select('full_name').eq('id', userId).single(),
    supabase.from('veille_results').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'pending'),
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
  const aEtudier    = scores.filter(s => s.verdict === 'A_ETUDIER').length
  const tauxTransfo = total > 0 ? Math.round((go / total) * 100) : 0
  const enCours     = projects.filter(p => p.status !== 'scored' && p.outcome === 'pending').length
  const won         = projects.filter(p => p.outcome === 'won').length
  const thisMonth   = new Date(); thisMonth.setDate(1); thisMonth.setHours(0,0,0,0)
  const goThisMonth = scores.filter(s => s.verdict === 'GO' && new Date(s.created_at) >= thisMonth).length
  const scoredCount = scores.length
  const pendingVeille = veilleRes.count ?? 0

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
    .slice(0, 8)

  return {
    recent: enriched.slice(0, 5),
    stats: { total, go, nogo, aEtudier, tauxTransfo, enCours, goThisMonth, won, scoredCount },
    userName: profileRes.data?.full_name ?? null,
    upcoming,
    pendingVeille,
  }
}

// ── Glass style tokens ────────────────────────────────────────────────────────
const G = {
  card: {
    background: 'rgba(8,8,28,0.72)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.07)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
  },
  glow: (rgb: string, opacity = 0.12) => ({
    background: `rgba(${rgb},0.07)`,
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: `1px solid rgba(${rgb},0.22)`,
    boxShadow: `0 0 60px rgba(${rgb},${opacity}), 0 8px 32px rgba(0,0,0,0.45)`,
  }),
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default async function AccueilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { recent, stats, userName, upcoming, pendingVeille } = await getAccueilData(user.id)
  const urgentCount  = upcoming.filter(p => p.daysLeft <= 3).length
  const warningCount = upcoming.filter(p => p.daysLeft > 3 && p.daysLeft <= 7).length
  const name         = userName?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'vous'
  const greeting     = getGreeting()
  const dateStr      = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  // What needs attention (smart insights)
  const attentionItems: string[] = []
  if (urgentCount > 0) attentionItems.push(`${urgentCount} échéance${urgentCount > 1 ? 's' : ''} urgente${urgentCount > 1 ? 's' : ''}`)
  if (pendingVeille > 0) attentionItems.push(`${pendingVeille} alerte${pendingVeille > 1 ? 's' : ''} BOAMP`)

  return (
    <div className="flex flex-col min-h-0 animate-fade-in">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="h-14 flex items-center justify-between px-4 md:px-6 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.055)', background: 'rgba(8,14,34,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
          <p className="text-xs text-white/40 capitalize font-medium hidden sm:block">{dateStr}</p>
          {attentionItems.length > 0 && (
            <span className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.22)', color: '#fca5a5' }}>
              <Flame size={10} />
              {attentionItems.join(' · ')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/projects/new"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.90),rgba(99,102,241,0.90))', boxShadow: '0 0 20px rgba(59,130,246,0.25)' }}>
            <PlusCircle size={13} />Nouveau projet
          </Link>
          <NotificationBell />
          <UserAvatarLink />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

        {/* ── Hero card ────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl px-6 py-6"
          style={{
            background: 'linear-gradient(135deg,rgba(59,130,246,0.13) 0%,rgba(139,92,246,0.09) 50%,rgba(8,8,28,0.60) 100%)',
            border: '1px solid rgba(59,130,246,0.20)',
            boxShadow: '0 4px 40px rgba(0,0,0,0.35), 0 0 80px rgba(59,130,246,0.06), inset 0 1px 0 rgba(255,255,255,0.07)',
          }}>
          <div className="absolute top-0 right-0 w-72 h-72 pointer-events-none"
            style={{ background: 'radial-gradient(circle at 80% 20%,rgba(139,92,246,0.15) 0%,transparent 65%)' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 pointer-events-none"
            style={{ background: 'radial-gradient(circle at 20% 80%,rgba(59,130,246,0.10) 0%,transparent 65%)' }} />
          <div className="absolute left-0 top-6 bottom-6 w-[3px] rounded-full"
            style={{ background: 'linear-gradient(180deg,transparent,rgba(99,102,241,0.70),transparent)' }} />

          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-2"
                style={{ color: 'rgba(147,197,253,0.55)' }}>
                Tableau de bord personnel
              </p>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                {greeting},&nbsp;
                <span style={{ background: 'linear-gradient(135deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {name}
                </span>
              </h1>
              <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.40)' }}>
                {stats.enCours > 0
                  ? <>{stats.enCours} projet{stats.enCours > 1 ? 's' : ''} actif{stats.enCours > 1 ? 's' : ''} · {upcoming.length} échéance{upcoming.length !== 1 ? 's' : ''} à venir · Taux de réussite <strong className="text-emerald-400">{stats.tauxTransfo}%</strong></>
                  : 'Démarrez en créant votre premier projet DCE.'}
              </p>
            </div>
            {/* Stats pills */}
            <div className="flex flex-wrap gap-2 mt-1">
              {stats.goThisMonth > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7' }}>
                  <Sparkles size={11} />+{stats.goThisMonth} GO ce mois
                </span>
              )}
              {stats.won > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.22)', color: '#fcd34d' }}>
                  <Trophy size={11} />{stats.won} gagné{stats.won > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── KPI strip ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Projets',    value: stats.total,              icon: FolderOpen,  rgb: '59,130,246',  textColor: '#93c5fd' },
            { label: 'GO',         value: stats.go,                  icon: CheckCircle, rgb: '16,185,129',  textColor: '#6ee7b7',
              sub: stats.goThisMonth > 0 ? `+${stats.goThisMonth} ce mois` : undefined },
            { label: 'No Go',      value: stats.nogo,                icon: XCircle,     rgb: '239,68,68',   textColor: '#fca5a5' },
            { label: 'À étudier',  value: stats.aEtudier,            icon: Target,      rgb: '245,158,11',  textColor: '#fcd34d' },
            { label: 'Taux transfo.', value: `${stats.tauxTransfo}%`,icon: TrendingUp,  rgb: '139,92,246',  textColor: '#c4b5fd' },
            { label: 'En cours',   value: stats.enCours,             icon: Clock,       rgb: '99,102,241',  textColor: '#a5b4fc' },
          ].map(({ label, value, icon: Icon, rgb, textColor, sub }) => (
            <div key={label} className="rounded-2xl p-4 relative overflow-hidden transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: `linear-gradient(135deg,rgba(${rgb},0.10) 0%,rgba(8,8,28,0.55) 100%)`,
                border: `1px solid rgba(${rgb},0.18)`,
                boxShadow: `0 4px 20px rgba(0,0,0,0.25), 0 0 40px rgba(${rgb},0.05)`,
              }}>
              <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle,rgba(${rgb},0.5),transparent)`, filter: 'blur(12px)', opacity: 0.25 }} />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/35">{label}</span>
                  <Icon size={11} style={{ color: textColor, opacity: 0.7 }} />
                </div>
                <p className="text-3xl font-extrabold tabular-nums leading-none" style={{ color: textColor }}>{value}</p>
                {sub && <p className="text-[10px] mt-1.5 text-white/25">{sub}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────────── */}
        {urgentCount > 0 && (
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
            style={{ background: 'linear-gradient(135deg,rgba(239,68,68,0.14),rgba(239,68,68,0.06))', border: '1px solid rgba(239,68,68,0.25)', boxShadow: '0 4px 24px rgba(239,68,68,0.10)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(239,68,68,0.22)', boxShadow: '0 0 16px rgba(239,68,68,0.30)' }}>
              <Flame size={17} className="text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-300">
                {urgentCount === 1 ? '1 échéance' : `${urgentCount} échéances`} dans moins de 3 jours !
              </p>
              <p className="text-xs text-red-400/50 mt-0.5 truncate">
                {upcoming.filter(p => p.daysLeft <= 3).map(p => p.name).join(' · ')}
              </p>
            </div>
            <Link href="/dashboard" className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-semibold flex-shrink-0 transition-colors">
              Voir <ChevronRight size={12} />
            </Link>
          </div>
        )}

        {urgentCount === 0 && warningCount > 0 && (
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
            style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(245,158,11,0.04))', border: '1px solid rgba(245,158,11,0.22)', boxShadow: '0 4px 24px rgba(245,158,11,0.07)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(245,158,11,0.20)', boxShadow: '0 0 14px rgba(245,158,11,0.22)' }}>
              <AlertTriangle size={17} className="text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-300">
                {warningCount === 1 ? '1 échéance' : `${warningCount} échéances`} cette semaine
              </p>
              <p className="text-xs text-amber-400/50 mt-0.5 truncate">
                {upcoming.filter(p => p.daysLeft <= 7).map(p => p.name).join(' · ')}
              </p>
            </div>
            <Link href="/dashboard" className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold flex-shrink-0 transition-colors">
              Voir <ChevronRight size={12} />
            </Link>
          </div>
        )}

        {pendingVeille > 0 && urgentCount === 0 && warningCount === 0 && (
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
            style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.10),rgba(245,158,11,0.04))', border: '1px solid rgba(245,158,11,0.18)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(245,158,11,0.18)' }}>
              <Radio size={17} className="text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-300">
                {pendingVeille} alerte{pendingVeille > 1 ? 's' : ''} BOAMP à traiter
              </p>
              <p className="text-xs text-amber-400/45 mt-0.5">Nouveaux marchés publics détectés</p>
            </div>
            <Link href="/veille" className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold flex-shrink-0 transition-colors">
              Traiter <ChevronRight size={12} />
            </Link>
          </div>
        )}

        {/* ── Quick actions ─────────────────────────────────────────────── */}
        <div className="rounded-2xl p-5" style={G.card}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap size={13} className="text-blue-400/70" />
              <span className="text-sm font-semibold text-white">Actions rapides</span>
            </div>
          </div>

          {/* Primary CTA */}
          <Link href="/projects/new"
            className="w-full flex items-center gap-4 px-5 py-4 rounded-xl mb-3 transition-all group"
            style={{
              background: 'linear-gradient(135deg,rgba(59,130,246,0.22),rgba(99,102,241,0.14))',
              border: '1px solid rgba(59,130,246,0.35)',
              boxShadow: '0 0 30px rgba(59,130,246,0.10)',
            }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(59,130,246,0.28)', border: '1px solid rgba(59,130,246,0.40)' }}>
              <Upload size={18} className="text-blue-300" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Importer un DCE</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(147,197,253,0.55)' }}>Analyse IA complète en moins de 30 secondes</p>
            </div>
            <ArrowRight size={15} className="text-blue-400/50 group-hover:text-blue-300 group-hover:translate-x-1 transition-all flex-shrink-0" />
          </Link>

          {/* Secondary grid — 4 cols */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { href: '/projects',   icon: FolderOpen,  label: 'Mes projets',    sub: `${stats.total} dossiers`,  rgb: '255,255,255', text: 'text-white/70' },
              { href: '/dashboard',  icon: BarChart3,   label: 'Dashboard',      sub: 'Statistiques',             rgb: '16,185,129',  text: 'text-emerald-400' },
              { href: '/pipeline',   icon: Activity,    label: 'Pipeline',       sub: 'Vue kanban',               rgb: '139,92,246',  text: 'text-violet-400' },
              { href: '/calendrier', icon: Calendar,    label: 'Calendrier',     sub: `${upcoming.length} RDV`,   rgb: '99,102,241',  text: 'text-indigo-400' },
              { href: '/veille',     icon: Radio,       label: 'Veille BOAMP',   sub: pendingVeille > 0 ? `${pendingVeille} alertes` : 'En direct', rgb: '245,158,11', text: 'text-amber-400' },
              { href: '/enrichment', icon: Search,      label: 'Find LinkedIn',  sub: 'Profils',                  rgb: '59,130,246',  text: 'text-blue-400' },
              { href: '/team',       icon: Users,       label: 'Mon équipe',     sub: 'Collaboration',            rgb: '236,72,153',  text: 'text-pink-400' },
              { href: '/export',     icon: FileDown,    label: 'Export',         sub: 'Rapports PDF',             rgb: '255,255,255', text: 'text-white/50' },
            ].map(({ href, icon: Icon, label, sub, rgb, text }) => (
              <Link key={label} href={href}
                className="flex flex-col gap-2.5 p-3.5 rounded-xl transition-all hover:scale-[1.03] group"
                style={{
                  background: `rgba(${rgb},0.05)`,
                  border: `1px solid rgba(${rgb},0.12)`,
                }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.18)` }}>
                  <Icon size={15} className={cn(text, 'transition-transform group-hover:scale-110')} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/80 leading-none">{label}</p>
                  <p className="text-[10px] mt-0.5 text-white/30">{sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Main 2-col ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* ── LEFT: Deadlines ───────────────────────────────────────── */}
          <div className="lg:col-span-3 rounded-2xl overflow-hidden" style={G.card}>
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(245,158,11,0.14)', border: '1px solid rgba(245,158,11,0.22)' }}>
                  <Calendar size={14} className="text-amber-400" />
                </div>
                <span className="text-sm font-semibold text-white">Calendrier des échéances</span>
                {upcoming.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums"
                    style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }}>
                    {upcoming.length}
                  </span>
                )}
              </div>
              <Link href="/dashboard"
                className="flex items-center gap-1 text-xs text-white/28 hover:text-white/55 transition-colors font-medium">
                Tout voir <ChevronRight size={11} />
              </Link>
            </div>

            {upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Calendar size={22} className="text-white/15" />
                </div>
                <p className="text-sm text-white/35 font-medium">Aucune échéance dans les 60 prochains jours</p>
                <p className="text-xs text-white/18 mt-1 mb-5">Ajoutez une date limite à vos projets</p>
                <Link href="/projects" className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors">
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
                    ? { background: 'rgba(239,68,68,0.20)', color: '#fca5a5', borderColor: 'rgba(239,68,68,0.32)' }
                    : isWarning
                    ? { background: 'rgba(245,158,11,0.20)', color: '#fcd34d', borderColor: 'rgba(245,158,11,0.32)' }
                    : isSoon
                    ? { background: 'rgba(59,130,246,0.15)', color: '#93c5fd', borderColor: 'rgba(59,130,246,0.25)' }
                    : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', borderColor: 'rgba(255,255,255,0.10)' }

                  const verdictCfg: Record<GoNoGoVerdict, React.CSSProperties> = {
                    GO:        { backgroundColor: 'rgba(16,185,129,0.15)', color: '#6ee7b7' },
                    A_ETUDIER: { backgroundColor: 'rgba(245,158,11,0.15)', color: '#fcd34d' },
                    NO_GO:     { backgroundColor: 'rgba(239,68,68,0.15)',  color: '#fca5a5' },
                  }
                  const verdictLabels: Record<GoNoGoVerdict, string> = { GO: 'GO', A_ETUDIER: '~', NO_GO: 'NG' }

                  return (
                    <Link key={p.id} href={`/projects/${p.id}`}
                      className={cn('flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.03] transition-all group', isUrgent && 'bg-red-500/[0.03]')}>
                      {/* Days badge */}
                      <span className="inline-flex items-center justify-center gap-1 rounded-lg text-[11px] font-extrabold tabular-nums flex-shrink-0 w-14 py-1.5 border"
                        style={badgeStyle}>
                        {isUrgent && <Flame size={9} />}
                        {p.daysLeft === 0 ? 'Auj.' : `${p.daysLeft}j`}
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/80 group-hover:text-white truncate transition-colors">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-white/28 mt-0.5 flex items-center gap-2">
                          <span className="flex items-center gap-1"><Building size={9} />{p.client}</span>
                          {p.location && <span className="hidden sm:flex items-center gap-1 text-white/18"><MapPin size={9} />{p.location}</span>}
                        </p>
                      </div>

                      <span className="text-xs text-white/25 hidden md:block flex-shrink-0 tabular-nums">
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

                      <ArrowRight size={12} className="text-white/12 group-hover:text-white/40 flex-shrink-0 transition-all group-hover:translate-x-0.5" />
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── RIGHT: Recent projects ────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Recent projects */}
            <div className="rounded-2xl overflow-hidden flex-1" style={G.card}>
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                  <Activity size={13} className="text-blue-400/70" />
                  <span className="text-sm font-semibold text-white">Activité récente</span>
                </div>
                <Link href="/projects"
                  className="flex items-center gap-1 text-xs text-white/28 hover:text-white/55 transition-colors font-medium">
                  Voir tout <ChevronRight size={11} />
                </Link>
              </div>

              {recent.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.14)' }}>
                    <FolderOpen size={20} className="text-blue-400/50" />
                  </div>
                  <p className="text-sm text-white/35 mb-1 font-medium">Aucun projet</p>
                  <p className="text-xs text-white/20 mb-4">Créez votre premier DCE</p>
                  <Link href="/projects/new" className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                    + Créer un projet
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

            {/* Footer links */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: '/dashboard', icon: BarChart3, label: 'Statistiques complètes', color: '#10b981' },
                { href: '/pipeline',  icon: Activity,  label: 'Vue pipeline kanban',    color: '#8b5cf6' },
              ].map(({ href, icon: Icon, label, color }) => (
                <Link key={label} href={href}
                  className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl transition-all hover:scale-[1.02] group"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Icon size={14} style={{ color }} />
                  <span className="text-xs font-medium text-white/50 group-hover:text-white/75 transition-colors leading-tight">{label}</span>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function RecentProjectRow({ project, index }: { project: ProjectWithScore; index: number }) {
  const verdict = project.score?.verdict
  const score   = project.score?.total_score

  const verdictCfg = {
    GO:        { label: 'GO',  bg: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: 'rgba(16,185,129,0.25)' },
    A_ETUDIER: { label: '~',   bg: 'rgba(245,158,11,0.15)', color: '#fcd34d', border: 'rgba(245,158,11,0.25)' },
    NO_GO:     { label: 'NG',  bg: 'rgba(239,68,68,0.15)',  color: '#fca5a5', border: 'rgba(239,68,68,0.25)' },
  }
  const cfg = verdict ? verdictCfg[verdict] : null

  const dotColor = verdict === 'GO' ? '#6ee7b7' : verdict === 'NO_GO' ? '#fca5a5' : verdict === 'A_ETUDIER' ? '#fcd34d' : 'rgba(255,255,255,0.18)'

  return (
    <Link href={`/projects/${project.id}`}
      className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.03] transition-all group animate-fade-in"
      style={{ animationDelay: `${index * 40}ms` }}>
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: dotColor, boxShadow: verdict === 'GO' ? '0 0 6px rgba(16,185,129,0.6)' : 'none' }} />

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white/75 group-hover:text-white truncate transition-colors">
          {project.name}
        </p>
        <p className="text-[10px] text-white/28 truncate mt-0.5">{project.client}</p>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
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
        <ArrowRight size={10} className="text-white/12 group-hover:text-white/35 transition-all group-hover:translate-x-0.5" />
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
