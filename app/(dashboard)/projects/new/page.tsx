import { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { ProjectForm } from '@/components/projects/ProjectForm'

export const metadata: Metadata = { title: 'Nouveau projet' }

export default function NewProjectPage() {
  return (
    <div className="flex flex-col min-h-0">
      <Header title="Nouveau projet" description="Créez un nouveau dossier DCE" />

      <div className="flex-1 p-6 animate-fade-in">
        <div className="max-w-xl mx-auto bg-[var(--bg-card)] rounded-xl border border-white/8 p-6">
          <h2 className="font-semibold text-white mb-1">Informations du projet</h2>
          <p className="text-sm text-white/40 mb-5">
            Renseignez les informations de base. Vous pourrez uploader les documents ensuite.
          </p>
          <ProjectForm mode="create" />
        </div>
      </div>
    </div>
  )
}
