'use client'

import type { AnalysisResult, BesoinClientDetail } from '@/types'

const SECTIONS: { key: keyof BesoinClientDetail; label: string }[] = [
  { key: 'objectifs',          label: 'OBJECTIFS EXPRIMÉS' },
  { key: 'besoins_metier',     label: 'BESOINS MÉTIER' },
  { key: 'contraintes',        label: 'CONTRAINTES IMPORTANTES' },
  { key: 'priorites',          label: 'PRIORITÉS APPARENTES' },
  { key: 'attentes_implicites',label: 'ATTENTES IMPLICITES' },
  { key: 'points_a_appuyer',   label: 'POINTS À APPUYER' },
]

export function BesoinClientTab({ result }: { result: AnalysisResult }) {
  const detail = result.besoin_client_detail

  if (!detail) {
    return (
      <div className="bg-[#1a1d2e] border border-white/8 rounded-xl p-8 text-center">
        <p className="text-white/40 text-sm">
          Aucune analyse structurée du besoin client disponible.
          <br />
          Relancez l&apos;analyse pour obtenir cette vue.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#1a1d2e] border border-white/8 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-4 h-4 bg-blue-500/20 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">
            Compréhension du besoin client
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SECTIONS.map(({ key, label }) => {
            const items: string[] = (detail[key] as string[]) ?? []
            return (
              <div key={key} className="bg-[#0f1117] rounded-lg border border-white/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">
                  {label}
                </p>
                <ul className="space-y-1.5">
                  {items.length > 0
                    ? items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                          <span className="text-blue-400 mt-0.5 flex-shrink-0">›</span>
                          {item}
                        </li>
                      ))
                    : <li className="text-sm text-white/25 italic">Non précisé</li>}
                </ul>
              </div>
            )
          })}
        </div>
      </div>

      {/* General context */}
      {result.besoin_client && (
        <div className="bg-[#1a1d2e] border border-white/8 rounded-xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Vue générale</h3>
          <p className="text-sm text-white/60 leading-relaxed">{result.besoin_client}</p>
        </div>
      )}
    </div>
  )
}
