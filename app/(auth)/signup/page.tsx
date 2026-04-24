'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, Mail, Lock, Loader2, AlertCircle, ArrowRight, CheckCircle } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)
  const [success, setSuccess]     = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      router.push('/accueil')
      router.refresh()
    }, 1500)
  }

  const pwStrength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3
  const pwColors   = ['', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500']
  const pwLabels   = ['', 'Faible', 'Moyen', 'Fort']

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={28} className="text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Compte créé !</h2>
        <p className="text-white/50 text-sm">Redirection vers votre tableau de bord…</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Créer un compte</h1>
        <p className="text-sm text-white/40">Rejoignez PILOT+ — analyse gratuite, sans carte bancaire</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider" htmlFor="fullName">
            Nom complet
          </label>
          <div className="relative">
            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              autoComplete="name"
              placeholder="Jean Dupont"
              className="w-full pl-10 pr-4 py-3 bg-white/4 border border-white/8 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500/60 focus:bg-white/6 transition-all text-sm"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider" htmlFor="email">
            Email professionnel
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

        {/* Password + strength */}
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
              autoComplete="new-password"
              placeholder="8 caractères minimum"
              className="w-full pl-10 pr-4 py-3 bg-white/4 border border-white/8 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-blue-500/60 focus:bg-white/6 transition-all text-sm"
            />
          </div>
          {/* Strength bar */}
          {password.length > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex gap-1 flex-1">
                {[1,2,3].map(n => (
                  <div key={n} className={`h-1 flex-1 rounded-full transition-all ${n <= pwStrength ? pwColors[pwStrength] : 'bg-white/8'}`} />
                ))}
              </div>
              <span className={`text-[11px] font-medium ${pwStrength === 1 ? 'text-red-400' : pwStrength === 2 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {pwLabels[pwStrength]}
              </span>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm">
            <AlertCircle size={15} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Terms notice */}
        <p className="text-[11px] text-white/25 leading-relaxed">
          En créant un compte, vous acceptez nos{' '}
          <span className="text-white/40 underline cursor-pointer">Conditions d&apos;utilisation</span>
          {' '}et notre{' '}
          <span className="text-white/40 underline cursor-pointer">Politique de confidentialité</span>.
        </p>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm shadow-lg shadow-blue-600/20"
        >
          {loading
            ? <><Loader2 size={15} className="animate-spin" />Création…</>
            : <><span>Créer mon compte</span><ArrowRight size={15} /></>
          }
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-white/6" />
        <span className="text-xs text-white/25">ou</span>
        <div className="flex-1 h-px bg-white/6" />
      </div>

      {/* Login link */}
      <p className="text-center text-sm text-white/40">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
