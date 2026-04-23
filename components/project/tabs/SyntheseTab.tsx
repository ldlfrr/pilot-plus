'use client'

import { AlertTriangle } from 'lucide-react'
import type { AnalysisResult } from '@/types'

export function SyntheseTab({ result }: { result: AnalysisResult }) {
  const fields = [
    { label: 'TYPE',        value: result.type_projet       ?? result.fourniture_demandee ?? 'NON PRÉCISÉ' },
    { label: 'OBJET',       value: result.objet             ?? result.perimetre           ?? 'NON PRÉCISÉ' },
    { label: 'LOCALISATION',value: result.repartition       ?? 'NON PRÉCISÉ' },
    { label: 'PUISSANCE',   value: result.puissance         ?? result.surface_pv          ?? 'NON PRÉCISÉ' },
    { label: 'SITES',       value: result.sites             ?? 'NON PRÉCISÉ' },
    { label: 'DATE LIMITE', value: result.date_offre        ?? 'NON PRÉCISÉ' },
    { label: 'CLIENT',      value: result.contexte?.slice(0, 60) ?? 'NON PRÉCISÉ' },
    { label: 'COMPLEXITÉ',  value: result.complexite        ?? 'NON PRÉCISÉ' },
  ]

  const vigilance = result.points_vigilance?.length
    ? result.points_vigilance
    : result.risques?.slice(0, 3) ?? []

  return (
    <div className="space-y-5">
      {/* Grid info */}
      <div className="bg-[#1a1d2e] border border-white/8 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-4 h-4 bg-blue-500/20 rounded flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-400 rounded-sm" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">Synthèse du projet</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {fields.map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">{label}</p>
              <p className="text-sm font-semibold text-white leading-snug">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Points de vigilance */}
      {vigilance.length > 0 && (
        <div className="bg-amber-950/30 border border-amber-800/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-300">Points de vigilance</h3>
          </div>
          <ul className="space-y-1.5">
            {vigilance.map((pt, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-200/70">
                <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>
                {pt}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Résumé exécutif */}
      <div className="bg-[#1a1d2e] border border-white/8 rounded-xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Résumé exécutif</h3>
        <p className="text-sm text-white/70 leading-relaxed">
          {result.resume_executif ?? result.contexte ?? 'Aucun résumé disponible.'}
        </p>
      </div>

      {/* Points clés */}
      {(result.points_cles?.length ?? 0) > 0 && (
        <div className="bg-[#1a1d2e] border border-white/8 rounded-xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Points clés</h3>
          <ul className="space-y-1.5">
            {result.points_cles.map((pt, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                <span className="text-blue-400 mt-0.5 flex-shrink-0">›</span>
                {pt}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
