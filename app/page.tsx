import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight, FileSearch, Target, BarChart3,
  Zap, Shield, Clock, Radio, CheckCircle,
  ChevronRight, Cpu, TrendingUp, Building2, Star,
} from 'lucide-react'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/accueil')
  return <LandingPage />
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

function GlowOrbs() {
  return (
    <>
      <div className="absolute top-[-10%] left-[-5%] w-[700px] h-[700px] rounded-full bg-blue-600/8 blur-[140px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/8 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[30%] w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-[100px] pointer-events-none" />
    </>
  )
}

function GridBg() {
  return (
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
      style={{
        backgroundImage: 'linear-gradient(rgba(59,130,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,1) 1px, transparent 1px)',
        backgroundSize: '72px 72px',
      }} />
  )
}

// ── Landing page ───────────────────────────────────────────────────────────────

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#05091a] text-white overflow-x-hidden" style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)' }}>

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/5" style={{ background: 'rgba(5,9,26,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="relative h-8 w-28">
            <Image src="/logo/pilot-plus.png" alt="PILOT+" fill className="object-contain object-left brightness-0 invert" priority />
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: 'Fonctionnalités', href: '#features' },
              { label: 'Comment ça marche', href: '#process' },
              { label: 'Tarifs', href: '#pricing' },
            ].map(({ label, href }) => (
              <a key={href} href={href} className="text-sm text-white/50 hover:text-white transition-colors font-medium">{label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-white/50 hover:text-white transition-colors">
              Connexion
            </Link>
            <Link href="/signup" className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-lg shadow-blue-600/20">
              Commencer <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-32 px-6 overflow-hidden">
        <GlowOrbs />
        <GridBg />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-semibold text-blue-300 tracking-wide">Powered by Claude AI · BTP & Énergie renouvelable</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6">
            Analysez vos DCE.<br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Décidez en confiance.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/45 max-w-2xl mx-auto mb-10 leading-relaxed">
            PILOT+ lit vos dossiers de consultation, génère une synthèse structurée par IA
            et calcule un score <strong className="text-white/70">Go / No Go</strong> selon
            les critères propres à votre entreprise.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Link href="/signup"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-xl shadow-blue-600/25 text-base">
              Commencer gratuitement <ArrowRight size={16} />
            </Link>
            <Link href="/login"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-semibold rounded-xl transition-all text-base">
              J&apos;ai déjà un compte <ChevronRight size={16} />
            </Link>
          </div>

          {/* Mock UI card */}
          <div className="relative mx-auto max-w-3xl">
            {/* Glow behind card */}
            <div className="absolute -inset-4 bg-blue-600/10 rounded-3xl blur-2xl" />
            <div className="relative rounded-2xl border border-white/8 bg-[#080e22] overflow-hidden shadow-2xl shadow-black/50">
              {/* Fake topbar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/6 bg-[#0a1020]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                </div>
                <div className="flex-1 mx-4 h-6 bg-white/4 rounded-md flex items-center px-3">
                  <span className="text-[10px] text-white/20">app.pilot-plus.fr/projects/...</span>
                </div>
              </div>
              {/* Fake content */}
              <div className="p-5 grid grid-cols-3 gap-3">
                {[
                  { label: 'Score Go/No Go', value: '84/100', color: 'text-emerald-400', badge: 'GO', badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
                  { label: 'Projets actifs', value: '12', color: 'text-blue-400', badge: 'En cours', badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
                  { label: 'Taux de réussite', value: '68%', color: 'text-violet-400', badge: '+12%', badgeColor: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
                ].map(({ label, value, color, badge, badgeColor }) => (
                  <div key={label} className="bg-white/3 border border-white/6 rounded-xl p-4">
                    <p className="text-[10px] text-white/35 mb-1">{label}</p>
                    <p className={`text-2xl font-extrabold ${color} mb-2`}>{value}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeColor}`}>{badge}</span>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5 grid grid-cols-2 gap-3">
                {[
                  { label: 'Analyse IA générée', sub: 'Mission de maîtrise d\'œuvre — Isère', dot: 'bg-emerald-400' },
                  { label: 'Veille BOAMP active', sub: '7 nouvelles annonces trouvées', dot: 'bg-blue-400' },
                ].map(({ label, sub, dot }) => (
                  <div key={label} className="bg-white/3 border border-white/6 rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot} animate-pulse`} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white/70 truncate">{label}</p>
                      <p className="text-[10px] text-white/30 truncate">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ─────────────────────────────────────────────────────── */}
      <section className="py-10 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '< 30s',  label: 'Analyse complète d\'un DCE' },
            { value: '5',      label: 'Critères Go/No Go pondérables' },
            { value: '100%',   label: 'Données hébergées en Europe' },
            { value: 'Gratuit', label: 'Pour démarrer, sans CB' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-extrabold text-white mb-1">{value}</p>
              <p className="text-xs text-white/35 leading-relaxed">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 relative overflow-hidden">
        <GlowOrbs />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-blue-400 tracking-widest uppercase mb-3">Fonctionnalités</p>
            <h2 className="text-4xl font-extrabold text-white mb-4">Tout ce qu&apos;il faut pour décider vite</h2>
            <p className="text-white/40 max-w-xl mx-auto text-base">De l&apos;import du document à la décision finale — un seul outil, zéro friction.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: FileSearch,
                color: 'text-blue-400',
                glow: 'bg-blue-500/10 border-blue-500/20',
                title: 'Analyse IA des DCE',
                desc: 'Uploadez votre PDF ou DOCX. Claude extrait contexte, besoin client, spécificités techniques et pièces à fournir en quelques secondes.',
                items: ['7 onglets structurés', 'Extraction PDF & DOCX', 'Synthèse corporate'],
              },
              {
                icon: Target,
                color: 'text-cyan-400',
                glow: 'bg-cyan-500/10 border-cyan-500/20',
                title: 'Score Go / No Go',
                desc: '5 critères pondérés selon votre stratégie d\'entreprise. Chaque score est justifié par des extraits factuels du dossier.',
                items: ['Critères personnalisables', 'Pondérations × 1 à 5', 'Verdict GO / À ÉTUDIER / NO GO'],
                highlight: true,
              },
              {
                icon: Radio,
                color: 'text-violet-400',
                glow: 'bg-violet-500/10 border-violet-500/20',
                title: 'Veille BOAMP auto',
                desc: 'Définissez vos mots-clés et régions. PILOT+ surveille le BOAMP et vous remonte les nouvelles consultations à valider.',
                items: ['Filtres par mots-clés', 'Départements & types', 'Lien direct vers l\'annonce'],
              },
              {
                icon: BarChart3,
                color: 'text-emerald-400',
                glow: 'bg-emerald-500/10 border-emerald-500/20',
                title: 'Dashboard analytique',
                desc: 'Visualisez votre pipeline commercial : KPIs, taux de conversion, top clients, prochaines échéances.',
                items: ['Taux Go/No Go', 'Top clients & secteurs', 'Alertes J-14, J-7, J-3'],
              },
              {
                icon: Cpu,
                color: 'text-amber-400',
                glow: 'bg-amber-500/10 border-amber-500/20',
                title: 'Checklist & actions',
                desc: 'Suivez l\'avancement de vos dossiers avec des checklists interactives et un suivi des actions par appel d\'offres.',
                items: ['Pièces à fournir', 'Actions commerciales', 'Barre de progression'],
              },
              {
                icon: TrendingUp,
                color: 'text-rose-400',
                glow: 'bg-rose-500/10 border-rose-500/20',
                title: 'Suivi des résultats',
                desc: 'Clôturez vos projets (Gagné / Perdu / Abandonné) et mesurez l\'efficacité réelle de votre scoring IA.',
                items: ['Résultats par appel', 'CA réalisé suivi', 'Insights stratégiques'],
              },
            ].map(({ icon: Icon, color, glow, title, desc, items, highlight }) => (
              <div key={title}
                className={`relative rounded-2xl border p-6 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 group ${
                  highlight
                    ? 'bg-gradient-to-b from-blue-600/10 to-transparent border-blue-500/30'
                    : 'bg-white/[0.02] border-white/8 hover:bg-white/[0.04]'
                }`}
              >
                {highlight && (
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent rounded-t-2xl" />
                )}
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${glow}`}>
                  <Icon size={20} className={color} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-2">{title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
                </div>
                <ul className="space-y-2 mt-auto">
                  {items.map(item => (
                    <li key={item} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle size={13} className={`${color} flex-shrink-0`} />
                      <span className="text-white/55">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section id="process" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-blue-400 tracking-widest uppercase mb-3">Comment ça marche</p>
            <h2 className="text-4xl font-extrabold text-white mb-4">De l&apos;annonce à la décision en 3 étapes</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-9 left-[22%] right-[22%] h-px bg-gradient-to-r from-blue-500/30 via-cyan-500/30 to-blue-500/30" />

            {[
              { n: '01', icon: FileSearch, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', title: 'Importez vos documents', desc: 'Uploadez vos DCE (PDF, DOCX). PILOT+ extrait et structure automatiquement toutes les informations.' },
              { n: '02', icon: Cpu,        color: 'text-cyan-400',  bg: 'bg-cyan-500/10 border-cyan-500/20',  title: 'L\'IA analyse & score', desc: 'Claude génère une synthèse complète en 7 onglets et calcule votre score Go/No Go en quelques secondes.' },
              { n: '03', icon: Target,     color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20', title: 'Décidez & suivez', desc: 'Acceptez ou déclinez chaque opportunité avec des données factuelles. Suivez vos résultats en temps réel.' },
            ].map(({ n, icon: Icon, color, bg, title, desc }) => (
              <div key={n} className="flex flex-col items-center text-center gap-4">
                <div className="relative">
                  <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center ${bg}`}>
                    <Icon size={26} className={color} />
                  </div>
                  <span className="absolute -top-2 -right-2 text-[10px] font-extrabold text-white/25 bg-[#05091a] border border-white/10 rounded-full w-5 h-5 flex items-center justify-center">{n}</span>
                </div>
                <h3 className="text-base font-bold text-white">{title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust / social proof ────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-white/5 bg-white/[0.015]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', label: 'Données sécurisées', sub: 'Hébergement Supabase UE, chiffrement bout-en-bout' },
              { icon: Zap,    color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Analyse en < 30 secondes', sub: 'Propulsé par Claude AI (Anthropic)' },
              { icon: Clock,  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Disponible 24h/24', sub: 'SaaS cloud, aucune installation' },
            ].map(({ icon: Icon, color, bg, label, sub }) => (
              <div key={label} className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/8">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${bg}`}>
                  <Icon size={18} className={color} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-0.5">{label}</p>
                  <p className="text-xs text-white/35 leading-relaxed">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing teaser ──────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6 relative overflow-hidden border-t border-white/5">
        <GlowOrbs />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-blue-400 tracking-widest uppercase mb-3">Tarifs</p>
            <h2 className="text-4xl font-extrabold text-white mb-4">Simple et transparent</h2>
            <p className="text-white/40 text-base">Commencez gratuitement, passez à la vitesse supérieure quand vous êtes prêt.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {[
              {
                plan: 'Gratuit',
                price: '0€',
                period: 'pour toujours',
                desc: 'Pour découvrir PILOT+',
                items: ['3 analyses IA / mois', 'Score Go/No Go', 'Veille BOAMP', 'Dashboard'],
                cta: 'Commencer gratuitement',
                href: '/signup',
                highlight: false,
              },
              {
                plan: 'Pro',
                price: '49€',
                period: '/ mois',
                desc: 'Pour les équipes commerciales actives',
                items: ['Analyses illimitées', 'Scoring avancé', 'Export PDF', 'Partage de projets', 'Support prioritaire'],
                cta: 'Essayer 14 jours gratuit',
                href: '/signup',
                highlight: true,
              },
            ].map(({ plan, price, period, desc, items, cta, href, highlight }) => (
              <div key={plan}
                className={`relative rounded-2xl border p-8 flex flex-col gap-6 ${
                  highlight
                    ? 'bg-gradient-to-b from-blue-600/15 to-transparent border-blue-500/40'
                    : 'bg-white/[0.02] border-white/8'
                }`}
              >
                {highlight && (
                  <>
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent rounded-t-2xl" />
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-extrabold text-white bg-blue-600 px-3 py-1 rounded-full">
                      Recommandé
                    </span>
                  </>
                )}
                <div>
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">{plan}</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold text-white">{price}</span>
                    <span className="text-sm text-white/35">{period}</span>
                  </div>
                  <p className="text-sm text-white/40 mt-1">{desc}</p>
                </div>
                <ul className="space-y-3 flex-1">
                  {items.map(item => (
                    <li key={item} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                      <span className="text-white/60">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href={href}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                    highlight
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
                      : 'bg-white/6 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white'
                  }`}
                >
                  {cta} <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonial ─────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center gap-1 mb-6">
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={18} className="text-amber-400 fill-amber-400" />
            ))}
          </div>
          <blockquote className="text-xl font-medium text-white/80 leading-relaxed mb-6">
            &ldquo;Avant PILOT+, on passait 2h à éplucher chaque DCE. Maintenant, en 30 secondes on sait si ça vaut le coup de postuler.
            Le score Go/No Go est devenu notre filtre numéro 1.&rdquo;
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white">M</div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Maxime D.</p>
              <p className="text-xs text-white/35 flex items-center gap-1"><Building2 size={10} />Directeur commercial · Installateur ENR</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-600/5 to-transparent pointer-events-none" />
        <GlowOrbs />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-blue-300">Gratuit pour commencer · Aucune carte requise</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
            Prêt à analyser<br />votre premier DCE ?
          </h2>
          <p className="text-white/40 text-base mb-10">
            Créez votre compte en 30 secondes et importez votre premier dossier immédiatement.
          </p>
          <Link href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white text-base font-bold rounded-2xl transition-all shadow-2xl shadow-blue-600/30 hover:shadow-blue-500/40 hover:-translate-y-0.5">
            Créer mon compte gratuitement <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative h-7 w-24">
            <Image src="/logo/pilot-plus.png" alt="PILOT+" fill className="object-contain object-left brightness-0 invert opacity-50" />
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login"  className="text-xs text-white/30 hover:text-white/60 transition-colors">Connexion</Link>
            <Link href="/signup" className="text-xs text-white/30 hover:text-white/60 transition-colors">Inscription</Link>
          </div>
          <p className="text-xs text-white/20">© {new Date().getFullYear()} PILOT+ · Tous droits réservés</p>
        </div>
      </footer>

    </div>
  )
}
