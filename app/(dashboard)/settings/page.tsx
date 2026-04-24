import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { SettingsShell } from '@/components/settings/SettingsShell'
import { DEFAULT_CRITERIA } from '@/types'
import type { CompanyCriteria } from '@/types'

export const metadata: Metadata = { title: 'Mon entreprise — PILOT+' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('company_settings')
    .select('criteria, settings_mode, company_document_name')
    .eq('user_id', user.id)
    .single()

  const criteria: CompanyCriteria = (data?.criteria as CompanyCriteria) ?? DEFAULT_CRITERIA
  const settingsMode: 'form' | 'document' =
    data?.settings_mode === 'document' ? 'document' : 'form'
  const companyDocumentName: string | null = data?.company_document_name ?? null

  return (
    <div className="flex flex-col min-h-0">
      <Header
        title="Mon entreprise"
        description="Configurez votre profil pour un scoring Go/No Go personnalisé"
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 animate-fade-in">
        <div className="max-w-3xl mx-auto">
          <SettingsShell
            initialCriteria={criteria}
            initialMode={settingsMode}
            initialDocName={companyDocumentName}
          />
        </div>
      </div>
    </div>
  )
}
