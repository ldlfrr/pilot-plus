'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Loader2, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react'

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

  return (
    <div className="w-full">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Bon retour 👋</h1>
        <p className="text-sm text-white/40">Connectez-vous à votre espace PILOT+</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Email */}
        <div>
          <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-2" htmlFor="email">
            Adresse email
          </label>
          <div className="relative group">
            <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none group-focus-within:text-blue-400 transition-colors" />
            <input
              id="email" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              required autoComplete="email"
              placeholder="vous@entreprise.com"
              className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
              onFocus={e => { e.currentTarget.style.border = '1px solid rgba(59,130,246,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
              onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.10)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-widest" htmlFor="password">
              Mot de passe
            </label>
            <button type="button" className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors font-medium">
              Mot de passe oublié ?
            </button>
          </div>
          <div className="relative group">
            <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none group-focus-within:text-blue-400 transition-colors" />
            <input
              id="password" type={showPw ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)}
              required autoComplete="current-password"
              placeholder="••••••••"
              className="w-full pl-11 pr-11 py-3.5 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
              onFocus={e => { e.currentTarget.style.border = '1px solid rgba(59,130,246,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
              onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.10)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            />
            <button
              type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
            >
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
            <span className="text-red-300">{error}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm shadow-xl shadow-blue-600/25 mt-2"
        >
          {loading
            ? <><Loader2 size={15} className="animate-spin" />Connexion…</>
            : <>Se connecter <ArrowRight size={15} /></>
          }
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-7">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
        <span className="text-xs text-white/25 font-medium">ou</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
      </div>

      {/* Sign up */}
      <p className="text-center text-sm text-white/40">
        Pas encore de compte ?{' '}
        <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
          Créer un compte gratuitement
        </Link>
      </p>
    </div>
  )
}
