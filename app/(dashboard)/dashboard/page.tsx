import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DonutChart } from '@/components/dashboard/DonutChart'
import { MonthlyBarChart } from '@/components/dashboard/MonthlyBarChart'
import { FunnelChart } from '@/components/dashboard/FunnelChart'
import { ScoreDistribChart } from '@/components/dashboard/ScoreDistribChart'
import {
  TrendingUp, Trophy, XCircle, Clock, AlertCircle, Layers,
  Target, DollarSign, BarChart3, Activity, Zap,
  ChevronRight, Calendar, Users, Lightbulb, AlertTriangle,
  MapPin, Building, ArrowRight, Flame,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Project, GoNoGoVerdict } from '@/types'

export const metadata: Metadata = { title: 'Dashboard — PILOT+' }

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getDashboardData(userId: string) {
  const supabase = await createClient()

  const projectIds = await supabase
    .from('projects').select('id').eq('user_id', userId)

  const ids = projectIds.data?.map(p => p.id) ?? []

  const [projectsRes, scoresRes] = await Promise.all([
    supabase.from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ids.length > 0
      ? supabase.from('project_scores').select('*').in('project_id', ids).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ])

  const projects = (projectsRes.data ?? []) as Project[]
  const scores   = scoresRes.data ?? []

  // ── Summary ────────────────────────────────────────────────────────────────
  const total     = projects.length
  const analyzed  = projects.filter(p => ['analyzed','scored'].includes(p.status)).length
  const scored    = projects.filter(p => p.status === 'scored').length
  const won       = projects.filter(p => p.outcome === 'won').length
  const lost      = projects.filter(p => p.outcome === 'lost').length
  const abandoned = projects.filter(p => p.outcome === 'abandoned').length
  const responded = won + lost
  const pending   = total - won - lost - abandoned

  const caTotal   = projects.reduce((s, p) => s + (p.ca_amount ?? 0), 0)
  const tauxTransfo = responded > 0 ? Math.round((won / responded) * 100) : 0

  // ── Scores ─────────────────────────────────────────────────────────────────
  const allScoreVals = scores.map(s => s.total_score as number)
  const scoreMoyen   = allScoreVals.length > 0
    ? Math.round(allScoreVals.reduce((a, b) => a + b, 0) / allScoreVals.length) : 0
  const go       = scores.filter(s => s.verdict === 'GO').length
  const nogo     = scores.filter(s => s.verdict === 'NO_GO').length
  const aEtudier = scores.filter(s => s.verdict === 'A_ETUDIER').length

  // ── Monthly activity (last 12 months) ──────────────────────────────────────
  const monthKeys: string[] = []
  const monthLabels: string[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    monthLabels.push(d.toLocaleDateString('fr-FR', { month: 'short' }))
  }

  const getYM = (iso: string) => iso.slice(0, 7)

  const importedByMonth = Object.fromEntries(monthKeys.map(k => [k, 0]))
  const analyzedByMonth = Object.fromEntries(monthKeys.map(k => [k, 0]))
  const scoredByMonth   = Object.fromEntries(monthKeys.map(k => [k, 0]))

  projects.forEach(p => {
    const ym = getYM(p.created_at)
    if (ym in importedByMonth) importedByMonth[ym]++
    if (['analyzed','scored'].includes(p.status)) {
      if (ym in analyzedByMonth) analyzedByMonth[ym]++
    }
    if (p.status === 'scored') {
      if (ym in scoredByMonth) scoredByMonth[ym]++
    }
  })

  const monthlyData = monthKeys.map((k, i) => ({
    month:    monthLabels[i],
    imported: importedByMonth[k],
    analyzed: analyzedByMonth[k],
    scored:   scoredByMonth[k],
  }))

  // ── Funnel ─────────────────────────────────────────────────────────────────
  const funnel = [
    { step: 'Importés',  count: total,     pct: 100 },
    { step: 'Analysés',  count: analyzed,  pct: total > 0 ? Math.round(analyzed  / total * 100) : 0 },
    { step: 'Scorés',    count: scored,    pct: total > 0 ? Math.round(scored    / total * 100) : 0 },
    { step: 'Répondus',  count: responded, pct: total > 0 ? Math.round(responded / total * 100) : 0 },
    { step: 'Gagnés',    count: won,       pct: total > 0 ? Math.round(won       / total * 100) : 0 },
  ]

  // ── Loss reasons ───────────────────────────────────────────────────────────
  const lossMap: Record<string, number> = {}
  projects.filter(p => p.outcome === 'lost' && p.loss_reason)
    .forEach(p => { lossMap[p.loss_reason!] = (lossMap[p.loss_reason!] ?? 0) + 1 })
  const lossReasons = Object.entries(lossMap).sort(([,a],[,b]) => b - a).slice(0, 5)

  // ── Score distribution ─────────────────────────────────────────────────────
  const scoreDistrib = [0,10,20,30,40,50,60,70,80,90].map(low => ({
    low,
    label: `${low}–${low + 9}`,
    count: allScoreVals.filter(v => v >= low && v < low + 10).length,
  }))

  // ── Score vs outcome ───────────────────────────────────────────────────────
  const wonIds  = new Set(projects.filter(p => p.outcome === 'won').map(p => p.id))
  const lostIds = new Set(projects.filter(p => p.outcome === 'lost').map(p => p.id))
  const wonScores  = scores.filter(s => wonIds.has(s.project_id as string)).map(s => s.total_score as number)
  const lostScores = scores.filter(s => lostIds.has(s.project_id as string)).map(s => s.total_score as number)
  const avgWon  = wonScores.length  > 0 ? Math.round(wonScores.reduce((a,b)=>a+b,0)  / wonScores.length)  : null
  const avgLost = lostScores.length > 0 ? Math.round(lostScores.reduce((a,b)=>a+b,0) / lostScores.length) : null

  // ── By segment ─────────────────────────────────────────────────────────────
  const segMap: Record<string, { total: number; won: number }> = {}
  projects.forEach(p => {
    const t = p.consultation_type?.trim() || 'Non défini'
    if (!segMap[t]) segMap[t] = { total: 0, won: 0 }
    segMap[t].total++
    if (p.outcome === 'won') segMap[t].won++
  })
  const bySegment = Object.entries(segMap)
    .map(([type, v]) => ({ type, ...v, taux: v.total > 0 ? Math.round((v.won / v.total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)

  // ── By client ──────────────────────────────────────────────────────────────
  const clientMap: Record<string, number> = {}
  projects.forEach(p => { clientMap[p.client] = (clientMap[p.client] ?? 0) + 1 })
  const topClients = Object.entries(clientMap).sort(([,a],[,b]) => b - a).slice(0, 5)
    .map(([client, count]) => ({ client, count }))

  // ── Upcoming deadlines (next 30 days) ──────────────────────────────────────
  const now = Date.now()
  // Build a map projectId → latest score for enriching the table
  const latestScoreByProject: Record<string, { total_score: number; verdict: GoNoGoVerdict }> = {}
  for (const s of scores) {
    const pid = s.project_id as string
    if (!latestScoreByProject[pid]) {
      latestScoreByProject[pid] = { total_score: s.total_score as number, verdict: s.verdict as GoNoGoVerdict }
    }
  }

  const upcoming = projects
    .filter(p => p.offer_deadline && p.outcome === 'pending')
    .map(p => ({
      ...p,
      daysLeft: Math.ceil((new Date(p.offer_deadline!).getTime() - now) / 86400000),
      scoreInfo: latestScoreByProject[p.id] ?? null,
    }))
    .filter(p => p.daysLeft >= 0 && p.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 12)

  // ── Time to decision ───────────────────────────────────────────────────────
  const closedProjects = projects.filter(p => p.closed_at && p.outcome !== 'pending')
  const avgDecisionDays = closedProjects.length > 0
    ? Math.round(closedProjects.reduce((sum, p) => {
        return sum + (new Date(p.closed_at!).getTime() - new Date(p.created_at).getTime()) / 86400000
      }, 0) / closedProjects.length)
    : null

  return {
    summary: { total, analyzed, scored, responded, won, lost, abandoned, pending, caTotal, tauxTransfo, scoreMoyen },
    verdicts: { go, nogo, aEtudier },
    monthlyData,
    funnel,
    lossReasons,
    scoreDistrib,
    scoring: { avgWon, avgLost, total: allScoreVals.length },
    bySegment,
    topClients,
    upcoming,
    avgDecisionDays,
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, iconColor, accent, glow,
}: {
  label: string; value: string | number; sub?: string
  icon: typeof Trophy; iconColor: string; accent: string; glow?: string
}) {
  return (
    <div className={cn(
      'rounded-xl border border-white/8 p-4 flex flex-col gap-1.5 relative overflow-hidden',
      'bg-[var(--bg-card)]',
    )}>
      {glow && (
        <div className={cn('absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-20', glow)} />
      )}
      <div className="flex items-center justify-between relative">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{label}</span>
        <Icon size={14} className={iconColor} />
      </div>
      <span className={cn('text-3xl font-extrabold tabular-nums leading-none', accent)}>{value}</span>
      {sub && <span className="text-[11px] text-white/30 leading-none">{sub}</span>}
    </div>
  )
}

function CardHeader({ icon: Icon, iconColor, title, sub }: {
  icon: typeof Trophy; iconColor: string; title: string; sub?: string
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon size={15} className={iconColor} />
      <div>
        <h2 className="text-sm font-semibold text-white leading-none">{title}</h2>
        {sub && <p className="text-[11px] text-white/40 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function EmptyState({ message, cta }: { message: string; cta?: { label: string; href: string } }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
        <BarChart3 size={18} className="text-white/20" />
      </div>
      <p className="text-sm text-white/30 text-center max-w-xs">{message}</p>
      {cta && (
        <Link href={cta.href}
          className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium">
          {cta.label} <ChevronRight size={12} />
        </Link>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const d = await getDashboardData(user.id)
  const { summary, verdicts, monthlyData, funnel, lossReasons, scoreDistrib, scoring, bySegment, topClients, upcoming, avgDecisionDays } = d

  const donutData = [
    { name: 'GO',        value: verdicts.go,       color: '#22c55e' },
    { name: 'À étudier', value: verdicts.aEtudier,  color: '#f59e0b' },
    { name: 'No Go',     value: verdicts.nogo,      color: '#ef4444' },
  ].filter(x => x.value > 0)

  const caFormatted = summary.caTotal >= 1_000_000
    ? `${(summary.caTotal / 1_000_000).toFixed(1)}M€`
    : summary.caTotal >= 1000
    ? `${(summary.caTotal / 1000).toFixed(0)}k€`
    : summary.caTotal > 0 ? `${summary.caTotal.toLocaleString('fr-FR')}€` : '—'

  return (
    <div className="flex flex-col min-h-0 animate-fade-in">

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <div className="h-14 border-b border-white/5 bg-[var(--bg-surface)] flex items-center justify-between px-4 md:px-6 flex-shrink-0">
        <div>
          <h1 className="text-base font-semibold text-white">Dashboard</h1>
          <p className="text-xs text-white/40">Vue d&apos;ensemble de votre activité commerciale</p>
        </div>
        <div className="text-xs text-white/30 hidden md:block capitalize">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">

        {/* ── Row 1 : 8 KPI cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
          <KpiCard label="Importés"  value={summary.total}     icon={Layers}     iconColor="text-white/40"  accent="text-white"         />
          <KpiCard label="Analysés"  value={summary.analyzed}  icon={Zap}        iconColor="text-blue-400"  accent="text-blue-400"      glow="bg-blue-500" />
          <KpiCard label="Scorés"    value={summary.scored}    icon={Target}     iconColor="text-violet-400" accent="text-violet-400"   glow="bg-violet-500" />
          <KpiCard label="Répondus"  value={summary.responded} icon={Activity}   iconColor="text-cyan-400"  accent="text-cyan-400"      />
          <KpiCard label="Gagnés"    value={summary.won}       icon={Trophy}     iconColor="text-emerald-400" accent="text-emerald-400" glow="bg-emerald-500"
            sub={summary.responded > 0 ? `sur ${summary.responded} clôturés` : undefined} />
          <KpiCard label="CA généré" value={caFormatted}       icon={DollarSign} iconColor="text-emerald-400" accent="text-emerald-300"
            sub={summary.won > 0 ? `${summary.won} projet${summary.won > 1 ? 's' : ''} gagné${summary.won > 1 ? 's' : ''}` : undefined} />
          <KpiCard label="Taux transfo." value={`${summary.tauxTransfo}%`} icon={TrendingUp} iconColor="text-amber-400" accent="text-amber-400"
            sub="répondus → gagnés" />
          <KpiCard label="Score moyen" value={summary.scoreMoyen > 0 ? `${summary.scoreMoyen}` : '—'} icon={BarChart3} iconColor="text-blue-400" accent="text-blue-300"
            sub={`sur ${scoring.total} dossiers`} />
        </div>

        {/* ── Prochaines échéances (full-width table) ─────────────────────── */}
        <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <Calendar size={14} className="text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white leading-none">Prochaines échéances</h2>
                <p className="text-[11px] text-white/40 mt-0.5">Projets en cours — 30 prochains jours</p>
              </div>
            </div>
            <Link href="/projects"
              className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors">
              Tous les projets <ChevronRight size={12} />
            </Link>
          </div>

          {upcoming.length > 0 ? (<>
            {/* ── Mobile / tablet: card layout ── */}
            <div className="md:hidden divide-y divide-white/4">
              {upcoming.map(p => {
                const isUrgent  = p.daysLeft <= 3
                const isWarning = p.daysLeft <= 7
                const isSoon    = p.daysLeft <= 14
                const urgencyColor = isUrgent  ? 'bg-red-500/20 text-red-400 border-red-500/20'
                                   : isWarning ? 'bg-amber-500/20 text-amber-400 border-amber-500/20'
                                   : isSoon    ? 'bg-blue-500/15 text-blue-400 border-blue-500/15'
                                   :             'bg-white/5 text-white/40 border-white/8'
                const verdictMap: Record<GoNoGoVerdict, { label: string; color: string }> = {
                  GO:        { label: 'GO',    color: 'bg-emerald-500/15 text-emerald-400' },
                  A_ETUDIER: { label: '~',     color: 'bg-amber-500/15 text-amber-400'    },
                  NO_GO:     { label: 'NO GO', color: 'bg-red-500/15 text-red-400'        },
                }
                return (
                  <Link key={p.id} href={`/projects/${p.id}`}
                    className={cn('flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors', isUrgent && 'bg-red-500/3')}>
                    <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-extrabold tabular-nums flex-shrink-0 w-12 justify-center', urgencyColor)}>
                      {isUrgent && <Flame size={9} />}
                      {p.daysLeft === 0 ? 'Auj.' : `${p.daysLeft}j`}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/80 truncate">{p.name}</p>
                      <p className="text-[11px] text-white/35 flex items-center gap-1.5 mt-0.5">
                        <Building size={9} /><span className="truncate">{p.client}</span>
                        <span className="text-white/15">·</span>
                        {new Date(p.offer_deadline!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    {p.scoreInfo && (
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0', verdictMap[p.scoreInfo.verdict].color)}>
                        {verdictMap[p.scoreInfo.verdict].label}
                      </span>
                    )}
                    <ArrowRight size={13} className="text-white/20 flex-shrink-0" />
                  </Link>
                )
              })}
            </div>

            {/* ── Desktop: table layout ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/30 w-16">Urgence</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/30">Projet</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/30 hidden lg:table-cell">Client</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/30 hidden xl:table-cell">Localisation</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/30">Échéance</th>
                    <th className="text-center px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/30">Score</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {upcoming.map(p => {
                    const isUrgent  = p.daysLeft <= 3
                    const isWarning = p.daysLeft <= 7
                    const isSoon    = p.daysLeft <= 14
                    const urgencyColor = isUrgent  ? 'bg-red-500/20 text-red-400 border-red-500/20'
                                       : isWarning ? 'bg-amber-500/20 text-amber-400 border-amber-500/20'
                                       : isSoon    ? 'bg-blue-500/15 text-blue-400 border-blue-500/15'
                                       :             'bg-white/5 text-white/40 border-white/8'
                    const verdictMap: Record<GoNoGoVerdict, { label: string; color: string }> = {
                      GO:        { label: 'GO',       color: 'bg-emerald-500/15 text-emerald-400' },
                      A_ETUDIER: { label: '~ Étudier',color: 'bg-amber-500/15 text-amber-400'    },
                      NO_GO:     { label: 'NO GO',    color: 'bg-red-500/15 text-red-400'         },
                    }
                    return (
                      <tr key={p.id} className={cn('group hover:bg-white/3 transition-colors', isUrgent && 'bg-red-500/3')}>
                        <td className="px-5 py-3.5">
                          <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-extrabold tabular-nums', urgencyColor)}>
                            {isUrgent && <Flame size={10} />}
                            {p.daysLeft === 0 ? "Auj." : `${p.daysLeft}j`}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 max-w-[200px]">
                          <Link href={`/projects/${p.id}`} className="font-medium text-white/80 group-hover:text-white truncate block leading-tight transition-colors hover:text-blue-300">
                            {p.name}
                          </Link>
                          {p.consultation_type && <span className="text-[11px] text-white/30 truncate block mt-0.5">{p.consultation_type}</span>}
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <span className="flex items-center gap-1.5 text-white/50 text-xs">
                            <Building size={11} className="flex-shrink-0 text-white/25" />
                            <span className="truncate max-w-[120px]">{p.client}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3.5 hidden xl:table-cell">
                          <span className="flex items-center gap-1.5 text-white/40 text-xs">
                            <MapPin size={11} className="flex-shrink-0 text-white/20" />
                            <span className="truncate max-w-[120px]">{p.location}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-white/60 font-medium whitespace-nowrap">
                            {new Date(p.offer_deadline!).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {p.scoreInfo ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className={cn('inline-block px-2 py-0.5 rounded-full text-[10px] font-bold', verdictMap[p.scoreInfo.verdict].color)}>
                                {verdictMap[p.scoreInfo.verdict].label}
                              </span>
                              <span className="text-[10px] text-white/30 tabular-nums">{p.scoreInfo.total_score}/100</span>
                            </div>
                          ) : <span className="text-[10px] text-white/20">—</span>}
                        </td>
                        <td className="pr-4 py-3.5 text-right">
                          <Link href={`/projects/${p.id}`} className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/4 hover:bg-blue-500/20 text-white/20 hover:text-blue-400 transition-all">
                            <ArrowRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Calendar size={20} className="text-amber-400/40" />
              </div>
              <p className="text-sm text-white/30 text-center">Aucune échéance dans les 30 prochains jours</p>
              <Link href="/projects/new"
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Nouveau projet <ChevronRight size={12} />
              </Link>
            </div>
          )}
        </div>

        {/* ── Row 2 : Funnel + Donut ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-5">
            <CardHeader icon={Activity} iconColor="text-blue-400"
              title="Pipeline de conversion"
              sub="De l'import à la victoire" />
            {summary.total > 0
              ? <FunnelChart steps={funnel} />
              : <EmptyState message="Importez votre premier DCE pour voir le pipeline"
                  cta={{ label: 'Nouveau projet', href: '/projects/new' }} />
            }
          </div>

          <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-5">
            <CardHeader icon={Target} iconColor="text-violet-400"
              title="Répartition Go / No Go"
              sub="Sur les projets scorés" />
            {donutData.length > 0
              ? <DonutChart data={donutData} />
              : <EmptyState message="Scorez vos projets pour voir la répartition"
                  cta={{ label: 'Mes projets', href: '/projects' }} />
            }
          </div>
        </div>

        {/* ── Row 3 : Activité mensuelle (full width) ──────────────────────── */}
        <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-5">
          <CardHeader icon={BarChart3} iconColor="text-blue-400"
            title="Activité mensuelle — 12 derniers mois"
            sub="Importés · Analysés · Scorés" />
          <MonthlyBarChart data={monthlyData} />
        </div>

        {/* ── Row 4 : Score distrib + Raisons de perte ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-5">
            <CardHeader icon={BarChart3} iconColor="text-amber-400"
              title="Distribution des scores"
              sub="Nombre de projets par tranche" />
            {scoring.total > 0
              ? <ScoreDistribChart data={scoreDistrib} />
              : <EmptyState message="Scorez des projets pour voir la distribution" />
            }
          </div>

          <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-5">
            <CardHeader icon={XCircle} iconColor="text-red-400"
              title="Top 5 raisons de perte"
              sub="Cloturez des projets comme « Perdu » pour alimenter" />
            {lossReasons.length > 0 ? (
              <div className="space-y-3 mt-1">
                {lossReasons.map(([reason, count], i) => {
                  const maxCount = lossReasons[0][1]
                  const pct = Math.round((count / maxCount) * 100)
                  return (
                    <div key={reason} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-white/30 w-4 tabular-nums flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs text-white/70 truncate">{reason}</span>
                          <span className="text-xs font-bold text-red-400 flex-shrink-0">{count}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyState message="Aucune perte enregistrée — cloturez des projets pour analyser vos échecs" />
            )}
          </div>
        </div>

        {/* ── Row 5 : Fiabilité scoring + Segmentation ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Scoring accuracy */}
          <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-5">
            <CardHeader icon={Zap} iconColor="text-amber-400"
              title="Fiabilité du scoring prédictif"
              sub="Score moyen gagné vs perdu" />
            {(scoring.avgWon !== null || scoring.avgLost !== null) ? (
              <div className="space-y-4 mt-2">
                {scoring.avgWon !== null && (
                  <div className="flex items-center gap-4">
                    <div className="w-24 flex-shrink-0">
                      <span className="text-xs text-white/40">Projets gagnés</span>
                    </div>
                    <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden">
                      <div className="h-full bg-emerald-500/70 rounded-full flex items-center px-3 transition-all"
                        style={{ width: `${scoring.avgWon}%` }}>
                        <span className="text-xs font-bold text-white">{scoring.avgWon}/100</span>
                      </div>
                    </div>
                  </div>
                )}
                {scoring.avgLost !== null && (
                  <div className="flex items-center gap-4">
                    <div className="w-24 flex-shrink-0">
                      <span className="text-xs text-white/40">Projets perdus</span>
                    </div>
                    <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden">
                      <div className="h-full bg-red-500/60 rounded-full flex items-center px-3 transition-all"
                        style={{ width: `${scoring.avgLost}%` }}>
                        <span className="text-xs font-bold text-white">{scoring.avgLost}/100</span>
                      </div>
                    </div>
                  </div>
                )}
                {scoring.avgWon !== null && scoring.avgLost !== null && (
                  <div className="mt-4 p-3 bg-white/4 rounded-lg border border-white/8">
                    <p className="text-xs text-white/50">
                      {scoring.avgWon > scoring.avgLost
                        ? `✅ Votre scoring est fiable — les projets gagnés sont scorés en moyenne ${scoring.avgWon - scoring.avgLost} pts plus haut que les perdus.`
                        : `⚠️ Scoring à calibrer — les projets gagnés ne sont pas mieux scorés que les perdus.`
                      }
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState message="Cloturez au moins un projet gagné et un perdu pour évaluer la fiabilité du scoring" />
            )}
          </div>

          {/* Segmentation */}
          <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-5">
            <CardHeader icon={Layers} iconColor="text-blue-400"
              title="Par type de consultation"
              sub="Répartition et taux de réussite" />
            {bySegment.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left py-2 pr-3 text-white/40 font-semibold">Type</th>
                      <th className="text-right py-2 px-3 text-white/40 font-semibold">Total</th>
                      <th className="text-right py-2 px-3 text-white/40 font-semibold">Gagnés</th>
                      <th className="text-right py-2 pl-3 text-white/40 font-semibold">Taux</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/4">
                    {bySegment.map(row => (
                      <tr key={row.type} className="hover:bg-white/3 transition-colors">
                        <td className="py-2.5 pr-3 text-white/70 font-medium truncate max-w-[120px]">{row.type}</td>
                        <td className="py-2.5 px-3 text-right text-white/60 tabular-nums">{row.total}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 tabular-nums font-semibold">{row.won}</td>
                        <td className="py-2.5 pl-3 text-right">
                          <span className={cn(
                            'inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums',
                            row.won === 0 && row.total > 0 ? 'bg-white/5 text-white/30' :
                            row.taux >= 50 ? 'bg-emerald-500/15 text-emerald-400' :
                            row.taux >= 25 ? 'bg-amber-500/15 text-amber-400' :
                            'bg-red-500/15 text-red-400'
                          )}>
                            {row.taux}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState message="Aucun projet pour segmenter" />
            )}
          </div>
        </div>

        {/* ── Row 6 : Top clients + Stats temps ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Top clients */}
          <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-5">
            <CardHeader icon={Users} iconColor="text-blue-400" title="Top clients" />
            {topClients.length > 0 ? (
              <ol className="space-y-3">
                {topClients.map(({ client, count }, i) => (
                  <li key={client} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white/25 w-4 tabular-nums">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-1.5">
                        <div className="h-full bg-blue-500/60 rounded-full"
                          style={{ width: `${Math.round((count / topClients[0].count) * 100)}%` }} />
                      </div>
                      <span className="text-xs text-white/60 truncate block">{client}</span>
                    </div>
                    <span className="text-sm font-bold text-blue-400 tabular-nums flex-shrink-0">{count}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState message="Aucun client pour l'instant" />
            )}
          </div>

          {/* Time & stats card */}
          <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-5">
            <CardHeader icon={Clock} iconColor="text-cyan-400" title="Métriques de cadence" />
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div>
                  <p className="text-xs text-white/40">Temps moyen import → décision</p>
                  <p className="text-2xl font-extrabold text-cyan-400 tabular-nums mt-1">
                    {avgDecisionDays !== null ? `${avgDecisionDays}j` : '—'}
                  </p>
                </div>
                <Clock size={24} className="text-cyan-400/20" />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div>
                  <p className="text-xs text-white/40">Projets abandonnés</p>
                  <p className="text-2xl font-extrabold text-white/50 tabular-nums mt-1">{summary.abandoned}</p>
                </div>
                <AlertTriangle size={24} className="text-white/10" />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-xs text-white/40">En attente de clôture</p>
                  <p className="text-2xl font-extrabold text-amber-400 tabular-nums mt-1">{summary.pending}</p>
                </div>
                <AlertCircle size={24} className="text-amber-400/20" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Insights banner ──────────────────────────────────────────────── */}
        {summary.total > 0 && (
          <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-5">
            <CardHeader icon={Lightbulb} iconColor="text-amber-400" title="Insights automatiques" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                summary.tauxTransfo > 0 && `Taux de transformation : ${summary.tauxTransfo}% (${summary.won} gagné${summary.won>1?'s':''} sur ${summary.responded} clôturé${summary.responded>1?'s':''})`,
                scoring.avgWon !== null && scoring.avgLost !== null && scoring.avgWon > scoring.avgLost &&
                  `Scoring fiable : +${scoring.avgWon - scoring.avgLost} pts d'écart entre projets gagnés et perdus`,
                upcoming.length > 0 && `${upcoming.length} projet${upcoming.length>1?'s':''} nécessite${upcoming.length>1?'nt':''} une action dans les 30 prochains jours`,
                lossReasons[0] && `Principale raison de perte : « ${lossReasons[0][0]} » (${lossReasons[0][1]} fois)`,
                summary.abandoned > 0 && `${summary.abandoned} projet${summary.abandoned>1?'s':''} abandonné${summary.abandoned>1?'s':''} — analysez les raisons`,
                summary.caTotal > 0 && `CA total généré via PILOT+ : ${caFormatted}`,
              ].filter(Boolean).map((ins, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-white/3 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                  <span className="text-xs text-white/60 leading-relaxed">{ins as string}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
