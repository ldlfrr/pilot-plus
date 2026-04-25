'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import {
  Loader2, Sparkles, FileText, ChevronDown, ChevronRight,
  Copy, Check, Download, AlertCircle, BookOpen, Target,
  ShieldAlert, Star, Layers, Clock,
} from 'lucide-react'

interface PlanSection {
  numero: string
  titre: string
  objectif: string
  contenu_cle: string[]
  arguments: string[]
  longueur_suggeree: string
  pieces_liees?: string[]
}

interface ResponsePlan {
  titre_propose: string
  accroche: string
  sections: PlanSection[]
  points_forts_a_valoriser: string[]
  risques_a_adresser: string[]
  criteres_selection_cibles: string[]
  conclusion_suggeree: string
  estimation_pages: string
}

interface ResponsePlanTabProps {
  projectId: string
  hasAnalysis: boolean
}

function SectionCard({ section, defaultOpen = false }: { section: PlanSection; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/3 transition-colors"
      >
        <span className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
          {section.numero}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white/90">{section.titre}</p>
          <p className="text-xs text-white/35 mt-0.5">{section.objectif}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] text-white/30 flex items-center gap-1">
            <Clock size={10} />{section.longueur_suggeree}
          </span>
          {open ? <ChevronDown size={14} className="text-white/30" /> : <ChevronRight size={14} className="text-white/30" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
          {/* Contenu clé */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Points à traiter</p>
            <ul className="space-y-1.5">
              {section.contenu_cle.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 flex-shrink-0 mt-1.5" />
                  {c}
                </li>
              ))}
            </ul>
          </div>

          {/* Arguments différenciants */}
          {section.arguments.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/50 mb-2">Arguments différenciants</p>
              <ul className="space-y-1.5">
                {section.arguments.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-emerald-400/80">
                    <Star size={10} className="flex-shrink-0 mt-1 text-emerald-500/60" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pièces liées */}
          {section.pieces_liees && section.pieces_liees.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {section.pieces_liees.map((p, i) => (
                <span key={i} className="text-[10px] px-2 py-1 rounded-md bg-white/5 border border-white/8 text-white/40">
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ResponsePlanTab({ projectId, hasAnalysis }: ResponsePlanTabProps) {
  const [plan, setPlan]       = useState<ResponsePlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [copied, setCopied]   = useState(false)

  async function generate() {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/response-plan`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur génération')
      setPlan(data.plan)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally { setLoading(false) }
  }

  async function copyAsText() {
    if (!plan) return
    const lines: string[] = [
      `# ${plan.titre_propose}`,
      ``,
      `## Introduction`,
      plan.accroche,
      ``,
      ...plan.sections.flatMap(s => [
        `## ${s.numero}. ${s.titre}`,
        `_${s.objectif}_`,
        ``,
        `**Points à traiter :**`,
        ...s.contenu_cle.map(c => `- ${c}`),
        ``,
        `**Arguments :**`,
        ...s.arguments.map(a => `- ${a}`),
        ``,
      ]),
      `## Points forts à valoriser`,
      ...plan.points_forts_a_valoriser.map(p => `- ${p}`),
      ``,
      `## Risques à adresser`,
      ...plan.risques_a_adresser.map(r => `- ${r}`),
      ``,
      `## Conclusion`,
      plan.conclusion_suggeree,
    ]
    await navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!hasAnalysis) {
    return (
      <div className="max-w-md mx-auto mt-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
          <BookOpen size={22} className="text-white/25" />
        </div>
        <p className="text-white/50 text-sm mb-1">Analyse IA requise</p>
        <p className="text-white/30 text-xs">Lancez d&apos;abord l&apos;analyse IA du projet pour générer le plan de réponse.</p>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="max-w-lg mx-auto mt-10">
        <div className="bg-[var(--bg-card)] border border-white/8 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-5">
            <FileText size={22} className="text-blue-400" />
          </div>
          <h3 className="text-white font-bold text-base mb-2">Plan de mémoire technique</h3>
          <p className="text-white/45 text-sm mb-6 leading-relaxed">
            Générez automatiquement un plan détaillé de votre mémoire technique :
            sections à rédiger, arguments clés, points forts à valoriser et risques à désamorcer.
          </p>
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {['Sections détaillées', 'Arguments IA', 'Points différenciants', 'Risques identifiés'].map(f => (
              <span key={f} className="text-xs bg-blue-500/8 border border-blue-500/15 text-blue-400/80 px-2.5 py-1 rounded-full">
                {f}
              </span>
            ))}
          </div>
          {error && (
            <div className="mb-4 flex items-center gap-2 text-sm text-red-400 bg-red-500/8 border border-red-500/15 rounded-xl px-3 py-2.5 text-left">
              <AlertCircle size={14} />{error}
            </div>
          )}
          <button
            onClick={generate}
            disabled={loading}
            className="inline-flex items-center gap-2.5 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? 'Génération en cours…' : 'Générer le plan de réponse'}
          </button>
          {loading && <p className="text-xs text-white/30 mt-3">Claude analyse le DCE et prépare votre plan (~15s)</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-3xl animate-fade-in">

      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/15 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400/60 mb-1">Plan de mémoire technique</p>
            <h2 className="text-base font-bold text-white">{plan.titre_propose}</h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={copyAsText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white text-xs font-medium transition-colors"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {copied ? 'Copié !' : 'Copier'}
            </button>
            <button
              onClick={generate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white text-xs font-medium transition-colors"
            >
              <Sparkles size={12} />Régénérer
            </button>
          </div>
        </div>
        <p className="text-sm text-white/55 italic leading-relaxed border-l-2 border-blue-500/30 pl-3">
          &ldquo;{plan.accroche}&rdquo;
        </p>
        <div className="mt-3 flex items-center gap-4 text-xs text-white/35">
          <span className="flex items-center gap-1"><Layers size={10} />{plan.sections.length} sections</span>
          <span className="flex items-center gap-1"><Clock size={10} />{plan.estimation_pages}</span>
        </div>
      </div>

      {/* Sections */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Plan détaillé</p>
        <div className="space-y-2">
          {plan.sections.map((s, i) => (
            <SectionCard key={i} section={s} defaultOpen={i === 0} />
          ))}
        </div>
      </div>

      {/* Points forts + Risques + Critères */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[var(--bg-card)] border border-emerald-500/15 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star size={13} className="text-emerald-400" />
            <p className="text-xs font-bold text-emerald-400/80 uppercase tracking-wider">Points forts à valoriser</p>
          </div>
          <ul className="space-y-2">
            {plan.points_forts_a_valoriser.map((p, i) => (
              <li key={i} className="text-sm text-white/60 flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 flex-shrink-0 mt-1.5" />{p}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[var(--bg-card)] border border-amber-500/15 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert size={13} className="text-amber-400" />
            <p className="text-xs font-bold text-amber-400/80 uppercase tracking-wider">Risques à désamorcer</p>
          </div>
          <ul className="space-y-2">
            {plan.risques_a_adresser.map((r, i) => (
              <li key={i} className="text-sm text-white/60 flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50 flex-shrink-0 mt-1.5" />{r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Critères ciblés */}
      {plan.criteres_selection_cibles.length > 0 && (
        <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target size={13} className="text-blue-400" />
            <p className="text-xs font-bold text-white/30 uppercase tracking-wider">Critères de sélection ciblés</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {plan.criteres_selection_cibles.map((c, i) => (
              <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400/80">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Conclusion */}
      <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Download size={13} className="text-white/40" />
          <p className="text-xs font-bold text-white/30 uppercase tracking-wider">Suggestion de conclusion</p>
        </div>
        <p className="text-sm text-white/60 italic leading-relaxed">&ldquo;{plan.conclusion_suggeree}&rdquo;</p>
      </div>

    </div>
  )
}
