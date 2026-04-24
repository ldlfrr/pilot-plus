'use client'

import { cn } from '@/lib/utils/cn'
import type { Project, ProjectAnalysis, ProjectScore, ScoreDetails } from '@/types'
import { AlertTriangle, CheckSquare, Square } from 'lucide-react'

interface Props {
  project: Project
  analysis: ProjectAnalysis | null
  score: ProjectScore | null
  /** 'light' = white bg for print/PDF  |  'dark' = app dark theme for share page */
  variant: 'light' | 'dark'
}

// ─── Label maps ───────────────────────────────────────────────────────────────

const BESOIN_LABELS: Record<string, string> = {
  objectifs:           'Objectifs',
  besoins_metier:      'Besoins métier',
  contraintes:         'Contraintes',
  priorites:           'Priorités',
  attentes_implicites: 'Attentes implicites',
  points_a_appuyer:    'Points à appuyer',
}

const SPEC_SECTIONS: { key: string; label: string; accent: string }[] = [
  { key: 'exigences_techniques', label: 'Exigences techniques', accent: 'text-blue-500' },
  { key: 'contraintes_site',     label: 'Contraintes site',     accent: 'text-amber-500' },
  { key: 'normes_applicables',   label: 'Normes applicables',   accent: 'text-purple-500' },
  { key: 'materiaux',            label: 'Matériaux',            accent: 'text-emerald-500' },
]

const SCORE_CRITERIA: { key: keyof ScoreDetails; label: string }[] = [
  { key: 'rentabilite',         label: 'Rentabilité' },
  { key: 'complexite',          label: 'Complexité technique' },
  { key: 'alignement_capacite', label: 'Alignement capacité' },
  { key: 'probabilite_gain',    label: 'Probabilité de gain' },
  { key: 'charge_interne',      label: 'Charge interne' },
]

const VERDICT_CFG = {
  GO:       { label: 'GO',        cls: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-500' },
  A_ETUDIER:{ label: 'À ÉTUDIER', cls: 'bg-amber-500/20 border-amber-500/40 text-amber-500' },
  NO_GO:    { label: 'NO GO',     cls: 'bg-red-500/20 border-red-500/40 text-red-500' },
}

// ─── Theme helpers ─────────────────────────────────────────────────────────────

function useTheme(v: 'light' | 'dark') {
  const d = v === 'dark'
  return {
    card:      d ? 'bg-[#1a1d2e] border border-white/8 rounded-xl p-5'               : 'bg-white border border-gray-200 rounded-xl p-5 shadow-sm',
    secTitle:  d ? 'text-xs font-bold uppercase tracking-widest text-white/40 mb-4'  : 'text-xs font-bold uppercase tracking-widest text-gray-400 mb-4',
    label:     d ? 'text-[11px] font-semibold uppercase tracking-wide text-white/40' : 'text-[11px] font-semibold uppercase tracking-wide text-gray-400',
    text:      d ? 'text-sm text-white/70'  : 'text-sm text-gray-600',
    textBold:  d ? 'text-sm text-white/90 font-medium' : 'text-sm text-gray-800 font-medium',
    bullet:    d ? 'text-white/20'          : 'text-gray-300',
    divider:   d ? 'border-white/5'         : 'border-gray-100',
    vigilCard: d ? 'bg-amber-500/8 border border-amber-500/20 rounded-xl p-5'        : 'bg-amber-50 border border-amber-200 rounded-xl p-5',
    vigilText: d ? 'text-amber-300/80'      : 'text-amber-800',
    barBg:     d ? 'bg-white/5'             : 'bg-gray-100',
    scoreHero: d ? 'text-5xl font-extrabold tabular-nums' : 'text-5xl font-extrabold tabular-nums',
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProjectFullView({ project, analysis, score, variant }: Props) {
  const t = useTheme(variant)
  const r = analysis?.result ?? null

  return (
    <div className="space-y-5">

      {/* ── 1. Header ─────────────────────────────────────────────────── */}
      <div className={t.card}>
        <div className="flex flex-wrap items-start gap-3 mb-3">
          <h1 className={cn(variant === 'dark' ? 'text-xl font-bold text-white' : 'text-xl font-bold text-gray-900')}>
            {project.name}
          </h1>
          {score && (
            <>
              <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full border', VERDICT_CFG[score.verdict].cls)}>
                {VERDICT_CFG[score.verdict].label}
              </span>
              <span className={cn(
                'text-lg font-extrabold',
                score.verdict === 'GO' ? 'text-emerald-500' :
                score.verdict === 'NO_GO' ? 'text-red-500' : 'text-amber-500'
              )}>
                {score.total_score}/100
              </span>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
          <InfoPair label="Client" value={project.client} variant={variant} />
          <InfoPair label="Lieu" value={project.location} variant={variant} />
          {project.offer_deadline && (
            <InfoPair
              label="Échéance"
              value={new Date(project.offer_deadline).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
              variant={variant}
              accent="amber"
            />
          )}
          {r?.ref_ao && r.ref_ao !== 'NON PRÉCISÉ' && (
            <InfoPair label="Réf AO" value={r.ref_ao} variant={variant} />
          )}
          {r?.type_projet && (
            <InfoPair label="Type" value={r.type_projet} variant={variant} />
          )}
          {r?.puissance && (
            <InfoPair label="Puissance" value={r.puissance} variant={variant} />
          )}
        </div>
      </div>

      {/* No analysis yet */}
      {!r && (
        <div className={cn(t.card, 'text-center py-10')}>
          <p className={t.text}>Aucune analyse IA disponible pour ce projet.</p>
        </div>
      )}

      {r && <>

        {/* ── 2. Résumé exécutif ──────────────────────────────────────── */}
        {r.resume_executif && (
          <div className={t.card}>
            <p className={t.secTitle}>Résumé exécutif</p>
            <p className={cn(t.text, 'leading-relaxed')}>{r.resume_executif}</p>
          </div>
        )}

        {/* ── 3. Infos projet ─────────────────────────────────────────── */}
        {(r.objet || r.sites || r.complexite || r.contexte) && (
          <div className={t.card}>
            <p className={t.secTitle}>Informations projet</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
              {[
                { label: 'Objet',      val: r.objet },
                { label: 'Sites',      val: r.sites },
                { label: 'Complexité', val: r.complexite },
                { label: 'Contexte',   val: r.contexte },
                { label: 'Périmètre',  val: r.perimetre },
                { label: 'Répartition',val: r.repartition },
              ].filter(f => f.val && f.val !== 'NON PRÉCISÉ').map(({ label, val }) => (
                <div key={label}>
                  <p className={cn(t.label, 'mb-1')}>{label}</p>
                  <p className={t.textBold}>{val}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 4. Points de vigilance ──────────────────────────────────── */}
        {r.points_vigilance && r.points_vigilance.length > 0 && (
          <div className={t.vigilCard}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
              <p className={cn(t.secTitle, '!mb-0 !text-amber-500')}>Points de vigilance</p>
            </div>
            <ul className="space-y-1.5">
              {r.points_vigilance.map((p, i) => (
                <li key={i} className={cn('text-sm flex gap-2', t.vigilText)}>
                  <span className="flex-shrink-0 mt-0.5">•</span>{p}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── 5. Besoin client ────────────────────────────────────────── */}
        {r.besoin_client_detail && (
          <div className={t.card}>
            <p className={t.secTitle}>Besoin client</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {Object.entries(BESOIN_LABELS).map(([key, label]) => {
                const items = (r.besoin_client_detail as unknown as Record<string, string[]>)[key]
                if (!items?.length) return null
                return (
                  <div key={key}>
                    <p className={cn(t.label, 'mb-2')}>{label}</p>
                    <ul className="space-y-1">
                      {items.map((item, i) => (
                        <li key={i} className={cn(t.text, 'flex gap-2')}>
                          <span className={cn('flex-shrink-0 mt-0.5', t.bullet)}>•</span>{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── 6. Pièces à fournir ─────────────────────────────────────── */}
        {r.pieces_a_fournir && r.pieces_a_fournir.length > 0 && (
          <div className={t.card}>
            <p className={t.secTitle}>Pièces à fournir</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(['obligatoire', 'recommande'] as const).map(type => {
                const items = r.pieces_a_fournir!.filter(p => p.type === type)
                if (!items.length) return null
                const isOblig = type === 'obligatoire'
                return (
                  <div key={type}>
                    <p className={cn(t.label, 'mb-2', isOblig ? 'text-red-400' : 'text-blue-400')}>
                      {isOblig ? `Obligatoires (${items.length})` : `Recommandées (${items.length})`}
                    </p>
                    <ul className="space-y-1.5">
                      {items.map((p, i) => (
                        <li key={i} className={cn(t.text, 'flex items-start gap-2')}>
                          {isOblig
                            ? <CheckSquare size={13} className="flex-shrink-0 mt-0.5 text-red-400" />
                            : <Square      size={13} className="flex-shrink-0 mt-0.5 text-blue-400" />
                          }
                          {p.nom}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── 7. Spécificités techniques ──────────────────────────────── */}
        {r.specificites && (
          <div className={t.card}>
            <p className={t.secTitle}>Spécificités techniques</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {SPEC_SECTIONS.map(({ key, label, accent }) => {
                const items = (r.specificites as unknown as Record<string, string[]>)[key]
                if (!items?.length) return null
                return (
                  <div key={key}>
                    <p className={cn(t.label, 'mb-2', accent)}>{label}</p>
                    <ul className="space-y-1">
                      {items.map((item, i) => (
                        <li key={i} className={cn(t.text, 'flex gap-2')}>
                          <span className={cn('flex-shrink-0 mt-0.5', t.bullet)}>•</span>{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── 8. Score Go / No Go ─────────────────────────────────────── */}
        {score && (
          <div className={t.card}>
            <p className={t.secTitle}>Score Go / No Go</p>

            {/* Hero score */}
            <div className="flex items-end gap-4 mb-6 pb-5 border-b" style={{ borderColor: variant === 'dark' ? 'rgba(255,255,255,0.05)' : '#f0f0f0' }}>
              <span className={cn(
                t.scoreHero,
                score.verdict === 'GO' ? 'text-emerald-500' :
                score.verdict === 'NO_GO' ? 'text-red-500' : 'text-amber-500'
              )}>
                {score.total_score}
              </span>
              <div className="mb-1">
                <p className={cn(t.text, 'mb-1')}>/100</p>
                <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full border', VERDICT_CFG[score.verdict].cls)}>
                  {VERDICT_CFG[score.verdict].label}
                </span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-4">
              {SCORE_CRITERIA.map(({ key, label }) => {
                const detail = score.score_details[key]
                if (!detail) return null
                const pct = Math.round((detail.score / 20) * 100)
                const barColor = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'
                return (
                  <div key={key} className={cn('pb-4 border-b last:border-b-0', t.divider)}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className={t.textBold}>{label}</p>
                      <span className={cn('text-sm font-bold tabular-nums', variant === 'dark' ? 'text-white' : 'text-gray-800')}>
                        {detail.score}/20
                      </span>
                    </div>
                    <div className={cn('h-1.5 rounded-full mb-2', t.barBg)}>
                      <div className={cn('h-1.5 rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
                    </div>
                    <p className={cn(t.text, 'text-xs leading-relaxed')}>{detail.justification}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── 9. Actions recommandées ─────────────────────────────────── */}
        {r.actions_suggerees && r.actions_suggerees.length > 0 && (
          <div className={t.card}>
            <p className={t.secTitle}>Actions recommandées</p>
            <ol className="space-y-3">
              {r.actions_suggerees.map((action, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className={cn(
                    'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5',
                    variant === 'dark' ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                  )}>
                    {i + 1}
                  </span>
                  <p className={cn(t.text, 'leading-relaxed')}>{action}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* ── 10. Points clés ─────────────────────────────────────────── */}
        {r.points_cles && r.points_cles.length > 0 && (
          <div className={t.card}>
            <p className={t.secTitle}>Points clés</p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {r.points_cles.map((p, i) => (
                <li key={i} className={cn(t.text, 'flex gap-2')}>
                  <span className={cn('flex-shrink-0 mt-0.5', variant === 'dark' ? 'text-blue-400' : 'text-blue-500')}>→</span>{p}
                </li>
              ))}
            </ul>
          </div>
        )}

      </>}

      {/* Footer watermark */}
      <div className={cn('text-center py-4', variant === 'dark' ? 'text-white/15' : 'text-gray-300')}>
        <p className="text-xs">Généré par PILOT+ — Copilot IA DCE solaire</p>
      </div>

    </div>
  )
}

// ─── InfoPair helper ──────────────────────────────────────────────────────────

function InfoPair({
  label, value, variant, accent,
}: { label: string; value: string; variant: 'light' | 'dark'; accent?: 'amber' }) {
  const d = variant === 'dark'
  return (
    <span className="flex items-center gap-1.5">
      <span className={d ? 'text-white/30' : 'text-gray-400'}>{label} :</span>
      <span className={
        accent === 'amber'
          ? 'text-amber-400 font-medium'
          : d ? 'text-white/70 font-medium' : 'text-gray-700 font-medium'
      }>
        {value}
      </span>
    </span>
  )
}
