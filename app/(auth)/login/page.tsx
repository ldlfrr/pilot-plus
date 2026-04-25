'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Loader2, AlertCircle, ArrowRight, Eye, EyeOff, Zap } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email ou mot de passe incorrect.'); setLoading(false); return }
    router.push('/accueil'); router.refresh()
  }

  const inputBase = { background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.095)' }
  const inputFocus = { background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.45)' }

  return (
    <div className="w-full">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.22)' }}>
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
            <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/22 pointer-events-none" />
            <input
              id="email" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              required autoComplete="email"
              placeholder="vous@entreprise.com"
              className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-white/18 focus:outline-none transition-all"
              style={inputBase}
              onFocus={e => Object.assign(e.currentTarget.style, inputFocus)}
              onBlur={e => Object.assign(e.currentTarget.style, inputBase)}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[11px] font-bold text-white/35 uppercase tracking-[0.18em]" htmlFor="password">
              Mot de passe
            </label>
            <button type="button" className="text-[11px] text-blue-400/70 hover:text-blue-300 transition-colors font-medium">
              Mot de passe oublié ?
            </button>
          </div>
          <div className="relative">
            <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/22 pointer-events-none" />
            <input
              id="password" type={showPw ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)}
              required autoComplete="current-password"
              placeholder="••••••••"
              className="w-full pl-11 pr-11 py-3.5 rounded-xl text-sm text-white placeholder-white/18 focus:outline-none transition-all"
              style={inputBase}
              onFocus={e => Object.assign(e.currentTarget.style, inputFocus)}
              onBlur={e => Object.assign(e.currentTarget.style, inputBase)}
            />
            <button
              type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/22 hover:text-white/55 transition-colors">
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.22)' }}>
            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
            <span className="text-red-300 text-xs">{error}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit" disabled={loading || !email || !password}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-bold transition-all mt-2 relative overflow-hidden group"
          style={{
            background: loading || !email || !password
              ? 'rgba(255,255,255,0.06)'
              : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            border: loading || !email || !password
              ? '1px solid rgba(255,255,255,0.09)'
              : '1px solid rgba(59,130,246,0.40)',
            color: loading || !email || !password ? 'rgba(255,255,255,0.3)' : 'white',
            boxShadow: loading || !email || !password ? 'none' : '0 4px 20px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
            cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
          }}
        >
          {(!loading && email && password) && (
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)' }} />
          )}
          <span className="relative flex items-center gap-2">
            {loading
              ? <><Loader2 size={15} className="animate-spin" />Connexion…</>
              : <>Se connecter <ArrowRight size={15} /></>
            }
          </span>
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <span className="text-[11px] text-white/22 font-medium">ou</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* Sign up */}
      <div className="rounded-xl px-4 py-3.5 text-center" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-sm text-white/38">
          Pas encore de compte ?{' '}
          <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
            Créer un compte gratuitement →
          </Link>
        </p>
      </div>
    </div>
  )
}
