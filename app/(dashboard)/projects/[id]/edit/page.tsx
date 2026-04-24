import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { ProjectForm } from '@/components/projects/ProjectForm'

export const metadata: Metadata = { title: 'Modifier le projet' }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditProjectPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) notFound()

  return (
    <div className="flex flex-col min-h-0">
      <Header title="Modifier le projet" />

      <div className="flex-1 p-6 animate-fade-in">
        <div className="max-w-xl mx-auto bg-[var(--bg-card)] rounded-xl border border-white/8 p-6">
          <h2 className="font-semibold text-white mb-1">{project.name}</h2>
          <p className="text-sm text-white/40 mb-5">Modifiez les informations du projet</p>
          <ProjectForm mode="edit" projectId={id} initialData={project} />
        </div>
      </div>
    </div>
  )
}
