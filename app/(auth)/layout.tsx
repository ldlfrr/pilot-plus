import Image from 'next/image'
import { CheckCircle, Zap, Target, TrendingUp, Shield } from 'lucide-react'

const FEATURES = [
  { icon: Zap,         text: 'Analyse IA de vos DCE en quelques secondes' },
  { icon: Target,      text: 'Scoring Go/No Go pour prioriser vos appels d\'offres' },
  { icon: TrendingUp,  text: 'Dashboard commercial avec KPIs temps réel' },
  { icon: Shield,      text: 'Données hébergées en Europe, sécurisées' },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[#05091a]" style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)' }}>

      {/* ── Left panel — branding ───────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col justify-between p-12 overflow-hidden">

        {/* Background layers */}
        <div className="absolute inset-0">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#05091a] via-[#080e22] to-[#0b1530]" />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'linear-gradient(rgba(59,130,246,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.8) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }} />
          {/* Glow orbs */}
          <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[100px]" />
          <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-cyan-500/5 blur-[80px]" />
          {/* Border right */}
          <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-2">
            <div className="relative h-9 w-32">
              <Image src="/logo/pilot-plus.png" alt="PILOT+" fill className="object-contain object-left brightness-0 invert" priority />
            </div>
          </div>
          <p className="text-[11px] text-blue-400/60 font-semibold tracking-[0.2em] uppercase">
            Copilot IA · Analyse DCE
          </p>
        </div>

        {/* Hero text */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
          <div className="mb-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs text-blue-300 font-medium">Powered by Claude AI</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-5">
            Décidez plus vite,<br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              gagnez plus d&apos;appels.
            </span>
          </h1>

          <p className="text-base text-white/50 leading-relaxed max-w-md mb-10">
            PILOT+ analyse vos DCE par IA, score chaque opportunité et vous dit
            exactement où concentrer votre énergie commerciale.
          </p>

          {/* Feature list */}
          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-blue-400" />
                </div>
                <span className="text-sm text-white/60">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Social proof */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/3 border border-white/6 backdrop-blur-sm">
            <div className="flex -space-x-2">
              {['#3b82f6','#8b5cf6','#10b981','#f59e0b'].map((c, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-[#05091a] flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: c }}>
                  {['M','P','A','L'][i]}
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1 mb-0.5">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-3 h-3 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-xs text-white/40">
                Utilisé par des équipes commerciales BTP & ENR
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 relative">

        {/* Background */}
        <div className="absolute inset-0 bg-[#080e22]">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/15 to-transparent lg:hidden" />
        </div>

        {/* Mobile logo */}
        <div className="relative z-10 mb-8 lg:hidden flex flex-col items-center">
          <div className="relative h-8 w-28 mb-2">
            <Image src="/logo/pilot-plus.png" alt="PILOT+" fill className="object-contain brightness-0 invert" priority />
          </div>
          <p className="text-[10px] text-blue-400/60 font-semibold tracking-[0.18em] uppercase">Copilot IA · Analyse DCE</p>
        </div>

        <div className="relative z-10 w-full max-w-[420px]">
          {children}
        </div>

        <p className="relative z-10 mt-8 text-[11px] text-white/20 text-center">
          © {new Date().getFullYear()} PILOT+ · Tous droits réservés
        </p>
      </div>

    </div>
  )
}
