'use client'

import { useState } from 'react'
import { FileText, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { CriteriaForm } from './CriteriaForm'
import { CompanyDocImport } from './CompanyDocImport'
import type { CompanyCriteria } from '@/types'

type Mode = 'form' | 'document'

interface SettingsShellProps {
  initialCriteria: CompanyCriteria
  initialMode: Mode
  initialDocName: string | null
}

export function SettingsShell({ initialCriteria, initialMode, initialDocName }: SettingsShellProps) {
  const [activeMode, setActiveMode] = useState<Mode>(initialMode)

  return (
    <div className="space-y-6">

      {/* Mode switcher */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex gap-1.5 shadow-sm">
        <ModeTab
          active={activeMode === 'form'}
          onClick={() => setActiveMode('form')}
          icon={<SlidersHorizontal size={15} />}
          label="Formulaire"
          description="Saisie guidée des critères"
        />
        <ModeTab
          active={activeMode === 'document'}
          onClick={() => setActiveMode('document')}
          icon={<FileText size={15} />}
          label="Importer un document"
          description="PDF ou Word comme base de scoring"
          badge={initialDocName ? 'Actif' : undefined}
        />
      </div>

      {/* Content */}
      <div style={{ display: activeMode === 'form' ? 'block' : 'none' }}>
        <CriteriaForm initialCriteria={initialCriteria} />
      </div>
      <div style={{ display: activeMode === 'document' ? 'block' : 'none' }}>
        <CompanyDocImport initialDocName={initialDocName} />
      </div>

    </div>
  )
}

function ModeTab({
  active,
  onClick,
  icon,
  label,
  description,
  badge,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  description: string
  badge?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left',
        active
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-slate-500 hover:bg-slate-50'
      )}
    >
      <div className={cn(
        'p-1.5 rounded-lg flex-shrink-0',
        active ? 'bg-white/20' : 'bg-slate-100'
      )}>
        <span className={active ? 'text-white' : 'text-slate-500'}>{icon}</span>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-semibold', active ? 'text-white' : 'text-slate-700')}>
            {label}
          </span>
          {badge && (
            <span className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
              active ? 'bg-white/30 text-white' : 'bg-emerald-100 text-emerald-700'
            )}>
              {badge}
            </span>
          )}
        </div>
        <p className={cn('text-xs truncate', active ? 'text-blue-100' : 'text-slate-400')}>
          {description}
        </p>
      </div>
    </button>
  )
}
