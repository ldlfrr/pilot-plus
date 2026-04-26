'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Loader2, AlertCircle, ArrowRight, Eye, EyeOff, Zap, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ── Shared input styles ────────────────────────────────────────────────────────

const INPUT_BASE: React.CSSProperties = {
  background: 'rgba(6, 10, 28, 0.85)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: 'white',
  WebkitTextFillColor: 'white',
}
const INPUT_FOCUS: React.CSSProperties = {
  background: 'rgba(6, 12, 32, 0.95)',
  border: '1px solid rgba(59,130,246,0.55)',
  boxShadow: '0 0 0 3px rgba(59,130,246,0.12)',
  color: 'white',
  WebkitTextFillColor: 'white',
}
const INPUT_FILLED: React.CSSProperties = {
  background: 'rgba(6, 10, 28, 0.85)',
  border: '1px solid rgba(255,255,255,0.15)',
  color: 'white',
  WebkitTextFillColor: 'white',
}

const sharedInputCls = 'w-full py-3.5 rounded-xl text-sm placeholder:text-white/20 focus:outline-none transition-all duration-150'

// ── Component ──────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [focused, setFocused]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email ou mot de passe incorrect.'); setLoading(false); return }
    router.push('/accueil'); router.refresh()
  }

  function inputStyle(key: string, value: string): React.CSSProperties {
    if (focused === key) return INPUT_FOCUS
    if (value) return INPUT_FILLED
    return INPUT_BASE
  }

  const canSubmit = !loading && !!email && !!password

  return (
    <div className="w-full">

      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.22)' }}
          >
            <Zap size={14} className="text-blue-400" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">Connexion sécurisée</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1.5 tracking-tight">Bon retour 👋</h1>
        <p className="text-sm text-white/38">Connectez-vous à votre espace PILOT+</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Email */}
        <div>
          <label className="block text-[11px] font-bold text-white/35 uppercase tracking-[0.18em] mb-2" htmlFor="email">
            Adresse email
          </label>
          <div className="relative">
            <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none z-10" />
            <input
              id="email" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              required autoComplete="email"
              placeholder="vous@entreprise.com"
              className={cn(sharedInputCls, 'pl-11 pr-4')}
              style={inputStyle('email', email)}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[11px] font-bold text-white/35 uppercase tracking-[0.18em]" htmlFor="password">
              Mot de passe
            </label>
            <button
              type="button"
              className="text-[11px] text-blue-400/70 hover:text-blue-300 transition-colors font-medium"
              onClick={() => {/* TODO: reset pw */}}
            >
              Mot de passe oublié ?
            </button>
          </div>
          <div className="relative">
            <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none z-10" />
            <input
              id="password" type={showPw ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              required autoComplete="current-password"
              placeholder="••••••••"
              className={cn(sharedInputCls, 'pl-11 pr-12')}
              style={inputStyle('password', password)}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/22 hover:text-white/55 transition-colors z-10"
            >
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.22)' }}
          >
            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
            <span className="text-red-300 text-xs">{error}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-bold transition-all mt-2 relative overflow-hidden group"
          style={{
            background: canSubmit
              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
              : 'rgba(255,255,255,0.06)',
            border: canSubmit
              ? '1px solid rgba(59,130,246,0.40)'
              : '1px solid rgba(255,255,255,0.09)',
            color: canSubmit ? 'white' : 'rgba(255,255,255,0.3)',
            boxShadow: canSubmit ? '0 4px 20px rgba(59,130,246,0.30), inset 0 1px 0 rgba(255,255,255,0.15)' : 'none',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          {canSubmit && (
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)' }}
            />
          )}
          <span className="relative flex items-center gap-2">
            {loading
              ? <><Loader2 size={15} className="animate-spin" />Connexion…</>
              : <>Se connecter <ArrowRight size={15} /></>
            }
          </span>
        </button>
      </form>

      {/* Trust badge */}
      <div className="flex items-center justify-center gap-2 mt-5 mb-5">
        <ShieldCheck size={11} className="text-emerald-400/50" />
        <span className="text-[11px] text-white/22">Connexion chiffrée · Données hébergées en Europe</span>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <span className="text-[11px] text-white/22 font-medium">pas encore de compte ?</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* Sign up */}
      <Link
        href="/signup"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.09)',
          color: 'rgba(255,255,255,0.55)',
        }}
        onMouseEnter={e => Object.assign(e.currentTarget.style, { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' })}
        onMouseLeave={e => Object.assign(e.currentTarget.style, { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.55)' })}
      >
        Créer un compte gratuitement <ArrowRight size={13} />
      </Link>

    </div>
  )
}
