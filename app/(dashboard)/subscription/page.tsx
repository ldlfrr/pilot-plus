import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils/cn'
import { Check, X, Zap, Star, Building2, Sparkles, Mail, Phone } from 'lucide-react'
import type { SubscriptionTier } from '@/types'

export const metadata: Metadata = { title: 'Mon abonnement — PILOT+' }

// ─── Plan definitions ─────────────────────────────────────────────────────────

interface Feature { label: string; included: boolean }

interface Plan {
  id: SubscriptionTier
  name: string
  price: number
  period: string
  tagline: string
  icon: typeof Zap
  accentClass: string
  ringClass: string
  badge: string | null
  cta: string
  ctaStyle: 'primary' | 'outline' | 'purple'
  mailSubject: string
  features: Feature[]
}

const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 49,
    period: 'mois',
    tagline: 'Pour démarrer et tester',
    icon: Zap,
    accentClass: 'text-blue-400',
    ringClass: 'border-white/10 hover:border-white/20',
    badge: null,
    cta: 'Choisir Basic',
    ctaStyle: 'outline',
    mailSubject: 'Abonnement PILOT+ Basic',
    features: [
      { label: '10 analyses / mois',      included: true  },
      { label: '1 utilisateur',            included: true  },
      { label: 'Scoring Go / No Go',       included: true  },
      { label: 'Support email',            included: true  },
      { label: 'Historique complet',       included: false },
      { label: 'Export PDF des rapports',  included: false },
      { label: 'Support prioritaire',      included: false },
      { label: 'API access',               included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 149,
    period: 'mois',
    tagline: 'Pour les équipes commerciales actives',
    icon: Star,
    accentClass: 'text-blue-400',
    ringClass: 'border-blue-500/60 shadow-[0_0_30px_rgba(59,130,246,0.12)]',
    badge: 'Le plus populaire',
    cta: 'Choisir Pro',
    ctaStyle: 'primary',
    mailSubject: 'Abonnement PILOT+ Pro',
    features: [
      { label: '50 analyses / mois',       included: true  },
      { label: '5 utilisateurs',           included: true  },
      { label: 'Scoring Go / No Go',       included: true  },
      { label: 'Historique complet',       included: true  },
      { label: 'Export PDF des rapports',  included: true  },
      { label: 'Support prioritaire',      included: true  },
      { label: 'API access',               included: false },
      { label: 'Onboarding dédié',         included: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Entreprise',
    price: 499,
    period: 'mois',
    tagline: 'Pour les grandes organisations',
    icon: Building2,
    accentClass: 'text-purple-400',
    ringClass: 'border-purple-500/30 hover:border-purple-500/50',
    badge: null,
    cta: 'Nous contacter',
    ctaStyle: 'purple',
    mailSubject: 'Abonnement PILOT+ Entreprise',
    features: [
      { label: 'Analyses illimitées',              included: true },
      { label: 'Utilisateurs illimités',           included: true },
      { label: 'Scoring + historique complet',     included: true },
      { label: 'Export PDF des rapports',          included: true },
      { label: 'API access',                       included: true },
      { label: 'Onboarding dédié',                 included: true },
      { label: 'SLA + support téléphonique',       included: true },
      { label: 'Données hébergées EU (RGPD)',       included: true },
    ],
  },
]

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SubscriptionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, subscription_tier, subscription_started_at, subscription_expires_at')
    .eq('id', user.id)
    .single()

  // Fallback gracefully if migration hasn't been run yet
  const tier: SubscriptionTier = (profile as { subscription_tier?: SubscriptionTier })?.subscription_tier ?? 'free'
  const isLifetime   = tier === 'lifetime'
  const currentPlan  = PLANS.find(p => p.id === tier)

  return (
    <div className="flex flex-col min-h-0 animate-fade-in">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="h-14 border-b border-white/5 bg-[#13161e] flex items-center px-4 md:px-6 flex-shrink-0">
        <div>
          <h1 className="text-base font-semibold text-white">Mon abonnement</h1>
          <p className="text-xs text-white/40">Gérez votre formule PILOT+</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8">

        {/* ── Current plan banner ─────────────────────────────────────────── */}
        {isLifetime ? (
          <LifetimeBanner userName={profile?.full_name} />
        ) : (
          <CurrentPlanBanner tier={tier} />
        )}

        {/* ── Pricing grid ────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-white mb-1">Choisir une formule</h2>
          <p className="text-xs text-white/40 mb-5">Sans engagement · Résiliation à tout moment</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrent={tier === plan.id}
                isLifetime={isLifetime}
              />
            ))}
          </div>
        </div>

        {/* ── FAQ / notes ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard
            title="Comment ça marche ?"
            items={[
              'Choisissez votre formule en cliquant sur le bouton',
              'Notre équipe vous contacte sous 24h pour activer',
              'Vous recevez un accès immédiat après confirmation',
              'Résiliation possible à tout moment, sans frais',
            ]}
          />
          <InfoCard
            title="Questions fréquentes"
            items={[
              'Les analyses non utilisées ne se cumulent pas',
              'Le passage à un plan supérieur est immédiat',
              'Paiement par virement ou carte bancaire',
              'Facture mensuelle disponible dans votre espace',
            ]}
          />
        </div>

      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CurrentPlanBanner({ tier }: { tier: SubscriptionTier }) {
  const isFree = tier === 'free'
  return (
    <div className={cn(
      'rounded-xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4',
      isFree
        ? 'bg-[#1a1d2e] border-white/8'
        : 'bg-blue-950/20 border-blue-500/20'
    )}>
      <div>
        <p className="text-xs text-white/40 mb-1.5">Votre formule actuelle</p>
        <div className="flex items-center gap-2.5">
          <span className={cn(
            'text-xs font-bold px-2.5 py-1 rounded-full border',
            TIER_COLORS[tier]
          )}>
            {TIER_LABELS[tier]}
          </span>
          {!isFree && (
            <span className="text-white/50 text-sm">
              · Renouvellement mensuel
            </span>
          )}
        </div>
        {isFree && (
          <p className="text-xs text-white/40 mt-2">
            Passez à une formule payante pour débloquer plus d&apos;analyses et de fonctionnalités.
          </p>
        )}
      </div>
      {isFree && (
        <a
          href={`mailto:contact@pilot-plus.fr?subject=Abonnement PILOT+`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors flex-shrink-0"
        >
          <Mail size={14} />
          Passer à un plan payant
        </a>
      )}
    </div>
  )
}

function LifetimeBanner({ userName }: { userName?: string | null }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
      {/* Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Accès à vie
            </span>
          </div>
          <p className="text-white font-semibold">
            {userName ? `${userName}, vous` : 'Vous'} bénéficiez d&apos;un accès illimité à vie à PILOT+.
          </p>
          <p className="text-white/40 text-xs mt-1">
            Toutes les fonctionnalités débloquées · Aucun renouvellement
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2.5 flex-shrink-0">
          <Sparkles size={14} className="text-amber-400" />
          <span className="text-amber-400 text-sm font-bold">Lifetime</span>
        </div>
      </div>
    </div>
  )
}

function PlanCard({
  plan, isCurrent, isLifetime,
}: {
  plan: Plan
  isCurrent: boolean
  isLifetime: boolean
}) {
  const isHighlighted = plan.id === 'pro'
  const Icon = plan.icon

  return (
    <div className={cn(
      'relative flex flex-col rounded-xl border transition-all duration-200',
      'bg-[#1a1d2e]',
      isCurrent
        ? 'border-blue-500/60 shadow-[0_0_24px_rgba(59,130,246,0.1)]'
        : plan.ringClass,
    )}>

      {/* Badge */}
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow whitespace-nowrap">
            {plan.badge}
          </span>
        </div>
      )}
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow whitespace-nowrap">
            Plan actuel
          </span>
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className={cn('p-1.5 rounded-lg', isHighlighted ? 'bg-blue-600/20' : 'bg-white/5')}>
              <Icon size={15} className={plan.accentClass} />
            </div>
            <span className="text-white font-bold text-sm">{plan.name}</span>
          </div>
          <div className="flex items-end gap-1.5 mb-1">
            <span className="text-3xl font-extrabold text-white tabular-nums">{plan.price}€</span>
            <span className="text-white/40 text-sm mb-1">/{plan.period}</span>
          </div>
          <p className="text-xs text-white/40">{plan.tagline}</p>
        </div>

        {/* Divider */}
        <div className="border-t border-white/5 mb-5" />

        {/* Features */}
        <ul className="space-y-2.5 flex-1 mb-6">
          {plan.features.map(({ label, included }) => (
            <li key={label} className={cn('flex items-start gap-2.5 text-xs', included ? 'text-white/70' : 'text-white/20')}>
              {included
                ? <Check size={13} className="flex-shrink-0 mt-0.5 text-emerald-400" />
                : <X    size={13} className="flex-shrink-0 mt-0.5 text-white/15" />
              }
              {label}
            </li>
          ))}
        </ul>

        {/* CTA */}
        {isLifetime ? (
          <div className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <Sparkles size={12} />
            Inclus dans votre accès à vie
          </div>
        ) : isCurrent ? (
          <div className="flex items-center justify-center px-4 py-2.5 rounded-lg bg-blue-600/15 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            Plan actuel
          </div>
        ) : (
          <CtaButton plan={plan} />
        )}

      </div>
    </div>
  )
}

function CtaButton({ plan }: { plan: Plan }) {
  const href = `mailto:contact@pilot-plus.fr?subject=${encodeURIComponent(plan.mailSubject)}&body=${encodeURIComponent(`Bonjour,\n\nJe souhaite souscrire au plan ${plan.name} (${plan.price}€/mois) de PILOT+.\n\nMerci de me contacter pour finaliser l'abonnement.`)}`

  const styles = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white',
    outline:  'bg-white/5 hover:bg-white/10 border border-white/10 text-white/80',
    purple:   'bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300',
  }

  return (
    <a
      href={href}
      className={cn(
        'flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all',
        styles[plan.ctaStyle]
      )}
    >
      {plan.id === 'enterprise' ? <Phone size={12} /> : <Mail size={12} />}
      {plan.cta}
    </a>
  )
}

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-[#1a1d2e] border border-white/8 rounded-xl p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">{title}</p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-xs text-white/60">
            <span className="flex-shrink-0 mt-0.5 w-1 h-1 rounded-full bg-blue-400 mt-1.5" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
