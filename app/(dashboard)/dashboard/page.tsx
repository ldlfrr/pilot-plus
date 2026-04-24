import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DonutChart } from '@/components/dashboard/DonutChart'
import { MonthlyBarChart } from '@/components/dashboard/MonthlyBarChart'
import { Clock, Lightbulb, Users } from 'lucide-react'
import type { Project } from '@/types'
import { cn } from '@/lib/utils/cn'

export const metadata: Metadata = { title: 'Dashboard — PILOT+' }

async function getDashboardData(userId: string) {
  const supabase = await createClient()

  const [projectsRes, scoresRes] = await Promise.all([
    supabase.from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('project_scores').select('*').in(
      'project_id',
      (await supabase.from('projects').select('id').eq('user_id', userId)).data?.map(p => p.id) ?? []
    ),
  ])

  const projects: Project[] = projectsRes.data ?? []
  const scores = scoresRes.data ?? []

  const total     = projects.length
  const go        = scores.filter(s => s.verdict === 'GO').length
  const nogo      = scores.filter(s => s.verdict === 'NO_GO').length
  const aEtudier  = scores.filter(s => s.verdict === 'A_ETUDIER').length
  const enCours   = projects.filter(p => p.status !== 'scored').length
  const tauxTransfo = total > 0 ? Math.round((go / total) * 100) : 0
  const tauxGo    = scores.length > 0 ? Math.round((go / scores.length) * 100) : 0

  // Monthly data (last 6 months)
  const monthly: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = d.toLocaleDateString('fr-FR', { month: 'short' })
    monthly[key] = 0
  }
  projects.forEach(p => {
    const key = new Date(p.created_at).toLocaleDateString('fr-FR', { month: 'short' })
    if (key in monthly) monthly[key]++
  })
  const monthlyData = Object.entries(monthly).map(([month, count]) => ({ month, count }))

  // Top clients
  const clientCounts: Record<string, number> = {}
  projects.forEach(p => { clientCounts[p.client] = (clientCounts[p.client] ?? 0) + 1 })
  const topClients = Object.entries(clientCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([client, count]) => ({ client, count }))

  // Upcoming deadlines (next 30 days, not scored)
  const now = Date.now()
  const upcoming = projects
    .filter(p => p.offer_deadline && p.status !== 'scored')
    .map(p => ({ ...p, daysLeft: Math.ceil((new Date(p.offer_deadline!).getTime() - now) / 86400000) }))
    .filter(p => p.daysLeft >= 0 && p.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5)

  // Quick insights
  const insights: string[] = []
  if (tauxGo > 50) insights.push(`Votre taux de Go est de ${tauxGo}% — au-dessus de la moyenne`)
  if (topClients[0]) insights.push(`${topClients[0].client} représente votre client le plus actif`)
  const urgent = upcoming.filter(p => p.daysLeft <= 7).length
  if (urgent > 0) insights.push(`${urgent} projet${urgent > 1 ? 's' : ''} nécessite${urgent > 1 ? 'nt' : ''} une action avant 7 jours`)
  if (insights.length === 0) insights.push('Créez votre premier projet pour commencer')

  return { stats: { total, go, nogo, aEtudier, enCours, tauxTransfo, tauxGo }, monthlyData, topClients, upcoming, insights }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { stats, monthlyData, topClients, upcoming, insights } = await getDashboardData(user.id)

  const donutData = [
    { name: 'Go',       value: stats.go,       color: '#22c55e' },
    { name: 'A analyser', value: stats.aEtudier, color: '#f59e0b' },
    { name: 'No Go',    value: stats.nogo,      color: '#ef4444' },
  ].filter(d => d.value > 0)

  const kpis = [
    { label: 'TOTAL PROJETS', value: stats.total, color: 'text-white',       bg: 'bg-[var(--bg-card)]' },
    { label: 'GO',            value: stats.go,    color: 'text-emerald-400', bg: 'bg-emerald-900/30 border-emerald-800/40' },
    { label: 'NO GO',         value: stats.nogo,  color: 'text-red-400',     bg: 'bg-red-900/30 border-red-800/40' },
    { label: 'EN COURS',      value: stats.enCours, color: 'text-amber-400', bg: 'bg-amber-900/20 border-amber-800/30' },
    { label: 'TAUX TRANSFO.', value: `${stats.tauxTransfo}%`, color: 'text-blue-400', bg: 'bg-[var(--bg-card)]', sub: stats.tauxTransfo > 0 ? `↑ +${Math.min(stats.tauxTransfo, 5)}%` : undefined },
    { label: 'TAUX GO',       value: `${stats.tauxGo}%`,      color: 'text-purple-400', bg: 'bg-purple-900/20 border-purple-800/30' },
  ]

  return (
    <div className="flex flex-col min-h-0 animate-fade-in">
      <div className="h-14 border-b border-white/5 bg-[var(--bg-surface)] flex items-center px-4 md:px-6 flex-shrink-0">
        <div>
          <h1 className="text-base font-semibold text-white">Dashboard</h1>
          <p className="text-xs text-white/40">Vue d&apos;ensemble de votre activité commerciale</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {kpis.map(({ label, value, color, bg, sub }) => (
            <div key={label} className={cn('rounded-xl border border-white/8 p-4', bg)}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">{label}</p>
              <p className={cn('text-3xl font-extrabold tabular-nums', color)}>{value}</p>
              {sub && <p className="text-xs text-emerald-400 mt-1">{sub}</p>}
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Donut */}
          <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-5">Répartition Go / No Go</h2>
            {donutData.length > 0 ? (
              <DonutChart data={donutData} />
            ) : (
              <div className="flex items-center justify-center h-40 text-white/30 text-sm">
                Aucun projet scoré
              </div>
            )}
          </div>

          {/* Monthly bar */}
          <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-5">Projets par mois</h2>
            <MonthlyBarChart data={monthlyData} />
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Top clients */}
          <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users size={15} className="text-blue-400" />
              <h2 className="text-sm font-semibold text-white">Top clients</h2>
            </div>
            {topClients.length > 0 ? (
              <ol className="space-y-2.5">
                {topClients.map(({ client, count }, i) => (
                  <li key={client} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white/30 w-4 tabular-nums">{i + 1}</span>
                    <span className="flex-1 text-sm text-white/80 truncate">{client}</span>
                    <span className="text-sm font-bold text-blue-400 tabular-nums">{count}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-white/30 text-sm text-center py-4">Aucun projet</p>
            )}
          </div>

          {/* Upcoming deadlines */}
          <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={15} className="text-amber-400" />
              <h2 className="text-sm font-semibold text-white">Échéances proches</h2>
            </div>
            {upcoming.length > 0 ? (
              <div className="space-y-3">
                {upcoming.map(p => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center gap-3 group"
                  >
                    <div className={cn(
                      'w-2 h-2 rounded-full flex-shrink-0',
                      p.daysLeft <= 7 ? 'bg-red-400' : p.daysLeft <= 14 ? 'bg-amber-400' : 'bg-emerald-400'
                    )} />
                    <div className="min-w-0">
                      <p className="text-sm text-white/80 truncate group-hover:text-blue-300 transition-colors">{p.name}</p>
                      <p className="text-xs text-white/40">
                        {new Date(p.offer_deadline!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} · {p.daysLeft} jour{p.daysLeft !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-white/30 text-sm text-center py-4">Aucune échéance proche</p>
            )}
          </div>

          {/* Quick insights */}
          <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb size={15} className="text-amber-400" />
              <h2 className="text-sm font-semibold text-white">Quick Insights</h2>
            </div>
            <ul className="space-y-3">
              {insights.map((ins, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
                  <span className="text-sm text-white/60 leading-relaxed">{ins}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  )
}
