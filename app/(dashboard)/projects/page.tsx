import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { Plus, FolderOpen } from 'lucide-react'
import type { ProjectWithScore } from '@/types'

export const metadata: Metadata = { title: 'Mes projets — PILOT+' }

const STATUS_FILTERS = [
  { value: 'all',      label: 'Tous' },
  { value: 'draft',    label: 'Brouillons' },
  { value: 'analyzed', label: 'Analysés' },
  { value: 'scored',   label: 'Scorés' },
  { value: 'closed',   label: 'Clôturés' },
] as const

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string }>
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  const { status, q } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch project IDs where user is a member (not owner)
  const { data: memberRows } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', user.id)
  const memberProjectIds = (memberRows ?? []).map(r => r.project_id as string)

  // Build query: owned projects OR projects where user is a member
  let query = memberProjectIds.length > 0
    ? supabase.from('projects').select('*')
        .or(`user_id.eq.${user.id},id.in.(${memberProjectIds.join(',')})`)
        .order('created_at', { ascending: false })
    : supabase.from('projects').select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

  if (status === 'closed') {
    query = query.neq('outcome', 'pending')
  } else if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: projects } = await query
  const allProjects = projects ?? []

  // Fetch scores for all projects
  const scoresRes = await supabase
    .from('project_scores')
    .select('*')
    .in('project_id', allProjects.map(p => p.id))
  const scoreMap = new Map((scoresRes.data ?? []).map(s => [s.project_id, s]))

  // File counts
  const fileCountsRes = await supabase
    .from('project_files')
    .select('project_id')
    .in('project_id', allProjects.map(p => p.id))
  const fileCounts = new Map<string, number>()
  for (const f of fileCountsRes.data ?? []) {
    fileCounts.set(f.project_id, (fileCounts.get(f.project_id) ?? 0) + 1)
  }

  // Member counts
  const memberCountsRes = await supabase
    .from('project_members')
    .select('project_id')
    .in('project_id', allProjects.map(p => p.id))
  const memberCounts = new Map<string, number>()
  for (const m of memberCountsRes.data ?? []) {
    memberCounts.set(m.project_id, (memberCounts.get(m.project_id) ?? 0) + 1)
  }

  const enriched: ProjectWithScore[] = allProjects.map(p => ({
    ...p,
    score:        scoreMap.get(p.id) ?? null,
    file_count:   fileCounts.get(p.id) ?? 0,
    member_count: (memberCounts.get(p.id) ?? 0) + 1, // +1 for the owner
  }))

  const filtered = q
    ? enriched.filter(p =>
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.client.toLowerCase().includes(q.toLowerCase())
      )
    : enriched

  return (
    <div className="flex flex-col min-h-0 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 flex-shrink-0 h-14"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.055)', background: 'rgba(8,14,34,0.80)', backdropFilter: 'blur(16px)' }}>
        <div>
          <h1 className="text-base font-semibold text-white">Mes projets</h1>
          <p className="text-xs text-white/35 mt-0.5">{filtered.length} projet{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/projects/new" className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white">
          <Plus size={14} />
          Nouveau projet
        </Link>
      </div>

      <div className="flex-1 p-4 md:p-6 space-y-4 overflow-y-auto">
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FILTERS.map(({ value, label }) => {
            const isActive = (status ?? 'all') === value
            return (
              <Link
                key={value}
                href={value === 'all' ? '/projects' : `/projects?status=${value}`}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={isActive ? {
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(59,130,246,0.12))',
                  border: '1px solid rgba(59,130,246,0.35)',
                  color: '#93c5fd',
                  boxShadow: '0 0 12px rgba(59,130,246,0.12)',
                } : {
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.45)',
                }}
              >
                {label}
              </Link>
            )
          })}
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((project, i) => (
              <div key={project.id} style={{ animationDelay: `${i * 35}ms` }} className="animate-fade-in">
                <ProjectCard project={project} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl p-14 text-center"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.10)' }}>
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
              style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <FolderOpen size={24} className="text-blue-400/50" />
            </div>
            <p className="text-white/65 font-semibold mb-1">Aucun projet trouvé</p>
            <p className="text-sm text-white/30 mb-6">
              {q ? `Aucun résultat pour « ${q} »` : 'Créez votre premier projet DCE pour démarrer'}
            </p>
            <Link href="/projects/new" className="btn-primary inline-flex">
              <Plus size={14} />Créer un projet
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
