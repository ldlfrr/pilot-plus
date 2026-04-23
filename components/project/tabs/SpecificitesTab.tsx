'use client'

import { Wrench, MapPin, BookOpen, Package } from 'lucide-react'
import type { AnalysisResult } from '@/types'

export function SpecificitesTab({ result }: { result: AnalysisResult }) {
  const spec = result.specificites

  if (!spec) {
    return (
      <div className="bg-[#1a1d2e] border border-white/8 rounded-xl p-8 text-center">
        <p className="text-white/40 text-sm">
          Aucune spécificité technique extraite.
          <br />Relancez l&apos;analyse pour obtenir cette vue.
        </p>
      </div>
    )
  }

  const sections = [
    {
      key: 'exigences_techniques',
      label: 'Exigences techniques',
      icon: <Wrench size={15} className="text-blue-400" />,
      items: spec.exigences_techniques ?? [],
      color: 'border-blue-800/30 bg-blue-950/20',
    },
    {
      key: 'contraintes_site',
      label: 'Contraintes site',
      icon: <MapPin size={15} className="text-amber-400" />,
      items: spec.contraintes_site ?? [],
      color: 'border-amber-800/30 bg-amber-950/20',
    },
    {
      key: 'normes_applicables',
      label: 'Normes applicables',
      icon: <BookOpen size={15} className="text-purple-400" />,
      items: spec.normes_applicables ?? [],
      color: 'border-purple-800/30 bg-purple-950/20',
    },
    {
      key: 'materiaux',
      label: 'Matériaux & équipements requis',
      icon: <Package size={15} className="text-emerald-400" />,
      items: spec.materiaux ?? [],
      color: 'border-emerald-800/30 bg-emerald-950/20',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="bg-[#1a1d2e] border border-white/8 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-4 h-4 bg-blue-500/20 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">Spécificités techniques</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map(({ key, label, icon, items, color }) => (
            <div key={key} className={`rounded-lg border p-4 ${color}`}>
              <div className="flex items-center gap-2 mb-3">
                {icon}
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">{label}</p>
              </div>
              {items.length > 0 ? (
                <ul className="space-y-1.5">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/65">
                      <span className="text-white/30 mt-0.5 flex-shrink-0">›</span>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-white/25 italic">Non précisé dans les documents</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
