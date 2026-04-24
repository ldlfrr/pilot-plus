import Image from 'next/image'
import { Zap, Target, TrendingUp, Shield, CheckCircle, BarChart3, Radio } from 'lucide-react'

const FEATURES = [
  { icon: Zap,       text: 'Analyse IA de vos DCE en moins de 30 secondes' },
  { icon: Target,    text: 'Score Go/No Go pour chaque appel d\'offres' },
  { icon: Radio,     text: 'Veille BOAMP automatique selon vos critères' },
  { icon: TrendingUp,text: 'Dashboard commercial avec KPIs temps réel' },
  { icon: Shield,    text: 'Données hébergées en Europe — sécurisées' },
]

const STATS = [
  { value: '< 30s', label: 'par analyse' },
  { value: '5',     label: 'critères scoring' },
  { value: '100%',  label: 'données EU' },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[#05091a]" style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)' }}>

      {/* ── Left panel — branding ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col justify-between p-12 overflow-hidden">

        {/* Backgrounds */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#05091a] via-[#080e22] to-[#0b1530]" />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: 'linear-gradient(rgba(59,130,246,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.9) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }} />
          {/* Orbs */}
          <div className="absolute top-[-15%] left-[-10%] w-[650px] h-[650px] rounded-full bg-blue-600/10 blur-[130px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[110px]" />
          <div className="absolute top-[40%] left-[35%] w-[300px] h-[300px] rounded-full bg-cyan-500/6 blur-[80px]" />
          {/* Right border */}
          <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="relative h-9 w-32 mb-1">
            <Image src="/logo/pilot-plus.png" alt="PILOT+" fill className="object-contain object-left brightness-0 invert" priority />
          </div>
          <p className="text-[10px] font-bold tracking-[0.25em] uppercase" style={{ color: 'rgba(96,165,250,0.55)' }}>
            Copilot IA · Analyse DCE
          </p>
        </div>

        {/* Hero text */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-10">

          {/* Badge */}
          <div className="mb-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full w-fit"
            style={{ background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.22)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs text-blue-300 font-semibold">Powered by Claude AI (Anthropic)</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-4 tracking-tight">
            Décidez plus vite,<br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              gagnez plus d&apos;appels.
            </span>
          </h1>

          <p className="text-sm text-white/45 leading-relaxed max-w-md mb-8">
            PILOT+ analyse vos DCE par IA, score chaque opportunité et vous dit
            exactement où concentrer votre énergie commerciale.
          </p>

          {/* Feature list */}
          <ul className="space-y-3.5 mb-10">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.20)' }}>
                  <Icon size={14} className="text-blue-400" />
                </div>
                <span className="text-sm text-white/55 font-medium">{text}</span>
              </li>
            ))}
          </ul>

          {/* Stats row */}
          <div className="flex items-center gap-6 pt-6"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-extrabold text-white">{value}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{label}</p>
              </div>
            ))}
            <div className="ml-auto">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-3 h-3 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-[10px] text-white/30 mt-0.5 text-right">BTP & ENR</p>
            </div>
          </div>
        </div>

        {/* Social proof card */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 p-4 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}>
            {/* Avatars */}
            <div className="flex -space-x-2 flex-shrink-0">
              {['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444'].map((c, i) => (
                <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ background: c, border: '2px solid #05091a' }}>
                  {['M','P','A','L','S'][i]}
                </div>
              ))}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white/70 mb-0.5">Équipes commerciales BTP & ENR</p>
              <p className="text-[10px] text-white/35">Utilisent PILOT+ pour qualifier leurs appels d&apos;offres</p>
            </div>
            <div className="ml-auto flex-shrink-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <BarChart3 size={14} className="text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative">

        {/* Background */}
        <div className="absolute inset-0" style={{ background: '#080e22' }}>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/15 to-transparent lg:hidden" />
          <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-blue-600/5 blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] rounded-full bg-indigo-600/5 blur-[80px]" />
        </div>

        {/* Mobile logo */}
        <div className="relative z-10 mb-8 lg:hidden flex flex-col items-center">
          <div className="relative h-8 w-28 mb-2">
            <Image src="/logo/pilot-plus.png" alt="PILOT+" fill className="object-contain brightness-0 invert" priority />
          </div>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: 'rgba(96,165,250,0.55)' }}>
            Copilot IA · Analyse DCE
          </p>
        </div>

        {/* Form card */}
        <div className="relative z-10 w-full max-w-[420px]">
          <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' }}>
            {children}
          </div>
        </div>

        <p className="relative z-10 mt-6 text-[11px] text-white/20 text-center">
          © {new Date().getFullYear()} PILOT+ · Tous droits réservés
        </p>
      </div>

    </div>
  )
}
