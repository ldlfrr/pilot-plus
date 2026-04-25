'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  User, Mail, Lock, Loader2, AlertCircle,
  ArrowRight, CheckCircle, Eye, EyeOff, Zap, Brain, Target, Radio,
} from 'lucide-react'

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="w-full h-32 flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-500/40 border-t-blue-500 rounded-full animate-spin" /></div>}>
      <SignupForm />
    </Suspense>
  )
}

function SignupForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const inviteToken  = searchParams.get('invite')

  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [invitationInfo, setInvitationInfo] = useState<{ project_name?: string; team_name?: string; inviter_name?: string } | null>(null)

  useEffect(() => {
    if (!inviteToken) return
    fetch(`/api/invitations/${inviteToken}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.invitation) setInvitationInfo(d.invitation) })
      .catch(() => {})
  }, [inviteToken])

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
        emailRedirectTo: `${window.location.origin}/auth/callback${inviteToken ? `?invite=${inviteToken}` : ''}`,
      },
    })
    if (error) { setError(error.message); setLoading(false); return }

    try {
      await fetch('/api/invitations/auto-accept', { method: 'POST' })
    } catch { /* best effort */ }

    setSuccess(true)
    setTimeout(() => {
      if (inviteToken) {
        router.push(`/invite/${inviteToken}`)
      } else {
        router.push('/accueil')
      }
      router.refresh()
    }, 1800)
  }

  const pwStrength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3
  const pwMeta = [
    null,
    { color: 'bg-red-500',    text: 'text-red-400',    label: 'Faible' },
    { color: 'bg-amber-400',  text: 'text-amber-400',  label: 'Moyen' },
    { color: 'bg-emerald-500', text: 'text-emerald-400', label: 'Fort' },
  ]

  const inputBase  = { background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.095)' }
  const inputFocus = { background: 'rgba(59,130,246,0.06)',   border: '1px solid rgba(59,130,246,0.45)' }

  const isValid = fullName.trim() && email.trim() && password.length >= 8

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="relative mx-auto mb-6 w-20 h-20">
          <div className="absolute inset-0 rounded-full bg-emerald-500/12 animate-ping opacity-40" />
          <div className="relative w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.28)' }}>
            <CheckCircle size={32} className="text-emerald-400" />
          </div>
        </div>
        <h2 className="text-2xl font-extrabold text-white mb-2">Compte créé !</h2>
        <p className="text-white/38 text-sm mb-6">Bienvenue dans PILOT+, redirection en cours…</p>
        <div className="flex justify-center">
          <div className="w-32 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%', animation: 'progress 1.8s ease-in-out forwards' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.22)' }}>
            <Zap size={14} className="text-blue-400" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">Inscription gratuite</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1.5 tracking-tight">Créer un compte</h1>
        <p className="text-sm text-white/38">Gratuit pour commencer — aucune carte requise</p>
      </div>

      {/* Invitation banner */}
      {invitationInfo && (
        <div className="mb-5 p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.22)' }}>
          <p className="text-[11px] font-bold text-blue-400 mb-1 uppercase tracking-widest">Invitation en attente</p>
          <p className="text-sm text-white/65">
            <strong className="text-white/85">{invitationInfo.inviter_name ?? 'Quelqu\'un'}</strong> vous invite à rejoindre{' '}
            {invitationInfo.project_name
              ? <>le projet <strong className="text-white/85">« {invitationInfo.project_name} »</strong></>
              : <>l&apos;équipe <strong className="text-white/85">« {invitationInfo.team_name} »</strong></>}
            .
          </p>
        </div>
      )}

      {/* Perks */}
      {!invitationInfo && (
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { icon: Brain,  text: 'Analyse IA DCE',    color: 'text-blue-400',    bg: 'rgba(59,130,246,0.09)',  border: 'rgba(59,130,246,0.18)' },
            { icon: Target, text: 'Score Go/No Go',    color: 'text-emerald-400', bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.16)' },
            { icon: Radio,  text: 'Veille BOAMP',      color: 'text-violet-400',  bg: 'rgba(139,92,246,0.07)', border: 'rgba(139,92,246,0.16)' },
          ].map(({ icon: Icon, text, color, bg, border }) => (
            <div key={text} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={{ background: bg, border: `1px solid ${border}` }}>
              <Icon size={11} className={color} />
              <span className="text-[11px] font-medium text-white/55">{text}</span>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">

        {/* Full name */}
        <div>
          <label className="block text-[11px] font-bold text-white/35 uppercase tracking-[0.18em] mb-2" htmlFor="fullName">
            Nom complet
          </label>
          <div className="relative">
            <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/22 pointer-events-none" />
            <input
              id="fullName" type="text" value={fullName}
              onChange={e => setFullName(e.target.value)}
              required autoComplete="name"
              placeholder="Jean Dupont"
              className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-white/18 focus:outline-none transition-all"
              style={inputBase}
              onFocus={e => Object.assign(e.currentTarget.style, inputFocus)}
              onBlur={e => Object.assign(e.currentTarget.style, inputBase)}
            />
          </div>
        </div>

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
          <label className="block text-[11px] font-bold text-white/35 uppercase tracking-[0.18em] mb-2" htmlFor="password">
            Mot de passe
          </label>
          <div className="relative">
            <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/22 pointer-events-none" />
            <input
              id="password" type={showPw ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)}
              required autoComplete="new-password"
              placeholder="8 caractères minimum"
              className="w-full pl-11 pr-11 py-3.5 rounded-xl text-sm text-white placeholder-white/18 focus:outline-none transition-all"
              style={inputBase}
              onFocus={e => Object.assign(e.currentTarget.style, inputFocus)}
              onBlur={e => Object.assign(e.currentTarget.style, inputBase)}
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/22 hover:text-white/55 transition-colors">
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {/* Strength bar */}
          {password.length > 0 && (
            <div className="flex items-center gap-2.5 mt-2">
              <div className="flex gap-1.5 flex-1">
                {[1,2,3].map(n => (
                  <div key={n} className={`h-1 flex-1 rounded-full transition-all duration-300 ${n <= pwStrength ? (pwMeta[pwStrength]?.color ?? '') : 'bg-white/8'}`} />
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
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.22)' }}>
            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
            <span className="text-red-300 text-xs">{error}</span>
          </div>
        )}

        {/* Terms */}
        <p className="text-[11px] text-white/22 leading-relaxed">
          En créant un compte, vous acceptez nos{' '}
          <Link href="/cgu" target="_blank" className="text-white/40 underline-offset-2 underline hover:text-white/60 transition-colors">CGU</Link>{' '}
          et notre{' '}
          <Link href="/politique-de-confidentialite" target="_blank" className="text-white/40 underline-offset-2 underline hover:text-white/60 transition-colors">Politique de confidentialité</Link>.
        </p>

        {/* Submit */}
        <button
          type="submit" disabled={loading || !isValid}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-bold transition-all relative overflow-hidden group"
          style={{
            background: !isValid || loading
              ? 'rgba(255,255,255,0.06)'
              : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            border: !isValid || loading
              ? '1px solid rgba(255,255,255,0.09)'
              : '1px solid rgba(59,130,246,0.40)',
            color: !isValid || loading ? 'rgba(255,255,255,0.3)' : 'white',
            boxShadow: !isValid || loading ? 'none' : '0 4px 20px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
            cursor: !isValid || loading ? 'not-allowed' : 'pointer',
          }}
        >
          {(isValid && !loading) && (
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)' }} />
          )}
          <span className="relative flex items-center gap-2">
            {loading
              ? <><Loader2 size={15} className="animate-spin" />Création en cours…</>
              : <>Créer mon compte gratuitement <ArrowRight size={15} /></>
            }
          </span>
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <span className="text-[11px] text-white/22 font-medium">ou</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* Login link */}
      <div className="rounded-xl px-4 py-3.5 text-center" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-sm text-white/38">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
            Se connecter →
          </Link>
        </p>
      </div>
    </div>
  )
}
