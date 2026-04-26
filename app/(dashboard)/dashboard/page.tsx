import React from 'react'
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
  MapPin, Building, ArrowRight, Flame, Radio, Send,
  Percent, RefreshCw, BrainCircuit,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Project, GoNoGoVerdict } from '@/types'

export const metadata: Metadata = { title: 'Dashboard — PILOT+' }

// ─── Shared glass styles ──────────────────────────────────────────────────────

const G = {
  card: {
    background: 'rgba(8, 8, 28, 0.72)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.07)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
  } as React.CSSProperties,
  glow: (rgb: string, opacity = 0.12) => ({
    background: `rgba(${rgb}, 0.07)`,
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: `1px solid rgba(${rgb}, 0.22)`,
    boxShadow: `0 0 60px rgba(${rgb}, ${opacity}), 0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)`,
  } as React.CSSProperties),
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getDashboardData(userId: string) {
  const supabase = await createClient()

  const [projectsRes, scoresRes, veilleRes] = await Promise.all([
    supabase.from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('project_scores').select('*').order('created_at', { ascending: false }),
    supabase.from('veille_results').select('id', { count: 'exact' }).eq('user_id', userId).eq('status', 'pending'),
  ])

  const projects = (projectsRes.data ?? []) as Project[]
  const allScores = scoresRes.data ?? []
  const pendingVeille = veilleRes.count ?? 0

  // filter scores to user's projects
  const projectIds = new Set(projects.map(p => p.id))
  const scores = allScores.filter(s => projectIds.has(s.project_id as string))

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const total     = projects.length
  const analyzed  = projects.filter(p => ['analyzed','scored'].includes(p.status)).length
  const scored    = projects.filter(p => p.status === 'scored').length
  const won       = projects.filter(p => p.outcome === 'won').length
  const lost      = projects.filter(p => p.outcome === 'lost').length
  const abandoned = projects.filter(p => p.outcome === 'abandoned').length
  const responded = won + lost
  const pending   = total - won - lost - abandoned
  const replied   = responded

  const caPipeline  = projects.filter(p => !['lost','abandoned'].includes(p.outcome)).reduce((s, p) => s + (p.ca_amount ?? 0), 0)
  const caGenerated = projects.filter(p => p.outcome === 'won').reduce((s, p) => s + (p.ca_amount ?? 0), 0)

  const allScoreVals = scores.map(s => s.total_score as number)
  const scoreMoyen   = allScoreVals.length > 0
    ? Math.round(allScoreVals.reduce((a, b) => a + b, 0) / allScoreVals.length) : 0

  const go        = scores.filter(s => s.verdict === 'GO').length
  const nogo      = scores.filter(s => s.verdict === 'NO_GO').length
  const aEtudier  = scores.filter(s => s.verdict === 'A_ETUDIER').length
  const tauxGo    = scores.length > 0 ? Math.round((go / scores.length) * 100) : 0

  // ── Secondary KPIs ─────────────────────────────────────────────────────────
  const avgDecisionDays = (() => {
    const closed = projects.filter(p => p.closed_at)
    if (!closed.length) return null
    const avg = closed.reduce((sum, p) =>
      sum + (new Date(p.closed_at!).getTime() - new Date(p.created_at).getTime()) / 86400000, 0
    ) / closed.length
    return Math.round(avg)
  })()

  // ── Monthly 12m ────────────────────────────────────────────────────────────
  const monthKeys: string[] = []
  const monthLabels: string[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i)
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    monthLabels.push(d.toLocaleDateString('fr-FR', { month: 'short' }))
  }
  const getYM = (iso: string) => iso.slice(0, 7)
  const iByM: Record<string,number> = Object.fromEntries(monthKeys.map(k => [k, 0]))
  const aByM: Record<string,number> = Object.fromEntries(monthKeys.map(k => [k, 0]))
  const sByM: Record<string,number> = Object.fromEntries(monthKeys.map(k => [k, 0]))
  projects.forEach(p => {
    const ym = getYM(p.created_at)
    if (ym in iByM) iByM[ym]++
    if (['analyzed','scored'].includes(p.status) && ym in aByM) aByM[ym]++
    if (p.status === 'scored' && ym in sByM) sByM[ym]++
  })
  const monthlyData = monthKeys.map((k, i) => ({ month: monthLabels[i], imported: iByM[k], analyzed: aByM[k], scored: sByM[k] }))
  const hasMonthlyActivity = monthlyData.filter(m => m.imported + m.analyzed + m.scored > 0).length >= 2

  // ── Funnel ─────────────────────────────────────────────────────────────────
  const funnel = [
    { step: 'Importés',  count: total,     pct: 100 },
    { step: 'Analysés',  count: analyzed,  pct: total > 0 ? Math.round(analyzed  / total * 100) : 0 },
    { step: 'Scorés',    count: scored,    pct: total > 0 ? Math.round(scored    / total * 100) : 0 },
    { step: 'Répondus',  count: responded, pct: total > 0 ? Math.round(responded / total * 100) : 0 },
    { step: 'Gagnés',    count: won,       pct: total > 0 ? Math.round(won       / total * 100) : 0 },
  ]

  // ── Score distribution ─────────────────────────────────────────────────────
  const scoreDistrib = [0,10,20,30,40,50,60,70,80,90].map(low => ({
    low, label: `${low}–${low+9}`,
    count: allScoreVals.filter(v => v >= low && v < low + 10).length,
  }))

  // ── Scoring reliability ────────────────────────────────────────────────────
  const wonIds   = new Set(projects.filter(p => p.outcome === 'won').map(p => p.id))
  const lostIds  = new Set(projects.filter(p => p.outcome === 'lost').map(p => p.id))
  const wonSc    = scores.filter(s => wonIds.has(s.project_id as string)).map(s => s.total_score as number)
  const lostSc   = scores.filter(s => lostIds.has(s.project_id as string)).map(s => s.total_score as number)
  const avgWon   = wonSc.length  > 0 ? Math.round(wonSc.reduce((a,b)=>a+b,0) / wonSc.length)   : null
  const avgLost  = lostSc.length > 0 ? Math.round(lostSc.reduce((a,b)=>a+b,0) / lostSc.length)  : null

  // ── By consultation type ───────────────────────────────────────────────────
  const segMap: Record<string, { total: number; won: number; scores: number[] }> = {}
  const scoreByProject: Record<string, number> = {}
  for (const s of scores) scoreByProject[s.project_id as string] = s.total_score as number

  projects.forEach(p => {
    const t = p.consultation_type?.trim() || 'Non défini'
    if (!segMap[t]) segMap[t] = { total: 0, won: 0, scores: [] }
    segMap[t].total++
    if (p.outcome === 'won') segMap[t].won++
    if (scoreByProject[p.id] !== undefined) segMap[t].scores.push(scoreByProject[p.id])
  })
  const bySegment = Object.entries(segMap)
    .map(([type, v]) => ({
      type, total: v.total, won: v.won,
      taux: v.total > 0 ? Math.round((v.won / v.total) * 100) : 0,
      scoreMoyen: v.scores.length > 0 ? Math.round(v.scores.reduce((a,b)=>a+b,0)/v.scores.length) : null,
    }))
    .sort((a, b) => b.total - a.total).slice(0, 8)

  // ── Top clients ────────────────────────────────────────────────────────────
  const clientMap: Record<string, { count: number; won: number }> = {}
  projects.forEach(p => {
    if (!clientMap[p.client]) clientMap[p.client] = { count: 0, won: 0 }
    clientMap[p.client].count++
    if (p.outcome === 'won') clientMap[p.client].won++
  })
  const topClients = Object.entries(clientMap)
    .sort(([,a],[,b]) => b.count - a.count).slice(0, 5)
    .map(([client, v]) => ({ client, ...v }))

  // ── Upcoming deadlines ─────────────────────────────────────────────────────
  const latestScore: Record<string, { total_score: number; verdict: GoNoGoVerdict }> = {}
  for (const s of scores) {
    const pid = s.project_id as string
    if (!latestScore[pid]) latestScore[pid] = { total_score: s.total_score as number, verdict: s.verdict as GoNoGoVerdict }
  }
  const now = Date.now()
  const upcoming = projects
    .filter(p => p.offer_deadline && p.outcome === 'pending')
    .map(p => ({
      ...p,
      daysLeft: Math.ceil((new Date(p.offer_deadline!).getTime() - now) / 86400000),
      scoreInfo: latestScore[p.id] ?? null,
    }))
    .filter(p => p.daysLeft >= 0 && p.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 8)

  // ── Loss reasons ───────────────────────────────────────────────────────────
  const lossMap: Record<string, number> = {}
  projects.filter(p => p.outcome === 'lost' && p.loss_reason)
    .forEach(p => { lossMap[p.loss_reason!] = (lossMap[p.loss_reason!] ?? 0) + 1 })
  const lossReasons = Object.entries(lossMap).sort(([,a],[,b]) => b - a).slice(0, 5)

  // ── Insights ───────────────────────────────────────────────────────────────
  const notScored = projects.filter(p => p.status === 'analyzed').length
  const insights: string[] = []
  if (upcoming.length > 0) insights.push(`${upcoming.length} projet${upcoming.length>1?'s':''} nécessite${upcoming.length>1?'nt':''} une action dans les 30 prochains jours`)
  if (notScored > 0) insights.push(`${notScored} projet${notScored>1?'s':''} analysé${notScored>1?'s':''} ne ${notScored>1?'sont':'est'} pas encore scoré${notScored>1?'s':''}`)
  if (won === 0 && total >= 5) insights.push(`Aucun projet gagné pour l'instant — clôturez vos dossiers terminés`)
  if (responded > 0) {
    const taux = Math.round((won / responded) * 100)
    if (taux < 15 && responded >= 3) insights.push(`Taux de transformation : ${taux}% — en dessous de la moyenne B2B (15–20%)`)
  }
  if (pendingVeille > 0) insights.push(`${pendingVeille} annonce${pendingVeille>1?'s':''} BOAMP non consultée${pendingVeille>1?'s':''} correspondent à votre profil`)
  if (abandoned > 0) insights.push(`${abandoned} projet${abandoned>1?'s':''} abandonné${abandoned>1?'s':''} — analysez les raisons pour améliorer votre scoring`)
  if (avgWon !== null && avgLost !== null && avgWon > avgLost)
    insights.push(`Scoring fiable : +${avgWon - avgLost} pts d'écart entre projets gagnés et perdus`)

  return {
    summary: { total, analyzed, scored, replied, won, lost, abandoned, pending, caPipeline, caGenerated, scoreMoyen, tauxGo },
    secondary: { avgDecisionDays, notScored, abandoned, pending },
    verdicts: { go, nogo, aEtudier },
    monthlyData, hasMonthlyActivity,
    funnel, scoreDistrib,
    scoring: { avgWon, avgLost, total: allScoreVals.length },
    bySegment, topClients,
    upcoming, lossReasons,
    pendingVeille,
    insights: insights.slice(0, 5),
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCA(n: number) {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M€`
  if (n >= 1000)      return `${(n/1000).toFixed(0)}k€`
  return n > 0 ? `${n.toLocaleString('fr-FR')}€` : '—'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GlassCard({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn('rounded-2xl overflow-hidden', className)} style={{ ...G.card, ...style }}>
      {children}
    </div>
  )
}

function SectionHeader({ icon: Icon, iconColor, iconRgb, title, sub, action }: {
  icon: React.ElementType; iconColor: string; iconRgb: string; title: string; sub?: string; action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `rgba(${iconRgb}, 0.12)`, border: `1px solid rgba(${iconRgb}, 0.20)` }}>
          <Icon size={14} className={iconColor} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white/90 leading-none">{title}</h2>
          {sub && <p className="text-[10px] text-white/35 mt-0.5">{sub}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

function EmptySlate({ message, cta }: { message: string; cta?: { label: string; href: string } }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <BarChart3 size={17} className="text-white/15" />
      </div>
      <p className="text-[13px] text-white/28 text-center max-w-xs leading-relaxed">{message}</p>
      {cta && (
        <Link href={cta.href}
          className="flex items-center gap-1.5 text-xs text-blue-400/70 hover:text-blue-400 transition-colors font-medium mt-1">
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
  const { summary, secondary, verdicts, monthlyData, hasMonthlyActivity, funnel, scoreDistrib, scoring, bySegment, topClients, upcoming, lossReasons, pendingVeille, insights } = d
  const { avgWon, avgLost } = scoring

  const donutData = [
    { name: 'GO',        value: verdicts.go,      color: '#10B981' },
    { name: 'À étudier', value: verdicts.aEtudier, color: '#F59E0B' },
    { name: 'NO GO',     value: verdicts.nogo,     color: '#EF4444' },
  ].filter(x => x.value > 0)

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const VERDICT_BADGE: Record<GoNoGoVerdict, { label: string; rgb: string }> = {
    GO:        { label: 'GO',       rgb: '16,185,129' },
    A_ETUDIER: { label: '~ Étudier',rgb: '245,158,11' },
    NO_GO:     { label: 'NO GO',    rgb: '239,68,68'  },
  }

  // Secondary KPIs — only show block if at least 2 have non-null values
  const secItems = [
    secondary.avgDecisionDays !== null ? { label: 'Délai moyen décision', value: `${secondary.avgDecisionDays}j`, sub: 'import → clôture', rgb: '6,182,212' } : null,
    scoring.total > 0 ? { label: 'Score moyen global', value: String(summary.scoreMoyen), sub: `sur ${scoring.total} dossiers`, rgb: '124,58,237' } : null,
    secondary.abandoned > 0 ? { label: 'Projets abandonnés', value: String(secondary.abandoned), sub: 'à analyser', rgb: '239,68,68' } : null,
    secondary.pending > 0 ? { label: 'En attente clôture', value: String(secondary.pending), sub: 'projets actifs', rgb: '245,158,11' } : null,
  ].filter(Boolean) as { label: string; value: string; sub: string; rgb: string }[]

  const showSecondary = secItems.filter(x => x !== null).length >= 2

  return (
    <div className="flex flex-col min-h-0">

      {/* ── [A] Header ────────────────────────────────────────────────────── */}
      <div className="relative flex-shrink-0 overflow-hidden"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(6,6,20,0.85)', backdropFilter: 'blur(20px)' }}>
        {/* subtle gradient accent */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 80% at 30% 50%, rgba(124,58,237,0.06) 0%, transparent 70%)' }} />
        <div className="relative flex items-center justify-between px-5 md:px-7 h-16">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-lg font-extrabold tracking-tight"
                style={{ background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.65) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Dashboard
              </h1>
              <p className="text-[11px] text-white/32 -mt-0.5">Vue d&apos;ensemble de votre activité commerciale</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:block text-[11px] text-white/28 capitalize px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {today}
            </span>
            <Link href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-white/40 hover:text-white/70 transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <RefreshCw size={12} />Actualiser
            </Link>
          </div>
        </div>
      </div>

      {/* ── Scrollable content ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-5"
        style={{ background: 'linear-gradient(180deg, rgba(7,7,26,1) 0%, rgba(5,5,18,1) 100%)' }}>

        {/* ── [B] BOAMP Alert Banner ───────────────────────────────────────── */}
        {pendingVeille > 0 && (
          <div className="relative overflow-hidden rounded-2xl px-5 py-3.5 flex items-center justify-between gap-4"
            style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.22)', boxShadow: '0 0 30px rgba(245,158,11,0.06)' }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 50% 100% at 10% 50%, rgba(245,158,11,0.08) 0%, transparent 70%)' }} />
            <div className="relative flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <Radio size={14} className="text-amber-400" />
              </div>
              <p className="text-sm font-semibold text-amber-300/90">
                <span className="font-extrabold text-amber-300">{pendingVeille}</span> nouvelle{pendingVeille > 1 ? 's' : ''} annonce{pendingVeille > 1 ? 's' : ''} BOAMP correspondent à votre profil
              </p>
            </div>
            <Link href="/veille"
              className="relative flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-300 transition-all hover:bg-amber-400/15"
              style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)' }}>
              Voir les annonces <ArrowRight size={12} />
            </Link>
          </div>
        )}

        {/* ── [C] 8 KPI Cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
          {[
            { label: 'Importés',    value: summary.total,           icon: Layers,      rgb: '124,58,237', num: summary.total,     sub: 'projets total' },
            { label: 'Analysés',    value: summary.analyzed,        icon: BrainCircuit,rgb: '59,130,246',  num: summary.analyzed,  sub: `${summary.total > 0 ? Math.round(summary.analyzed/summary.total*100) : 0}% du total` },
            { label: 'Scorés',      value: summary.scored,          icon: Target,      rgb: '6,182,212',   num: summary.scored,    sub: `${summary.total > 0 ? Math.round(summary.scored/summary.total*100) : 0}% du total` },
            { label: 'Répondus',    value: summary.replied,         icon: Send,        rgb: '99,102,241',  num: summary.replied,   sub: 'gagnés + perdus' },
            { label: 'Gagnés',      value: summary.won,             icon: Trophy,      rgb: '16,185,129',  num: summary.won,       sub: summary.replied > 0 ? `sur ${summary.replied} clôturés` : 'projets gagnés' },
            { label: 'CA Pipeline', value: fmtCA(summary.caPipeline), icon: DollarSign, rgb: '16,185,129', num: summary.caPipeline, sub: 'projets actifs' },
            { label: 'CA Généré',   value: fmtCA(summary.caGenerated), icon: TrendingUp, rgb: '34,197,94', num: summary.caGenerated, sub: `${summary.won} gagné${summary.won !== 1 ? 's' : ''}` },
            { label: 'Taux Go',     value: `${summary.tauxGo}%`,    icon: Percent,     rgb: '124,58,237',  num: summary.tauxGo,    sub: `${verdicts.go} go / ${scoring.total} scorés` },
          ].map(({ label, value, icon: Icon, rgb, num, sub }) => (
            <div key={label} className="relative rounded-2xl p-4 overflow-hidden transition-all duration-300 hover:-translate-y-px group cursor-default"
              style={num > 0 ? G.glow(rgb) : { ...G.card }}>
              {/* Glow overlay */}
              {num > 0 && (
                <div className="absolute -top-6 -right-6 w-20 h-20 pointer-events-none"
                  style={{ background: `radial-gradient(circle, rgba(${rgb},0.35) 0%, transparent 70%)`, filter: 'blur(12px)' }} />
              )}
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/35">{label}</span>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: num > 0 ? `rgba(${rgb},0.15)` : 'rgba(255,255,255,0.05)' }}>
                    <Icon size={11} style={{ color: num > 0 ? `rgb(${rgb})` : 'rgba(255,255,255,0.2)' }} />
                  </div>
                </div>
                <div className={cn('text-2xl font-extrabold tabular-nums leading-none mb-1', num === 0 && 'text-white/20')}
                  style={num > 0 ? { color: `rgb(${rgb})`, textShadow: `0 0 20px rgba(${rgb},0.4)` } : {}}>
                  {num > 0 ? value : '—'}
                </div>
                <p className="text-[10px] text-white/25 leading-none truncate">{num > 0 ? sub : 'Aucun pour l\'instant'}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── [D] Secondary KPIs ──────────────────────────────────────────── */}
        {showSecondary && (
          <div className={cn('grid gap-3', `grid-cols-${secItems.length} sm:grid-cols-${secItems.length}`)}>
            {secItems.map(item => (
              <GlassCard key={item.label} className="p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/32 mb-2">{item.label}</p>
                <p className="text-2xl font-extrabold tabular-nums" style={{ color: `rgb(${item.rgb})` }}>{item.value}</p>
                <p className="text-[10px] text-white/30 mt-1">{item.sub}</p>
              </GlassCard>
            ))}
          </div>
        )}

        {/* ── [E] Upcoming Deadlines ──────────────────────────────────────── */}
        {upcoming.length > 0 && (
          <GlassCard>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.20)' }}>
                  <Calendar size={14} className="text-amber-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white/90">Prochaines échéances</h2>
                  <p className="text-[10px] text-white/35">30 prochains jours · {upcoming.length} projet{upcoming.length > 1 ? 's' : ''}</p>
                </div>
              </div>
              <Link href="/projects"
                className="flex items-center gap-1 text-xs text-white/35 hover:text-white/65 transition-colors">
                Tous <ChevronRight size={12} />
              </Link>
            </div>

            {/* Table — desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {['Urgence', 'Projet', 'Client', 'Localisation', 'Échéance', 'Score', ''].map(h => (
                      <th key={h} className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/25">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((p, idx) => {
                    const urgent  = p.daysLeft <= 3
                    const warning = p.daysLeft <= 7
                    const soon    = p.daysLeft <= 14
                    const urgRgb  = urgent ? '239,68,68' : warning ? '245,158,11' : soon ? '59,130,246' : '255,255,255'
                    return (
                      <tr key={p.id} className="group transition-colors hover:bg-white/[0.025]"
                        style={{ borderBottom: idx < upcoming.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                          background: urgent ? 'rgba(239,68,68,0.02)' : 'transparent' }}>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-extrabold tabular-nums"
                            style={{ background: `rgba(${urgRgb},0.12)`, border: `1px solid rgba(${urgRgb},0.22)`, color: `rgb(${urgRgb})` }}>
                            {urgent && <Flame size={9} />}
                            {p.daysLeft === 0 ? 'Auj.' : `${p.daysLeft}j`}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 max-w-[180px]">
                          <Link href={`/projects/${p.id}`} className="text-sm font-semibold text-white/75 hover:text-blue-400 truncate block transition-colors">
                            {p.name}
                          </Link>
                          {p.consultation_type && <span className="text-[10px] text-white/28 block mt-0.5 truncate">{p.consultation_type}</span>}
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <span className="flex items-center gap-1.5 text-xs text-white/45">
                            <Building size={10} className="text-white/25 flex-shrink-0" />{p.client}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 hidden xl:table-cell">
                          <span className="flex items-center gap-1.5 text-xs text-white/35">
                            <MapPin size={10} className="text-white/20 flex-shrink-0" />{p.location}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-white/55 font-medium whitespace-nowrap">
                            {new Date(p.offer_deadline!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {p.scoreInfo ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold"
                                style={{ background: `rgba(${VERDICT_BADGE[p.scoreInfo.verdict].rgb},0.12)`, color: `rgb(${VERDICT_BADGE[p.scoreInfo.verdict].rgb})` }}>
                                {VERDICT_BADGE[p.scoreInfo.verdict].label}
                              </span>
                              <span className="text-[10px] text-white/28 tabular-nums">{p.scoreInfo.total_score}/100</span>
                            </div>
                          ) : <span className="text-[10px] text-white/20">—</span>}
                        </td>
                        <td className="pr-5 py-3.5">
                          <Link href={`/projects/${p.id}`}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-xl transition-all text-white/20 hover:text-blue-400"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <ArrowRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Cards — mobile */}
            <div className="md:hidden divide-y divide-white/5">
              {upcoming.map(p => {
                const urgent = p.daysLeft <= 3
                const urgRgb = urgent ? '239,68,68' : p.daysLeft <= 7 ? '245,158,11' : '59,130,246'
                return (
                  <Link key={p.id} href={`/projects/${p.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.025] transition-colors">
                    <span className="flex-shrink-0 px-2 py-1 rounded-lg text-[11px] font-bold tabular-nums"
                      style={{ background: `rgba(${urgRgb},0.12)`, color: `rgb(${urgRgb})`, border: `1px solid rgba(${urgRgb},0.2)` }}>
                      {p.daysLeft === 0 ? 'Auj.' : `${p.daysLeft}j`}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white/80 truncate">{p.name}</p>
                      <p className="text-[11px] text-white/35 truncate mt-0.5">{p.client}</p>
                    </div>
                    <ArrowRight size={13} className="text-white/20 flex-shrink-0" />
                  </Link>
                )
              })}
            </div>
          </GlassCard>
        )}

        {/* ── [F+G] Pipeline + Donut ──────────────────────────────────────── */}
        {summary.total > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

            {/* [F] Pipeline */}
            <GlassCard className="lg:col-span-3 p-5">
              <SectionHeader icon={Activity} iconColor="text-blue-400" iconRgb="59,130,246"
                title="Pipeline de conversion" sub="De l'import à la victoire" />
              <FunnelChart steps={funnel} />
            </GlassCard>

            {/* [G] Go/NoGo Donut */}
            <GlassCard className="lg:col-span-2 p-5">
              <SectionHeader icon={Target} iconColor="text-violet-400" iconRgb="124,58,237"
                title="Répartition Go / No Go" sub={`${scoring.total} projets scorés · score moyen ${summary.scoreMoyen}`} />
              {donutData.length > 0
                ? <DonutChart data={donutData} centerLabel={summary.scoreMoyen > 0 ? String(summary.scoreMoyen) : undefined} />
                : <EmptySlate message="Scorez vos projets pour voir la répartition" cta={{ label: 'Mes projets', href: '/projects' }} />
              }
            </GlassCard>
          </div>
        )}

        {/* ── [H] Monthly Activity ────────────────────────────────────────── */}
        {hasMonthlyActivity && (
          <GlassCard className="p-5">
            <SectionHeader icon={BarChart3} iconColor="text-blue-400" iconRgb="59,130,246"
              title="Activité mensuelle" sub="12 derniers mois · Importés · Analysés · Scorés" />
            <MonthlyBarChart data={monthlyData} />
          </GlassCard>
        )}

        {/* ── [I] Score Distribution + Reliability ────────────────────────── */}
        {scoring.total >= 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* I.1 Distribution */}
            <GlassCard className="p-5">
              <SectionHeader icon={BarChart3} iconColor="text-amber-400" iconRgb="245,158,11"
                title="Distribution des scores" sub="Nombre de projets par tranche" />
              {scoring.total >= 3
                ? <ScoreDistribChart data={scoreDistrib} />
                : <EmptySlate message="Scorez au moins 3 projets pour voir la distribution" />
              }
            </GlassCard>

            {/* I.2 Reliability */}
            <GlassCard className="p-5">
              <SectionHeader icon={Zap} iconColor="text-emerald-400" iconRgb="16,185,129"
                title="Fiabilité du scoring prédictif" sub="Score moyen gagné vs perdu" />
              {(avgWon !== null || avgLost !== null) ? (
                <div className="space-y-5 mt-2">
                  {avgWon !== null && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-white/45">Projets gagnés</span>
                        <span className="text-sm font-extrabold text-emerald-400 tabular-nums">{avgWon}/100</span>
                      </div>
                      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${avgWon}%`, background: 'linear-gradient(90deg, #059669, #10B981)', boxShadow: '0 0 10px rgba(16,185,129,0.5)' }} />
                      </div>
                    </div>
                  )}
                  {avgLost !== null && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-white/45">Projets perdus</span>
                        <span className="text-sm font-extrabold text-red-400 tabular-nums">{avgLost}/100</span>
                      </div>
                      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="h-full rounded-full"
                          style={{ width: `${avgLost}%`, background: 'linear-gradient(90deg, #dc2626, #EF4444)', boxShadow: '0 0 10px rgba(239,68,68,0.4)' }} />
                      </div>
                    </div>
                  )}
                  {avgWon !== null && avgLost !== null && (
                    <div className="rounded-xl p-3" style={{ background: avgWon > avgLost ? 'rgba(16,185,129,0.07)' : 'rgba(245,158,11,0.07)', border: `1px solid ${avgWon > avgLost ? 'rgba(16,185,129,0.18)' : 'rgba(245,158,11,0.18)'}` }}>
                      <p className="text-xs leading-relaxed" style={{ color: avgWon > avgLost ? 'rgba(52,211,153,0.9)' : 'rgba(251,191,36,0.9)' }}>
                        {avgWon > avgLost
                          ? `✅ Scoring fiable — +${avgWon - avgLost} pts d'écart entre projets gagnés et perdus`
                          : `⚠️ Scoring à calibrer — écart insuffisant entre gagnés et perdus`
                        }
                      </p>
                    </div>
                  )}
                  {(avgWon === null || avgLost === null) && (
                    <p className="text-xs text-white/30 italic">Clôturez au moins un projet gagné et un perdu pour voir l&apos;écart</p>
                  )}
                </div>
              ) : (
                <EmptySlate message="Clôturez des projets gagnés et perdus pour évaluer la fiabilité du scoring" />
              )}
            </GlassCard>
          </div>
        )}

        {/* ── [J] By Consultation Type + [M] Top Clients ─────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* [J] By type */}
          {bySegment.length >= 2 && (
            <GlassCard className="p-5">
              <SectionHeader icon={Layers} iconColor="text-indigo-400" iconRgb="99,102,241"
                title="Par type de consultation" sub="Répartition et taux de réussite" />
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['Type', 'Total', 'Gagnés', 'Score moy.', 'Taux'].map(h => (
                        <th key={h} className={cn('py-2 text-white/32 font-bold', h === 'Type' ? 'text-left pr-3' : 'text-right px-2')}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bySegment.map((row, i) => (
                      <tr key={row.type} className="transition-colors hover:bg-white/[0.025]"
                        style={{ borderBottom: i < bySegment.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                        <td className="py-2.5 pr-3 text-white/65 font-medium truncate max-w-[110px]">{row.type}</td>
                        <td className="py-2.5 px-2 text-right text-white/50 tabular-nums">{row.total}</td>
                        <td className="py-2.5 px-2 text-right text-emerald-400/80 tabular-nums font-semibold">{row.won}</td>
                        <td className="py-2.5 px-2 text-right text-white/40 tabular-nums">{row.scoreMoyen ?? '—'}</td>
                        <td className="py-2.5 pl-2 text-right">
                          <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums"
                            style={{
                              background: row.taux >= 50 ? 'rgba(16,185,129,0.12)' : row.taux >= 25 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.10)',
                              color: row.taux >= 50 ? '#34d399' : row.taux >= 25 ? '#fbbf24' : '#f87171',
                            }}>
                            {row.taux}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <td className="pt-2.5 pr-3 text-white/60 font-bold text-xs">Total</td>
                      <td className="pt-2.5 px-2 text-right font-bold text-white/65 tabular-nums">{summary.total}</td>
                      <td className="pt-2.5 px-2 text-right font-bold text-emerald-400 tabular-nums">{summary.won}</td>
                      <td className="pt-2.5 px-2 text-right font-bold text-white/50 tabular-nums">{summary.scoreMoyen > 0 ? summary.scoreMoyen : '—'}</td>
                      <td className="pt-2.5 pl-2 text-right font-bold text-white/50">
                        {summary.replied > 0 ? `${Math.round(summary.won/summary.replied*100)}%` : '—'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}

          {/* [M] Top Clients */}
          {topClients.length >= 2 && (
            <GlassCard className="p-5">
              <SectionHeader icon={Users} iconColor="text-blue-400" iconRgb="59,130,246"
                title="Top clients" sub={`${topClients.length} clients · classés par volume`} />
              <div className="space-y-4">
                {topClients.map(({ client, count, won }, i) => {
                  const maxCount = topClients[0].count
                  const pct = Math.round((count / maxCount) * 100)
                  return (
                    <div key={client} className="flex items-center gap-3 group">
                      <span className="text-xs font-extrabold w-4 text-right flex-shrink-0 tabular-nums"
                        style={{ color: i === 0 ? '#fbbf24' : 'rgba(255,255,255,0.25)' }}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-xs font-semibold text-white/65 truncate">{client}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {won > 0 && <span className="text-[10px] font-bold text-emerald-400">{won}✓</span>}
                            <span className="text-xs font-bold text-blue-400 tabular-nums">{count}</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, rgba(59,130,246,0.6), rgba(99,102,241,0.8))', boxShadow: `0 0 8px rgba(59,130,246,0.4)` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </GlassCard>
          )}

          {/* If only one section fits, fill with loss reasons */}
          {(bySegment.length < 2 || topClients.length < 2) && lossReasons.length > 0 && (
            <GlassCard className="p-5">
              <SectionHeader icon={XCircle} iconColor="text-red-400" iconRgb="239,68,68"
                title="Raisons de perte" sub="Top raisons identifiées" />
              <div className="space-y-4">
                {lossReasons.map(([reason, count], i) => {
                  const maxCount = lossReasons[0][1]
                  return (
                    <div key={reason} className="flex items-center gap-3">
                      <span className="text-xs font-bold w-4 text-right text-white/25 tabular-nums flex-shrink-0">{i+1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-xs text-white/60 truncate">{reason}</span>
                          <span className="text-xs font-bold text-red-400 flex-shrink-0 tabular-nums">{count}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <div className="h-full rounded-full"
                            style={{ width: `${Math.round((count/maxCount)*100)}%`, background: 'linear-gradient(90deg, rgba(220,38,38,0.6), rgba(239,68,68,0.8))' }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </GlassCard>
          )}

          {/* Cadence metrics if available */}
          {secondary.avgDecisionDays !== null && (
            <GlassCard className="p-5">
              <SectionHeader icon={Clock} iconColor="text-cyan-400" iconRgb="6,182,212"
                title="Métriques de cadence" sub="Délais et état du pipeline" />
              <div className="space-y-0">
                {[
                  { label: 'Délai moyen import → décision', value: secondary.avgDecisionDays !== null ? `${secondary.avgDecisionDays} jours` : '—', sub: `sur ${summary.replied} projet${summary.replied !== 1 ? 's' : ''} clôturés`, rgb: '6,182,212' },
                  { label: 'Projets en attente de clôture', value: String(secondary.pending), sub: 'sans issue définie', rgb: '245,158,11' },
                  { label: 'Projets abandonnés', value: String(secondary.abandoned), sub: 'à analyser', rgb: '239,68,68' },
                ].map(({ label, value, sub, rgb }, i, arr) => (
                  <div key={label} className="flex items-center justify-between py-4"
                    style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <div>
                      <p className="text-xs text-white/40">{label}</p>
                      <p className="text-2xl font-extrabold mt-1 tabular-nums" style={{ color: `rgb(${rgb})`, textShadow: `0 0 15px rgba(${rgb},0.4)` }}>{value}</p>
                    </div>
                    <p className="text-[10px] text-white/22 text-right">{sub}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>

        {/* ── [Q] Auto Insights ───────────────────────────────────────────── */}
        {insights.length > 0 && (
          <div className="relative overflow-hidden rounded-2xl p-5"
            style={{ background: 'rgba(8,8,28,0.72)', backdropFilter: 'blur(24px)', border: '1px solid rgba(245,158,11,0.14)', boxShadow: '0 0 40px rgba(245,158,11,0.04), 0 8px 32px rgba(0,0,0,0.4)' }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 40% 60% at 5% 50%, rgba(245,158,11,0.05) 0%, transparent 60%)' }} />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.22)' }}>
                  <Lightbulb size={14} className="text-amber-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white/90">Insights automatiques</h2>
                  <p className="text-[10px] text-white/35">{insights.length} observation{insights.length > 1 ? 's' : ''} générée{insights.length > 1 ? 's' : ''} depuis vos données</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {insights.map((ins, i) => (
                  <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl"
                    style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.10)' }}>
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: '#fbbf24', boxShadow: '0 0 6px rgba(251,191,36,0.7)' }} />
                    <p className="text-[12px] text-white/58 leading-relaxed">{ins}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Empty state — no projects ────────────────────────────────────── */}
        {summary.total === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(124,58,237,0.10)', border: '1px solid rgba(124,58,237,0.20)' }}>
              <Layers size={26} className="text-violet-400/60" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-white/50 mb-1">Aucune donnée disponible</h3>
              <p className="text-sm text-white/25 max-w-xs">Importez votre premier DCE pour voir les métriques se remplir</p>
            </div>
            <Link href="/projects/new"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-px"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.30)', color: '#c4b5fd' }}>
              Nouveau projet <ArrowRight size={14} />
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}

