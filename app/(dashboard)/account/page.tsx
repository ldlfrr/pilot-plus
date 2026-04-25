'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { useTheme, type Theme } from '@/components/providers/ThemeProvider'
import {
  User, Building2, Phone, Briefcase, Mail, Lock, CreditCard, AlertTriangle,
  Check, Loader2, Shield, Bell, Palette, BarChart3, Cpu, Calendar,
  Zap, Star, ArrowUpRight, ChevronRight, BellOff, Globe2, KeyRound,
  Fingerprint, Download, Trash2, LogOut, CheckCircle2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// ── Types ─────────────────────────────────────────────────────────────────────

type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise' | 'lifetime'
type Section = 'profile' | 'notifications' | 'appearance' | 'security' | 'subscription' | 'danger'

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
  created_at?: string | null
  provider?: string
}

interface UserLimits {
  tier: SubscriptionTier
  analyses_used: number
  analyses_limit: number | null
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TIER_LABELS: Record<SubscriptionTier, string> = {
  free: 'Gratuit', basic: 'Basic', pro: 'Pro', enterprise: 'Entreprise', lifetime: 'Accès à vie',
}
const TIER_COLORS: Record<SubscriptionTier, string> = {
  free:       'bg-white/5 text-white/50 border-white/10',
  basic:      'bg-blue-500/15 text-blue-400 border-blue-500/30',
  pro:        'bg-blue-600/20 text-blue-300 border-blue-500/40',
  enterprise: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  lifetime:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
}
const TIER_AVATAR_BG: Record<SubscriptionTier, string> = {
  free:       'from-blue-600 to-blue-800',
  basic:      'from-blue-500 to-blue-700',
  pro:        'from-indigo-500 to-blue-600',
  enterprise: 'from-purple-600 to-indigo-700',
  lifetime:   'from-amber-500 to-orange-600',
}
const TIER_LIMITS_DISPLAY: Record<SubscriptionTier, string> = {
  free:       '3 analyses / mois',
  basic:      '10 analyses / mois',
  pro:        '50 analyses / mois',
  enterprise: 'Illimité',
  lifetime:   'Illimité',
}

const NAV: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'profile',       label: 'Profil',        icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance',   label: 'Apparence',      icon: Palette },
  { id: 'security',     label: 'Sécurité',       icon: Shield },
  { id: 'subscription', label: 'Abonnement',     icon: CreditCard },
  { id: 'danger',       label: 'Zone de danger', icon: AlertTriangle },
]

const THEMES: { id: Theme; label: string; description: string; animated?: boolean; colors: { base: string; surface: string; card: string; accent: string } }[] = [
  { id: 'dark',         label: 'Sombre',         description: 'Classique, moins fatigant',     colors: { base: '#0f1117', surface: '#13161e', card: '#1a1d2e', accent: '#3b82f6' } },
  { id: 'pilot',        label: 'Pilot+',         description: 'Bleu marine profond',           colors: { base: '#05091a', surface: '#080e22', card: '#0b1530', accent: '#3b82f6' } },
  { id: 'midnight',     label: 'Minuit',         description: 'OLED pur noir',                 colors: { base: '#000000', surface: '#0a0a0a', card: '#111111', accent: '#3b82f6' } },
  { id: 'slate',        label: 'Ardoise',        description: 'Gris bleuté élégant',           colors: { base: '#0d1117', surface: '#161b22', card: '#21262d', accent: '#3b82f6' } },
  { id: 'forest',       label: 'Forêt',          description: 'Vert profond naturel',          colors: { base: '#060e0a', surface: '#0a1610', card: '#0f2018', accent: '#22c55e' } },
  { id: 'aurora',       label: 'Aurore',         description: 'Violet mystérieux',             colors: { base: '#0c0814', surface: '#110e1e', card: '#18142a', accent: '#a78bfa' } },
  { id: 'dusk',         label: 'Crépuscule',     description: 'Ambré chaleureux',              colors: { base: '#0e0a06', surface: '#181008', card: '#22160a', accent: '#fb923c' } },
  { id: 'cyber',        label: 'Cyber',          description: 'Néon cyan, ambiance matrix',    colors: { base: '#00060e', surface: '#000d1a', card: '#001527', accent: '#00e5ff' } },
  { id: 'sunset',       label: 'Coucher de soleil', description: 'Rouge intense, chaleur vive', colors: { base: '#0d0500', surface: '#180800', card: '#240d02', accent: '#ff4500' } },
  { id: 'ocean',        label: 'Océan',          description: 'Bleu profond, azur apaisant',   colors: { base: '#010810', surface: '#030f1a', card: '#061826', accent: '#0ea5e9' } },
  { id: 'rose',         label: 'Rose',           description: 'Dark rose, élégance féminine',  colors: { base: '#0d020a', surface: '#180510', card: '#220818', accent: '#f43f5e' } },
  { id: 'holographic',  label: 'Holographique',  description: 'Arc-en-ciel animé',  animated: true, colors: { base: '#06020e', surface: '#0a0420', card: '#10062e', accent: '#8b5cf6' } },
  { id: 'light',        label: 'Clair',          description: 'Lumineux, idéal le jour',       colors: { base: '#f0f4f8', surface: '#e4eaf3', card: '#ffffff',  accent: '#3b82f6' } },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-4">{children}</p>
}

function Field({
  label, icon: Icon, value, onChange, type = 'text', readOnly = false, placeholder,
}: {
  label: string; icon: React.ElementType; value: string; onChange?: (v: string) => void
  type?: string; readOnly?: boolean; placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-white/45">{label}</label>
      <div className="relative">
        <Icon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
        <input
          type={type}
          value={value}
          readOnly={readOnly}
          placeholder={placeholder}
          onChange={e => onChange?.(e.target.value)}
          className={cn(
            'w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-white/5 border border-white/8 text-white placeholder:text-white/20',
            'focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all',
            readOnly && 'opacity-40 cursor-not-allowed select-none',
          )}
        />
      </div>
    </div>
  )
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        'relative rounded-full transition-all duration-200 flex-shrink-0 disabled:opacity-40',
        checked ? 'bg-blue-600' : 'bg-white/10',
      )}
      style={{ height: '22px', width: '40px' }}
    >
      <span className={cn(
        'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-200',
        checked ? 'left-5' : 'left-0.5',
      )} />
    </button>
  )
}

function NotifRow({
  icon: Icon, iconColor, label, sub, checked, onChange,
}: {
  icon: React.ElementType; iconColor: string; label: string; sub: string
  checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-white/5 last:border-0">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', iconColor)}>
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/80">{label}</p>
        <p className="text-xs text-white/35 mt-0.5">{sub}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

// Skeleton inline pour les champs pendant le chargement
function FieldSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="skeleton h-3 w-20 rounded" />
      <div className="skeleton h-10 w-full rounded-xl" />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const [activeSection, setActiveSection] = useState<Section>('profile')
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [limits, setLimits]   = useState<UserLimits | null>(null)
  const [loading, setLoading] = useState(true)

  // Profile form
  const [fullName, setFullName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [phone, setPhone]       = useState('')
  const [company, setCompany]   = useState('')

  // Save states
  const [saving, setSaving]           = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError]     = useState<string | null>(null)

  // Password reset
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError]     = useState<string | null>(null)

  // Delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Notifications (localStorage)
  const [notifDeadline7,  setNotifDeadline7]  = useState(true)
  const [notifDeadline3,  setNotifDeadline3]  = useState(true)
  const [notifBoamp,      setNotifBoamp]      = useState(true)
  const [notifWeekly,     setNotifWeekly]     = useState(false)
  const [notifProduct,    setNotifProduct]    = useState(true)
  const [notifLoaded, setNotifLoaded]         = useState(false)

  // Load notif prefs from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('pp_notif_prefs')
      if (raw) {
        const p = JSON.parse(raw) as Record<string, boolean>
        if (typeof p.deadline7 === 'boolean') setNotifDeadline7(p.deadline7)
        if (typeof p.deadline3 === 'boolean') setNotifDeadline3(p.deadline3)
        if (typeof p.boamp    === 'boolean')  setNotifBoamp(p.boamp)
        if (typeof p.weekly   === 'boolean')  setNotifWeekly(p.weekly)
        if (typeof p.product  === 'boolean')  setNotifProduct(p.product)
      }
    } catch { /* ignore */ }
    setNotifLoaded(true)
  }, [])

  function saveNotifPref(key: string, val: boolean) {
    try {
      const raw = localStorage.getItem('pp_notif_prefs')
      const p = raw ? (JSON.parse(raw) as Record<string, boolean>) : {}
      p[key] = val
      localStorage.setItem('pp_notif_prefs', JSON.stringify(p))
    } catch { /* ignore */ }
  }

  function handleNotif(key: string, setter: (v: boolean) => void) {
    return (v: boolean) => { setter(v); saveNotifPref(key, v) }
  }

  // Load profile + limits
  const loadAll = useCallback(async () => {
    try {
      const [profileRes, limitsRes] = await Promise.all([
        fetch('/api/user/profile'),
        fetch('/api/user/limits'),
      ])
      if (profileRes.ok) {
        const d = await profileRes.json() as ProfileData
        setProfile(d)
        setFullName(d.full_name ?? '')
        setJobTitle(d.job_title ?? '')
        setPhone(d.phone ?? '')
        setCompany(d.company ?? '')
      }
      if (limitsRes.ok) {
        setLimits(await limitsRes.json() as UserLimits)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // Save profile
  async function handleSave() {
    setSaving(true); setSaveSuccess(false); setSaveError(null)
    try {
      const r = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, job_title: jobTitle, phone, company }),
      })
      if (!r.ok) throw new Error(((await r.json()) as { error?: string }).error ?? 'Erreur serveur')
      setSaveSuccess(true)
      // Refresh profile data
      const refreshed = await fetch('/api/user/profile')
      if (refreshed.ok) setProfile(await refreshed.json() as ProfileData)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Erreur')
    } finally { setSaving(false) }
  }

  // Password reset
  async function handlePasswordReset() {
    setPwLoading(true); setPwSuccess(false); setPwError(null)
    try {
      const r = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-password' }),
      })
      if (!r.ok) throw new Error(((await r.json()) as { error?: string }).error ?? 'Erreur')
      setPwSuccess(true)
    } catch (e) {
      setPwError(e instanceof Error ? e.message : 'Erreur')
    } finally { setPwLoading(false) }
  }

  // Sign out
  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Helpers
  const tier: SubscriptionTier = profile?.subscription_tier ?? 'free'

  const initials = (fullName || profile?.email || '?')
    .split(/[\s@]/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : null

  const completionFields = [fullName, jobTitle, phone, company]
  const completionPct = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100)

  const usagePct = limits?.analyses_limit
    ? Math.min(100, Math.round((limits.analyses_used / limits.analyses_limit) * 100))
    : 0

  return (
    <div className="flex flex-col min-h-0 h-full animate-fade-in">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="h-14 flex items-center px-4 md:px-6 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.055)', background: 'rgba(8,14,34,0.80)', backdropFilter: 'blur(16px)' }}>
        <div>
          <h1 className="text-base font-semibold text-white">Mon compte</h1>
          <p className="text-xs text-white/35">Gérez votre profil et vos préférences</p>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Left nav ──────────────────────────────────────────────────── */}
        <aside className="hidden md:flex flex-col w-52 flex-shrink-0 py-4 gap-0.5 overflow-y-auto scrollbar-hide"
          style={{ borderRight: '1px solid rgba(255,255,255,0.055)' }}>
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={cn(
                'flex items-center gap-2.5 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left border',
                activeSection === id
                  ? id === 'danger'
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : 'bg-blue-600/15 text-blue-400 border-blue-500/20'
                  : id === 'danger'
                    ? 'text-red-400/50 hover:text-red-400 hover:bg-red-500/5 border-transparent mt-auto'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5 border-transparent',
              )}
            >
              <Icon size={14} className="flex-shrink-0" />
              {label}
            </button>
          ))}
        </aside>

        {/* ── Mobile tabs ───────────────────────────────────────────────── */}
        <div className="md:hidden flex-shrink-0 border-b border-white/5 overflow-x-auto scrollbar-hide w-full absolute top-14 z-10 bg-[var(--bg-surface)]">
          <div className="flex gap-0 px-3 py-2 w-max">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                  activeSection === id
                    ? id === 'danger' ? 'bg-red-500/15 text-red-400' : 'bg-blue-600/15 text-blue-400'
                    : 'text-white/40 hover:text-white/70',
                )}
              >
                <Icon size={12} />{label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ───────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">

          {/* Profile banner */}
          <div className="px-5 md:px-8 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,14,34,0.60)', backdropFilter: 'blur(12px)' }}>
            {loading ? (
              <div className="flex items-center gap-4">
                <div className="skeleton w-16 h-16 rounded-2xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-40 rounded" />
                  <div className="skeleton h-3 w-52 rounded" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className={cn(
                  'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white text-xl font-extrabold flex-shrink-0 select-none shadow-lg',
                  TIER_AVATAR_BG[tier],
                )}>
                  {initials}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-base font-bold text-white truncate">
                      {fullName || 'Nom non défini'}
                    </p>
                    <span className={cn('inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border', TIER_COLORS[tier])}>
                      {TIER_LABELS[tier]}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 mt-0.5 truncate">{profile?.email}</p>
                  {memberSince && (
                    <p className="text-[11px] text-white/25 mt-0.5 flex items-center gap-1">
                      <Calendar size={9} />Membre depuis {memberSince}
                    </p>
                  )}
                </div>

                {/* Quick stats */}
                <div className="hidden lg:flex items-center gap-6 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] text-white/30 flex items-center justify-end gap-1"><Cpu size={9} />Analyses</p>
                    <p className="text-sm font-bold text-white/80 tabular-nums">{limits?.analyses_used ?? '—'}</p>
                    <p className="text-[10px] text-white/25">ce mois</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-white/30 flex items-center justify-end gap-1"><BarChart3 size={9} />Formule</p>
                    <p className="text-sm font-bold text-white/80">{TIER_LABELS[tier]}</p>
                    <p className="text-[10px] text-white/25">actuelle</p>
                  </div>
                </div>
              </div>
            )}

            {/* Completion bar */}
            {!loading && completionPct < 100 && (
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${completionPct}%` }} />
                </div>
                <p className="text-[10px] text-white/30 flex-shrink-0">
                  Profil complété à {completionPct}%
                </p>
              </div>
            )}
          </div>

          {/* Section content */}
          <div className="p-5 md:p-8 space-y-5 max-w-2xl">

            {/* ══════════════ PROFIL ══════════════ */}
            {activeSection === 'profile' && (
              <div className="space-y-5 animate-fade-in">

                <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                  <SectionTitle>Identité</SectionTitle>
                  {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Array.from({ length: 5 }).map((_, i) => <FieldSkeleton key={i} />)}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Prénom & nom"     icon={User}      value={fullName}  onChange={setFullName}  placeholder="Jean Dupont" />
                      <Field label="Email"             icon={Mail}      value={profile?.email ?? ''} readOnly type="email" />
                      <Field label="Intitulé du poste" icon={Briefcase} value={jobTitle}  onChange={setJobTitle}  placeholder="Directeur commercial" />
                      <Field label="Téléphone"         icon={Phone}     value={phone}     onChange={setPhone}     placeholder="+33 6 00 00 00 00" type="tel" />
                      <div className="sm:col-span-2">
                        <Field label="Entreprise"      icon={Building2} value={company}   onChange={setCompany}   placeholder="Acme SAS" />
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex items-center gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saving || loading}
                      className={cn(
                        'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
                        saveSuccess
                          ? 'bg-emerald-500/12 border border-emerald-500/30 text-emerald-400'
                          : 'btn-primary',
                        (saving || loading) && 'opacity-60 cursor-not-allowed',
                      )}
                    >
                      {saving ? <Loader2 size={13} className="animate-spin" /> : saveSuccess ? <CheckCircle2 size={13} /> : null}
                      {saving ? 'Enregistrement…' : saveSuccess ? 'Enregistré !' : 'Enregistrer les modifications'}
                    </button>
                    {saveError && <p className="text-xs text-red-400">{saveError}</p>}
                  </div>
                </div>

                {/* Connexion */}
                <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                  <SectionTitle>Connexion</SectionTitle>
                  <div className="space-y-0">
                    <div className="flex items-center justify-between py-3 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                          <Globe2 size={13} className="text-white/40" />
                        </div>
                        <div>
                          <p className="text-sm text-white/70">Méthode de connexion</p>
                          <p className="text-xs text-white/30">
                            {loading ? '…' : profile?.provider === 'google' ? 'Google OAuth' : 'Email + mot de passe'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">Actif</span>
                    </div>
                    {memberSince && (
                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                            <Calendar size={13} className="text-white/40" />
                          </div>
                          <div>
                            <p className="text-sm text-white/70">Membre depuis</p>
                            <p className="text-xs text-white/30">{memberSince}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Export données */}
                <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                  <SectionTitle>Mes données</SectionTitle>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                        <Download size={13} className="text-white/40" />
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Exporter mes données</p>
                        <p className="text-xs text-white/30">Téléchargez tous vos projets et analyses (RGPD)</p>
                      </div>
                    </div>
                    <a
                      href={`mailto:privacy@pilotplus.app?subject=Export de mes données RGPD&body=Email du compte : ${profile?.email ?? ''}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white text-xs font-semibold transition-colors flex-shrink-0"
                    >
                      <ArrowUpRight size={12} />Demander
                    </a>
                  </div>
                </div>

              </div>
            )}

            {/* ══════════════ NOTIFICATIONS ══════════════ */}
            {activeSection === 'notifications' && notifLoaded && (
              <div className="space-y-5 animate-fade-in">

                <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                  <SectionTitle>Alertes & rappels</SectionTitle>
                  <NotifRow
                    icon={Bell}    iconColor="bg-amber-500/10 text-amber-400"
                    label="Alerte échéance J-7"
                    sub="Rappel 7 jours avant la date limite d'une offre"
                    checked={notifDeadline7}
                    onChange={handleNotif('deadline7', setNotifDeadline7)}
                  />
                  <NotifRow
                    icon={Bell}    iconColor="bg-red-500/10 text-red-400"
                    label="Alerte échéance J-3"
                    sub="Rappel 3 jours avant — priorité haute"
                    checked={notifDeadline3}
                    onChange={handleNotif('deadline3', setNotifDeadline3)}
                  />
                </div>

                <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                  <SectionTitle>Veille & activité</SectionTitle>
                  <NotifRow
                    icon={Zap}       iconColor="bg-blue-500/10 text-blue-400"
                    label="Nouvelles annonces BOAMP"
                    sub="Notifié dès qu'une consultation correspond à vos critères"
                    checked={notifBoamp}
                    onChange={handleNotif('boamp', setNotifBoamp)}
                  />
                  <NotifRow
                    icon={BarChart3} iconColor="bg-emerald-500/10 text-emerald-400"
                    label="Résumé hebdomadaire"
                    sub="Récap de vos projets et opportunités chaque lundi matin"
                    checked={notifWeekly}
                    onChange={handleNotif('weekly', setNotifWeekly)}
                  />
                </div>

                <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                  <SectionTitle>Produit</SectionTitle>
                  <NotifRow
                    icon={Star}    iconColor="bg-violet-500/10 text-violet-400"
                    label="Mises à jour PILOT+"
                    sub="Nouvelles fonctionnalités et améliorations de la plateforme"
                    checked={notifProduct}
                    onChange={handleNotif('product', setNotifProduct)}
                  />
                  <div className="mt-3 px-3 py-2.5 rounded-lg bg-white/3 border border-white/6 flex items-start gap-2.5">
                    <BellOff size={12} className="text-white/25 mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-white/30 leading-relaxed">
                      Les notifications sont envoyées à <strong className="text-white/50">{profile?.email}</strong>.
                      Les préférences sont sauvegardées sur cet appareil.
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* ══════════════ APPARENCE ══════════════ */}
            {activeSection === 'appearance' && (
              <div className="space-y-5 animate-fade-in">
                <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                  <SectionTitle>Thème de l&apos;interface</SectionTitle>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {THEMES.map(t => {
                      const active = theme === t.id
                      return (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id)}
                          className={cn(
                            'relative flex flex-col gap-2.5 p-3 rounded-xl border text-left transition-all group',
                            active
                              ? 'border-blue-500/60 bg-blue-600/8 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                              : 'border-white/8 hover:border-white/20 bg-white/2 hover:bg-white/4',
                          )}
                        >
                          {active && (
                            <span className="absolute top-2 right-2 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center z-10">
                              <Check size={9} className="text-white" />
                            </span>
                          )}
                          {t.animated && !active && (
                            <span className="absolute top-2 right-2 text-[7px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                              style={{ background: 'rgba(139,92,246,0.25)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.35)' }}>
                              LIVE
                            </span>
                          )}
                          {/* Mini preview */}
                          <div
                            className="w-full h-14 rounded-lg overflow-hidden flex flex-col gap-1 p-1.5 relative"
                            style={{ background: t.colors.base, border: t.id === 'light' ? '1px solid rgba(0,0,0,0.10)' : '1px solid rgba(255,255,255,0.06)' }}
                          >
                            {/* Fake orbs */}
                            <div className="absolute inset-0 opacity-40" style={{
                              background: `radial-gradient(circle at 20% 30%, ${t.colors.accent}20 0%, transparent 60%)`,
                            }} />
                            <div className="h-1.5 w-8 rounded flex-shrink-0" style={{ background: t.colors.surface }} />
                            <div className="flex gap-1 flex-1 min-h-0">
                              <div className="w-4 h-full rounded" style={{ background: t.colors.surface }} />
                              <div className="flex-1 h-full rounded" style={{ background: t.colors.card }} />
                            </div>
                            <div className="h-1 w-5 rounded flex-shrink-0" style={{ background: t.colors.accent, opacity: 0.9 }} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className={cn('text-xs font-bold truncate', active ? 'text-blue-400' : 'text-white/80')}>{t.label}</p>
                            </div>
                            <p className="text-[9px] text-white/30 mt-0.5 leading-snug line-clamp-2">{t.description}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-[10px] text-white/25 mt-4">
                    Le thème est appliqué instantanément et sauvegardé localement. Les thèmes&nbsp;
                    <span className="text-violet-400/70 font-medium">LIVE</span> ont des animations actives.
                  </p>
                </div>
              </div>
            )}

            {/* ══════════════ SÉCURITÉ ══════════════ */}
            {activeSection === 'security' && (
              <div className="space-y-5 animate-fade-in">

                {/* Mot de passe */}
                <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                  <SectionTitle>Mot de passe</SectionTitle>
                  {profile?.provider === 'google' ? (
                    <div className="flex items-center gap-3 py-2">
                      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                        <Globe2 size={14} className="text-white/40" />
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Connexion via Google</p>
                        <p className="text-xs text-white/30 mt-0.5">La gestion du mot de passe se fait depuis votre compte Google</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                          <KeyRound size={14} className="text-white/40" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white/80">Réinitialiser le mot de passe</p>
                          <p className="text-xs text-white/35 mt-0.5">
                            Un lien sera envoyé à <span className="text-white/50">{profile?.email}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-start sm:items-end gap-1.5">
                        <button
                          onClick={handlePasswordReset}
                          disabled={pwLoading || pwSuccess}
                          className={cn(
                            'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex-shrink-0',
                            pwSuccess
                              ? 'bg-emerald-600/15 border border-emerald-500/30 text-emerald-400'
                              : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white',
                            (pwLoading || pwSuccess) && 'opacity-70 cursor-not-allowed',
                          )}
                        >
                          {pwLoading ? <Loader2 size={14} className="animate-spin" /> : pwSuccess ? <Check size={14} /> : <Lock size={14} />}
                          {pwSuccess ? 'Email envoyé !' : 'Envoyer le lien'}
                        </button>
                        {pwError && <p className="text-xs text-red-400">{pwError}</p>}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2FA */}
                <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                  <SectionTitle>Double authentification</SectionTitle>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                        <Fingerprint size={14} className="text-white/40" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">Authentification à deux facteurs</p>
                        <p className="text-xs text-white/35 mt-0.5">Renforcez la sécurité avec un code OTP à chaque connexion</p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/4 border border-white/8 text-white/25 font-semibold flex-shrink-0">
                      À venir
                    </span>
                  </div>
                </div>

                {/* Session */}
                <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                  <SectionTitle>Session active</SectionTitle>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Shield size={14} className="text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">Session en cours</p>
                        <p className="text-xs text-white/35 mt-0.5">
                          Navigateur web · {profile?.email}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold flex-shrink-0">
                      Connecté
                    </span>
                  </div>
                </div>

              </div>
            )}

            {/* ══════════════ ABONNEMENT ══════════════ */}
            {activeSection === 'subscription' && (
              <div className="space-y-5 animate-fade-in">

                {/* Plan actuel */}
                <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                  <SectionTitle>Formule actuelle</SectionTitle>

                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', TIER_COLORS[tier])}>
                        {tier === 'enterprise' || tier === 'lifetime' ? <Star size={16} /> : tier === 'pro' ? <Zap size={16} /> : <CreditCard size={16} />}
                      </div>
                      <div>
                        <p className="text-base font-bold text-white">{TIER_LABELS[tier]}</p>
                        <p className="text-xs text-white/35">{TIER_LIMITS_DISPLAY[tier]}</p>
                      </div>
                    </div>
                    <Link
                      href="/subscription"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-semibold transition-colors flex-shrink-0"
                    >
                      Gérer <ChevronRight size={12} />
                    </Link>
                  </div>

                  {/* Usage bar */}
                  {limits && limits.analyses_limit !== null && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-white/50">Analyses utilisées ce mois</p>
                        <p className="text-xs font-semibold text-white/60 tabular-nums">
                          {limits.analyses_used} / {limits.analyses_limit}
                        </p>
                      </div>
                      <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-700',
                            usagePct >= 90 ? 'bg-red-500' : usagePct >= 70 ? 'bg-amber-500' : 'bg-blue-500',
                          )}
                          style={{ width: `${usagePct}%` }}
                        />
                      </div>
                      {usagePct >= 90 && (
                        <p className="text-xs text-red-400 mt-2 flex items-center gap-1.5">
                          <AlertTriangle size={11} />Quota presque atteint — passez à un plan supérieur
                        </p>
                      )}
                    </div>
                  )}

                  {/* Unlimited badge for lifetime/enterprise */}
                  {(tier === 'lifetime' || tier === 'enterprise') && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/8 border border-emerald-500/15">
                      <CheckCircle2 size={13} className="text-emerald-400" />
                      <p className="text-xs text-emerald-400/80">Analyses illimitées incluses</p>
                    </div>
                  )}
                </div>

                {/* Upgrade CTA */}
                {(tier === 'free' || tier === 'basic') && (
                  <div className="bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/20 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-white mb-1">Passez au niveau supérieur</p>
                        <p className="text-xs text-white/45 leading-relaxed">
                          Débloquez des analyses illimitées, la veille BOAMP avancée et bien plus.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {['Analyses illimitées', 'Export PDF', 'Veille avancée', 'Support prioritaire'].map(f => (
                            <span key={f} className="text-[10px] flex items-center gap-1 text-blue-400/80">
                              <Check size={9} />{f}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Link
                        href="/subscription"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex-shrink-0 whitespace-nowrap"
                      >
                        Voir les offres <ArrowUpRight size={12} />
                      </Link>
                    </div>
                  </div>
                )}

                {/* Facturation */}
                <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                  <SectionTitle>Facturation</SectionTitle>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                        <CreditCard size={14} className="text-white/40" />
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Portail de facturation</p>
                        <p className="text-xs text-white/30">Factures, paiements, résiliation</p>
                      </div>
                    </div>
                    <Link
                      href="/subscription"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white text-xs font-semibold transition-colors flex-shrink-0"
                    >
                      Accéder <ArrowUpRight size={12} />
                    </Link>
                  </div>
                </div>

              </div>
            )}

            {/* ══════════════ DANGER ══════════════ */}
            {activeSection === 'danger' && (
              <div className="space-y-5 animate-fade-in">

                <div className="px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/20 flex items-start gap-3">
                  <AlertTriangle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-400/80 leading-relaxed">
                    Les actions de cette section sont <strong>irréversibles</strong>. Procédez avec précaution.
                  </p>
                </div>

                {/* Déconnexion */}
                <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                  <SectionTitle>Déconnexion</SectionTitle>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                        <LogOut size={14} className="text-white/40" />
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Se déconnecter</p>
                        <p className="text-xs text-white/30">Met fin à votre session sur cet appareil</p>
                      </div>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-sm font-semibold transition-all"
                    >
                      <LogOut size={14} />Déconnexion
                    </button>
                  </div>
                </div>

                {/* Suppression */}
                <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(239,68,68,0.20)', backdropFilter: 'blur(10px)' }}>
                  <SectionTitle>Suppression du compte</SectionTitle>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Trash2 size={14} className="text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">Supprimer mon compte</p>
                        <p className="text-xs text-white/35 mt-0.5 max-w-xs leading-relaxed">
                          Tous vos projets, analyses et fichiers seront définitivement supprimés.
                        </p>
                      </div>
                    </div>

                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-semibold transition-all flex-shrink-0"
                      >
                        <Trash2 size={14} />Supprimer
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2 sm:items-end">
                        <p className="text-xs text-white/50 sm:text-right max-w-xs">
                          Contactez le support pour confirmer la suppression :
                        </p>
                        <a
                          href={`mailto:contact@pilot-plus.fr?subject=Suppression de compte PILOT%2B&body=Email : ${profile?.email ?? ''}`}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600/20 border border-red-500/40 text-red-300 text-xs font-semibold hover:bg-red-600/30 transition-colors"
                        >
                          <Mail size={13} />contact@pilot-plus.fr
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
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
