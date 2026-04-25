import { Metadata } from 'next'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { FolderPlus, Sparkles, FileText, Brain } from 'lucide-react'

export const metadata: Metadata = { title: 'Nouveau projet — PILOT+' }

export default function NewProjectPage() {
  return (
    <div className="flex flex-col min-h-full bg-[var(--bg-base)] animate-fade-in">

      {/* ── Hero header ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-white/5"
        style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.10) 0%, rgba(109,40,217,0.08) 60%, transparent 100%)' }}>
        <div className="px-6 md:px-10 py-8 md:py-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/25 flex items-center justify-center flex-shrink-0">
              <FolderPlus size={18} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Nouveau projet</h1>
              <p className="text-xs text-white/40 mt-0.5">Créez un dossier DCE et lancez l&apos;analyse IA</p>
            </div>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {[
              { icon: Brain, label: 'Analyse IA automatique', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
              { icon: Sparkles, label: 'Scoring Go/No Go', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
              { icon: FileText, label: 'Mémoire technique IA', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
            ].map(({ icon: Icon, label, color }) => (
              <span key={label} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${color}`}>
                <Icon size={10} />{label}
              </span>
            ))}
          </div>
        </div>

        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-blue-600/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full bg-violet-600/5 blur-3xl pointer-events-none" />
      </div>

      {/* ── Form card ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-start justify-center px-4 py-8 md:py-10">
        <div className="w-full max-w-xl">
          <div className="bg-[var(--bg-card)] border border-white/8 rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/30">
            <div className="mb-6 pb-4 border-b border-white/5">
              <h2 className="text-base font-bold text-white">Informations du projet</h2>
              <p className="text-xs text-white/35 mt-1">
                Renseignez les informations de base. Vous pourrez uploader les documents ensuite et lancer l&apos;analyse IA.
              </p>
            </div>
            <ProjectForm mode="create" />
          </div>

          {/* Helper tip */}
          <div className="mt-4 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-white/2 border border-white/5">
            <Sparkles size={13} className="text-blue-400/60 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-white/30 leading-relaxed">
              <strong className="text-white/45">Conseil :</strong> Plus le nom du projet et les informations sont précis, meilleure sera la qualité de l&apos;analyse IA et du scoring Go/No Go.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
