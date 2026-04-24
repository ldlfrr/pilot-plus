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

  let query = supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
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

  const enriched: ProjectWithScore[] = allProjects.map(p => ({
    ...p,
    score: scoreMap.get(p.id) ?? null,
    file_count: fileCounts.get(p.id) ?? 0,
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
      <div className="h-14 border-b border-white/5 bg-[var(--bg-surface)] flex items-center justify-between px-6 flex-shrink-0">
        <div>
          <h1 className="text-base font-semibold text-white">Mes projets</h1>
          <p className="text-xs text-white/40 mt-0.5">{filtered.length} projet{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus size={14} />
          Nouveau projet
        </Link>
      </div>

      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FILTERS.map(({ value, label }) => (
            <Link
              key={value}
              href={value === 'all' ? '/projects' : `/projects?status=${value}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                (status ?? 'all') === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="bg-[var(--bg-card)] border border-dashed border-white/10 rounded-xl p-12 text-center">
            <FolderOpen size={32} className="mx-auto text-white/20 mb-3" />
            <p className="text-white/60 font-medium">Aucun projet trouvé</p>
            <p className="text-sm text-white/30 mt-1 mb-5">
              {q ? `Aucun résultat pour "${q}"` : 'Créez votre premier projet DCE'}
            </p>
            <Link href="/projects/new" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-500 transition-colors">
              <Plus size={14} />Créer un projet
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
