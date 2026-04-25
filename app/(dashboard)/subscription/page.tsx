import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import {
  Check, X, Lock, Zap, Star, Building2, Sparkles,
  Shield, Clock, Headphones, BarChart3,
  ArrowRight, BadgeCheck, Infinity as InfinityIcon,
  FileText, Users, Mail, UserSearch, Radio,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { CheckoutButton } from './CheckoutButton'
import { PortalButton } from './PortalButton'
import type { SubscriptionTier } from '@/types'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Mon abonnement — PILOT+' }

// ── Plans config ──────────────────────────────────────────────────────────────

type PlanId = Exclude<SubscriptionTier, 'lifetime'>

interface Plan {
  id: PlanId
  name: string
  price: number
  tagline: string
  quota: string
  quotaSub: string
  icon: React.ElementType
  color: 'free' | 'blue' | 'pro' | 'purple'
  badge: string | null
}

const PLANS: Plan[] = [
  {
    id: 'free', name: 'Gratuit', price: 0,
    tagline: 'Pour découvrir',
    quota: '1', quotaSub: 'analyse IA (à vie)',
    icon: Lock, color: 'free', badge: null,
  },
  {
    id: 'basic', name: 'Basic', price: 49,
    tagline: 'Pour démarrer',
    quota: '10', quotaSub: 'analyses IA / mois',
    icon: Zap, color: 'blue', badge: null,
  },
  {
    id: 'pro', name: 'Pro', price: 149,
    tagline: 'Pour les équipes',
    quota: '50', quotaSub: 'analyses IA / mois',
    icon: Star, color: 'pro', badge: 'Le plus populaire',
  },
  {
    id: 'enterprise', name: 'Entreprise', price: 499,
    tagline: 'Pour scaler',
    quota: '∞', quotaSub: 'analyses illimitées',
    icon: Building2, color: 'purple', badge: null,
  },
]

// ── Feature matrix ────────────────────────────────────────────────────────────

type FeatureValue = boolean | string | null

interface Feature {
  label: string
  icon: React.ElementType
  values: [FeatureValue, FeatureValue, FeatureValue, FeatureValue] // free, basic, pro, enterprise
  category?: string
}

const FEATURES: Feature[] = [
  // IA
  { icon: BarChart3, label: 'Analyses IA / mois',         values: ['1 total', '10 / mois',  '50 / mois', '∞ illimité'],   category: 'Analyse IA' },
  { icon: BarChart3, label: 'Score Go / No Go',           values: [true, true, true, true],                                category: 'Analyse IA' },
  { icon: FileText,  label: 'Rapport détaillé',           values: [false, true, true, true],                               category: 'Analyse IA' },
  { icon: FileText,  label: 'Export PDF',                 values: [false, false, true, true],                              category: 'Analyse IA' },
  // Projets
  { icon: BarChart3, label: 'Historique projets',         values: ['7 jours', '30 jours', 'Complet', 'Complet'],           category: 'Projets' },
  { icon: BarChart3, label: 'Plan de réponse IA',         values: [false, false, true, true],                              category: 'Projets' },
  { icon: FileText,  label: 'Veille BOAMP',               values: [false, false, true, true],                              category: 'Projets' },
  // Outils
  { icon: UserSearch, label: 'Find contacts (emails)',    values: [false, '50 / mois', '200 / mois', '∞ illimité'],        category: 'Outils IA' },
  { icon: Mail,       label: 'Campagnes email IA',        values: [false, false, true, true],                              category: 'Outils IA' },
  { icon: Radio,      label: 'Accès API PILOT+',          values: [false, false, false, true],                             category: 'Outils IA' },
  // Équipe
  { icon: Users, label: 'Utilisateurs',                   values: ['1', '1', '5', '∞ illimité'],                          category: 'Équipe' },
  { icon: Users, label: 'Partage de projets',             values: [false, false, true, true],                              category: 'Équipe' },
  // Support
  { icon: Headphones, label: 'Support',                   values: ['Email', 'Email', 'Prioritaire', 'Dédié + Tel'],        category: 'Support' },
  { icon: Headphones, label: 'Onboarding dédié',          values: [false, false, false, true],                             category: 'Support' },
  { icon: Shield,     label: 'SLA garanti',               values: [false, false, false, true],                             category: 'Support' },
]

const FAQ = [
  { q: 'Le quota Free est-il mensuel ou à vie ?', a: 'À vie. Le plan Gratuit donne accès à 1 seule analyse IA. Pour en effectuer davantage, vous devez upgrader.' },
  { q: 'Que se passe-t-il quand j\'atteins mon quota ?', a: 'Toutes les fonctionnalités IA sont bloquées jusqu\'au renouvellement mensuel (plans payants) ou jusqu\'au passage à un plan supérieur.' },
  { q: 'Puis-je annuler à tout moment ?', a: 'Oui, sans préavis ni frais. Votre accès reste actif jusqu\'à la fin de la période payée.' },
  { q: 'Puis-je changer de plan en cours de mois ?', a: 'Oui, le changement est immédiat et le montant est calculé au prorata via Stripe.' },
]

const TIER_LABEL: Record<SubscriptionTier, string> = {
  free: 'Gratuit', basic: 'Basic', pro: 'Pro', enterprise: 'Entreprise', lifetime: 'Accès à vie',
}

// ── Color configs ─────────────────────────────────────────────────────────────

const COLOR_CFG = {
  free:   { card: 'rgba(255,255,255,0.02)',   border: 'rgba(255,255,255,0.07)',    icon: 'rgba(255,255,255,0.05)',  iconBorder: 'rgba(255,255,255,0.09)',   text: 'text-white/40',   cta: 'bg-white/5 text-white/30 border border-white/10',  glow: '' },
  blue:   { card: 'rgba(59,130,246,0.06)',    border: 'rgba(59,130,246,0.22)',     icon: 'rgba(59,130,246,0.14)',  iconBorder: 'rgba(59,130,246,0.28)',    text: 'text-blue-400',   cta: 'bg-blue-600/90 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25', glow: '0 0 40px rgba(59,130,246,0.08)' },
  pro:    { card: 'rgba(59,130,246,0.10)',    border: 'rgba(59,130,246,0.42)',     icon: 'rgba(59,130,246,0.18)',  iconBorder: 'rgba(59,130,246,0.35)',    text: 'text-blue-300',   cta: 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-xl shadow-blue-600/35', glow: '0 0 60px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.08)' },
  purple: { card: 'rgba(139,92,246,0.07)',    border: 'rgba(139,92,246,0.28)',     icon: 'rgba(139,92,246,0.14)',  iconBorder: 'rgba(139,92,246,0.28)',    text: 'text-violet-400', cta: 'bg-violet-600/90 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/25', glow: '0 0 40px rgba(139,92,246,0.08)' },
} as const

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, subscription_tier, stripe_customer_id, stripe_subscription_id')
    .eq('id', user.id).single()

  const tier: SubscriptionTier = profile?.subscription_tier ?? 'free'
  const isLifetime = tier === 'lifetime'
  const isPaid = tier !== 'free' && !isLifetime
  const hasStripe = !!(profile?.stripe_customer_id)
  const firstName = profile?.full_name?.split(' ')[0] ?? null

  return (
    <div className="flex flex-col min-h-0">

      {/* Top bar */}
      <div className="h-14 flex items-center px-4 md:px-6 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.055)', background: 'rgba(8,14,34,0.80)', backdropFilter: 'blur(16px)' }}>
        <div>
          <h1 className="text-base font-semibold text-white">Mon abonnement</h1>
          <p className="text-xs text-white/35">Gérez votre formule PILOT+</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-12 animate-fade-in">

          {/* Flash messages */}
          {sp.success && (
            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl relative overflow-hidden"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', boxShadow: '0 0 30px rgba(16,185,129,0.08)' }}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 0% 50%, rgba(16,185,129,0.10) 0%, transparent 60%)' }} />
              <BadgeCheck size={20} className="text-emerald-400 flex-shrink-0 relative" />
              <div className="relative">
                <p className="text-sm font-semibold text-emerald-300">Paiement confirmé !</p>
                <p className="text-xs text-emerald-400/70 mt-0.5">Votre abonnement est maintenant actif.</p>
              </div>
            </div>
          )}
          {sp.canceled && (
            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <X size={16} className="text-white/40 flex-shrink-0" />
              <p className="text-sm text-white/50">Paiement annulé. Vous pouvez réessayer à tout moment.</p>
            </div>
          )}

          {/* ── Current plan banner ─────────────────────────────────────────── */}
          {isLifetime ? (
            <LifetimeBanner firstName={firstName} />
          ) : (
            <CurrentPlanBanner tier={tier} firstName={firstName} isPaid={isPaid} hasStripe={hasStripe} />
          )}

          {/* ── Section header ──────────────────────────────────────────────── */}
          {!isLifetime && (
            <div id="plans">
              <div className="text-center mb-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-400/65 mb-3">Tarification</p>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3 leading-tight">
                  Choisissez votre formule
                </h2>
                <p className="text-white/40 text-sm max-w-lg mx-auto">
                  Toutes les analyses utilisent Claude IA. Le quota se renouvelle le 1er de chaque mois (sauf plan Gratuit).
                </p>
                <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] text-white/40">Sans engagement · Résiliation 1 clic · Paiement Stripe</span>
                </div>
              </div>

              {/* ── Plan cards ────────────────────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-16">
                {PLANS.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} isCurrent={tier === plan.id} isLifetime={isLifetime} />
                ))}
              </div>

              {/* ── Feature comparison table ───────────────────────────────── */}
              <FeatureTable currentTier={tier} />

              {/* ── Trust strip ───────────────────────────────────────────── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10">
                {[
                  { icon: Shield,     text: 'Paiement sécurisé', sub: 'SSL + Stripe',  color: 'rgba(59,130,246,0.10)',  border: 'rgba(59,130,246,0.18)',  cls: 'text-blue-400'    },
                  { icon: Clock,      text: 'Annulation libre',  sub: 'Sans préavis',   color: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.16)', cls: 'text-emerald-400' },
                  { icon: Headphones, text: 'Support inclus',    sub: 'Email & chat',   color: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.16)', cls: 'text-violet-400'  },
                  { icon: BarChart3,  text: 'Données en EU',     sub: 'RGPD compliant', color: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.16)', cls: 'text-amber-400'   },
                ].map(({ icon: Icon, text, sub, color, border, cls }) => (
                  <div key={text} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: color, border: `1px solid ${border}`, backdropFilter: 'blur(8px)' }}>
                    <Icon size={14} className={cls} />
                    <div>
                      <p className="text-xs font-semibold text-white/75">{text}</p>
                      <p className="text-[10px] text-white/30">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── FAQ ───────────────────────────────────────────────────── */}
              <section className="mt-10">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">Questions fréquentes</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {FAQ.map(({ q, a }) => (
                    <div key={q} className="px-5 py-4 rounded-2xl"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(8px)' }}>
                      <p className="text-sm font-semibold text-white/80 mb-2">{q}</p>
                      <p className="text-xs text-white/40 leading-relaxed">{a}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ── CurrentPlanBanner ─────────────────────────────────────────────────────────

function CurrentPlanBanner({ tier, firstName, isPaid, hasStripe }: {
  tier: SubscriptionTier; firstName: string | null; isPaid: boolean; hasStripe: boolean
}) {
  const isFree = tier === 'free'
  const planIdx = PLANS.findIndex(p => p.id === tier)
  const plan = planIdx >= 0 ? PLANS[planIdx] : null
  const cfg = plan ? COLOR_CFG[plan.color] : COLOR_CFG.free

  return (
    <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
      style={{
        background: isFree ? 'rgba(255,255,255,0.025)' : `linear-gradient(135deg, ${cfg.card} 0%, rgba(8,14,34,0.92) 100%)`,
        border: `1px solid ${cfg.border}`,
        boxShadow: cfg.glow || undefined,
        backdropFilter: 'blur(16px)',
      }}>

      {!isFree && (
        <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
          style={{ background: `radial-gradient(circle at top right, ${cfg.card.replace('0.10', '0.15').replace('0.06', '0.12').replace('0.07', '0.12')} 0%, transparent 70%)` }} />
      )}

      <div className="relative min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Votre formule actuelle</p>
        <div className="flex items-center gap-3 mb-3">
          <span className={cn('text-sm font-bold px-3 py-1.5 rounded-full border', isFree ? 'bg-white/5 text-white/50 border-white/10' : 'border-blue-500/30 bg-blue-500/15 text-blue-300')}>
            {TIER_LABEL[tier]}
          </span>
          {isPaid && <span className="text-white/30 text-xs">· Renouvellement mensuel automatique</span>}
        </div>
        {plan && (
          <p className="text-2xl md:text-3xl font-extrabold text-white leading-none">
            {plan.quota}
            <span className="text-base font-normal text-white/35 ml-2">{plan.quotaSub}</span>
          </p>
        )}
        {isFree && (
          <p className="text-sm text-white/40 mt-3 max-w-md leading-relaxed">
            {firstName ? `${firstName}, passez` : 'Passez'} à un plan payant pour débloquer toutes les fonctionnalités IA.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 flex-shrink-0 relative">
        {isPaid && hasStripe && <PortalButton />}
        {isFree && (
          <a href="#plans" className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white">
            Voir les formules <ArrowRight size={14} />
          </a>
        )}
      </div>
    </div>
  )
}

// ── LifetimeBanner ────────────────────────────────────────────────────────────

function LifetimeBanner({ firstName }: { firstName: string | null }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-8"
      style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.10) 0%, rgba(245,158,11,0.04) 60%, rgba(8,14,34,0.95) 100%)',
        border: '1px solid rgba(245,158,11,0.30)',
        boxShadow: '0 0 60px rgba(245,158,11,0.08), inset 0 1px 0 rgba(255,255,255,0.07)',
      }}>
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.30)' }}>
            <Sparkles size={13} className="text-amber-400" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-400/80">Accès à vie activé</span>
        </div>
        <h2 className="text-2xl font-extrabold text-white mb-2">
          {firstName ? `${firstName}, vous avez` : 'Vous avez'}&nbsp;
          <span style={{ color: '#fcd34d', textShadow: '0 0 20px rgba(245,158,11,0.4)' }}>l&apos;accès complet.</span>
        </h2>
        <p className="text-sm text-white/45">Toutes les fonctionnalités · Aucun renouvellement · Pour toujours.</p>
      </div>
    </div>
  )
}

// ── PlanCard ──────────────────────────────────────────────────────────────────

function PlanCard({ plan, isCurrent, isLifetime }: {
  plan: Plan; isCurrent: boolean; isLifetime: boolean
}) {
  const cfg = COLOR_CFG[plan.color]
  const isPro = plan.color === 'pro'
  const Icon = plan.icon

  return (
    <div className={cn('relative flex flex-col rounded-2xl transition-all duration-300', isPro ? 'card-hover' : 'card-hover')}
      style={{
        background: `linear-gradient(180deg, ${cfg.card} 0%, rgba(8,14,34,0.97) 100%)`,
        border: `1px solid ${cfg.border}`,
        boxShadow: cfg.glow || undefined,
        backdropFilter: 'blur(16px)',
      }}>

      {/* Top glow line for Pro */}
      {isPro && (
        <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.70), transparent)' }} />
      )}

      {/* Badge */}
      {(plan.badge || isCurrent) && (
        <div className="absolute -top-3.5 inset-x-0 flex justify-center">
          <span className="text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap"
            style={isCurrent
              ? { background: 'rgba(16,185,129,0.9)', color: 'white', boxShadow: '0 0 12px rgba(16,185,129,0.40)' }
              : isPro
                ? { background: 'linear-gradient(90deg, #2563eb, #3b82f6)', color: 'white', boxShadow: '0 0 14px rgba(59,130,246,0.55)' }
                : { background: 'rgba(139,92,246,0.85)', color: 'white' }}>
            {isCurrent ? '✓ Plan actuel' : plan.badge}
          </span>
        </div>
      )}

      <div className="p-6 flex flex-col flex-1 relative">

        {/* Icon + name */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: cfg.icon, border: `1px solid ${cfg.iconBorder}`, boxShadow: isPro ? '0 0 14px rgba(59,130,246,0.22)' : undefined }}>
            <Icon size={17} className={cfg.text} />
          </div>
          <div>
            <p className="font-extrabold text-white leading-none">{plan.name}</p>
            <p className="text-[11px] text-white/35 mt-0.5">{plan.tagline}</p>
          </div>
        </div>

        {/* Price */}
        <div className="mb-5">
          {plan.price === 0 ? (
            <div>
              <p className="text-4xl font-extrabold text-white/50 leading-none">Gratuit</p>
              <p className="text-[11px] text-white/20 mt-1">Pour toujours</p>
            </div>
          ) : (
            <div>
              <div className="flex items-end gap-1.5">
                <span className="text-5xl font-extrabold tabular-nums leading-none"
                  style={isPro ? { color: 'white', textShadow: '0 0 20px rgba(59,130,246,0.3)' } : { color: 'rgba(255,255,255,0.90)' }}>
                  {plan.price}€
                </span>
                <span className="text-white/30 text-sm mb-1">/mois</span>
              </div>
              <p className="text-[10px] text-white/20 mt-1">HT · Facturé mensuellement</p>
            </div>
          )}
        </div>

        {/* Quota highlight */}
        <div className="rounded-xl px-4 py-3 mb-5 flex items-center gap-3"
          style={{ background: cfg.icon, border: `1px solid ${cfg.iconBorder}` }}>
          <span className={cn('text-2xl font-extrabold tabular-nums leading-none', cfg.text)}>
            {plan.quota}
          </span>
          <div>
            <p className="text-[10px] font-semibold text-white/65">{plan.quotaSub}</p>
            {plan.id === 'free' && <p className="text-[9px] text-white/30 mt-0.5">Bloqué après utilisation</p>}
            {plan.id !== 'free' && plan.id !== 'enterprise' && <p className="text-[9px] text-white/30 mt-0.5">Renouvellement le 1er du mois</p>}
          </div>
        </div>

        <div className="h-px mb-5" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* Key features (3 highlights for this plan) */}
        <PlanHighlights planId={plan.id} cfg={cfg} />

        <div className="mt-auto pt-5">
          <PlanCTA plan={plan} isCurrent={isCurrent} isLifetime={isLifetime} cfg={cfg} />
        </div>
      </div>
    </div>
  )
}

function PlanHighlights({ planId, cfg }: { planId: PlanId; cfg: typeof COLOR_CFG[keyof typeof COLOR_CFG] }) {
  const highlights: Record<PlanId, string[]> = {
    free:       ['1 analyse IA (à vie)', 'Score Go / No Go basique', 'Accès limité à la plateforme'],
    basic:      ['10 analyses IA / mois', 'Score + rapport détaillé', 'Find contacts : 50 / mois'],
    pro:        ['50 analyses IA / mois', 'Veille BOAMP incluse', 'Export PDF · Campagnes email IA'],
    enterprise: ['Analyses illimitées', 'API PILOT+ + SLA garanti', 'Onboarding dédié · Support Tel'],
  }

  return (
    <ul className="space-y-2">
      {highlights[planId].map(h => (
        <li key={h} className="flex items-center gap-2.5 text-xs">
          <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: planId === 'free' ? 'rgba(255,255,255,0.05)' : cfg.icon, border: `1px solid ${planId === 'free' ? 'rgba(255,255,255,0.08)' : cfg.iconBorder}` }}>
            <Check size={9} className={planId === 'free' ? 'text-white/25' : cfg.text} />
          </div>
          <span className={planId === 'free' ? 'text-white/35' : 'text-white/70'}>{h}</span>
        </li>
      ))}
    </ul>
  )
}

function PlanCTA({ plan, isCurrent, isLifetime, cfg }: {
  plan: Plan; isCurrent: boolean; isLifetime: boolean; cfg: typeof COLOR_CFG[keyof typeof COLOR_CFG]
}) {
  if (isLifetime) return (
    <div className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-amber-400 text-xs font-semibold"
      style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.20)' }}>
      <Sparkles size={12} />Inclus dans votre accès à vie
    </div>
  )

  if (isCurrent) return (
    <div className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-emerald-400 text-xs font-semibold"
      style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.20)' }}>
      <BadgeCheck size={13} />Plan actuel
    </div>
  )

  if (plan.id === 'free') return (
    <div className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-white/25 text-xs"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      Plan de démarrage
    </div>
  )

  if (plan.id === 'enterprise') return (
    <a href="mailto:contact@pilot-plus.fr?subject=Abonnement%20Entreprise"
      className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-violet-300 text-sm font-semibold transition-all"
      style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.30)' }}>
      Nous contacter <ChevronRight size={14} />
    </a>
  )

  return (
    <CheckoutButton
      tier={plan.id}
      label={`Commencer avec ${plan.name}`}
      className={cn('w-full px-4 py-3 rounded-xl text-sm font-bold transition-all', cfg.cta)}
    />
  )
}

// ── Feature comparison table ──────────────────────────────────────────────────

function FeatureTable({ currentTier }: { currentTier: SubscriptionTier }) {
  const planColors: [string, string, string, string] = [
    'text-white/35', 'text-blue-400', 'text-blue-300', 'text-violet-400',
  ]

  function renderValue(val: FeatureValue, colIdx: number) {
    const textCls = planColors[colIdx]
    if (val === true) return (
      <div className="flex justify-center">
        <div className="w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: colIdx >= 2 ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.07)', border: colIdx >= 2 ? '1px solid rgba(16,185,129,0.28)' : '1px solid rgba(255,255,255,0.10)' }}>
          <Check size={10} className={colIdx >= 2 ? 'text-emerald-400' : 'text-white/40'} />
        </div>
      </div>
    )
    if (val === false || val === null) return (
      <div className="flex justify-center">
        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <X size={8} className="text-white/15" />
        </div>
      </div>
    )
    return <p className={cn('text-center text-[11px] font-semibold tabular-nums', textCls)}>{val}</p>
  }

  // Group by category
  const categories = [...new Set(FEATURES.map(f => f.category ?? 'Général'))]

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>

      {/* Header */}
      <div className="grid grid-cols-5 px-4 py-4 sticky top-0 z-10"
        style={{ background: 'rgba(8,14,34,0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/25 flex items-end pb-1">Fonctionnalité</div>
        {PLANS.map((p, i) => (
          <div key={p.id} className="text-center">
            <p className={cn('text-xs font-extrabold', planColors[i])}>{p.name}</p>
            <p className="text-[9px] text-white/25 mt-0.5">{p.price === 0 ? 'Gratuit' : `${p.price}€/mois`}</p>
            {currentTier === p.id && (
              <span className="inline-block mt-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.25)' }}>
                actuel
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Rows by category */}
      {categories.map((cat, catIdx) => (
        <div key={cat}>
          <div className="px-4 py-2.5" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/25">{cat}</p>
          </div>
          {FEATURES.filter(f => (f.category ?? 'Général') === cat).map((feat, i) => {
            const isLast = i === FEATURES.filter(f => (f.category ?? 'Général') === cat).length - 1 && catIdx === categories.length - 1
            const FeatIcon = feat.icon
            return (
              <div key={feat.label}
                className={cn('grid grid-cols-5 px-4 py-3 hover:bg-white/2 transition-colors')}
                style={!isLast ? { borderBottom: '1px solid rgba(255,255,255,0.04)' } : {}}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <FeatIcon size={11} className="text-white/20 flex-shrink-0" />
                  <span className="text-[11px] text-white/55 truncate">{feat.label}</span>
                </div>
                {feat.values.map((val, j) => (
                  <div key={j} className={cn('flex items-center justify-center', currentTier === PLANS[j].id ? 'bg-white/2 rounded-lg' : '')}>
                    {renderValue(val, j)}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
