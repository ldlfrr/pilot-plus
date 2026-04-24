'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  User, Mail, Lock, Loader2, AlertCircle,
  ArrowRight, CheckCircle, Eye, EyeOff, Zap,
} from 'lucide-react'

const PERKS = [
  '3 analyses IA offertes dès l\'inscription',
  'Score Go/No Go en 30 secondes',
  'Veille BOAMP automatique',
]

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      setLoading(false); return
    }
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSuccess(true)
    setTimeout(() => { router.push('/accueil'); router.refresh() }, 1800)
  }

  const pwStrength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3
  const pwMeta = [
    null,
    { color: 'bg-red-500', text: 'text-red-400', label: 'Faible' },
    { color: 'bg-amber-400', text: 'text-amber-400', label: 'Moyen' },
    { color: 'bg-emerald-500', text: 'text-emerald-400', label: 'Fort' },
  ]

  const inputStyle = {
    base: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' },
    focus: { border: '1px solid rgba(59,130,246,0.5)', background: 'rgba(255,255,255,0.07)' },
  }

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="relative mx-auto mb-6 w-20 h-20">
          <div className="absolute inset-0 rounded-full bg-emerald-500/15 animate-ping opacity-40" />
          <div className="relative w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle size={32} className="text-emerald-400" />
          </div>
        </div>
        <h2 className="text-2xl font-extrabold text-white mb-2">Compte créé !</h2>
        <p className="text-white/40 text-sm mb-6">Bienvenue dans PILOT+, redirection en cours…</p>
        <div className="flex justify-center">
          <div className="w-32 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full bg-blue-500 rounded-full animate-[progress_1.8s_ease-in-out_forwards]" style={{ width: '100%', animation: 'progress 1.8s ease-in-out forwards' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Créer un compte</h1>
        <p className="text-sm text-white/40">Gratuit pour commencer — aucune carte requise</p>
      </div>

      {/* Perks strip */}
      <div className="flex flex-col gap-1.5 mb-6 p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
        {PERKS.map(perk => (
          <div key={perk} className="flex items-center gap-2.5">
            <div className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
              <Zap size={9} className="text-blue-400" />
            </div>
            <span className="text-xs text-white/55 font-medium">{perk}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Full name */}
        <div>
          <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-2" htmlFor="fullName">
            Nom complet
          </label>
          <div className="relative group">
            <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none group-focus-within:text-blue-400 transition-colors" />
            <input
              id="fullName" type="text" value={fullName}
              onChange={e => setFullName(e.target.value)}
              required autoComplete="name"
              placeholder="Jean Dupont"
              className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none transition-all"
              style={inputStyle.base}
              onFocus={e => Object.assign(e.currentTarget.style, inputStyle.focus)}
              onBlur={e => Object.assign(e.currentTarget.style, inputStyle.base)}
            />
          </div>
        </div>

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
              style={inputStyle.base}
              onFocus={e => Object.assign(e.currentTarget.style, inputStyle.focus)}
              onBlur={e => Object.assign(e.currentTarget.style, inputStyle.base)}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-2" htmlFor="password">
            Mot de passe
          </label>
          <div className="relative group">
            <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none group-focus-within:text-blue-400 transition-colors" />
            <input
              id="password" type={showPw ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)}
              required autoComplete="new-password"
              placeholder="8 caractères minimum"
              className="w-full pl-11 pr-11 py-3.5 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none transition-all"
              style={inputStyle.base}
              onFocus={e => Object.assign(e.currentTarget.style, inputStyle.focus)}
              onBlur={e => Object.assign(e.currentTarget.style, inputStyle.base)}
            />
            <button
              type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
            >
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* Strength bar */}
          {password.length > 0 && (
            <div className="flex items-center gap-2.5 mt-2">
              <div className="flex gap-1.5 flex-1">
                {[1,2,3].map(n => (
                  <div key={n}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      n <= pwStrength ? (pwMeta[pwStrength]?.color ?? '') : 'bg-white/8'
                    }`}
                  />
                ))}
              </div>
              <span className={`text-[11px] font-semibold ${pwMeta[pwStrength]?.text}`}>
                {pwMeta[pwStrength]?.label}
              </span>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
            <span className="text-red-300">{error}</span>
          </div>
        )}

        {/* Terms */}
        <p className="text-[11px] text-white/25 leading-relaxed">
          En créant un compte, vous acceptez nos{' '}
          <span className="text-white/45 underline-offset-2 underline cursor-pointer hover:text-white/70 transition-colors">
            Conditions d&apos;utilisation
          </span>{' '}
          et notre{' '}
          <span className="text-white/45 underline-offset-2 underline cursor-pointer hover:text-white/70 transition-colors">
            Politique de confidentialité
          </span>.
        </p>

        {/* Submit */}
        <button
          type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm shadow-xl shadow-blue-600/25"
        >
          {loading
            ? <><Loader2 size={15} className="animate-spin" />Création en cours…</>
            : <>Créer mon compte <ArrowRight size={15} /></>
          }
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
        <span className="text-xs text-white/25 font-medium">ou</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
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
