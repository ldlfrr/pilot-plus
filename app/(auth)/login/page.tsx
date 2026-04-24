'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Loader2, AlertCircle, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }

    router.push('/accueil')
    router.refresh()
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Bon retour 👋</h1>
        <p className="text-sm text-white/40">Connectez-vous à votre espace PILOT+</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider" htmlFor="email">
            Email
          </label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="vous@entreprise.com"
              className="w-full pl-10 pr-4 py-3 bg-white/4 border border-white/8 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500/60 focus:bg-white/6 transition-all text-sm"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider" htmlFor="password">
            Mot de passe
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-3 bg-white/4 border border-white/8 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500/60 focus:bg-white/6 transition-all text-sm"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm">
            <AlertCircle size={15} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm mt-2 shadow-lg shadow-blue-600/20"
        >
          {loading
            ? <><Loader2 size={15} className="animate-spin" />Connexion…</>
            : <><span>Se connecter</span><ArrowRight size={15} /></>
          }
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-white/6" />
        <span className="text-xs text-white/25">ou</span>
        <div className="flex-1 h-px bg-white/6" />
      </div>

      {/* Sign up link */}
      <p className="text-center text-sm text-white/40">
        Pas encore de compte ?{' '}
        <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
          Créer un compte gratuitement
        </Link>
      </p>
    </div>
  )
}
