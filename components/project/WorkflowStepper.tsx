'use client'

import { useState } from 'react'
import { CheckCircle, ChevronRight, Loader2, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { PipelineStage } from '@/types'

interface Step {
  id:       PipelineStage
  label:    string
  shortLabel: string
  color:    string
  // who can advance FROM this step
  roles:    ('owner' | 'editor' | 'avant_vente' | 'viewer')[]
  /** CTA label shown on the advance button at this stage */
  ctaLabel: string
}

const STEPS: Step[] = [
  { id: 'veille',    label: 'Veille',        shortLabel: 'Veille',    color: '#60a5fa', roles: ['owner','editor'],                ctaLabel: 'Lancer l\'analyse' },
  { id: 'analyse',   label: 'Analyse',       shortLabel: 'Analyse',   color: '#a78bfa', roles: ['owner','editor'],                ctaLabel: 'Valider l\'analyse' },
  { id: 'go',        label: 'Go / No Go',    shortLabel: 'Go/No-Go',  color: '#34d399', roles: ['owner','editor'],                ctaLabel: 'GO → Envoyer aux AV' },
  { id: 'brief',     label: 'Brief AV',      shortLabel: 'Brief AV',  color: '#fb923c', roles: ['owner','editor','avant_vente'],  ctaLabel: 'Brief transmis — AV commence' },
  { id: 'chiffrage', label: 'Chiffrage AV',  shortLabel: 'Chiffrage', color: '#f472b6', roles: ['owner','editor','avant_vente'],  ctaLabel: 'Chiffrage déposé ✓' },
  { id: 'relecture', label: 'Relecture',     shortLabel: 'Relecture', color: '#facc15', roles: ['owner','editor'],                ctaLabel: 'Relecture validée' },
  { id: 'remis',     label: 'Remis',         shortLabel: 'Remis',     color: '#4ade80', roles: ['owner','editor'],                ctaLabel: 'Dossier remis ✓' },
  { id: 'cloture',   label: 'Clôturé',       shortLabel: 'Clôturé',   color: '#94a3b8', roles: [],                                ctaLabel: '' },
]

const STAGE_INDEX: Record<PipelineStage, number> = Object.fromEntries(
  STEPS.map((s, i) => [s.id, i])
) as Record<PipelineStage, number>

interface WorkflowStepperProps {
  projectId:   string
  stage:       PipelineStage | undefined
  currentRole: 'owner' | 'editor' | 'viewer' | 'avant_vente'
  onStageChange?: (stage: PipelineStage) => void
}

export function WorkflowStepper({ projectId, stage, currentRole, onStageChange }: WorkflowStepperProps) {
  const currentIndex = stage ? STAGE_INDEX[stage] ?? 0 : 0
  const currentStep  = STEPS[currentIndex]
  const nextStep     = STEPS[currentIndex + 1] ?? null

  const [advancing, setAdvancing] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const canAdvance = nextStep && currentStep.roles.includes(currentRole as never)

  async function handleAdvance() {
    if (!nextStep || !canAdvance) return
    setAdvancing(true); setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/pipeline`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ pipeline_stage: nextStep.id }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { error?: string }).error ?? 'Erreur')
      }
      onStageChange?.(nextStep.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setAdvancing(false)
    }
  }

  return (
    <div className="bg-[var(--bg-card)] border border-white/6 rounded-xl px-4 py-3 mb-4">
      {/* Step track */}
      <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide mb-3">
        {STEPS.map((step, idx) => {
          const done    = idx < currentIndex
          const active  = idx === currentIndex
          const future  = idx > currentIndex

          return (
            <div key={step.id} className="flex items-center flex-shrink-0">
              {/* Step node */}
              <div className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all',
                done   && 'text-white/35',
                active && 'text-white',
                future && 'text-white/20',
              )}>
                {/* Circle */}
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                  done   && 'border-white/20 bg-white/10',
                  active && 'border-current bg-current/20',
                  future && 'border-white/10 bg-transparent',
                )}
                style={active ? { borderColor: step.color, color: step.color } : undefined}
                >
                  {done
                    ? <CheckCircle size={10} className="text-white/30" />
                    : <span className="text-[9px] font-bold leading-none"
                        style={active ? { color: step.color } : undefined}>
                        {idx + 1}
                      </span>
                  }
                </div>
                <span className="hidden sm:block" style={active ? { color: step.color } : undefined}>
                  {step.shortLabel}
                </span>
              </div>

              {/* Arrow between steps */}
              {idx < STEPS.length - 1 && (
                <ChevronRight size={12} className={cn(
                  'flex-shrink-0 mx-0.5',
                  idx < currentIndex ? 'text-white/20' : 'text-white/8'
                )} />
              )}
            </div>
          )
        })}
      </div>

      {/* Current stage label + advance button */}
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <p className="text-[11px] text-white/30 font-medium uppercase tracking-wider leading-none mb-0.5">Étape actuelle</p>
          <p className="text-sm font-bold" style={{ color: currentStep.color }}>{currentStep.label}</p>
        </div>

        {canAdvance && nextStep && (
          <button
            onClick={handleAdvance}
            disabled={advancing}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: `${nextStep.color}18`,
              borderColor:     `${nextStep.color}40`,
              color:           nextStep.color,
            }}
          >
            {advancing
              ? <Loader2 size={12} className="animate-spin" />
              : <ArrowRight size={12} />}
            {currentStep.ctaLabel}
          </button>
        )}

        {!canAdvance && currentStep.id !== 'cloture' && (
          <p className="ml-auto text-xs text-white/20 italic">
            {currentRole === 'viewer'
              ? 'Lecture seule — avancement non autorisé'
              : currentRole === 'avant_vente' && !currentStep.roles.includes('avant_vente' as never)
              ? 'En attente du commercial'
              : null}
          </p>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}
    </div>
  )
}
