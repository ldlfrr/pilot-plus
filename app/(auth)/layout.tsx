import Link from 'next/link'
import {
  Brain, Target, Radio, TrendingUp, Shield,
  Kanban, FileText, Users, BarChart3, Sparkles,
} from 'lucide-react'

const FEATURES = [
  { icon: Brain,    text: 'Analyse IA de vos DCE en 30 secondes', color: 'text-blue-400',    bg: 'rgba(59,130,246,0.10)',  border: 'rgba(59,130,246,0.20)' },
  { icon: Target,   text: 'Score Go/No Go personnalisé',          color: 'text-emerald-400', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.18)' },
  { icon: Radio,    text: 'Veille BOAMP automatique',             color: 'text-violet-400',  bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.18)' },
  { icon: Kanban,   text: 'Pipeline commercial 7 étapes',        color: 'text-cyan-400',    bg: 'rgba(6,182,212,0.08)',  border: 'rgba(6,182,212,0.18)' },
  { icon: Shield,   text: 'Données 100% hébergées en Europe',    color: 'text-amber-400',   bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.18)' },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: '#050914' }}>

      {/* ── Left panel ────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[54%] relative flex-col justify-between p-10 xl:p-14 overflow-hidden">

        {/* Backgrounds */}
        <div className="absolute inset-0">
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(145deg, #050914 0%, #06091f 40%, #080d28 100%)' }} />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: 'linear-gradient(rgba(59,130,246,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.9) 1px, transparent 1px)',
              backgroundSize: '72px 72px',
            }} />
          {/* Orbs */}
          <div className="absolute animate-orb-1 gpu" style={{
            top: '-15%', left: '-10%', width: 700, height: 700, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.09) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }} />
          <div className="absolute animate-orb-2 gpu" style={{
            bottom: '-20%', right: '-15%', width: 600, height: 600, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
            filter: 'blur(70px)',
          }} />
          <div className="absolute animate-orb-3 gpu" style={{
            top: '45%', left: '35%', width: 380, height: 380, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }} />
          {/* Right border */}
          <div className="absolute top-0 right-0 bottom-0 w-px"
            style={{ background: 'linear-gradient(180deg, transparent 5%, rgba(59,130,246,0.20) 30%, rgba(59,130,246,0.30) 50%, rgba(59,130,246,0.20) 70%, transparent 95%)' }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <span className="text-white text-[12px] font-black tracking-tighter select-none">P+</span>
          </div>
          <div>
            <p className="text-[18px] font-extrabold text-white tracking-tight leading-none">
              PILOT<span className="text-blue-400" style={{ textShadow: '0 0 16px rgba(96,165,250,0.6)' }}>+</span>
            </p>
            <p className="text-[9px] font-bold tracking-[0.22em] uppercase" style={{ color: 'rgba(96,165,250,0.45)' }}>
              Copilot IA · Analyse DCE
            </p>
          </div>
        </div>

        {/* Hero */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-8 max-w-lg">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full w-fit mb-7"
            style={{ background: 'rgba(59,130,246,0.09)', border: '1px solid rgba(59,130,246,0.20)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[11px] text-blue-300/80 font-semibold tracking-wide">Propulsé par Claude AI · Anthropic</span>
          </div>

          {/* Headline */}
          <h1 className="text-[2.6rem] xl:text-5xl font-black text-white leading-[1.07] mb-5 tracking-[-0.02em]">
            Gagnez plus<br />
            <span className="text-gradient-animate" style={{ display: 'inline-block' }}>
              d&apos;appels d&apos;offres.
            </span>
          </h1>

          <p className="text-sm leading-relaxed mb-8 max-w-sm" style={{ color: 'rgba(255,255,255,0.42)' }}>
            PILOT+ analyse vos DCE par IA, calcule votre score Go/No Go personnalisé
            et pilote votre pipeline commercial de la veille à la signature.
          </p>

          {/* Feature list */}
          <ul className="space-y-2.5 mb-10">
            {FEATURES.map(({ icon: Icon, text, color, bg, border }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: bg, border: `1px solid ${border}` }}>
                  <Icon size={13} className={color} />
                </div>
                <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.54)' }}>{text}</span>
              </li>
            ))}
          </ul>

          {/* Stats */}
          <div className="flex items-center gap-8 pt-5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { value: '< 30s', label: 'par analyse' },
              { value: '7',     label: 'onglets IA' },
              { value: '100%',  label: 'données EU' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-2xl font-extrabold text-white tabular-nums leading-none">{value}</p>
                <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.28)' }}>{label}</p>
              </div>
            ))}
            <div className="ml-auto">
              <div className="flex items-center gap-0.5 mb-1">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-3 h-3" fill="#fbbf24" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-[10px] text-right" style={{ color: 'rgba(255,255,255,0.28)' }}>BTP & ENR</p>
            </div>
          </div>
        </div>

        {/* Social proof */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 p-4 rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(16px)',
            }}>
            <div className="flex -space-x-2 flex-shrink-0">
              {['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444'].map((c, i) => (
                <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ background: c, border: '2px solid #050914' }}>
                  {['M','P','A','L','S'][i]}
                </div>
              ))}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.70)' }}>
                Équipes commerciales BTP & ENR
              </p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.32)' }}>
                Utilisent PILOT+ pour qualifier leurs appels d&apos;offres
              </p>
            </div>
            <div className="ml-auto flex-shrink-0">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.13)', border: '1px solid rgba(16,185,129,0.22)' }}>
                <BarChart3 size={13} className="text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 relative overflow-hidden min-h-screen">

        {/* Background */}
        <div className="absolute inset-0" style={{ background: '#080e22' }}>
          <div className="absolute top-0 left-0 right-0 h-px lg:hidden"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.20), transparent)' }} />
          <div className="absolute gpu" style={{
            top: '-20%', right: '-10%', width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.055) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }} />
          <div className="absolute gpu" style={{
            bottom: '-15%', left: '-5%', width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.045) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }} />
          {/* Subtle dot grid */}
          <div className="absolute inset-0 opacity-[0.018]"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }} />
        </div>

        {/* Mobile logo */}
        <div className="relative z-10 mb-8 lg:hidden flex flex-col items-center">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <span className="text-white text-[10px] font-black">P+</span>
            </div>
            <p className="text-lg font-extrabold text-white tracking-tight">
              PILOT<span className="text-blue-400">+</span>
            </p>
          </div>
          <p className="text-[9px] font-bold tracking-[0.2em] uppercase" style={{ color: 'rgba(96,165,250,0.45)' }}>
            Copilot IA · Analyse DCE
          </p>
        </div>

        {/* Form card */}
        <div className="relative z-10 w-full max-w-[430px]">

          {/* Top glow line */}
          <div className="absolute -top-px left-8 right-8 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.45), transparent)' }} />

          <div className="rounded-2xl p-8 sm:p-9"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.048) 0%, rgba(255,255,255,0.022) 100%)',
              border: '1px solid rgba(255,255,255,0.085)',
              backdropFilter: 'blur(28px)',
              boxShadow: '0 8px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)',
            }}>
            {children}
          </div>
        </div>

        <p className="relative z-10 mt-5 text-[11px] text-center" style={{ color: 'rgba(255,255,255,0.16)' }}>
          © {new Date().getFullYear()} PILOT+ · Tous droits réservés ·{' '}
          <Link href="/politique-de-confidentialite" className="hover:text-white/35 transition-colors">Confidentialité</Link>
        </p>
      </div>

    </div>
  )
}
