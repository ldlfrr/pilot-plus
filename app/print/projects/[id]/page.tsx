import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PrintTrigger } from '@/components/export/PrintTrigger'
import type {
  Project,
  ProjectAnalysis,
  ProjectScore,
  AnalysisResult,
  ScoreDetails,
} from '@/types'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ auto?: string }>
}

const STATUS_LABELS: Record<Project['status'], string> = {
  draft: 'Brouillon',
  analyzed: 'Analysé',
  scored: 'Scoré',
}

const VERDICT_CONFIG: Record<
  ProjectScore['verdict'],
  { label: string; description: string; color: string; bg: string; border: string }
> = {
  GO: {
    label: 'GO',
    description: 'Projet à fort potentiel — répondre',
    color: '#047857',
    bg: '#ecfdf5',
    border: '#a7f3d0',
  },
  A_ETUDIER: {
    label: 'À ÉTUDIER',
    description: 'Potentiel modéré — analyse approfondie recommandée',
    color: '#b45309',
    bg: '#fffbeb',
    border: '#fde68a',
  },
  NO_GO: {
    label: 'NO GO',
    description: 'Projet non prioritaire — ne pas répondre',
    color: '#b91c1c',
    bg: '#fef2f2',
    border: '#fecaca',
  },
}

const CRITERIA_LABELS: Record<keyof ScoreDetails, string> = {
  rentabilite: 'Rentabilité',
  complexite: 'Complexité',
  alignement_capacite: 'Alignement capacité',
  probabilite_gain: 'Probabilité de gain',
  charge_interne: 'Charge interne',
}

export default async function ProjectExportPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { auto } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single<Project>()

  if (!project) notFound()

  const [analysesRes, scoreRes] = await Promise.all([
    supabase
      .from('project_analyses')
      .select('*')
      .eq('project_id', id)
      .order('version', { ascending: false })
      .limit(1),
    supabase
      .from('project_scores')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .limit(1),
  ])

  const analysis = (analysesRes.data?.[0] ?? null) as ProjectAnalysis | null
  const score = (scoreRes.data?.[0] ?? null) as ProjectScore | null

  const generatedAt = new Date().toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <>
      <PrintTrigger projectId={project.id} autoPrint={auto === '1'} />

      <div className="print-root max-w-[780px] mx-auto px-10 py-12">
        {/* Cover / header */}
        <header className="pb-6 border-b-2 border-slate-900 mb-8">
          <div className="flex items-center justify-between text-xs uppercase tracking-widest text-slate-500 mb-4">
            <span className="font-bold text-blue-600">PILOT+</span>
            <span>Rapport d&apos;analyse DCE</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 leading-tight">{project.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-slate-600">
            <span>
              <span className="font-semibold">Client :</span> {project.client}
            </span>
            <span>
              <span className="font-semibold">Localisation :</span> {project.location}
            </span>
            <span>
              <span className="font-semibold">Type :</span> {project.consultation_type}
            </span>
            {project.offer_deadline && (
              <span>
                <span className="font-semibold">Offre avant :</span>{' '}
                {new Date(project.offer_deadline).toLocaleDateString('fr-FR')}
              </span>
            )}
            <span>
              <span className="font-semibold">Statut :</span> {STATUS_LABELS[project.status]}
            </span>
          </div>
          <p className="mt-4 text-xs text-slate-400">Généré le {generatedAt}</p>
        </header>

        {/* Score summary */}
        {score ? <ScoreSection score={score} /> : null}

        {/* Analysis */}
        {analysis ? (
          <AnalysisSection result={analysis.result} version={analysis.version} />
        ) : (
          <section className="mt-10 p-6 border border-dashed border-slate-300 rounded-lg text-center text-slate-400 italic">
            Aucune analyse IA disponible pour ce projet.
          </section>
        )}

        {/* Footer */}
        <footer className="mt-14 pt-6 border-t border-slate-200 text-xs text-slate-400 flex items-center justify-between">
          <span>PILOT+ — Copilot IA d&apos;analyse DCE</span>
          <span>Document confidentiel</span>
        </footer>
      </div>
    </>
  )
}

/* ───────────────────────── Sections ───────────────────────── */

function ScoreSection({ score }: { score: ProjectScore }) {
  const cfg = VERDICT_CONFIG[score.verdict]
  return (
    <section className="mb-10 page-break-avoid">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
        Décision Go / No Go
      </h2>
      <div
        className="rounded-lg border-2 p-5 flex items-center justify-between"
        style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
      >
        <div>
          <div
            className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white mb-2"
            style={{ backgroundColor: cfg.color }}
          >
            {cfg.label}
          </div>
          <p className="text-sm font-medium" style={{ color: cfg.color }}>
            {cfg.description}
          </p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-black leading-none" style={{ color: cfg.color }}>
            {score.total_score}
          </div>
          <div className="text-xs font-medium mt-1" style={{ color: cfg.color }}>
            / 100
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {(Object.entries(score.score_details) as Array<[keyof ScoreDetails, { score: number; justification: string }]>).map(
          ([key, detail]) => {
            const pct = Math.round((detail.score / 20) * 100)
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-700">
                    {CRITERIA_LABELS[key] ?? key}
                  </span>
                  <span className="text-sm font-bold tabular-nums text-slate-800">
                    {detail.score}/20
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden print-bar-track">
                  <div
                    className="h-full rounded-full print-bar-fill"
                    style={{ width: `${pct}%`, backgroundColor: cfg.color }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {detail.justification}
                </p>
              </div>
            )
          }
        )}
      </div>
    </section>
  )
}

function AnalysisSection({ result, version }: { result: AnalysisResult; version: number }) {
  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
          Synthèse IA
        </h2>
        <p className="text-xs text-slate-400">Version {version}</p>
      </div>

      <SubSection title="Contexte & besoin">
        <Grid2>
          <Field label="Contexte général" value={result.contexte} />
          <Field label="Besoin client" value={result.besoin_client} />
          <Field label="Fourniture demandée" value={result.fourniture_demandee} />
          <Field label="Périmètre mission" value={result.perimetre} />
          <Field label="Surface / Puissance PV" value={result.surface_pv} />
          <Field label="Répartition lots" value={result.repartition} />
        </Grid2>
      </SubSection>

      <SubSection title="Calendrier">
        <Grid2>
          <Field label="Date limite de remise des offres" value={result.date_offre} />
          <Field label="Date de réalisation des travaux" value={result.date_travaux} />
        </Grid2>
      </SubSection>

      <SubSection title="Points clés">
        <BulletList items={result.points_cles} tone="check" />
      </SubSection>

      <SubSection title="Exigences RSE">
        <BulletList items={result.points_rse} tone="check" />
      </SubSection>

      <SubSection title="Risques identifiés">
        <BulletList items={result.risques} tone="risk" />
      </SubSection>

      <SubSection title="Détails importants">
        <BulletList items={result.details_importants} />
      </SubSection>
    </section>
  )
}

/* ───────────────────────── Leaves ───────────────────────── */

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="page-break-avoid">
      <h3 className="text-sm font-bold text-slate-900 mb-3 pb-1 border-b border-slate-200">
        {title}
      </h3>
      {children}
    </div>
  )
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-6 gap-y-4">{children}</div>
}

function Field({ label, value }: { label: string; value: string }) {
  const empty = !value || value === 'NON PRÉCISÉ'
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">
        {label}
      </div>
      <div className={empty ? 'text-sm text-slate-400 italic' : 'text-sm text-slate-800'}>
        {value || 'Non précisé'}
      </div>
    </div>
  )
}

function BulletList({
  items,
  tone = 'default',
}: {
  items: string[]
  tone?: 'default' | 'risk' | 'check'
}) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-slate-400 italic">Non précisé</p>
  }
  const marker =
    tone === 'risk' ? 'bg-amber-500' : tone === 'check' ? 'bg-emerald-500' : 'bg-blue-500'
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
          <span
            className={`mt-[7px] w-1.5 h-1.5 rounded-full flex-shrink-0 print-marker ${marker}`}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
