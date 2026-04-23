import { AlertTriangle, CheckCircle, Info, List } from 'lucide-react'
import type { AnalysisResult } from '@/types'

interface AnalysisDisplayProps {
  result: AnalysisResult
}

function Field({ label, value }: { label: string; value: string }) {
  const isEmpty = !value || value === 'NON PRÉCISÉ'
  return (
    <div className="space-y-1">
      <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</dt>
      <dd className={isEmpty ? 'text-sm text-slate-400 italic' : 'text-sm text-slate-800'}>
        {value || 'NON PRÉCISÉ'}
      </dd>
    </div>
  )
}

function ListField({ label, items, variant = 'default' }: {
  label: string
  items: string[]
  variant?: 'default' | 'risk' | 'check'
}) {
  const icons = {
    default: <List size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />,
    risk: <AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />,
    check: <CheckCircle size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" />,
  }

  return (
    <div className="space-y-2">
      <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</dt>
      <dd>
        {!items || items.length === 0 ? (
          <span className="text-sm text-slate-400 italic">NON PRÉCISÉ</span>
        ) : (
          <ul className="space-y-1.5">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                {icons[variant]}
                <span className="text-sm text-slate-700">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </dd>
    </div>
  )
}

export function AnalysisDisplay({ result }: AnalysisDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Contexte et besoin */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info size={16} className="text-blue-600" />
          <h3 className="font-semibold text-slate-900 text-sm">Contexte & Besoin</h3>
        </div>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Contexte général" value={result.contexte} />
          <Field label="Besoin client" value={result.besoin_client} />
          <Field label="Fourniture demandée" value={result.fourniture_demandee} />
          <Field label="Périmètre mission" value={result.perimetre} />
          <Field label="Surface / Puissance PV" value={result.surface_pv} />
          <Field label="Répartition lots" value={result.repartition} />
        </dl>
      </section>

      {/* Dates */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info size={16} className="text-blue-600" />
          <h3 className="font-semibold text-slate-900 text-sm">Calendrier</h3>
        </div>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Date limite de remise des offres" value={result.date_offre} />
          <Field label="Date de réalisation des travaux" value={result.date_travaux} />
        </dl>
      </section>

      {/* Points clés, RSE, Risques */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <List size={16} className="text-blue-600" />
          <h3 className="font-semibold text-slate-900 text-sm">Analyse détaillée</h3>
        </div>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ListField label="Points clés" items={result.points_cles} variant="check" />
          <ListField label="Exigences RSE" items={result.points_rse} variant="check" />
          <ListField label="Risques identifiés" items={result.risques} variant="risk" />
          <ListField label="Détails importants" items={result.details_importants} />
        </dl>
      </section>
    </div>
  )
}
