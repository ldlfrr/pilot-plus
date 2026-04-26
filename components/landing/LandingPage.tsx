'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  motion, useInView, useScroll, useTransform,
  useMotionValue, useSpring, AnimatePresence,
} from 'framer-motion'
import {
  ArrowRight, FileSearch, Target, BarChart3, Zap, Shield, Clock,
  Radio, CheckCircle, ChevronRight, TrendingUp, Building2, Star,
  FileText, Users, Mail, UserSearch, Brain, Sparkles, Kanban,
  Calendar, Download, Search, BellRing, PenLine, Check,
  Workflow, Bolt, Globe, PlayCircle, ChevronDown, Plus,
  Cpu, Lock, Layers, MessageSquare, Eye, Linkedin,
} from 'lucide-react'

// ── Animation presets (Apple-style easing) ────────────────────────────────────

const ease = [0.22, 1, 0.36, 1] as const

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
}
const fadeIn = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.6, ease } },
}
const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show:   { opacity: 1, scale: 1,   transition: { duration: 0.7, ease } },
}
const stagger = (delay = 0.12) => ({
  show: { transition: { staggerChildren: delay } },
})

function Section({ children, className = '', id = '', style }: {
  children: React.ReactNode; className?: string; id?: string; style?: React.CSSProperties
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.section
      id={id} ref={ref}
      variants={{ hidden: {}, show: {} }}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      className={className}
      style={style}
    >
      {children}
    </motion.section>
  )
}

// ── Shared primitives ─────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={fadeUp}
      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/8 border border-blue-500/18 mb-5"
    >
      <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
      <span className="text-[11px] font-bold text-blue-400 tracking-[0.18em] uppercase">{children}</span>
    </motion.div>
  )
}

function GlowOrb({ style }: { style: React.CSSProperties }) {
  return <div className="absolute rounded-full pointer-events-none" style={style} />
}

// ── Animated + logo ───────────────────────────────────────────────────────────
// 3 full rotations in 2s → hold for 7s → repeat (total cycle = 9s)

function AnimatedPlus({ size = 'nav' }: { size?: 'nav' | 'hero' }) {
  return (
    <motion.span
      animate={{ rotate: [0, 1080, 1080] }}
      transition={{
        duration: 9,
        times: [0, 2 / 9, 1],           // 0s → 2s spin → 9s hold
        ease: ['easeInOut', 'linear'],
        repeat: Infinity,
        repeatType: 'loop',
      }}
      className="text-blue-400"
      style={{
        display: 'inline-block',
        transformOrigin: 'center',
        textShadow: size === 'hero'
          ? '0 0 32px rgba(96,165,250,0.9)'
          : '0 0 24px rgba(96,165,250,0.75)',
      }}
    >
      +
    </motion.span>
  )
}

// ── 1. Navbar ─────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { label: 'Fonctionnalités', href: '#features' },
    { label: 'Pipeline IA',     href: '#pipeline' },
    { label: 'Comment ça marche', href: '#process' },
    { label: 'Tarifs',          href: '#pricing' },
  ]

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0,   opacity: 1 }}
      transition={{ duration: 0.6, ease }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(4,8,18,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.055)' : '1px solid transparent',
        boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.4)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <span className="text-[22px] font-black text-white tracking-tight select-none">
            PILOT<AnimatedPlus />
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {links.map(({ label, href }) => (
            <a key={href} href={href}
              className="text-[13px] text-white/45 hover:text-white transition-colors duration-200 font-medium">
              {label}
            </a>
          ))}
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Link href="/login"
            className="hidden sm:block text-sm font-medium text-white/40 hover:text-white transition-colors px-3 py-2">
            Connexion
          </Link>
          <Link href="/signup"
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-500/35">
            Essai gratuit <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </motion.header>
  )
}

// ── 2. Hero ───────────────────────────────────────────────────────────────────

function Hero() {
  const { scrollY } = useScroll()
  const y      = useTransform(scrollY, [0, 600], [0, 120])
  const opacity = useTransform(scrollY, [0, 400], [1, 0])

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 pb-8 overflow-hidden px-4">

      {/* Background */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 120% 80% at 50% -10%, rgba(37,99,235,0.14) 0%, rgba(4,8,18,0) 65%), #040812' }} />
      <div className="absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage: 'linear-gradient(rgba(59,130,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,1) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }} />
      <GlowOrb style={{ top: '10%', left: '8%',  width: 600, height: 600, background: 'radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 65%)', filter: 'blur(80px)' }} />
      <GlowOrb style={{ top: '20%', right: '5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 65%)', filter: 'blur(80px)' }} />
      <GlowOrb style={{ bottom: '0%', left: '30%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 65%)', filter: 'blur(80px)' }} />

      <motion.div style={{ y, opacity }} className="relative z-10 w-full max-w-5xl mx-auto text-center flex flex-col items-center">

        {/* ── Big centered logo ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease }}
          className="mb-8 flex flex-col items-center"
        >
          <p className="text-5xl sm:text-6xl font-black text-white tracking-tight select-none">
            PILOT<AnimatedPlus size="hero" />
          </p>
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease }}
          className="flex items-center gap-2.5 px-4 py-2 rounded-full mb-8"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.20)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-[11px] font-semibold text-white/50 tracking-wide">Propulsé par Claude AI · Anthropic · BTP & Énergie renouvelable</span>
          <span className="hidden sm:flex items-center gap-1">
            <span className="w-px h-3 bg-white/10" />
            <span className="text-[10px] px-2 py-0.5 rounded-full text-blue-300 font-bold"
              style={{ background: 'rgba(59,130,246,0.18)', border: '1px solid rgba(59,130,246,0.30)' }}>
              v2 Pipeline IA
            </span>
          </span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease }}
          className="text-[3rem] sm:text-[5rem] lg:text-[6.5rem] font-black leading-[1.02] tracking-[-0.03em] mb-4 text-white"
        >
          Gagnez plus<br />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent"
            style={{ backgroundSize: '200% 100%', animation: 'gradientShift 4s ease infinite' }}>
            d&apos;appels d&apos;offres.
          </span>
        </motion.h1>

        {/* SEO sub-label */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6, ease }}
          className="text-sm text-white/28 mb-4 font-medium tracking-wide"
        >
          Analyseur DCE IA · Score Go/No Go · Veille BOAMP · Pipeline commercial · BTP & ENR
        </motion.p>

        {/* Body */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.6, ease }}
          className="text-lg sm:text-xl text-white/42 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          PILOT+ <strong className="text-white/70">analyse vos DCE en 30 secondes</strong> grâce à l&apos;IA,
          calcule un <strong className="text-white/70">score Go&nbsp;/&nbsp;No&nbsp;Go</strong> personnalisé
          et pilote votre pipeline de la veille à la signature.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.6, ease }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-14"
        >
          <Link href="/signup"
            className="group inline-flex items-center justify-center gap-2 px-9 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all text-base shadow-2xl shadow-blue-600/35 hover:shadow-blue-500/45 hover:-translate-y-0.5"
          >
            Commencer gratuitement
            <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href="#features"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 border text-white/60 hover:text-white font-semibold rounded-2xl transition-all text-base hover:-translate-y-0.5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <PlayCircle size={16} className="text-white/35" />
            Voir en action
          </a>
        </motion.div>

        {/* Social proof strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.6, ease }}
          className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-16"
        >
          <div className="flex -space-x-2.5">
            {['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444'].map((c, i) => (
              <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: c, border: '2px solid #040812' }}>
                {['M','P','A','L','S'][i]}
              </div>
            ))}
          </div>
          <div className="text-center sm:text-left">
            <div className="flex items-center gap-1 mb-0.5 justify-center sm:justify-start">
              {[1,2,3,4,5].map(i => (
                <svg key={i} className="w-3 h-3" fill="#fbbf24" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="text-xs text-white/55 font-semibold ml-1">5.0</span>
            </div>
            <p className="text-xs text-white/30">Utilisé par des équipes BTP & ENR</p>
          </div>
          <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.20)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-emerald-400">Gratuit pour démarrer</span>
          </div>
        </motion.div>

        {/* Hero mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          transition={{ delay: 0.9, duration: 1.0, ease }}
          className="relative w-full max-w-5xl"
        >
          <div className="absolute -inset-6 bg-blue-600/8 rounded-3xl blur-3xl pointer-events-none" />
          <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/70"
            style={{ border: '1px solid rgba(255,255,255,0.09)' }}>

            {/* Browser chrome */}
            <div className="flex items-center gap-3 px-4 py-3"
              style={{ background: 'rgba(6,10,22,0.98)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              </div>
              <div className="flex-1 mx-2 h-6 rounded-md flex items-center px-3 gap-2"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                <Shield size={9} className="text-emerald-400/50" />
                <span className="text-[10px] text-white/20">pilot-plus.fr/projects/réhabilitation-energétique-bâtiment-B</span>
              </div>
              <span className="text-[9px] bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 px-2 py-0.5 rounded-full font-bold">● Live</span>
            </div>

            {/* App content */}
            <div className="p-4 sm:p-5" style={{ background: 'rgba(4,8,20,0.98)' }}>
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
                {[
                  { label: 'Score Go/No Go', value: '87/100', color: 'text-emerald-400', badge: '✓ GO',  badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
                  { label: 'Pipeline actifs', value: '14',     color: 'text-blue-400',    badge: 'En cours', badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
                  { label: 'Taux conversion', value: '71%',    color: 'text-violet-400',  badge: '+8%',  badgeColor: 'bg-violet-500/15 text-violet-400 border-violet-500/25' },
                  { label: 'CA pipeline',    value: '2.4M€',   color: 'text-amber-400',   badge: 'Actif',badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
                ].map(({ label, value, color, badge, badgeColor }) => (
                  <div key={label} className="rounded-xl p-3 sm:p-4"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-[9px] sm:text-[10px] text-white/30 mb-1.5">{label}</p>
                    <p className={`text-xl sm:text-2xl font-extrabold ${color} mb-1.5 leading-none`}>{value}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>{badge}</span>
                  </div>
                ))}
              </div>

              {/* Feature pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { icon: Brain,  label: 'Analyse IA générée',    sub: 'Réhabilitation énergétique — Isère', dot: 'bg-emerald-400', dotBg: 'bg-emerald-500/10' },
                  { icon: Radio,  label: 'Veille BOAMP active',   sub: '11 nouvelles annonces correspondantes', dot: 'bg-blue-400', dotBg: 'bg-blue-500/10' },
                  { icon: Target, label: 'Score calculé : 87/100', sub: 'Recommandation : GO — Postuler',      dot: 'bg-violet-400', dotBg: 'bg-violet-500/10' },
                ].map(({ icon: Icon, label, sub, dot, dotBg }) => (
                  <div key={label} className="rounded-xl px-3.5 py-3 flex items-center gap-3"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className={`w-8 h-8 rounded-lg ${dotBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={14} className={dot.replace('bg-', 'text-')} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-white/70 truncate">{label}</p>
                      <p className="text-[10px] text-white/30 truncate">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.6 }}
          className="mt-10 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="w-5 h-8 rounded-full border border-white/15 flex items-start justify-center pt-1.5"
          >
            <div className="w-1 h-2 rounded-full bg-white/30" />
          </motion.div>
        </motion.div>

      </motion.div>
    </section>
  )
}

// ── 3. Stats bar ──────────────────────────────────────────────────────────────

function StatsBar() {
  const stats = [
    { value: '< 30s',    label: 'Analyse complète d\'un DCE' },
    { value: '7',        label: 'Onglets IA structurés' },
    { value: '100%',     label: 'Données hébergées en UE' },
    { value: 'Gratuit',  label: 'Pour démarrer, sans CB' },
  ]
  return (
    <Section className="relative py-10 sm:py-14 border-y"
      style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.012)' } as React.CSSProperties}>
      <motion.div variants={stagger(0.1)} className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10">
        {stats.map(({ value, label }) => (
          <motion.div key={label} variants={fadeUp} className="text-center">
            <p className="text-3xl sm:text-4xl font-extrabold text-white mb-1.5 tracking-tight">{value}</p>
            <p className="text-xs text-white/30 leading-relaxed">{label}</p>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  )
}

// ── 4. Problem / Solution (pain points) ──────────────────────────────────────

function ProblemSection() {
  const pains = [
    { emoji: '⏳', text: '2h à éplucher chaque DCE pour trouver les infos clés' },
    { emoji: '🎯', text: 'Impossible de savoir vite si ça vaut la peine de postuler' },
    { emoji: '📡', text: 'Des opportunités BOAMP ratées faute de veille régulière' },
    { emoji: '📊', text: 'Pipeline dispersé entre Excel, emails et tableaux blancs' },
    { emoji: '✍️', text: 'Mémoire technique réécrite from scratch à chaque fois' },
    { emoji: '📅', text: 'Échéances oubliées, dossiers remis à la dernière minute' },
  ]

  return (
    <Section id="problem" className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div variants={stagger(0.08)} className="text-center mb-14">
          <SectionLabel>Le problème</SectionLabel>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight tracking-tight">
            Répondre aux appels d&apos;offres<br className="hidden sm:block" /> prend trop de temps.
          </motion.h2>
          <motion.p variants={fadeUp} className="text-white/38 max-w-xl mx-auto text-base leading-relaxed">
            Sans outil dédié, les équipes commerciales BTP & ENR perdent des heures sur des tâches
            qui devraient prendre des minutes.
          </motion.p>
        </motion.div>

        <motion.div variants={stagger(0.07)} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pains.map(({ emoji, text }) => (
            <motion.div key={text} variants={scaleIn}
              className="flex items-start gap-3.5 p-4 rounded-2xl"
              style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.10)' }}>
              <span className="text-xl flex-shrink-0 mt-0.5">{emoji}</span>
              <p className="text-sm text-white/55 leading-relaxed">{text}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Bridge to solution */}
        <motion.div variants={fadeUp} className="text-center mt-14">
          <div className="inline-flex flex-col items-center gap-3">
            <p className="text-base text-white/30 font-medium">Et si tout ça pouvait se faire en 30 secondes ?</p>
            <ChevronDown size={20} className="text-blue-400/50 animate-bounce" />
          </div>
        </motion.div>
      </div>
    </Section>
  )
}

// ── 5. Features showcase (scroll-reveal per feature) ─────────────────────────

function FeaturesShowcase() {
  const features = [
    {
      side: 'right' as const,
      badge: 'Analyse IA DCE',
      headline: 'Votre DCE analysé en 30 secondes chrono.',
      sub: 'Uploadez un PDF ou DOCX. PILOT+ extrait et structure automatiquement le contenu en 7 onglets : contexte projet, besoin client, spécificités techniques, critères d\'attribution, concurrents, points de vigilance et plan de réponse.',
      highlights: [
        { icon: Brain,      text: '7 onglets d\'analyse structurée', color: 'text-blue-400' },
        { icon: FileSearch, text: 'PDF, DOCX, multi-documents',       color: 'text-cyan-400' },
        { icon: Sparkles,   text: 'Mémoire technique IA prête',       color: 'text-violet-400' },
      ],
      color: 'blue',
      gradient: 'from-blue-600/15',
    },
    {
      side: 'left' as const,
      badge: 'Score Go / No Go',
      headline: 'Décidez en 30 secondes, pas en 3 heures.',
      sub: 'Configurez vos critères une fois (zones, types de projets, capacités, certifications). PILOT+ calcule un score pondéré sur 100 avec une recommandation GO / À ÉTUDIER / NO GO justifiée par des extraits factuels du document.',
      highlights: [
        { icon: Target,    text: 'Critères 100% personnalisables',  color: 'text-emerald-400' },
        { icon: BarChart3, text: 'Score justifié avec extraits',    color: 'text-blue-400' },
        { icon: TrendingUp,text: 'Métriques affinées dans le temps', color: 'text-amber-400' },
      ],
      color: 'emerald',
      gradient: 'from-emerald-600/12',
    },
    {
      side: 'right' as const,
      badge: 'Veille BOAMP',
      headline: 'Ne ratez plus aucune opportunité.',
      sub: 'Configurez vos mots-clés, types de marchés et zones géographiques. PILOT+ surveille le BOAMP en continu et vous remonte les nouvelles consultations qui correspondent — avec lien direct et scoring automatique.',
      highlights: [
        { icon: Radio,   text: 'Surveillance BOAMP automatique',    color: 'text-violet-400' },
        { icon: BellRing,text: 'Alertes email en temps réel',       color: 'text-amber-400' },
        { icon: Search,  text: 'Filtres avancés secteur & région',  color: 'text-blue-400' },
      ],
      color: 'violet',
      gradient: 'from-violet-600/12',
    },
    {
      side: 'left' as const,
      badge: 'Pipeline commercial IA',
      headline: '7 étapes, de la prospection à la signature.',
      sub: 'Vue Kanban interactive pour suivre chaque dossier à travers toutes les étapes commerciales. Déplacez les projets par drag & drop, ajoutez des notes collaboratives, suivez les tâches et visualisez votre performance.',
      highlights: [
        { icon: Kanban,   text: 'Pipeline Kanban drag & drop',      color: 'text-cyan-400' },
        { icon: Users,    text: 'Collaboration équipe temps réel',  color: 'text-blue-400' },
        { icon: Calendar, text: 'Alertes d\'échéance intégrées',   color: 'text-emerald-400' },
      ],
      color: 'cyan',
      gradient: 'from-cyan-600/12',
    },
  ]

  return (
    <section id="features" className="py-20 sm:py-32 px-4 sm:px-6 relative overflow-hidden">
      <GlowOrb style={{ top: '20%', right: '-5%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)', filter: 'blur(100px)' }} />

      <div className="max-w-6xl mx-auto space-y-32">
        <Section className="text-center">
          <motion.div variants={stagger(0.12)}>
            <SectionLabel>Fonctionnalités clés</SectionLabel>
            <motion.h2 variants={fadeUp}
              className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight tracking-tight">
              Tout ce qu&apos;il faut pour décider<br className="hidden sm:block" /> vite et bien.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/35 max-w-xl mx-auto text-base">
              De l&apos;import du document à la signature — un seul outil, zéro friction.
            </motion.p>
          </motion.div>
        </Section>

        {features.map(({ side, badge, headline, sub, highlights, color, gradient }) => (
          <Section key={badge}
            className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center ${side === 'left' ? 'lg:grid-flow-dense' : ''}`}>
            {/* Text */}
            <motion.div variants={stagger(0.1)} className={side === 'left' ? 'lg:col-start-2' : ''}>
              <SectionLabel>{badge}</SectionLabel>
              <motion.h3 variants={fadeUp}
                className="text-3xl sm:text-4xl font-extrabold text-white mb-5 leading-tight">
                {headline}
              </motion.h3>
              <motion.p variants={fadeUp} className="text-white/42 text-base leading-relaxed mb-8">{sub}</motion.p>
              <motion.ul variants={stagger(0.08)} className="space-y-3.5">
                {highlights.map(({ icon: Icon, text, color: c }) => (
                  <motion.li key={text} variants={fadeUp} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                      <Icon size={16} className={c} />
                    </div>
                    <span className="text-sm text-white/60">{text}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>

            {/* Visual card */}
            <motion.div
              variants={scaleIn}
              className={`relative ${side === 'left' ? 'lg:col-start-1 lg:row-start-1' : ''}`}
            >
              <div className={`absolute -inset-6 bg-gradient-to-br ${gradient} to-transparent rounded-3xl blur-3xl pointer-events-none`} />
              <FeatureCard color={color} badge={badge} />
            </motion.div>
          </Section>
        ))}
      </div>
    </section>
  )
}

function FeatureCard({ color, badge }: { color: string; badge: string }) {
  const configs: Record<string, React.ReactNode> = {
    'Analyse IA DCE': (
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain size={14} className="text-blue-400" />
          <span className="text-xs font-semibold text-white/60">Analyse IA — Réhabilitation Bât. B</span>
          <span className="ml-auto text-[10px] bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 px-2 py-0.5 rounded-full">✓ Terminée</span>
        </div>
        <div className="flex gap-1 border-b border-white/5 pb-3 mb-4 overflow-x-auto">
          {['Contexte','Besoin','Technique','Attribution','Vigilance','Plan IA','Chiffrage'].map((t,i) => (
            <span key={t} className={`flex-shrink-0 px-3 py-1 text-[9px] font-semibold rounded-lg ${i===0 ? 'bg-blue-600/20 text-blue-400' : 'text-white/25'}`}>{t}</span>
          ))}
        </div>
        {[
          { label: 'Maître d\'ouvrage', value: 'OPAC Isère — Bailleur social public' },
          { label: 'Budget estimé',     value: '1,2 M€ HT (isolation + CVC)' },
          { label: 'Date limite',       value: '15 juin 2026 · J-21' },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-start gap-3 mb-2.5">
            <span className="text-[10px] text-white/25 w-28 flex-shrink-0">{label}</span>
            <span className="text-[11px] font-medium text-white/65">{value}</span>
          </div>
        ))}
        <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <p className="text-[10px] font-semibold text-blue-400 mb-1">📋 Synthèse IA</p>
          <p className="text-[10px] text-white/45 leading-relaxed">Profil correspondant. Forte composante ENR. Recommandation : postuler en priorité.</p>
        </div>
      </div>
    ),
    'Score Go / No Go': (
      <div className="p-5">
        <div className="text-center py-5 rounded-xl mb-4" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <p className="text-[10px] text-white/30 mb-1 uppercase tracking-wider font-semibold">Score global</p>
          <p className="text-6xl font-black text-emerald-400 leading-none mb-2">87<span className="text-2xl opacity-50">/100</span></p>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-xs font-bold text-emerald-300">
            <CheckCircle size={11} /> GO — Recommandé
          </span>
        </div>
        {[
          { label: 'Adéquation géo.',     score: 95, color: '#10b981' },
          { label: 'Capacité technique',  score: 82, color: '#3b82f6' },
          { label: 'Budget dans cible',   score: 78, color: '#8b5cf6' },
          { label: 'Concurrence',         score: 65, color: '#f59e0b' },
        ].map(({ label, score, color: c }) => (
          <div key={label} className="mb-2.5">
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-white/40">{label}</span>
              <span className="text-[10px] font-bold" style={{ color: c }}>{score}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full" style={{ width: `${score}%`, background: c }} />
            </div>
          </div>
        ))}
      </div>
    ),
    'Veille BOAMP': (
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Radio size={13} className="text-violet-400" />
          <span className="text-xs font-semibold text-white/60">Veille BOAMP — Nouvelles opportunités</span>
          <span className="ml-auto text-[10px] bg-violet-500/15 border border-violet-500/25 text-violet-400 px-2 py-0.5 rounded-full">3 nouvelles</span>
        </div>
        {[
          { title: 'Centrale photovoltaïque 800kWc', loc: 'Lyon (69)', score: 91, badge: 'GO' },
          { title: 'Réhabilitation thermique Beaumont', loc: 'Grenoble (38)', score: 68, badge: 'À étudier' },
          { title: 'Chaufferie biomasse 250kW', loc: 'Annecy (74)', score: 84, badge: 'GO' },
        ].map(({ title, loc, score, badge: b }) => (
          <div key={title} className="flex items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer transition-colors hover:border-white/10"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-white/65 truncate">{title}</p>
              <p className="text-[10px] text-white/30">{loc}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${b === 'GO' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>{b}</span>
              <span className="text-[10px] text-white/35 font-bold">{score}/100</span>
            </div>
          </div>
        ))}
      </div>
    ),
    'Pipeline commercial IA': (
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Kanban size={13} className="text-cyan-400" />
          <span className="text-xs font-semibold text-white/60">Pipeline commercial</span>
          <span className="ml-auto text-[10px] text-white/25">24 dossiers</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { name: 'Prospection', color: '#6366f1', count: 3 },
            { name: 'Chiffrage', color: '#8b5cf6', count: 2 },
            { name: 'Juridique', color: '#f59e0b', count: 3 },
            { name: 'Signature', color: '#ec4899', count: 1 },
          ].map(({ name, color: c, count }) => (
            <div key={name} className="flex-shrink-0 w-36">
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
                <span className="text-[9px] font-bold text-white/40 truncate">{name}</span>
                <span className="text-[8px] text-white/20 ml-auto">{count}</span>
              </div>
              <div className="space-y-1.5">
                {Array.from({ length: Math.min(count, 2) }).map((_, i) => (
                  <div key={i} className="h-10 rounded-lg px-2 flex items-center gap-2"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: c, opacity: 0.7 }} />
                    <div className="flex-1 space-y-1">
                      <div className="h-1.5 rounded-full bg-white/10" style={{ width: `${70 + i*15}%` }} />
                      <div className="h-1 rounded-full bg-white/5" style={{ width: `${50 + i*10}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  }

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/50"
      style={{ background: 'rgba(6,10,24,0.95)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {configs[badge] ?? null}
    </div>
  )
}

// ── 6. All features grid ──────────────────────────────────────────────────────

function AllFeaturesGrid() {
  const features = [
    { icon: Brain,      color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',       title: 'Analyse IA DCE',           desc: 'Extraction en 7 onglets depuis PDF ou DOCX en 30 secondes.' },
    { icon: Target,     color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', title: 'Score Go / No Go',          desc: 'Score pondéré sur 100 avec critères personnalisés et justification IA.', highlight: true },
    { icon: Radio,      color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20',   title: 'Veille BOAMP',             desc: 'Surveillance automatique avec filtres secteur & région.' },
    { icon: Kanban,     color: 'text-cyan-400',     bg: 'bg-cyan-500/10 border-cyan-500/20',       title: 'Pipeline Kanban',          desc: '7 colonnes de prospection à signature. Drag & drop.' },
    { icon: PenLine,    color: 'text-amber-400',    bg: 'bg-amber-500/10 border-amber-500/20',     title: 'Mémoire technique IA',     desc: 'Génération automatique de la mémoire technique prête à compléter.' },
    { icon: Download,   color: 'text-rose-400',     bg: 'bg-rose-500/10 border-rose-500/20',       title: 'Export PDF pro',           desc: 'Mise en page complète, prêt à intégrer dans votre dossier.' },
    { icon: Linkedin,   color: 'text-blue-400',     bg: 'bg-blue-500/10 border-blue-500/20',       title: 'Find LinkedIn IA',         desc: 'Identifiez les décisionnaires LinkedIn par entreprise et titre de poste.' },
    { icon: BellRing,  color: 'text-violet-400',   bg: 'bg-violet-500/10 border-violet-500/20',   title: 'Alertes & notifications',  desc: 'Alertes J-14/J-7/J-3 sur vos échéances. Notifications BOAMP instantanées.' },
    { icon: BarChart3,  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', title: 'Dashboard analytique',     desc: 'KPIs, taux de conversion, CA pipeline, alertes d\'échéance.' },
    { icon: Calendar,   color: 'text-cyan-400',     bg: 'bg-cyan-500/10 border-cyan-500/20',       title: 'Calendrier des remises',   desc: 'Vue calendrier de toutes vos échéances avec alertes J-14/7/3.' },
    { icon: Users,      color: 'text-amber-400',    bg: 'bg-amber-500/10 border-amber-500/20',     title: 'Collaboration équipe',     desc: 'Partagez projets et analyses avec tous vos collaborateurs.' },
    { icon: CheckCircle,color: 'text-rose-400',     bg: 'bg-rose-500/10 border-rose-500/20',       title: 'Checklists & chiffrage',   desc: 'Pièces à fournir, actions commerciales et chiffrage intégré.' },
  ]

  return (
    <Section className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden border-t"
      style={{ borderColor: 'rgba(255,255,255,0.05)' } as React.CSSProperties}>
      <div className="max-w-6xl mx-auto">
        <motion.div variants={stagger(0.1)} className="text-center mb-14">
          <SectionLabel>Toutes les fonctionnalités</SectionLabel>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight tracking-tight">
            Un outil complet, rien à ajouter.
          </motion.h2>
          <motion.p variants={fadeUp} className="text-white/35 max-w-xl mx-auto text-base">
            Tout ce qu&apos;une équipe commerciale BTP ou ENR a besoin pour piloter ses appels d&apos;offres.
          </motion.p>
        </motion.div>

        <motion.div variants={stagger(0.06)} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, color, bg, title, desc, highlight }) => (
            <motion.div key={title} variants={scaleIn}
              whileHover={{ y: -4, transition: { duration: 0.2, ease } }}
              className={`relative rounded-2xl border p-5 flex flex-col gap-4 transition-colors cursor-default ${
                highlight
                  ? 'bg-gradient-to-b from-emerald-600/10 to-transparent border-emerald-500/30'
                  : 'bg-white/[0.015] border-white/[0.07] hover:bg-white/[0.03] hover:border-white/12'
              }`}
            >
              {highlight && (
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent rounded-t-2xl" />
              )}
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${bg}`}>
                <Icon size={18} className={color} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1.5">{title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  )
}

// ── 7. How it works ───────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    { n: '01', icon: Building2, color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',    title: 'Configurez votre profil', desc: 'Zones géographiques, types de projets, capacités et certifications. Le scoring s\'adapte automatiquement.' },
    { n: '02', icon: FileSearch,color: 'text-cyan-400',    bg: 'bg-cyan-500/10 border-cyan-500/20',    title: 'Importez vos DCE', desc: 'Uploadez PDF ou DOCX. En 30 secondes, l\'IA extrait et structure le contenu en 7 onglets.' },
    { n: '03', icon: Target,    color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20',title: 'Obtenez votre score', desc: 'GO, À ÉTUDIER ou NO GO — avec justification factuelle. Décidez en 30 secondes.' },
    { n: '04', icon: TrendingUp,color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20',title: 'Pilotez jusqu\'à la signature', desc: 'Pipeline, mémoire technique, campagnes email — tout jusqu\'à la réponse finale.' },
  ]

  return (
    <Section id="process" className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden border-t"
      style={{ borderColor: 'rgba(255,255,255,0.05)' } as React.CSSProperties}>
      <GlowOrb style={{ top: '30%', left: '-5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)', filter: 'blur(80px)' }} />

      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div variants={stagger(0.1)} className="text-center mb-16">
          <SectionLabel>Comment ça marche</SectionLabel>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight tracking-tight">
            De l&apos;annonce à la signature<br className="hidden sm:block" /> en 4 étapes.
          </motion.h2>
        </motion.div>

        <motion.div variants={stagger(0.15)} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          <div className="hidden lg:block absolute top-10 left-[16%] right-[16%] h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.22) 15%, rgba(59,130,246,0.22) 85%, transparent)' }} />

          {steps.map(({ n, icon: Icon, color, bg, title, desc }) => (
            <motion.div key={n} variants={fadeUp} className="flex flex-col items-center text-center gap-5">
              <div className="relative">
                <div className={`w-20 h-20 rounded-2xl border flex items-center justify-center ${bg}`}>
                  <Icon size={28} className={color} />
                </div>
                <span className="absolute -top-2.5 -right-2.5 text-[9px] font-black text-white/30 rounded-full w-6 h-6 flex items-center justify-center"
                  style={{ background: '#040812', border: '1px solid rgba(255,255,255,0.10)' }}>
                  {n}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="text-sm text-white/38 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  )
}

// ── 8. Pricing ────────────────────────────────────────────────────────────────

function Pricing() {
  const [annual, setAnnual] = useState(false)

  const plans = [
    {
      id: 'free', name: 'Gratuit', price: 0, tagline: 'Pour découvrir',
      quota: '1 analyse IA',
      items: ['1 analyse IA (à vie)', 'Score Go/No Go basique', 'Dashboard simplifié', 'Accès pipeline'],
      notIncluded: ['Veille BOAMP', 'Export PDF', 'Find LinkedIn', 'Équipe'],
      cta: 'Commencer gratuitement', href: '/signup', color: 'free',
    },
    {
      id: 'basic', name: 'Basic', price: 49, tagline: 'Pour démarrer',
      quota: '10 analyses / mois',
      items: ['10 analyses IA / mois', 'Score Go/No Go complet', 'Rapport 7 onglets', 'Pipeline commercial', 'Calendrier & alertes', 'Find LinkedIn : 30 / mois'],
      cta: 'Essayer Basic', href: '/signup', color: 'blue',
    },
    {
      id: 'pro', name: 'Pro', price: 149, tagline: 'Pour les équipes actives',
      quota: '50 analyses / mois', badge: '⭐ Le plus populaire',
      items: ['50 analyses IA / mois', 'Score + rapport complet', 'Veille BOAMP automatique', 'Export PDF professionnel', 'Mémoire technique IA', 'Find LinkedIn : 150 / mois', "Équipe jusqu'à 5 utilisateurs", 'Alertes & notifications avancées', 'Support prioritaire'],
      cta: 'Essayer Pro 14 jours', href: '/signup', color: 'pro', highlight: true,
    },
    {
      id: 'enterprise', name: 'Entreprise', price: 499, tagline: 'Pour scaler sans limite',
      quota: 'Illimité',
      items: ['Analyses illimitées', 'Tout le plan Pro', 'Find LinkedIn illimité', 'API PILOT+', 'Équipe illimitée', 'Onboarding dédié', 'SLA 99.9%', 'Support téléphonique'],
      cta: 'Nous contacter', href: 'mailto:contact@pilot-plus.fr?subject=Abonnement%20Entreprise', color: 'purple',
    },
  ]

  const discount = 0.17 // 17% annual discount
  const colorCfg = {
    free:   { border: 'border-white/[0.08]', bg: '',    text: 'text-white/40', cta: 'bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-white/60' },
    blue:   { border: 'border-blue-500/[0.22]', bg: 'bg-blue-600/[0.04]', text: 'text-blue-400', cta: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20' },
    pro:    { border: 'border-blue-400/[0.40]', bg: 'bg-gradient-to-b from-blue-600/[0.12] to-transparent', text: 'text-blue-300', cta: 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-xl shadow-blue-600/30' },
    purple: { border: 'border-violet-500/[0.25]', bg: 'bg-violet-600/[0.04]', text: 'text-violet-400', cta: 'bg-violet-700 hover:bg-violet-600 text-white shadow-lg shadow-violet-600/20' },
  } as const

  return (
    <Section id="pricing" className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden border-t"
      style={{ borderColor: 'rgba(255,255,255,0.05)' } as React.CSSProperties}>
      <GlowOrb style={{ bottom: '10%', right: '-5%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)', filter: 'blur(100px)' }} />

      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div variants={stagger(0.1)} className="text-center mb-10">
          <SectionLabel>Tarifs</SectionLabel>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight tracking-tight">
            Simple, transparent, sans engagement.
          </motion.h2>

          {/* Annual / Monthly toggle */}
          <motion.div variants={fadeUp} className="inline-flex items-center gap-4 px-5 py-3 rounded-2xl mt-2"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button onClick={() => setAnnual(false)}
              className={`text-sm font-semibold transition-colors ${!annual ? 'text-white' : 'text-white/35'}`}>
              Mensuel
            </button>
            <button onClick={() => setAnnual(v => !v)}
              className="relative w-12 h-6 rounded-full transition-colors"
              style={{ background: annual ? '#2563eb' : 'rgba(255,255,255,0.12)' }}>
              <motion.span animate={{ x: annual ? 24 : 2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
            <span className="flex items-center gap-2">
              <button onClick={() => setAnnual(true)}
                className={`text-sm font-semibold transition-colors ${annual ? 'text-white' : 'text-white/35'}`}>
                Annuel
              </button>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-emerald-400"
                style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.22)' }}>
                -17%
              </span>
            </span>
          </motion.div>
        </motion.div>

        <motion.div variants={stagger(0.1)} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {plans.map(({ id, name, price, tagline, quota, badge, items, cta, href, color, highlight }) => {
            const cfg = colorCfg[color as keyof typeof colorCfg]
            const finalPrice = annual && price > 0 ? Math.round(price * (1 - discount)) : price
            return (
              <motion.div key={id} variants={scaleIn}
                whileHover={{ y: -6, transition: { duration: 0.2, ease } }}
                className={`relative flex flex-col rounded-2xl border overflow-hidden ${cfg.border} ${cfg.bg}`}
              >
                {highlight && (
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
                )}
                {badge && (
                  <div className="absolute -top-4 inset-x-0 flex justify-center z-10">
                    <span className="text-[10px] font-bold px-3 py-1.5 rounded-full text-white"
                      style={{ background: 'linear-gradient(90deg, #2563eb, #3b82f6)', boxShadow: '0 0 14px rgba(59,130,246,0.55)' }}>
                      {badge}
                    </span>
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1 ${cfg.text}`}>{name}</p>
                  <p className="text-xs text-white/30 mb-4">{tagline}</p>

                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-4xl font-black text-white leading-none">
                      {price === 0 ? '0€' : `${finalPrice}€`}
                    </span>
                    {price > 0 && <span className="text-xs text-white/30 mb-1">/ mois HT</span>}
                  </div>
                  {annual && price > 0 && (
                    <p className="text-[10px] text-white/25 mb-3 line-through">{price}€/mois</p>
                  )}

                  <div className="rounded-xl px-3 py-2 mb-4 flex items-center gap-2"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <Zap size={11} className={cfg.text} />
                    <span className={`text-xs font-bold ${cfg.text}`}>{quota}</span>
                  </div>

                  <div className="h-px bg-white/[0.05] mb-4" />

                  <ul className="space-y-2 flex-1 mb-6">
                    {items.map(item => (
                      <li key={item} className="flex items-start gap-2 text-xs">
                        <Check size={11} className={`${cfg.text} flex-shrink-0 mt-0.5`} />
                        <span className="text-white/55">{item}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href={href}
                    className={`flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-bold transition-all ${cfg.cta}`}>
                    {cta} {id !== 'enterprise' && <ArrowRight size={13} />}
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center justify-center gap-6">
          {[
            { icon: Shield,  text: 'Paiement sécurisé', sub: 'SSL + Stripe'    },
            { icon: Clock,   text: 'Annulation libre',  sub: 'Sans préavis'    },
            { icon: Globe,   text: 'Données en EU',     sub: 'RGPD compliant'  },
            { icon: Bolt,    text: 'Quota mensuel',     sub: 'Reset le 1er'    },
          ].map(({ icon: Icon, text, sub }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon size={13} className="text-white/25" />
              <span className="text-xs text-white/40 font-medium">{text}</span>
              <span className="text-[11px] text-white/20">· {sub}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </Section>
  )
}

// ── 9. Testimonials ───────────────────────────────────────────────────────────

function Testimonials() {
  const testimonials = [
    { quote: 'Avant PILOT+, on passait 2h à éplucher chaque DCE. Maintenant, en 30 secondes on sait si ça vaut le coup. Le score Go/No Go est devenu notre filtre numéro 1.', author: 'Maxime D.', role: 'Directeur commercial', company: 'Installateur ENR — Isère', avatar: 'M', stars: 5, color: '#3b82f6' },
    { quote: 'La veille BOAMP automatique nous fait gagner un temps fou. On ne rate plus aucune consultation dans nos zones cibles, et le scoring est vraiment personnalisé.', author: 'Sophie L.', role: 'Responsable appels d\'offres', company: 'Bureau d\'études structure — Lyon', avatar: 'S', stars: 5, color: '#8b5cf6' },
    { quote: 'La mémoire technique générée par l\'IA est bluffante. Une base solide en quelques secondes. Nos taux de réponse ont augmenté de 40% en 3 mois.', author: 'Thomas R.', role: 'PDG', company: 'Réhabilitation énergétique', avatar: 'T', stars: 5, color: '#10b981' },
  ]

  return (
    <Section className="py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden border-t"
      style={{ borderColor: 'rgba(255,255,255,0.05)' } as React.CSSProperties}>
      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div variants={stagger(0.1)} className="text-center mb-14">
          <SectionLabel>Témoignages</SectionLabel>
          <motion.h2 variants={fadeUp} className="text-4xl font-extrabold text-white mb-4 tracking-tight">
            Ils ont choisi PILOT+.
          </motion.h2>
        </motion.div>

        <motion.div variants={stagger(0.12)} className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map(({ quote, author, role, company, avatar, stars, color }) => (
            <motion.div key={author} variants={scaleIn}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="rounded-2xl border p-6 flex flex-col gap-5 hover:border-white/12 transition-colors"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex gap-1">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} size={13} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <blockquote className="text-sm text-white/55 leading-relaxed flex-1">
                &ldquo;{quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: color }}>
                  {avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/80">{author}</p>
                  <p className="text-[11px] text-white/30">{role} · {company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  )
}

// ── 10. FAQ ───────────────────────────────────────────────────────────────────

function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  const faqs = [
    { q: "Qu'est-ce qu'un analyseur DCE ?", a: "Un analyseur DCE (Dossier de Consultation des Entreprises) lit automatiquement vos documents d'appel d'offres et en extrait les informations clés : maître d'ouvrage, périmètre technique, critères d'attribution, délais et budget. PILOT+ analyse un DCE complet en moins de 30 secondes grâce à l'IA Claude d'Anthropic." },
    { q: "Comment analyser un DCE avec PILOT+ ?", a: "Créez un projet, uploadez vos fichiers PDF ou DOCX, et l'IA lance automatiquement l'analyse. En moins de 30 secondes vous obtenez 7 onglets structurés : contexte, besoin client, technique, critères d'attribution, concurrents, vigilance et plan de réponse." },
    { q: "PILOT+ fonctionne-t-il pour les marchés publics BTP ?", a: "Oui, PILOT+ est conçu spécifiquement pour le BTP et les ENR. Il intègre la veille BOAMP automatique, un scoring Go/No Go adapté aux marchés publics français (MAPA, appels d'offres ouverts et restreints) et un pipeline de la prospection à la signature." },
    { q: "Quel est le prix pour analyser des DCE ?", a: "PILOT+ est gratuit pour démarrer (1 analyse IA complète, sans carte bancaire). Les plans payants commencent à 49€/mois HT (10 analyses). Le plan Pro à 149€/mois inclut veille BOAMP et export PDF. Tous les plans sont sans engagement." },
    { q: "Mes données DCE sont-elles sécurisées ?", a: "Oui. Vos documents sont hébergés exclusivement sur des serveurs en Europe (Union Européenne), conformément au RGPD. Les accès sont chiffrés (HTTPS/TLS) et chaque compte dispose de son espace isolé. Supabase (base de données) et Anthropic (IA) sont nos seuls sous-traitants." },
  ]

  return (
    <Section className="py-16 px-4 sm:px-6 border-t"
      style={{ borderColor: 'rgba(255,255,255,0.05)' } as React.CSSProperties}>
      <div className="max-w-3xl mx-auto">
        <motion.div variants={stagger(0.1)} className="text-center mb-10">
          <SectionLabel>Questions fréquentes</SectionLabel>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
            Tout savoir sur PILOT+
          </motion.h2>
        </motion.div>

        <motion.div variants={stagger(0.08)} className="space-y-3">
          {faqs.map(({ q, a }, i) => (
            <motion.div key={i} variants={fadeUp}
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-sm font-semibold text-white/80">{q}</span>
                <motion.div animate={{ rotate: open === i ? 45 : 0 }} transition={{ duration: 0.2 }}>
                  <Plus size={15} className="text-white/30 flex-shrink-0" />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease }}
                  >
                    <div className="px-5 pb-5 border-t border-white/5">
                      <p className="text-sm text-white/45 leading-relaxed pt-4">{a}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  )
}

// ── 11. Final CTA ─────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <Section className="py-24 sm:py-36 px-4 sm:px-6 relative overflow-hidden border-t"
      style={{ borderColor: 'rgba(255,255,255,0.05)' } as React.CSSProperties}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(37,99,235,0.09) 0%, transparent 70%)' }} />
      <GlowOrb style={{ top: '-10%', left: '-5%', width: 700, height: 700, background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', filter: 'blur(100px)' }} />

      <motion.div variants={stagger(0.12)} className="relative z-10 max-w-3xl mx-auto text-center">
        <motion.div variants={fadeUp}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-white/45">Gratuit pour commencer · Aucune carte requise</span>
        </motion.div>

        <motion.h2 variants={fadeUp}
          className="text-4xl sm:text-6xl font-black text-white mb-6 leading-[1.07] tracking-[-0.02em]">
          Prêt à analyser<br />votre premier DCE ?
        </motion.h2>

        <motion.p variants={fadeUp} className="text-white/38 text-lg mb-10 leading-relaxed max-w-xl mx-auto">
          Créez votre compte en 30 secondes. Importez votre premier dossier immédiatement. Sans engagement.
        </motion.p>

        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup"
            className="group inline-flex items-center justify-center gap-2 px-9 py-4 bg-blue-600 hover:bg-blue-500 text-white text-base font-bold rounded-2xl transition-all shadow-2xl shadow-blue-600/30 hover:-translate-y-0.5">
            Créer mon compte gratuitement
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border text-white/60 hover:text-white font-semibold rounded-2xl transition-all text-base hover:-translate-y-0.5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
            Déjà un compte <ChevronRight size={16} />
          </Link>
        </motion.div>

        <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-5 mt-10">
          {[
            { icon: Check, text: 'Analyse en 30 secondes' },
            { icon: Check, text: 'Sans carte bancaire' },
            { icon: Check, text: 'Annulation libre' },
            { icon: Check, text: 'Données hébergées en EU' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-xs text-white/30">
              <Icon size={11} className="text-emerald-400" />{text}
            </div>
          ))}
        </motion.div>
      </motion.div>
    </Section>
  )
}

// ── 12. Footer ────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t py-10 px-6" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
          <div className="max-w-xs">
            <div className="flex items-center mb-3">
              <span className="text-[18px] font-black text-white tracking-tight">PILOT<AnimatedPlus /></span>
            </div>
            <p className="text-xs text-white/25 leading-relaxed">
              Logiciel SaaS d&apos;analyse et de pilotage des appels d&apos;offres pour les entreprises du BTP et des énergies renouvelables.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-12 gap-y-3">
            {[
              { title: 'Produit', links: [{ label: 'Fonctionnalités', href: '#features' }, { label: 'Tarifs', href: '#pricing' }, { label: 'Comment ça marche', href: '#process' }] },
              { title: 'Compte', links: [{ label: 'Connexion', href: '/login' }, { label: 'Inscription', href: '/signup' }] },
              { title: 'Légal', links: [{ label: 'Mentions légales', href: '/mentions-legales' }, { label: 'Confidentialité', href: '/politique-de-confidentialite' }, { label: 'CGU', href: '/cgu' }, { label: 'CGV', href: '/cgv' }] },
            ].map(({ title, links }) => (
              <div key={title}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-3">{title}</p>
                <div className="space-y-2">
                  {links.map(({ label, href }) => (
                    href.startsWith('/') && !href.startsWith('/#')
                      ? <Link key={label} href={href} className="block text-xs text-white/30 hover:text-white/60 transition-colors">{label}</Link>
                      : <a key={label} href={href} className="block text-xs text-white/30 hover:text-white/60 transition-colors">{label}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-white/5">
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

// ── Main export ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: '#040812', fontFamily: 'var(--font-inter, Inter, sans-serif)' }}>
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50%       { background-position: 100% 50%; }
        }
      `}</style>

      <Navbar />
      <Hero />
      <StatsBar />
      <ProblemSection />
      <FeaturesShowcase />
      <AllFeaturesGrid />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  )
}
