import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight, FileSearch, Target, BarChart3,
  CheckCircle, Zap, Shield, Clock, ChevronRight,
} from 'lucide-react'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/accueil')
  return <LandingPage />
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="relative h-10 w-36">
            <Image src="/logo/pilot-plus.png" alt="PILOT+" fill className="object-contain object-left" priority />
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900">Connexion</Link>
            <Link href="/signup" className="px-4 py-2 text-sm font-medium bg-[#1B3464] text-white rounded-lg hover:bg-[#152a52] transition-colors">
              Commencer gratuitement
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-xs font-semibold text-blue-700 mb-8">
            <Zap size={12} className="text-blue-500" />
            Copilot IA pour équipes commerciales énergie solaire
          </div>
          <div className="flex justify-center mb-8">
            <div className="relative h-24 w-80">
              <Image src="/logo/pilot-plus.png" alt="PILOT+" fill className="object-contain" priority />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1B3464] leading-tight mb-5">
            Analysez vos DCE.<br />
            <span className="text-[#E63B2E]">Décidez en confiance.</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            PILOT+ analyse automatiquement vos dossiers de consultation (PDF/DOCX),
            génère une synthèse IA et calcule un score Go / No Go personnalisé selon
            les critères de votre entreprise.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#1B3464] text-white text-base font-semibold rounded-xl hover:bg-[#152a52] transition-all shadow-md">
              Commencer gratuitement <ArrowRight size={18} />
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-slate-200 text-slate-700 text-base font-semibold rounded-xl hover:bg-slate-50 transition-all">
              J&apos;ai déjà un compte <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#1B3464] mb-3">Tout ce qu&apos;il vous faut pour décider vite</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard icon={<FileSearch size={28} className="text-blue-600" />} bg="bg-blue-50"
              title="Analyse IA des documents"
              description="Claude extrait automatiquement le contexte, besoin client, spécificités et pièces à fournir."
              items={['7 onglets structurés', 'Extraction PDF/DOCX', 'Détection des risques']} />
            <FeatureCard icon={<Target size={28} className="text-[#E63B2E]" />} bg="bg-red-50"
              title="Score Go / No Go" accent
              description="5 critères pondérés selon votre stratégie avec justification factuelle."
              items={['Critères personnalisables', 'Pondérations × 1–5', 'GO / À ÉTUDIER / NO GO']} />
            <FeatureCard icon={<BarChart3 size={28} className="text-emerald-600" />} bg="bg-emerald-50"
              title="Dashboard analytique"
              description="KPIs, répartition Go/No Go, top clients, échéances proches."
              items={['Graphiques recharts', 'Top clients', 'Insights automatiques']} />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="py-10 px-6 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {[
            { icon: <Shield size={20} className="text-blue-600" />, label: 'Données sécurisées', sub: 'Supabase EU' },
            { icon: <Zap size={20} className="text-amber-500" />, label: 'Analyse en < 30s', sub: 'Claude Opus' },
            { icon: <Clock size={20} className="text-emerald-600" />, label: 'Disponible 24/7', sub: 'SaaS cloud' },
          ].map(({ icon, label, sub }) => (
            <div key={label} className="flex items-center justify-center gap-3">
              <div className="p-2.5 bg-white rounded-lg shadow-sm">{icon}</div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                <p className="text-xs text-slate-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA footer */}
      <section className="py-16 px-6 bg-[#1B3464]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Prêt à analyser votre premier DCE ?</h2>
          <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-[#E63B2E] text-white text-base font-bold rounded-xl hover:bg-[#cc2f24] transition-all shadow-lg">
            Créer mon compte gratuitement <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="py-5 px-6 bg-[#152a52] border-t border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="relative h-7 w-24">
            <Image src="/logo/pilot-plus.png" alt="PILOT+" fill className="object-contain object-left brightness-0 invert" />
          </div>
          <p className="text-slate-400 text-xs">© {new Date().getFullYear()} PILOT+</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, bg, title, description, items, accent = false }: {
  icon: React.ReactNode; bg: string; title: string; description: string; items: string[]; accent?: boolean
}) {
  return (
    <div className={`rounded-2xl border p-6 flex flex-col gap-4 ${accent ? 'bg-[#1B3464] border-[#1B3464]' : 'bg-white border-slate-200'}`}>
      <div className={`w-12 h-12 rounded-xl ${accent ? 'bg-white/10' : bg} flex items-center justify-center`}>{icon}</div>
      <div>
        <h3 className={`text-lg font-bold mb-2 ${accent ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
        <p className={`text-sm leading-relaxed ${accent ? 'text-blue-200' : 'text-slate-500'}`}>{description}</p>
      </div>
      <ul className="space-y-1.5 mt-auto">
        {items.map(item => (
          <li key={item} className="flex items-center gap-2 text-sm">
            <CheckCircle size={14} className={accent ? 'text-blue-300 flex-shrink-0' : 'text-emerald-500 flex-shrink-0'} />
            <span className={accent ? 'text-blue-100' : 'text-slate-600'}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
