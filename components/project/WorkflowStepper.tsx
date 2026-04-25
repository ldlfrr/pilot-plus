'use client'

import { useState } from 'react'
import { Check, Loader2, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { PipelineStage } from '@/types'

interface Step {
  id:         PipelineStage
  label:      string
  shortLabel: string
  color:      string
  roles:      ('owner' | 'editor' | 'avant_vente' | 'viewer')[]
  ctaLabel:   string
  emoji:      string
}

const STEPS: Step[] = [
  {
    id: 'prospection',
    label: 'Prospection',
    shortLabel: 'Prospect',
    color: '#60a5fa',
    roles: ['owner', 'editor'],
    ctaLabel: 'Opportunité qualifiée — scorer',
    emoji: '🔍',
  },
  {
    id: 'qualification',
    label: 'Qualification',
    shortLabel: 'Qualif.',
    color: '#a78bfa',
    roles: ['owner', 'editor'],
    ctaLabel: 'GO décidé — présenter en interne',
    emoji: '📊',
  },
  {
    id: 'vente_interne',
    label: 'Vente interne',
    shortLabel: 'Vente int.',
    color: '#34d399',
    roles: ['owner', 'editor'],
    ctaLabel: 'Direction approuve — mobiliser AV',
    emoji: '🏢',
  },
  {
    id: 'avant_vente',
    label: 'Avant-vente',
    shortLabel: 'Avant-vente',
    color: '#fb923c',
    roles: ['owner', 'editor', 'avant_vente'],
    ctaLabel: 'Offre prête — envoyer au client',
    emoji: '⚙️',
  },
  {
    id: 'echanges_client',
    label: 'Échanges client',
    shortLabel: 'Échanges',
    color: '#f472b6',
    roles: ['owner', 'editor'],
    ctaLabel: 'Accord client — revue juridique',
    emoji: '💬',
  },
  {
    id: 'juridique',
    label: 'Analyse juridique',
    shortLabel: 'Juridique',
    color: '#facc15',
    roles: ['owner', 'editor'],
    ctaLabel: 'Validé — envoyer pour signature',
    emoji: '⚖️',
  },
  {
    id: 'signature',
    label: 'Signature',
    shortLabel: 'Signature',
    color: '#4ade80',
    roles: ['owner', 'editor'],
    ctaLabel: 'Signé — clôturer le projet',
    emoji: '✍️',
  },
  {
    id: 'cloture',
    label: 'Clôturé',
    shortLabel: 'Clôturé',
    color: '#94a3b8',
    roles: [],
    ctaLabel: '',
    emoji: '🏆',
  },
]

const STAGE_INDEX: Record<PipelineStage, number> = Object.fromEntries(
  STEPS.map((s, i) => [s.id, i])
) as Record<PipelineStage, number>

interface WorkflowStepperProps {
  projectId:    string
  stage:        PipelineStage | undefined
  currentRole:  'owner' | 'editor' | 'viewer' | 'avant_vente'
  onStageChange?: (stage: PipelineStage) => void
}

export function WorkflowStepper({ projectId, stage, currentRole, onStageChange }: WorkflowStepperProps) {
  const currentIndex = stage ? (STAGE_INDEX[stage] ?? 0) : 0
  const currentStep  = STEPS[currentIndex]
  const nextStep     = STEPS[currentIndex + 1] ?? null
  const progressPct  = Math.round((currentIndex / (STEPS.length - 1)) * 100)

  const [advancing, setAdvancing] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const canAdvance = !!(nextStep && currentStep.roles.includes(currentRole as never))

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
    <div className="bg-[var(--bg-card)] border border-white/6 rounded-xl mb-4 overflow-hidden">

      {/* ── Gradient progress bar ───────────────────────────────────────── */}
      <div className="h-[2px] bg-white/5 relative">
        <div
          className="absolute inset-y-0 left-0 transition-all duration-700 ease-out"
          style={{
            width: `${progressPct}%`,
            background: `linear-gradient(90deg, #60a5fa 0%, ${currentStep.color} 100%)`,
          }}
        />
      </div>

      {/* ── Step track ──────────────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-0 overflow-x-auto scrollbar-hide">
        <div className="flex items-center min-w-0">
          {STEPS.map((step, idx) => {
            const done   = idx < currentIndex
            const active = idx === currentIndex
            const future = idx > currentIndex

            return (
              <div key={step.id} className="flex items-center flex-shrink-0">
                {/* Node + label */}
                <div className="flex items-center gap-1.5 px-1 py-0.5 rounded-md transition-all">
                  {/* Circle */}
                  <div
                    className={cn(
                      'flex items-center justify-center rounded-full flex-shrink-0 transition-all',
                      done   ? 'w-[18px] h-[18px] bg-white/10' : '',
                      active ? 'w-[22px] h-[22px] border-[2px]' : '',
                      future ? 'w-[18px] h-[18px] border border-white/10' : '',
                    )}
                    style={active ? {
                      borderColor: step.color,
                      backgroundColor: `${step.color}22`,
                    } : {}}
                  >
                    {done
                      ? <Check size={10} className="text-white/40" />
                      : <span
                          className="text-[9px] font-bold leading-none"
                          style={{ color: active ? step.color : 'rgba(255,255,255,0.18)' }}
                        >
                          {idx + 1}
                        </span>
                    }
                  </div>

                  {/* Label — always visible for active, hidden on sm for others */}
                  <span
                    className={cn(
                      'text-[11px] font-semibold whitespace-nowrap transition-colors',
                      done   ? 'hidden sm:block text-white/20' : '',
                      active ? 'block' : '',
                      future ? 'hidden sm:block text-white/12' : '',
                    )}
                    style={active ? { color: step.color } : {}}
                  >
                    {step.shortLabel}
                  </span>
                </div>

                {/* Connector line */}
                {idx < STEPS.length - 1 && (
                  <div className={cn(
                    'flex-shrink-0 h-px mx-1',
                    idx < currentIndex ? 'w-4 bg-white/18' : 'w-4 bg-white/6',
                  )} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Bottom bar: current stage info + CTA ────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 mt-2 border-t border-white/5">
        {/* Stage indicator */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="flex-shrink-0 w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: currentStep.color }}
          />
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-white/25 uppercase tracking-widest leading-none">
              Étape {currentIndex + 1}/{STEPS.length - 1 > currentIndex ? STEPS.length - 1 : STEPS.length}
            </p>
            <p className="text-sm font-bold leading-snug mt-0.5 truncate"
               style={{ color: currentStep.color }}>
              {currentStep.emoji} {currentStep.label}
            </p>
          </div>
        </div>

        {/* CTA / status */}
        <div className="flex-shrink-0 ml-4">
          {canAdvance && nextStep && (
            <button
              onClick={handleAdvance}
              disabled={advancing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-125"
              style={{
                backgroundColor: `${nextStep.color}18`,
                borderColor:     `${nextStep.color}45`,
                color:            nextStep.color,
              }}
            >
              {advancing
                ? <Loader2 size={11} className="animate-spin" />
                : <ArrowRight size={11} />}
              <span>{currentStep.ctaLabel}</span>
            </button>
          )}

          {currentStep.id === 'cloture' && (
            <span className="text-xs text-white/25 italic">Pipeline terminé</span>
          )}

          {!canAdvance && currentStep.id !== 'cloture' && (
            <span className="text-[11px] text-white/20 italic">
              {currentRole === 'viewer'
                ? 'Accès lecture seule'
                : currentRole === 'avant_vente' && !currentStep.roles.includes('avant_vente' as never)
                ? 'En attente du commercial'
                : null}
            </span>
          )}
        </div>
      </div>

      {error && (
        <p className="px-4 pb-3 text-xs text-red-400 -mt-1">{error}</p>
      )}
    </div>
  )
}
