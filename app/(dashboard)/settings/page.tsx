import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { CriteriaForm } from '@/components/settings/CriteriaForm'
import { SlidersHorizontal, Info } from 'lucide-react'
import { DEFAULT_CRITERIA } from '@/types'
import type { CompanyCriteria } from '@/types'

export const metadata: Metadata = { title: 'Paramètres — Critères de scoring' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('company_settings')
    .select('criteria')
    .eq('user_id', user.id)
    .single()

  const criteria: CompanyCriteria = (data?.criteria as CompanyCriteria) ?? DEFAULT_CRITERIA

  return (
    <div className="flex flex-col min-h-0">
      <Header
        title="Paramètres"
        description="Configurez le profil de votre entreprise pour un scoring personnalisé"
      />

      <div className="flex-1 overflow-y-auto p-6 animate-fade-in">
        <div className="max-w-3xl mx-auto">

          {/* Intro banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 mb-6">
            <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800 mb-1">
                Comment fonctionnent les critères de scoring ?
              </p>
              <p className="text-sm text-blue-700 leading-relaxed">
                Ces paramètres sont injectés dans le prompt de scoring IA à chaque analyse.
                L&apos;IA évalue chaque projet en tenant compte de votre géographie d&apos;intervention,
                vos certifications, vos secteurs cibles et vos pondérations personnalisées —
                pour un score Go/No Go vraiment adapté à votre réalité.
              </p>
            </div>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-xl border border-slate-200 px-6 pb-0 pt-6 relative">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-blue-50 rounded-lg">
                <SlidersHorizontal size={17} className="text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Profil entreprise</h2>
                <p className="text-xs text-slate-400">
                  Ces critères sont utilisés automatiquement à chaque scoring
                </p>
              </div>
            </div>

            <CriteriaForm initialCriteria={criteria} />
          </div>

        </div>
      </div>
    </div>
  )
}
