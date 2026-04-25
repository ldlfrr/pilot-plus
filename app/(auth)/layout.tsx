import { Zap, Target, TrendingUp, Shield, BarChart3, Radio } from 'lucide-react'

const FEATURES = [
  { icon: Zap,        text: 'Analyse IA de vos DCE en moins de 30 secondes' },
  { icon: Target,     text: 'Score Go/No Go pour chaque appel d\'offres' },
  { icon: Radio,      text: 'Veille BOAMP automatique selon vos critères' },
  { icon: TrendingUp, text: 'Dashboard commercial avec KPIs temps réel' },
  { icon: Shield,     text: 'Données hébergées en Europe — sécurisées' },
]

const STATS = [
  { value: '< 30s', label: 'par analyse' },
  { value: '5',     label: 'critères scoring' },
  { value: '100%',  label: 'données EU' },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: '#050914' }}>

      {/* ── Left panel — branding ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col justify-between p-12 overflow-hidden">

        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, #050914 0%, #080e22 50%, #0c1428 100%)',
          }} />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.028]" style={{
            backgroundImage: 'linear-gradient(rgba(59,130,246,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.9) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }} />
          {/* Animated orbs */}
          <div className="absolute animate-orb-1 gpu" style={{
            top: '-15%', left: '-10%',
            width: 700, height: 700,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }} />
          <div className="absolute animate-orb-2 gpu" style={{
            bottom: '-20%', right: '-15%',
            width: 600, height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%)',
            filter: 'blur(70px)',
          }} />
          <div className="absolute animate-orb-3 gpu" style={{
            top: '40%', left: '40%',
            width: 350, height: 350,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }} />
          {/* Right border gradient */}
          <div className="absolute top-0 right-0 bottom-0 w-px"
            style={{ background: 'linear-gradient(180deg, transparent, rgba(59,130,246,0.25), transparent)' }} />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <p className="text-[22px] font-extrabold text-white tracking-tight leading-none">
            PILOT<span className="text-blue-400" style={{ textShadow: '0 0 20px rgba(96,165,250,0.7)' }}>+</span>
          </p>
          <p className="text-[10px] font-bold tracking-[0.22em] uppercase mt-0.5"
            style={{ color: 'rgba(96,165,250,0.50)' }}>
            Copilot IA · Analyse DCE
          </p>
        </div>

        {/* Hero */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-10">
          <div
            className="mb-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full w-fit"
            style={{ background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.22)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs text-blue-300 font-semibold">Powered by Claude AI (Anthropic)</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-4 tracking-tight">
            Décidez plus vite,<br />
            <span
              className="text-gradient-animate"
              style={{ display: 'inline-block' }}
            >
              gagnez plus d&apos;appels.
            </span>
          </h1>

          <p className="text-sm leading-relaxed max-w-md mb-8" style={{ color: 'rgba(255,255,255,0.42)' }}>
            PILOT+ analyse vos DCE par IA, score chaque opportunité et vous dit
            exactement où concentrer votre énergie commerciale.
          </p>

          {/* Features */}
          <ul className="space-y-3 mb-10">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.18)' }}
                >
                  <Icon size={14} className="text-blue-400" />
                </div>
                <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.52)' }}>{text}</span>
              </li>
            ))}
          </ul>

          {/* Stats */}
          <div className="flex items-center gap-8 pt-6"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="text-2xl font-extrabold text-white tabular-nums">{value}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>{label}</p>
              </div>
            ))}
            <div className="ml-auto">
              <div className="flex items-center gap-0.5 mb-1">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-3 h-3" style={{ color: '#fbbf24', fill: '#fbbf24' }} viewBox="0 0 20 20">
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
          <div
            className="flex items-center gap-3 p-4 rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div className="flex -space-x-2 flex-shrink-0">
              {['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444'].map((c, i) => (
                <div key={i}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ background: c, border: '2px solid #050914' }}>
                  {['M','P','A','L','S'][i]}
                </div>
              ))}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.68)' }}>
                Équipes commerciales BTP & ENR
              </p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.32)' }}>
                Utilisent PILOT+ pour qualifier leurs appels d&apos;offres
              </p>
            </div>
            <div className="ml-auto flex-shrink-0">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.22)' }}>
                <BarChart3 size={14} className="text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">

        {/* Background */}
        <div className="absolute inset-0" style={{ background: '#080e22' }}>
          <div className="absolute top-0 left-0 right-0 h-px lg:hidden"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.20), transparent)' }} />
          <div className="absolute gpu" style={{
            top: '-20%', right: '-10%',
            width: 500, height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }} />
          <div className="absolute gpu" style={{
            bottom: '-15%', left: '-5%',
            width: 400, height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }} />
        </div>

        {/* Mobile logo */}
        <div className="relative z-10 mb-8 lg:hidden flex flex-col items-center">
          <p className="text-xl font-extrabold text-white tracking-tight">
            PILOT<span className="text-blue-400" style={{ textShadow: '0 0 16px rgba(96,165,250,0.7)' }}>+</span>
          </p>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase mt-0.5"
            style={{ color: 'rgba(96,165,250,0.50)' }}>
            Copilot IA · Analyse DCE
          </p>
        </div>

        {/* Form card */}
        <div className="relative z-10 w-full max-w-[420px]">
          <div
            className="rounded-2xl p-8"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 8px 48px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            {children}
          </div>
        </div>

        <p className="relative z-10 mt-6 text-[11px] text-center" style={{ color: 'rgba(255,255,255,0.18)' }}>
          © {new Date().getFullYear()} PILOT+ · Tous droits réservés
        </p>
      </div>
    </div>
  )
}
