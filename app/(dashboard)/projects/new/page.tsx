import { Metadata } from 'next'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { FolderPlus, Brain, Sparkles, FileText, Cpu } from 'lucide-react'

export const metadata: Metadata = { title: 'Nouveau projet — PILOT+' }

export default function NewProjectPage() {
  return (
    <div className="flex flex-col min-h-full animate-fade-in" style={{ background: 'var(--bg-base)' }}>

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-6 md:px-8 py-4 flex items-center gap-4"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.055)',
          background: 'rgba(8,14,34,0.80)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(59,130,246,0.14)', border: '1px solid rgba(59,130,246,0.24)' }}
        >
          <FolderPlus size={16} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white leading-none">Nouveau projet</h1>
          <p className="text-[11px] text-white/35 mt-0.5">Créez un dossier et lancez l&apos;analyse IA</p>
        </div>
        <div className="ml-auto hidden sm:flex items-center gap-2">
          {[
            { icon: Brain,    label: 'Analyse IA',   color: 'text-blue-400',    bg: 'rgba(59,130,246,0.10)',  border: 'rgba(59,130,246,0.18)' },
            { icon: Sparkles, label: 'Scoring',       color: 'text-violet-400',  bg: 'rgba(139,92,246,0.10)', border: 'rgba(139,92,246,0.18)' },
            { icon: FileText, label: 'Mémoire tech.', color: 'text-emerald-400', bg: 'rgba(16,185,129,0.09)', border: 'rgba(16,185,129,0.18)' },
          ].map(({ icon: Icon, label, color, bg, border }) => (
            <span
              key={label}
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold ${color}`}
              style={{ background: bg, border: `1px solid ${border}` }}
            >
              <Icon size={9} />{label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-lg">

          {/* Form card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(11,21,48,0.95) 0%, rgba(8,14,34,0.98) 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            {/* Card header */}
            <div
              className="px-6 py-5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.20)' }}
                >
                  <Cpu size={14} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Informations du projet</p>
                  <p className="text-[11px] text-white/35 mt-0.5">
                    Complétez les champs requis pour activer l&apos;analyse IA
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="px-6 py-6">
              <ProjectForm mode="create" />
            </div>
          </div>

          {/* Tip */}
          <div
            className="mt-4 flex items-start gap-2.5 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.12)' }}
          >
            <Sparkles size={12} className="text-blue-400/50 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.28)' }}>
              <strong style={{ color: 'rgba(255,255,255,0.45)' }}>Conseil IA :</strong>{' '}
              Plus le nom du projet et les informations sont précis, meilleure sera la qualité
              de l&apos;analyse et du scoring Go/No Go.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
