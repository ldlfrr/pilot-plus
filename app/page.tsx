import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  ArrowRight, FileSearch, Target, BarChart3,
  Zap, Shield, Clock, Radio, CheckCircle,
  ChevronRight, Cpu, TrendingUp, Building2, Star,
  FileText, Users, Mail, UserSearch, Brain,
  Sparkles, Lock, Layers, Kanban, Calendar,
  Download, Search, BellRing, PenLine, Check, X,
  BadgeCheck, GitBranch, Workflow, Bolt, Globe,
  MessageSquare, Eye, PlayCircle,
} from 'lucide-react'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/accueil')
  return <LandingPage />
}

// ── Shared visual helpers ──────────────────────────────────────────────────────

function GlowOrbs({ variant = 'default' }: { variant?: 'default' | 'warm' | 'violet' }) {
  if (variant === 'warm') return (
    <>
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-amber-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-orange-600/5 blur-[100px] pointer-events-none" />
    </>
  )
  if (variant === 'violet') return (
    <>
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-violet-600/7 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-indigo-600/6 blur-[100px] pointer-events-none" />
    </>
  )
  return (
    <>
      <div className="absolute top-[-10%] left-[-5%] w-[700px] h-[700px] rounded-full bg-blue-600/7 blur-[140px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/6 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[30%] w-[400px] h-[400px] rounded-full bg-cyan-500/4 blur-[100px] pointer-events-none" />
    </>
  )
}

function GridBg() {
  return (
    <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
      style={{
        backgroundImage: 'linear-gradient(rgba(59,130,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,1) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
      }} />
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/8 border border-blue-500/15 mb-4">
      <span className="w-1 h-1 rounded-full bg-blue-400" />
      <span className="text-[11px] font-bold text-blue-400 tracking-[0.15em] uppercase">{children}</span>
    </div>
  )
}

// ── Landing ────────────────────────────────────────────────────────────────────

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060a1c] text-white overflow-x-hidden" style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)' }}>

      <Navbar />
      <Hero />
      <TrustBar />
      <FeaturesShowcase />
      <PipelineSection />
      <AllFeatures />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <FinalCTA />
      <Footer />

    </div>
  )
}

// ── Navbar ─────────────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.055]" style={{ background: 'rgba(6,10,28,0.88)', backdropFilter: 'blur(24px)' }}>
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md shadow-blue-600/30">
            <span className="text-white text-[11px] font-black tracking-tighter select-none">P+</span>
          </div>
          <span className="text-[15px] font-extrabold text-white tracking-tight">
            PILOT<span className="text-blue-400">+</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="hidden lg:flex items-center gap-7">
          {[
            { label: 'Fonctionnalités', href: '#features' },
            { label: 'Pipeline IA', href: '#pipeline' },
            { label: 'Comment ça marche', href: '#process' },
            { label: 'Tarifs', href: '#pricing' },
          ].map(({ label, href }) => (
            <a key={href} href={href} className="text-[13px] text-white/45 hover:text-white transition-colors font-medium">{label}</a>
          ))}
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <Link href="/login" className="hidden sm:block px-4 py-2 text-sm font-medium text-white/45 hover:text-white transition-colors">
            Connexion
          </Link>
          <Link href="/signup" className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-600/25">
            Essai gratuit <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </header>
  )
}

// ── Hero ───────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative pt-20 sm:pt-28 pb-24 sm:pb-36 px-4 sm:px-6 overflow-hidden">
      <GlowOrbs />
      <GridBg />

      {/* Radial center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full bg-blue-600/6 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.09] mb-8 group cursor-default">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-white/55 tracking-wide">Propulsé par Claude AI · BTP & Énergie renouvelable</span>
          </span>
          <span className="hidden sm:flex items-center gap-1 text-[11px] text-blue-400/70 font-medium">
            <span className="w-px h-3 bg-white/10" />
            Nouveau
            <span className="bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full">Pipeline IA</span>
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-[2.75rem] sm:text-6xl lg:text-[5.5rem] font-black leading-[1.06] tracking-[-0.02em] mb-7">
          <span className="text-white">Gagnez plus d&apos;appels</span><br />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            d&apos;offres avec l&apos;IA.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-white/40 max-w-2xl mx-auto mb-10 leading-relaxed">
          PILOT+ analyse vos DCE en <strong className="text-white/65">30 secondes</strong>, calcule un score&nbsp;
          <strong className="text-white/65">Go&nbsp;/&nbsp;No&nbsp;Go</strong> personnalisé et pilote votre
          pipeline commercial de la veille à la signature.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
          <Link href="/signup"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-2xl shadow-blue-600/30 hover:shadow-blue-500/40 hover:-translate-y-px text-base">
            Commencer gratuitement <ArrowRight size={17} />
          </Link>
          <a href="#features"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 text-white/70 hover:text-white font-semibold rounded-2xl transition-all text-base">
            <PlayCircle size={16} className="text-white/40" />
            Voir les fonctionnalités
          </a>
        </div>

        {/* Hero UI mockup */}
        <div className="relative mx-auto max-w-4xl">
          <div className="absolute -inset-6 bg-blue-600/8 rounded-3xl blur-3xl" />
          <div className="relative rounded-2xl border border-white/8 bg-[#080e22] overflow-hidden shadow-2xl shadow-black/60">

            {/* Fake topbar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]" style={{ background: 'rgba(8,12,30,0.95)' }}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
              </div>
              <div className="flex-1 mx-3 h-6 bg-white/[0.04] rounded-md flex items-center px-3 gap-2">
                <Shield size={9} className="text-emerald-400/60" />
                <span className="text-[10px] text-white/20">pilotplus.app/projects/réhabilitation-energétique-bâtiment-B</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[9px] bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">● Live</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { label: 'Score Go/No Go', value: '87/100', color: 'text-emerald-400', badge: '✓ GO', badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
                { label: 'Pipeline actifs', value: '14', color: 'text-blue-400', badge: 'En cours', badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
                { label: 'Taux conversion', value: '71%', color: 'text-violet-400', badge: '+8%', badgeColor: 'bg-violet-500/15 text-violet-400 border-violet-500/25' },
                { label: 'CA pipeline', value: '2.4M€', color: 'text-amber-400', badge: 'Actif', badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
              ].map(({ label, value, color, badge, badgeColor }) => (
                <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 sm:p-4">
                  <p className="text-[9px] sm:text-[10px] text-white/30 mb-1.5 truncate">{label}</p>
                  <p className={`text-xl sm:text-2xl font-extrabold ${color} mb-2 leading-none`}>{value}</p>
                  <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>{badge}</span>
                </div>
              ))}
            </div>

            {/* Feature rows */}
            <div className="px-4 pb-4 sm:px-5 sm:pb-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { icon: Brain, label: 'Analyse IA générée', sub: 'Réhabilitation énergétique — Isère (38)', dot: 'bg-emerald-400', dotBg: 'bg-emerald-500/10' },
                { icon: Radio, label: 'Veille BOAMP active', sub: '11 nouvelles annonces correspondantes', dot: 'bg-blue-400', dotBg: 'bg-blue-500/10' },
                { icon: Target, label: 'Score calculé : 87/100', sub: 'Recommandation : GO — Postuler', dot: 'bg-violet-400', dotBg: 'bg-violet-500/10' },
              ].map(({ icon: Icon, label, sub, dot, dotBg }) => (
                <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3.5 py-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${dotBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={14} className={dot.replace('bg-', 'text-')} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white/70 truncate">{label}</p>
                    <p className="text-[10px] text-white/30 truncate">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Trust bar ──────────────────────────────────────────────────────────────────

function TrustBar() {
  return (
    <section className="py-8 sm:py-10 border-y border-white/[0.05]" style={{ background: 'rgba(255,255,255,0.012)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10">
          {[
            { value: '< 30s',    label: 'Analyse complète d\'un DCE' },
            { value: '7',        label: 'Onglets structurés par IA' },
            { value: '100%',     label: 'Données hébergées en UE' },
            { value: 'Gratuit',  label: 'Pour démarrer, sans CB' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl sm:text-4xl font-extrabold text-white mb-1.5 tracking-tight">{value}</p>
              <p className="text-xs text-white/30 leading-relaxed">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Features showcase ──────────────────────────────────────────────────────────

function FeaturesShowcase() {
  const features = [
    {
      side: 'right' as const,
      badge: 'Analyse IA',
      headline: 'Votre DCE analysé en 30 secondes chrono.',
      sub: 'Uploadez un PDF ou DOCX. PILOT+ extrait automatiquement tout le contenu et génère une analyse structurée en 7 onglets : contexte projet, besoin client, spécificités techniques, critères d\'attribution, concurrents potentiels, points de vigilance et plan de réponse.',
      highlights: [
        { icon: Brain, text: '7 onglets d\'analyse structurée', color: 'text-blue-400' },
        { icon: FileSearch, text: 'PDF, DOCX, multi-documents', color: 'text-cyan-400' },
        { icon: Sparkles, text: 'Mémoire technique IA prête à l\'emploi', color: 'text-violet-400' },
      ],
      mockup: <AnalysisMockup />,
      color: 'blue',
    },
    {
      side: 'left' as const,
      badge: 'Score Go / No Go',
      headline: 'Décidez en 30 secondes, pas en 3 heures.',
      sub: 'Configurez les critères de votre entreprise une seule fois (zones géographiques, types de projets, capacités, certifications). PILOT+ calcule automatiquement un score pondéré sur 100 avec une recommandation GO / À ÉTUDIER / NO GO justifiée par des extraits factuels.',
      highlights: [
        { icon: Target, text: 'Critères 100% personnalisables', color: 'text-emerald-400' },
        { icon: BarChart3, text: 'Score justifié avec extraits', color: 'text-blue-400' },
        { icon: TrendingUp, text: 'Métriques affinées dans le temps', color: 'text-amber-400' },
      ],
      mockup: <ScoringMockup />,
      color: 'emerald',
    },
    {
      side: 'right' as const,
      badge: 'Veille BOAMP',
      headline: 'Ne ratez plus aucune opportunité.',
      sub: 'Configurez vos mots-clés, types de marchés et zones géographiques. PILOT+ surveille le BOAMP en continu et vous remonte les nouvelles consultations qui correspondent à votre profil — avec lien direct vers l\'annonce et scoring automatique.',
      highlights: [
        { icon: Radio, text: 'Surveillance automatique BOAMP', color: 'text-blue-400' },
        { icon: BellRing, text: 'Alertes en temps réel', color: 'text-amber-400' },
        { icon: Search, text: 'Filtres avancés par secteur & région', color: 'text-violet-400' },
      ],
      mockup: <VeilleMockup />,
      color: 'violet',
    },
  ]

  return (
    <section id="features" className="py-20 sm:py-32 px-4 sm:px-6 relative overflow-hidden">
      <GlowOrbs />
      <div className="relative z-10 max-w-6xl mx-auto space-y-28 sm:space-y-40">

        <div className="text-center">
          <SectionLabel>Fonctionnalités clés</SectionLabel>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight tracking-tight">
            Tout ce qu&apos;il vous faut pour<br className="hidden sm:block" /> décider vite et bien.
          </h2>
          <p className="text-white/35 max-w-xl mx-auto text-base leading-relaxed">
            De l&apos;import du document à la signature — un seul outil, zéro friction.
          </p>
        </div>

        {features.map(({ side, badge, headline, sub, highlights, mockup, color }) => (
          <div key={badge}
            className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${side === 'left' ? 'lg:grid-flow-dense' : ''}`}
          >
            {/* Text */}
            <div className={side === 'left' ? 'lg:col-start-2' : ''}>
              <SectionLabel>{badge}</SectionLabel>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-5 leading-tight">{headline}</h3>
              <p className="text-white/40 text-base leading-relaxed mb-8">{sub}</p>
              <ul className="space-y-3.5">
                {highlights.map(({ icon: Icon, text, color: c }) => (
                  <li key={text} className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0`}>
                      <Icon size={15} className={c} />
                    </div>
                    <span className="text-sm text-white/60">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Mockup */}
            <div className={`relative ${side === 'left' ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
              <div className={`absolute -inset-4 rounded-3xl blur-3xl opacity-30 ${
                color === 'blue' ? 'bg-blue-600/20' : color === 'emerald' ? 'bg-emerald-600/15' : 'bg-violet-600/15'
              }`} />
              <div className="relative">
                {mockup}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function AnalysisMockup() {
  const tabs = ['Contexte', 'Besoin client', 'Technique', 'Attribution', 'Vigilance', 'Plan IA', 'Chiffrage']
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#080e22] overflow-hidden shadow-2xl shadow-black/50">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]" style={{ background: 'rgba(8,12,30,0.9)' }}>
        <Brain size={13} className="text-blue-400" />
        <span className="text-xs font-semibold text-white/60">Analyse IA — Réhabilitation énergétique Bât. B</span>
        <span className="ml-auto text-[10px] bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 px-2 py-0.5 rounded-full">Terminée</span>
      </div>
      <div className="flex gap-0 border-b border-white/[0.05] overflow-x-auto scrollbar-hide px-3 pt-2">
        {tabs.map((t, i) => (
          <button key={t} className={`flex-shrink-0 px-3 py-1.5 text-[10px] font-semibold rounded-t-lg transition-all ${
            i === 0 ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-500' : 'text-white/30 hover:text-white/60'
          }`}>{t}</button>
        ))}
      </div>
      <div className="p-4 space-y-3">
        {[
          { label: 'Maître d\'ouvrage', value: 'OPAC Isère — Bailleur social public' },
          { label: 'Localisation', value: 'Grenoble (38) — Zone périurbaine' },
          { label: 'Budget estimé', value: '1,2 M€ HT (isolation + CVC)' },
          { label: 'Date limite', value: '15 juin 2026 · J-21' },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-start gap-3">
            <span className="text-[10px] text-white/30 w-28 flex-shrink-0 mt-0.5">{label}</span>
            <span className="text-[11px] font-medium text-white/70 leading-relaxed">{value}</span>
          </div>
        ))}
        <div className="mt-3 p-3 rounded-xl bg-blue-500/[0.07] border border-blue-500/[0.15]">
          <p className="text-[10px] font-semibold text-blue-400 mb-1.5">📋 Synthèse IA</p>
          <p className="text-[11px] text-white/50 leading-relaxed">Mission de maîtrise d'œuvre complète. Forte composante énergétique (RT2012 → BBC). Profil correspondant à votre expertise ENR et isolation.</p>
        </div>
      </div>
    </div>
  )
}

function ScoringMockup() {
  const criteria = [
    { label: 'Adéquation géographique', score: 95, color: '#10b981', max: 100 },
    { label: 'Capacité technique', score: 82, color: '#3b82f6', max: 100 },
    { label: 'Budget dans cible', score: 78, color: '#8b5cf6', max: 100 },
    { label: 'Délai réalisable', score: 90, color: '#f59e0b', max: 100 },
    { label: 'Concurrence estimée', score: 65, color: '#ef4444', max: 100 },
  ]
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#080e22] overflow-hidden shadow-2xl shadow-black/50">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]" style={{ background: 'rgba(8,12,30,0.9)' }}>
        <Target size={13} className="text-emerald-400" />
        <span className="text-xs font-semibold text-white/60">Score Go / No Go</span>
      </div>
      <div className="p-5">
        {/* Big score */}
        <div className="text-center mb-6 py-5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/[0.15]">
          <p className="text-[11px] text-white/30 mb-1 font-semibold uppercase tracking-wider">Score global</p>
          <p className="text-6xl font-black text-emerald-400 leading-none mb-2">87<span className="text-2xl text-emerald-400/50">/100</span></p>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-xs font-bold text-emerald-300">
            <CheckCircle size={11} /> GO — Recommandé
          </span>
        </div>
        {/* Criteria */}
        <div className="space-y-3">
          {criteria.map(({ label, score, color }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-white/45">{label}</span>
                <span className="text-[10px] font-bold" style={{ color }}>{score}</span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function VeilleMockup() {
  const items = [
    { title: 'Centrale photovoltaïque ombrière 800kWc', loc: 'Lyon (69)', date: 'Il y a 2h', badge: 'GO', badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', score: 91 },
    { title: 'Réhabilitation thermique résidence Beaumont', loc: 'Grenoble (38)', date: 'Il y a 5h', badge: 'À étudier', badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20', score: 68 },
    { title: 'Installation chaufferie biomasse 250kW', loc: 'Annecy (74)', date: 'Hier', badge: 'GO', badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', score: 84 },
  ]
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#080e22] overflow-hidden shadow-2xl shadow-black/50">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]" style={{ background: 'rgba(8,12,30,0.9)' }}>
        <Radio size={13} className="text-violet-400" />
        <span className="text-xs font-semibold text-white/60">Veille BOAMP — Nouvelles opportunités</span>
        <span className="ml-auto text-[10px] bg-violet-500/15 border border-violet-500/25 text-violet-400 px-2 py-0.5 rounded-full">3 nouvelles</span>
      </div>
      <div className="p-4 space-y-2.5">
        {items.map(({ title, loc, date, badge, badgeColor, score }) => (
          <div key={title} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-all cursor-pointer group">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white/70 leading-snug mb-1 group-hover:text-white/90 transition-colors">{title}</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/30">{loc}</span>
                <span className="text-white/15">·</span>
                <span className="text-[10px] text-white/25">{date}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>{badge}</span>
              <span className="text-[10px] font-bold text-white/40">{score}/100</span>
            </div>
          </div>
        ))}
        <div className="text-center pt-1">
          <button className="text-[11px] text-white/25 hover:text-white/50 transition-colors">Voir 8 autres résultats →</button>
        </div>
      </div>
    </div>
  )
}

// ── Pipeline section ───────────────────────────────────────────────────────────

function PipelineSection() {
  const stages = [
    { name: 'Prospection', color: '#6366f1', count: 3 },
    { name: 'Vente interne', color: '#3b82f6', count: 5 },
    { name: 'Échanges client', color: '#0ea5e9', count: 4 },
    { name: 'Chiffrage', color: '#8b5cf6', count: 2 },
    { name: 'Juridique', color: '#f59e0b', count: 3 },
    { name: 'Remise offre', color: '#10b981', count: 6 },
    { name: 'Signature', color: '#ec4899', count: 1 },
  ]

  return (
    <section id="pipeline" className="py-20 sm:py-28 px-4 sm:px-6 border-t border-white/[0.05] relative overflow-hidden">
      <GlowOrbs variant="violet" />
      <div className="relative z-10 max-w-6xl mx-auto">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionLabel>Pipeline commercial IA</SectionLabel>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
              Votre pipeline<br />commercial en kanban.
            </h2>
            <p className="text-white/40 text-base leading-relaxed mb-8">
              Suivez chaque dossier à travers les 7 étapes de votre cycle commercial.
              De la prospection à la signature — avec sauvegarde automatique, historique
              et alertes d&apos;échéance.
            </p>
            <div className="space-y-4">
              {[
                { icon: Kanban,    text: 'Vue Kanban interactive avec drag & drop', color: 'text-violet-400' },
                { icon: Workflow,  text: '7 étapes : Prospection → Signature', color: 'text-blue-400' },
                { icon: Calendar,  text: 'Calendrier des échéances intégré', color: 'text-cyan-400' },
                { icon: Users,     text: 'Collaboration équipe en temps réel', color: 'text-emerald-400' },
              ].map(({ icon: Icon, text, color }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                    <Icon size={15} className={color} />
                  </div>
                  <span className="text-sm text-white/55">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Kanban mockup */}
          <div className="relative">
            <div className="absolute -inset-4 bg-violet-600/8 rounded-3xl blur-3xl" />
            <div className="relative rounded-2xl border border-white/[0.08] bg-[#080e22] overflow-hidden shadow-2xl shadow-black/50">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]" style={{ background: 'rgba(8,12,30,0.9)' }}>
                <Kanban size={13} className="text-violet-400" />
                <span className="text-xs font-semibold text-white/60">Pipeline commercial</span>
                <span className="ml-auto text-[10px] text-white/25">24 dossiers actifs</span>
              </div>
              <div className="p-3 flex gap-2 overflow-x-auto scrollbar-hide">
                {stages.map(({ name, color, count }) => (
                  <div key={name} className="flex-shrink-0 w-32">
                    <div className="flex items-center gap-1.5 mb-2 px-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <span className="text-[9px] font-bold text-white/45 truncate">{name}</span>
                      <span className="text-[8px] text-white/20 ml-auto">{count}</span>
                    </div>
                    <div className="space-y-1.5">
                      {Array.from({ length: Math.min(count, 2) }).map((_, i) => (
                        <div key={i} className="h-8 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color, opacity: 0.7 }} />
                          <div className="flex-1 space-y-0.5">
                            <div className="h-1.5 bg-white/[0.12] rounded-full" style={{ width: `${60 + i * 20}%` }} />
                          </div>
                        </div>
                      ))}
                      {count > 2 && (
                        <div className="text-[8px] text-white/20 text-center py-0.5">+{count - 2} autres</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── All features grid ──────────────────────────────────────────────────────────

function AllFeatures() {
  const allFeatures = [
    { icon: Brain,       color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',       title: 'Analyse IA DCE',            desc: 'Extraction automatique en 7 onglets structurés depuis PDF ou DOCX.' },
    { icon: Target,      color: 'text-emerald-400',  bg: 'bg-emerald-500/10 border-emerald-500/20', title: 'Score Go / No Go',           desc: 'Score pondéré sur 100 avec critères personnalisés et justification IA.', highlight: true },
    { icon: Radio,       color: 'text-violet-400',   bg: 'bg-violet-500/10 border-violet-500/20',   title: 'Veille BOAMP',              desc: 'Surveillance automatique avec filtres par mots-clés, secteur et région.' },
    { icon: Kanban,      color: 'text-cyan-400',     bg: 'bg-cyan-500/10 border-cyan-500/20',       title: 'Pipeline Kanban',           desc: '7 colonnes de prospection à signature. Suivi par dossier.' },
    { icon: PenLine,     color: 'text-amber-400',    bg: 'bg-amber-500/10 border-amber-500/20',     title: 'Mémoire technique IA',      desc: 'Génération automatique de la mémoire technique prête à compléter.' },
    { icon: Download,    color: 'text-rose-400',     bg: 'bg-rose-500/10 border-rose-500/20',       title: 'Export PDF professionnel',  desc: 'Export mise en page complète, prêt à intégrer dans votre dossier.' },
    { icon: UserSearch,  color: 'text-blue-400',     bg: 'bg-blue-500/10 border-blue-500/20',       title: 'Find contacts IA',          desc: 'Enrichissement automatique : emails et contacts décisionnaires.' },
    { icon: Mail,        color: 'text-violet-400',   bg: 'bg-violet-500/10 border-violet-500/20',   title: 'Campagnes email IA',        desc: 'Envoi de séquences email personnalisées depuis votre pipeline.' },
    { icon: BarChart3,   color: 'text-emerald-400',  bg: 'bg-emerald-500/10 border-emerald-500/20', title: 'Dashboard analytique',      desc: 'KPIs, taux de conversion, CA pipeline, alertes d\'échéance.' },
    { icon: Calendar,    color: 'text-cyan-400',     bg: 'bg-cyan-500/10 border-cyan-500/20',       title: 'Calendrier des remises',    desc: 'Vue calendrier de toutes vos échéances avec alertes J-14, J-7, J-3.' },
    { icon: Users,       color: 'text-amber-400',    bg: 'bg-amber-500/10 border-amber-500/20',     title: 'Collaboration équipe',      desc: 'Partagez projets et analyses avec plusieurs collaborateurs.' },
    { icon: CheckCircle, color: 'text-rose-400',     bg: 'bg-rose-500/10 border-rose-500/20',       title: 'Checklists & chiffrage',    desc: 'Pièces à fournir, actions commerciales et chiffrage intégré.' },
  ]

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 border-t border-white/[0.05] relative overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <SectionLabel>Toutes les fonctionnalités</SectionLabel>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight tracking-tight">
            Un outil complet, rien à ajouter.
          </h2>
          <p className="text-white/35 max-w-xl mx-auto text-base">Tout ce qu&apos;une équipe commerciale BTP ou ENR a besoin pour piloter ses appels d&apos;offres.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allFeatures.map(({ icon: Icon, color, bg, title, desc, highlight }) => (
            <div key={title}
              className={`relative rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-0.5 group ${
                highlight
                  ? 'bg-gradient-to-b from-emerald-600/10 to-transparent border-emerald-500/30'
                  : 'bg-white/[0.015] border-white/[0.07] hover:bg-white/[0.03] hover:border-white/12'
              }`}
            >
              {highlight && (
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent rounded-t-2xl" />
              )}
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${bg}`}>
                <Icon size={18} className={color} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1.5">{title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── How it works ───────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      n: '01',
      icon: Building2,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
      title: 'Configurez votre profil',
      desc: 'Renseignez vos zones géographiques, types de projets, capacités et certifications. PILOT+ adapte tout le scoring à votre entreprise.',
    },
    {
      n: '02',
      icon: FileSearch,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
      title: 'Importez vos DCE',
      desc: 'Uploadez PDF ou DOCX. En 30 secondes, l\'IA extrait et structure le contenu en 7 onglets détaillés.',
    },
    {
      n: '03',
      icon: Target,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10 border-violet-500/20',
      title: 'Obtenez votre score',
      desc: 'GO, À ÉTUDIER ou NO GO — avec justification factuelle. Décidez en 30 secondes, pas en 3 heures.',
    },
    {
      n: '04',
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      title: 'Pilotez jusqu\'à la signature',
      desc: 'Suivez chaque dossier dans le pipeline, rédigez la mémoire technique, envoyez des campagnes email et mesurez vos résultats.',
    },
  ]

  return (
    <section id="process" className="py-20 sm:py-28 px-4 sm:px-6 border-t border-white/[0.05] relative overflow-hidden">
      <GlowOrbs />
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <SectionLabel>Comment ça marche</SectionLabel>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight tracking-tight">
            De l&apos;annonce à la signature<br className="hidden sm:block" /> en 4 étapes.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connector */}
          <div className="hidden lg:block absolute top-10 left-[16%] right-[16%] h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.25) 15%, rgba(59,130,246,0.25) 85%, transparent)' }} />

          {steps.map(({ n, icon: Icon, color, bg, title, desc }) => (
            <div key={n} className="flex flex-col items-center text-center gap-5">
              <div className="relative">
                <div className={`w-20 h-20 rounded-2xl border flex items-center justify-center ${bg} relative z-10`}>
                  <Icon size={28} className={color} />
                </div>
                <span className="absolute -top-2.5 -right-2.5 z-20 text-[9px] font-black text-white/30 bg-[#080e22] border border-white/[0.1] rounded-full w-6 h-6 flex items-center justify-center">
                  {n}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="text-sm text-white/38 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Pricing ────────────────────────────────────────────────────────────────────

function Pricing() {
  const plans = [
    {
      id: 'free',
      name: 'Gratuit',
      price: '0€',
      period: 'pour toujours',
      tagline: 'Pour découvrir PILOT+',
      quota: '1 analyse IA',
      color: 'free' as const,
      items: [
        '1 analyse IA (à vie)',
        'Score Go / No Go basique',
        'Dashboard simplifié',
        'Accès lecture pipeline',
      ],
      notIncluded: ['Veille BOAMP', 'Export PDF', 'Find contacts', 'Équipe'],
      cta: 'Commencer gratuitement',
      href: '/signup',
      highlight: false,
    },
    {
      id: 'basic',
      name: 'Basic',
      price: '49€',
      period: '/ mois HT',
      tagline: 'Pour démarrer sérieusement',
      quota: '10 analyses / mois',
      color: 'blue' as const,
      items: [
        '10 analyses IA / mois',
        'Score Go / No Go complet',
        'Rapport détaillé 7 onglets',
        'Pipeline commercial',
        'Calendrier & alertes',
        'Find contacts : 50 / mois',
      ],
      notIncluded: ['Veille BOAMP', 'Export PDF', 'Équipe (5 users)', 'Campagnes email'],
      cta: 'Essayer Basic',
      href: '/signup',
      highlight: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '149€',
      period: '/ mois HT',
      tagline: 'Pour les équipes actives',
      quota: '50 analyses / mois',
      color: 'pro' as const,
      badge: 'Le plus populaire',
      items: [
        '50 analyses IA / mois',
        'Score + rapport complet',
        'Veille BOAMP automatique',
        'Export PDF professionnel',
        'Mémoire technique IA',
        'Campagnes email IA',
        'Find contacts : 200 / mois',
        'Équipe jusqu\'à 5 utilisateurs',
        'Support prioritaire',
      ],
      notIncluded: [],
      cta: 'Essayer Pro 14 jours',
      href: '/signup',
      highlight: true,
    },
    {
      id: 'enterprise',
      name: 'Entreprise',
      price: '499€',
      period: '/ mois HT',
      tagline: 'Pour scaler sans limite',
      quota: 'Illimité',
      color: 'purple' as const,
      items: [
        'Analyses IA illimitées',
        'Tout le plan Pro inclus',
        'Find contacts illimité',
        'API PILOT+ incluse',
        'Équipe illimitée',
        'Onboarding dédié',
        'SLA garanti 99.9%',
        'Support téléphonique dédié',
      ],
      notIncluded: [],
      cta: 'Nous contacter',
      href: 'mailto:contact@pilotplus.app?subject=Abonnement%20Entreprise',
      highlight: false,
    },
  ]

  const colorCfg = {
    free:   { border: 'border-white/[0.08]',         bg: 'bg-transparent',                       text: 'text-white/40',    ctaBg: 'bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-white/60' },
    blue:   { border: 'border-blue-500/[0.22]',       bg: 'bg-blue-600/[0.04]',                   text: 'text-blue-400',    ctaBg: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20' },
    pro:    { border: 'border-blue-400/[0.40]',       bg: 'bg-gradient-to-b from-blue-600/[0.12] to-transparent', text: 'text-blue-300', ctaBg: 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-xl shadow-blue-600/30' },
    purple: { border: 'border-violet-500/[0.25]',     bg: 'bg-violet-600/[0.04]',                 text: 'text-violet-400',  ctaBg: 'bg-violet-700 hover:bg-violet-600 text-white shadow-lg shadow-violet-600/20' },
  } as const

  return (
    <section id="pricing" className="py-20 sm:py-28 px-4 sm:px-6 border-t border-white/[0.05] relative overflow-hidden">
      <GlowOrbs />
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <SectionLabel>Tarifs</SectionLabel>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight tracking-tight">
            Simple, transparent, sans engagement.
          </h2>
          <p className="text-white/35 max-w-lg mx-auto text-base">
            Commencez gratuitement. Le quota se renouvelle le 1er de chaque mois. Annulation à tout moment.
          </p>
          <div className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-white/40 font-medium">Sans engagement · Paiement sécurisé Stripe · RGPD</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {plans.map(({ id, name, price, period, tagline, quota, color, badge, items, cta, href, highlight }) => {
            const cfg = colorCfg[color]
            return (
              <div key={id}
                className={`relative flex flex-col rounded-2xl border ${cfg.border} ${cfg.bg} overflow-hidden transition-all duration-300 hover:-translate-y-0.5`}
              >
                {/* Top glow for pro */}
                {highlight && (
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
                )}
                {/* Badge */}
                {(badge || highlight) && badge && (
                  <div className="absolute -top-3.5 inset-x-0 flex justify-center z-10">
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full text-white"
                      style={{ background: 'linear-gradient(90deg, #2563eb, #3b82f6)', boxShadow: '0 0 14px rgba(59,130,246,0.55)' }}>
                      {badge}
                    </span>
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  {/* Header */}
                  <div className="mb-5">
                    <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1 ${cfg.text}`}>{name}</p>
                    <p className="text-xs text-white/30 mb-4">{tagline}</p>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-black text-white leading-none">{price}</span>
                      <span className="text-xs text-white/30 mb-1">{period}</span>
                    </div>
                  </div>

                  {/* Quota chip */}
                  <div className={`rounded-xl px-4 py-2.5 mb-5 flex items-center gap-2 bg-white/[0.04] border border-white/[0.07]`}>
                    <Zap size={11} className={cfg.text} />
                    <span className={`text-xs font-bold ${cfg.text}`}>{quota}</span>
                  </div>

                  <div className="h-px bg-white/[0.05] mb-5" />

                  {/* Features */}
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {items.map(item => (
                      <li key={item} className="flex items-start gap-2.5 text-xs">
                        <CheckCircle size={12} className={`${cfg.text} flex-shrink-0 mt-0.5`} />
                        <span className="text-white/60">{item}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link href={href}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${cfg.ctaBg}`}
                  >
                    {cta} {id !== 'enterprise' && <ArrowRight size={13} />}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Feature comparison teaser */}
        <div className="mt-10 text-center">
          <p className="text-xs text-white/25">
            Tableau de comparaison complet disponible dans votre espace abonnement ·{' '}
            <Link href="/signup" className="text-blue-400/70 hover:text-blue-400 transition-colors underline underline-offset-2">
              Créer un compte gratuitement
            </Link>
          </p>
        </div>

        {/* Trust strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-10">
          {[
            { icon: Shield,    text: 'Paiement sécurisé',  sub: 'SSL + Stripe',   cls: 'text-blue-400',    bg: 'bg-blue-500/[0.07] border-blue-500/[0.14]'    },
            { icon: Clock,     text: 'Annulation libre',   sub: 'Sans préavis',   cls: 'text-emerald-400', bg: 'bg-emerald-500/[0.07] border-emerald-500/[0.14]' },
            { icon: Globe,     text: 'Données en EU',      sub: 'RGPD compliant', cls: 'text-amber-400',   bg: 'bg-amber-500/[0.07] border-amber-500/[0.14]'   },
            { icon: Bolt,      text: 'Quota mensuel',      sub: 'Reset le 1er',   cls: 'text-violet-400',  bg: 'bg-violet-500/[0.07] border-violet-500/[0.14]'  },
          ].map(({ icon: Icon, text, sub, cls, bg }) => (
            <div key={text} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${bg}`}>
              <Icon size={13} className={cls} />
              <div>
                <p className="text-xs font-semibold text-white/65">{text}</p>
                <p className="text-[10px] text-white/25">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Testimonials ───────────────────────────────────────────────────────────────

function Testimonials() {
  const testimonials = [
    {
      quote: 'Avant PILOT+, on passait 2h à éplucher chaque DCE. Maintenant, en 30 secondes on sait si ça vaut le coup de postuler. Le score Go/No Go est devenu notre filtre numéro 1.',
      author: 'Maxime D.',
      role: 'Directeur commercial',
      company: 'Installateur ENR — Isère',
      avatar: 'M',
      stars: 5,
    },
    {
      quote: 'La veille BOAMP automatique nous fait gagner un temps fou. On ne rate plus aucune consultation dans nos zones cibles, et le scoring est vraiment personnalisé à notre profil.',
      author: 'Sophie L.',
      role: 'Responsable appels d\'offres',
      company: 'Bureau d\'études structure — Lyon',
      avatar: 'S',
      stars: 5,
    },
    {
      quote: 'La mémoire technique générée par l\'IA est bluffante. Elle nous donne une base solide en quelques secondes. Nos taux de réponse ont augmenté de 40%.',
      author: 'Thomas R.',
      role: 'PDG',
      company: 'Entreprise de réhabilitation énergétique',
      avatar: 'T',
      stars: 5,
    },
  ]

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/[0.05] relative overflow-hidden">
      <GlowOrbs variant="warm" />
      <div className="relative z-10 max-w-6xl mx-auto">

        <div className="text-center mb-14">
          <SectionLabel>Témoignages</SectionLabel>
          <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
            Ils ont choisi PILOT+.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map(({ quote, author, role, company, avatar, stars }) => (
            <div key={author} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 flex flex-col gap-5 hover:border-white/12 transition-all">
              <div className="flex gap-1">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} size={13} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <blockquote className="text-sm text-white/55 leading-relaxed flex-1">
                &ldquo;{quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3 pt-2 border-t border-white/[0.05]">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/80">{author}</p>
                  <p className="text-[11px] text-white/30">{role} · {company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Final CTA ──────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden border-t border-white/[0.05]">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(37,99,235,0.07) 0%, transparent 70%)' }} />
      <GlowOrbs />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.09] mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-white/45">Gratuit pour commencer · Aucune carte requise</span>
        </div>

        <h2 className="text-4xl sm:text-6xl font-black text-white mb-6 leading-[1.07] tracking-[-0.02em]">
          Prêt à analyser<br />votre premier DCE ?
        </h2>
        <p className="text-white/38 text-lg mb-10 leading-relaxed max-w-xl mx-auto">
          Créez votre compte en 30 secondes et importez votre premier dossier immédiatement. Gratuit, sans CB.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/signup"
            className="inline-flex items-center justify-center gap-2 px-9 py-4 bg-blue-600 hover:bg-blue-500 text-white text-base font-bold rounded-2xl transition-all shadow-2xl shadow-blue-600/30 hover:shadow-blue-500/40 hover:-translate-y-px">
            Créer mon compte gratuitement <ArrowRight size={18} />
          </Link>
          <Link href="/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.1] text-white/60 hover:text-white font-semibold rounded-2xl transition-all text-base">
            Déjà un compte <ChevronRight size={16} />
          </Link>
        </div>

        {/* Mini features below CTA */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
          {[
            { icon: Check, text: 'Analyse en 30 secondes' },
            { icon: Check, text: 'Sans carte bancaire' },
            { icon: Check, text: 'Annulation libre' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-xs text-white/30">
              <Icon size={11} className="text-emerald-400" />
              {text}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Footer ─────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-white/[0.05] py-10 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Top row */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[10px] font-black tracking-tighter select-none">P+</span>
              </div>
              <span className="text-[14px] font-extrabold text-white tracking-tight">
                PILOT<span className="text-blue-400">+</span>
              </span>
            </div>
            <p className="text-xs text-white/25 leading-relaxed">
              Logiciel SaaS d&apos;analyse et de pilotage des appels d&apos;offres pour les entreprises du BTP et des énergies renouvelables.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-12 gap-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-3">Produit</p>
              <div className="space-y-2">
                {[
                  { label: 'Fonctionnalités', href: '#features' },
                  { label: 'Tarifs', href: '#pricing' },
                  { label: 'Comment ça marche', href: '#process' },
                ].map(({ label, href }) => (
                  <a key={label} href={href} className="block text-xs text-white/30 hover:text-white/60 transition-colors">{label}</a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-3">Compte</p>
              <div className="space-y-2">
                {[
                  { label: 'Connexion', href: '/login' },
                  { label: 'Inscription', href: '/signup' },
                ].map(({ label, href }) => (
                  <Link key={label} href={href} className="block text-xs text-white/30 hover:text-white/60 transition-colors">{label}</Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-3">Légal</p>
              <div className="space-y-2">
                {[
                  { label: 'Mentions légales', href: '/mentions-legales' },
                  { label: 'Confidentialité', href: '/politique-de-confidentialite' },
                  { label: 'CGU', href: '/cgu' },
                  { label: 'CGV', href: '/cgv' },
                ].map(({ label, href }) => (
                  <Link key={label} href={href} className="block text-xs text-white/30 hover:text-white/60 transition-colors">{label}</Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-white/[0.05]">
          <p className="text-[11px] text-white/18">© {new Date().getFullYear()} PILOT+. Tous droits réservés.</p>
          <div className="flex items-center gap-3 text-[11px] text-white/20">
            <span className="flex items-center gap-1"><Shield size={10} className="text-emerald-400/50" /> Hébergement EU · RGPD</span>
            <span className="text-white/10">·</span>
            <span>Propulsé par Claude AI (Anthropic)</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
