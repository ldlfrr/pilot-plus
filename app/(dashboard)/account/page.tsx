'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { useTheme, type Theme } from '@/components/providers/ThemeProvider'
import {
  User,
  Building2,
  Phone,
  Briefcase,
  Mail,
  Lock,
  CreditCard,
  AlertTriangle,
  Check,
  Loader2,
  ChevronRight,
  Shield,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise' | 'lifetime'

interface ProfileData {
  id: string
  email: string
  full_name: string | null
  company: string | null
  job_title: string | null
  phone: string | null
  avatar_url: string | null
  theme: Theme
  subscription_tier: SubscriptionTier
}

// ── Tier display helpers ──────────────────────────────────────────────────────

const TIER_LABELS: Record<SubscriptionTier, string> = {
  free:       'Gratuit',
  basic:      'Basic',
  pro:        'Pro',
  enterprise: 'Entreprise',
  lifetime:   'Accès à vie',
}

const TIER_COLORS: Record<SubscriptionTier, string> = {
  free:       'bg-white/5 text-white/50 border-white/10',
  basic:      'bg-blue-500/15 text-blue-400 border-blue-500/30',
  pro:        'bg-blue-600/20 text-blue-300 border-blue-500/40',
  enterprise: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  lifetime:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
      {children}
    </p>
  )
}

// ── Input field ───────────────────────────────────────────────────────────────

function Field({
  label,
  icon: Icon,
  value,
  onChange,
  type = 'text',
  readOnly = false,
  placeholder,
}: {
  label: string
  icon: React.ElementType
  value: string
  onChange?: (v: string) => void
  type?: string
  readOnly?: boolean
  placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-white/50">{label}</label>
      <div className="relative">
        <Icon
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
        />
        <input
          type={type}
          value={value}
          readOnly={readOnly}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(
            'w-full pl-9 pr-3 py-2.5 rounded-lg text-sm',
            'bg-white/5 border border-white/8 text-white',
            'placeholder:text-white/20',
            'focus:outline-none focus:ring-1 focus:ring-blue-500/60 focus:border-blue-500/40',
            readOnly && 'opacity-50 cursor-not-allowed',
          )}
        />
      </div>
    </div>
  )
}

// ── Theme preview cards ───────────────────────────────────────────────────────

const THEMES = [
  {
    id: 'dark' as Theme,
    label: 'Sombre',
    description: 'Classique, moins fatigant',
    colors: { base: '#0f1117', surface: '#13161e', card: '#1a1d2e', accent: '#3b82f6' },
  },
  {
    id: 'pilot' as Theme,
    label: 'Pilot+',
    description: 'Bleu marine profond',
    colors: { base: '#05091a', surface: '#080e22', card: '#0b1530', accent: '#3b82f6' },
  },
  {
    id: 'midnight' as Theme,
    label: 'Minuit',
    description: 'OLED pur noir',
    colors: { base: '#000000', surface: '#0a0a0a', card: '#111111', accent: '#3b82f6' },
  },
  {
    id: 'slate' as Theme,
    label: 'Ardoise',
    description: 'Gris bleuté élégant',
    colors: { base: '#0d1117', surface: '#161b22', card: '#21262d', accent: '#3b82f6' },
  },
  {
    id: 'forest' as Theme,
    label: 'Forêt',
    description: 'Vert profond naturel',
    colors: { base: '#060e0a', surface: '#0a1610', card: '#0f2018', accent: '#22c55e' },
  },
  {
    id: 'aurora' as Theme,
    label: 'Aurore',
    description: 'Violet mystérieux',
    colors: { base: '#0c0814', surface: '#110e1e', card: '#18142a', accent: '#a78bfa' },
  },
  {
    id: 'dusk' as Theme,
    label: 'Crépuscule',
    description: 'Ambré chaleureux',
    colors: { base: '#0e0a06', surface: '#181008', card: '#22160a', accent: '#fb923c' },
  },
  {
    id: 'light' as Theme,
    label: 'Clair',
    description: 'Lumineux, idéal le jour',
    colors: { base: '#f0f4f8', surface: '#e4eaf3', card: '#ffffff', accent: '#3b82f6' },
  },
] as const

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const { theme, setTheme } = useTheme()

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [fullName, setFullName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [phone, setPhone]       = useState('')
  const [company, setCompany]   = useState('')

  // UI states
  const [saving, setSaving]                     = useState(false)
  const [saveSuccess, setSaveSuccess]           = useState(false)
  const [saveError, setSaveError]               = useState<string | null>(null)

  const [pwLoading, setPwLoading]               = useState(false)
  const [pwSuccess, setPwSuccess]               = useState(false)
  const [pwError, setPwError]                   = useState<string | null>(null)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // ── Load profile ────────────────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/user/profile')
      if (!r.ok) throw new Error('Erreur de chargement')
      const data: ProfileData = await r.json()
      setProfile(data)
      setFullName(data.full_name ?? '')
      setJobTitle(data.job_title ?? '')
      setPhone(data.phone ?? '')
      setCompany(data.company ?? '')
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadProfile() }, [loadProfile])

  // ── Save profile ────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true)
    setSaveSuccess(false)
    setSaveError(null)
    try {
      const r = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, job_title: jobTitle, phone, company }),
      })
      if (!r.ok) {
        const d = await r.json() as { error?: string }
        throw new Error(d.error ?? 'Erreur')
      }
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  // ── Password reset ──────────────────────────────────────────────────────────
  async function handlePasswordReset() {
    setPwLoading(true)
    setPwSuccess(false)
    setPwError(null)
    try {
      const r = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-password' }),
      })
      if (!r.ok) {
        const d = await r.json() as { error?: string }
        throw new Error(d.error ?? 'Erreur')
      }
      setPwSuccess(true)
    } catch (e: unknown) {
      setPwError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setPwLoading(false)
    }
  }

  // ── Avatar initials ─────────────────────────────────────────────────────────
  const initials = (fullName || profile?.email || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const tier: SubscriptionTier = profile?.subscription_tier ?? 'free'

  if (loading) return null // loading.tsx handles skeleton

  return (
    <div className="flex flex-col min-h-0 animate-fade-in">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="h-14 border-b border-white/5 bg-[var(--bg-surface)] flex items-center px-4 md:px-6 flex-shrink-0">
        <div>
          <h1 className="text-base font-semibold text-white">Mon compte</h1>
          <p className="text-xs text-white/40">Gérez votre profil et vos préférences</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-2xl w-full mx-auto">

        {/* ── Section: Profil ────────────────────────────────────────────── */}
        <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-5">
          <SectionLabel>Profil</SectionLabel>

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-[72px] h-[72px] rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 select-none">
              {initials}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{fullName || 'Nom non défini'}</p>
              <p className="text-white/40 text-xs mt-0.5">{profile?.email}</p>
              <span className={cn(
                'inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1.5',
                TIER_COLORS[tier],
              )}>
                {TIER_LABELS[tier]}
              </span>
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Prénom & nom"
              icon={User}
              value={fullName}
              onChange={setFullName}
              placeholder="Jean Dupont"
            />
            <Field
              label="Email"
              icon={Mail}
              value={profile?.email ?? ''}
              readOnly
              type="email"
            />
            <Field
              label="Intitulé du poste"
              icon={Briefcase}
              value={jobTitle}
              onChange={setJobTitle}
              placeholder="Directeur commercial"
            />
            <Field
              label="Téléphone"
              icon={Phone}
              value={phone}
              onChange={setPhone}
              placeholder="+33 6 00 00 00 00"
              type="tel"
            />
            <Field
              label="Entreprise"
              icon={Building2}
              value={company}
              onChange={setCompany}
              placeholder="Acme SAS"
              // span full width on sm grid
            />
          </div>

          {/* Save */}
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {saving
                ? <Loader2 size={14} className="animate-spin" />
                : saveSuccess
                ? <Check size={14} />
                : null
              }
              {saving ? 'Enregistrement…' : saveSuccess ? 'Enregistré !' : 'Enregistrer'}
            </button>
            {saveError && (
              <p className="text-xs text-red-400">{saveError}</p>
            )}
          </div>
        </div>

        {/* ── Section: Apparence ─────────────────────────────────────────── */}
        <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-5">
          <SectionLabel>Apparence — Thème</SectionLabel>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {THEMES.map((t) => {
              const active = theme === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    'relative flex flex-col gap-2.5 p-3 rounded-xl border text-left transition-all',
                    active
                      ? 'border-blue-500/70 bg-blue-600/10 shadow-[0_0_16px_rgba(59,130,246,0.12)]'
                      : 'border-white/8 hover:border-white/20 bg-white/2 hover:bg-white/5',
                  )}
                >
                  {/* Active checkmark */}
                  {active && (
                    <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                      <Check size={10} className="text-white" />
                    </span>
                  )}

                  {/* Mini UI preview */}
                  <div
                    className="w-full h-14 rounded-md overflow-hidden flex flex-col gap-1 p-2"
                    style={{ background: t.colors.base, border: t.id === 'light' ? '1px solid rgba(0,0,0,0.07)' : undefined }}
                  >
                    <div className="h-1.5 w-10 rounded" style={{ background: t.colors.surface }} />
                    <div className="flex gap-1 flex-1">
                      <div className="w-5 rounded" style={{ background: t.colors.surface }} />
                      <div className="flex-1 rounded" style={{ background: t.colors.card }} />
                    </div>
                    <div className="h-1 w-7 rounded" style={{ background: t.colors.accent, opacity: 0.7 }} />
                  </div>

                  {/* Labels */}
                  <div>
                    <p className={cn('text-xs font-bold', active ? 'text-blue-400' : 'text-white/80')}>
                      {t.label}
                    </p>
                    <p className="text-[10px] text-white/40 mt-0.5 leading-snug">{t.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Section: Sécurité ──────────────────────────────────────────── */}
        <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-5">
          <SectionLabel>Sécurité</SectionLabel>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/5 mt-0.5">
                <Shield size={14} className="text-white/40" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/80">Mot de passe</p>
                <p className="text-xs text-white/40 mt-0.5">{profile?.email}</p>
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-2">
              <button
                onClick={handlePasswordReset}
                disabled={pwLoading || pwSuccess}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-shrink-0',
                  pwSuccess
                    ? 'bg-emerald-600/15 border border-emerald-500/30 text-emerald-400'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white',
                )}
              >
                {pwLoading
                  ? <Loader2 size={14} className="animate-spin" />
                  : pwSuccess
                  ? <Check size={14} />
                  : <Lock size={14} />
                }
                {pwSuccess ? 'Email envoyé !' : 'Réinitialiser le mot de passe'}
              </button>
              {pwError && <p className="text-xs text-red-400">{pwError}</p>}
            </div>
          </div>
        </div>

        {/* ── Section: Mon abonnement ────────────────────────────────────── */}
        <div className="bg-[var(--bg-card)] border border-white/8 rounded-xl p-5">
          <SectionLabel>Mon abonnement</SectionLabel>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/5">
                <CreditCard size={14} className="text-white/40" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/80">Formule actuelle</p>
                <span className={cn(
                  'inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1',
                  TIER_COLORS[tier],
                )}>
                  {TIER_LABELS[tier]}
                </span>
              </div>
            </div>

            <Link
              href="/subscription"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-semibold transition-colors flex-shrink-0"
            >
              Gérer
              <ChevronRight size={12} />
            </Link>
          </div>
        </div>

        {/* ── Section: Zone de danger ────────────────────────────────────── */}
        <div className="bg-[var(--bg-card)] border border-red-500/20 rounded-xl p-5">
          <SectionLabel>Zone de danger</SectionLabel>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-red-500/10 mt-0.5">
                <AlertTriangle size={14} className="text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/80">Supprimer mon compte</p>
                <p className="text-xs text-white/40 mt-0.5">
                  Cette action est irréversible. Toutes vos données seront supprimées.
                </p>
              </div>
            </div>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-semibold transition-colors flex-shrink-0"
              >
                <AlertTriangle size={14} />
                Supprimer
              </button>
            ) : (
              <div className="flex flex-col gap-2 sm:items-end">
                <p className="text-xs text-white/50 text-right max-w-xs">
                  Pour supprimer votre compte, veuillez contacter notre support :
                </p>
                <a
                  href="mailto:contact@pilot-plus.fr?subject=Suppression de compte"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/20 border border-red-500/40 text-red-300 text-xs font-semibold transition-colors hover:bg-red-600/30"
                >
                  <Mail size={13} />
                  contact@pilot-plus.fr
                </a>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
