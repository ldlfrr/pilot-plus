import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import {
  Check, X, Zap, Star, Building2, Sparkles,
  Shield, Clock, Headphones, BarChart3, FileText,
  Users, Infinity, ArrowRight, BadgeCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { CheckoutButton } from './CheckoutButton'
import { PortalButton } from './PortalButton'
import type { SubscriptionTier } from '@/types'

export const metadata: Metadata = { title: 'Mon abonnement — PILOT+' }

// ── Plans ─────────────────────────────────────────────────────────────────────

interface Feature { label: string; included: boolean; highlight?: boolean }

const PLANS = [
  {
    id:       'basic' as SubscriptionTier,
    name:     'Basic',
    price:    49,
    tagline:  'Pour démarrer',
    icon:     Zap,
    color:    'blue',
    badge:    null,
    features: [
      { label: '10 analyses IA / mois',  included: true  },
      { label: '1 utilisateur',           included: true  },
      { label: 'Score Go / No Go',        included: true  },
      { label: 'Support email',           included: true  },
      { label: 'Historique complet',      included: false },
      { label: 'Export PDF',              included: false },
      { label: 'Veille BOAMP',            included: false },
      { label: 'Support prioritaire',     included: false },
    ] as Feature[],
  },
  {
    id:       'pro' as SubscriptionTier,
    name:     'Pro',
    price:    149,
    tagline:  'Pour les équipes commerciales',
    icon:     Star,
    color:    'blue-highlight',
    badge:    'Le plus populaire',
    features: [
      { label: '50 analyses IA / mois',  included: true, highlight: true },
      { label: '5 utilisateurs',          included: true  },
      { label: 'Score Go / No Go',        included: true  },
      { label: 'Historique complet',      included: true, highlight: true },
      { label: 'Export PDF des rapports', included: true, highlight: true },
      { label: 'Veille BOAMP',            included: true, highlight: true },
      { label: 'Support prioritaire',     included: true  },
      { label: 'API access',              included: false },
    ] as Feature[],
  },
  {
    id:       'enterprise' as SubscriptionTier,
    name:     'Entreprise',
    price:    499,
    tagline:  'Pour les grandes organisations',
    icon:     Building2,
    color:    'purple',
    badge:    null,
    features: [
      { label: 'Analyses illimitées',           included: true, highlight: true },
      { label: 'Utilisateurs illimités',         included: true, highlight: true },
      { label: 'Score + historique complet',     included: true  },
      { label: 'Export PDF',                     included: true  },
      { label: 'Veille BOAMP avancée',           included: true  },
      { label: 'API access',                     included: true, highlight: true },
      { label: 'Onboarding dédié',               included: true  },
      { label: 'SLA + support téléphonique',     included: true  },
    ] as Feature[],
  },
]

const TIER_LABEL: Record<SubscriptionTier, string> = {
  free: 'Gratuit', basic: 'Basic', pro: 'Pro', enterprise: 'Entreprise', lifetime: 'Accès à vie',
}

const FAQ = [
  { q: 'Puis-je annuler à tout moment ?', a: 'Oui, sans préavis ni frais. Votre accès reste actif jusqu\'à la fin de la période payée.' },
  { q: 'Les analyses non utilisées sont-elles reportées ?', a: 'Non, le quota mensuel se remet à zéro chaque mois.' },
  { q: 'Puis-je passer à un plan supérieur en cours de mois ?', a: 'Oui, le changement est immédiat et le montant est calculé au prorata.' },
  { q: 'Quels modes de paiement acceptez-vous ?', a: 'Carte bancaire (Visa, Mastercard, Amex) via Stripe. Virement possible sur devis.' },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>
}) {
  const sp      = await searchParams
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, subscription_tier, stripe_customer_id, stripe_subscription_id')
    .eq('id', user.id)
    .single()

  const tier: SubscriptionTier = profile?.subscription_tier ?? 'free'
  const isLifetime   = tier === 'lifetime'
  const isPaid       = tier !== 'free' && !isLifetime
  const hasStripe    = !!(profile?.stripe_customer_id)
  const firstName    = profile?.full_name?.split(' ')[0] ?? null

  return (
    <div className="flex flex-col min-h-0 bg-[var(--bg-base)]">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="h-14 border-b border-white/5 bg-[var(--bg-surface)] flex items-center px-4 md:px-6 flex-shrink-0">
        <div>
          <h1 className="text-base font-semibold text-white">Mon abonnement</h1>
          <p className="text-xs text-white/35">Gérez votre formule PILOT+</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-10">

          {/* ── Flash messages ──────────────────────────────────────────────── */}
          {sp.success && (
            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
              <BadgeCheck size={20} className="text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-300">Paiement confirmé !</p>
                <p className="text-xs text-emerald-400/70 mt-0.5">Votre abonnement est maintenant actif. Bienvenue sur PILOT+.</p>
              </div>
            </div>
          )}
          {sp.canceled && (
            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-white/4 border border-white/8">
              <X size={16} className="text-white/40 flex-shrink-0" />
              <p className="text-sm text-white/50">Paiement annulé. Vous pouvez réessayer à tout moment.</p>
            </div>
          )}

          {/* ── Current plan hero ──────────────────────────────────────────── */}
          {isLifetime ? (
            <LifetimeBanner firstName={firstName} />
          ) : (
            <CurrentPlanCard
              tier={tier}
              firstName={firstName}
              isPaid={isPaid}
              hasStripe={hasStripe}
            />
          )}

          {/* ── Pricing grid ───────────────────────────────────────────────── */}
          {!isLifetime && (
            <section>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">Choisissez votre formule</h2>
                <p className="text-sm text-white/40 mt-1">Sans engagement · Résiliation en 1 clic · Paiement sécurisé Stripe</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {PLANS.map(plan => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    isCurrent={tier === plan.id}
                    isLifetime={isLifetime}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Trust strip ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Shield,     text: 'Paiement sécurisé', sub: 'SSL + Stripe' },
              { icon: Clock,      text: 'Annulation libre',  sub: 'Sans préavis' },
              { icon: Headphones, text: 'Support inclus',    sub: 'Email & chat' },
              { icon: BarChart3,  text: 'Données EU',        sub: 'RGPD compliant' },
            ].map(({ icon: Icon, text, sub }) => (
              <div key={text} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/3 border border-white/6">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/70">{text}</p>
                  <p className="text-[10px] text-white/30">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── FAQ ────────────────────────────────────────────────────────── */}
          <section>
            <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4">Questions fréquentes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FAQ.map(({ q, a }) => (
                <div key={q} className="px-5 py-4 rounded-xl bg-white/3 border border-white/6">
                  <p className="text-sm font-semibold text-white/80 mb-1.5">{q}</p>
                  <p className="text-xs text-white/45 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LifetimeBanner({ firstName }: { firstName: string | null }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/8 via-amber-500/5 to-transparent p-7">
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
              <Sparkles size={14} className="text-amber-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-amber-400">Accès à vie</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-1">
            {firstName ? `${firstName}, vous avez` : 'Vous avez'} l&apos;accès complet.
          </h2>
          <p className="text-sm text-white/45">Toutes les fonctionnalités · Aucun renouvellement · Pour toujours.</p>
        </div>
        <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex-shrink-0">
          <Sparkles size={18} className="text-amber-400" />
          <div>
            <p className="text-lg font-extrabold text-amber-400 leading-none">Lifetime</p>
            <p className="text-[10px] text-amber-400/60 mt-0.5">Illimité à vie</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function CurrentPlanCard({
  tier, firstName, isPaid, hasStripe,
}: {
  tier: SubscriptionTier
  firstName: string | null
  isPaid: boolean
  hasStripe: boolean
}) {
  const isFree = tier === 'free'

  return (
    <div className={cn(
      'rounded-2xl border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5',
      isFree
        ? 'bg-white/2 border-white/8'
        : 'bg-blue-950/20 border-blue-500/20',
    )}>
      <div>
        <p className="text-xs text-white/35 mb-2">Votre formule actuelle</p>
        <div className="flex items-center gap-2 mb-2">
          <span className={cn(
            'text-xs font-bold px-2.5 py-1 rounded-full border',
            isFree
              ? 'bg-white/5 text-white/50 border-white/10'
              : 'bg-blue-500/15 text-blue-300 border-blue-500/30',
          )}>
            {TIER_LABEL[tier]}
          </span>
          {isPaid && <span className="text-white/35 text-xs">· Renouvellement mensuel automatique</span>}
        </div>
        {isFree && (
          <p className="text-sm text-white/45 max-w-md">
            {firstName ? `${firstName}, passez` : 'Passez'} à un plan payant pour accéder à l&apos;analyse IA complète, l&apos;export PDF et la veille BOAMP.
          </p>
        )}
      </div>
      {isPaid && hasStripe && <PortalButton />}
      {isFree && (
        <a
          href="#plans"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
        >
          Voir les formules <ArrowRight size={14} />
        </a>
      )}
    </div>
  )
}

function PlanCard({
  plan, isCurrent, isLifetime,
}: {
  plan: typeof PLANS[number]
  isCurrent: boolean
  isLifetime: boolean
}) {
  const isHighlighted = plan.color === 'blue-highlight'
  const isPurple      = plan.color === 'purple'
  const Icon          = plan.icon

  return (
    <div
      id={isCurrent ? undefined : 'plans'}
      className={cn(
        'relative flex flex-col rounded-2xl border transition-all duration-200',
        isHighlighted
          ? 'bg-gradient-to-b from-blue-950/40 to-[var(--bg-card)] border-blue-500/50 shadow-[0_0_40px_rgba(59,130,246,0.12)]'
          : isPurple
            ? 'bg-[var(--bg-card)] border-purple-500/25 hover:border-purple-500/40'
            : 'bg-[var(--bg-card)] border-white/8 hover:border-white/15',
        isCurrent && 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.08)]',
      )}
    >
      {/* Top badge */}
      {(plan.badge || isCurrent) && (
        <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
          <span className={cn(
            'text-[10px] font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap',
            isCurrent
              ? 'bg-emerald-600 text-white'
              : isHighlighted
                ? 'bg-blue-600 text-white'
                : 'bg-purple-600 text-white',
          )}>
            {isCurrent ? 'Plan actuel' : plan.badge}
          </span>
        </div>
      )}

      <div className="p-6 flex flex-col flex-1">

        {/* Icon + name */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center border',
            isHighlighted ? 'bg-blue-600/25 border-blue-500/30'
            : isPurple    ? 'bg-purple-600/20 border-purple-500/25'
            :               'bg-white/6 border-white/8',
          )}>
            <Icon size={16} className={
              isHighlighted ? 'text-blue-400'
              : isPurple    ? 'text-purple-400'
              :               'text-white/60'
            } />
          </div>
          <div>
            <p className="font-bold text-white">{plan.name}</p>
            <p className="text-[11px] text-white/35">{plan.tagline}</p>
          </div>
        </div>

        {/* Price */}
        <div className="mb-5">
          <div className="flex items-end gap-1.5">
            <span className="text-4xl font-extrabold text-white tabular-nums leading-none">{plan.price}€</span>
            <span className="text-white/35 text-sm mb-1">/mois</span>
          </div>
          <p className="text-[11px] text-white/25 mt-1">HT · Facturé mensuellement</p>
        </div>

        <div className="h-px bg-white/5 mb-5" />

        {/* Features */}
        <ul className="space-y-2.5 flex-1 mb-6">
          {plan.features.map(({ label, included, highlight }) => (
            <li key={label} className={cn(
              'flex items-center gap-2.5 text-xs',
              included
                ? highlight ? 'text-white/90 font-medium' : 'text-white/60'
                : 'text-white/20',
            )}>
              {included
                ? <div className={cn(
                    'w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0',
                    highlight ? 'bg-emerald-500/20' : 'bg-white/6',
                  )}>
                    <Check size={10} className={highlight ? 'text-emerald-400' : 'text-white/50'} />
                  </div>
                : <div className="w-4 h-4 rounded-full bg-white/4 flex items-center justify-center flex-shrink-0">
                    <X size={9} className="text-white/15" />
                  </div>
              }
              {label}
              {included && highlight && (
                <span className={cn(
                  'ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-md',
                  isHighlighted ? 'bg-blue-500/15 text-blue-400'
                  : isPurple    ? 'bg-purple-500/15 text-purple-400'
                  :               'bg-white/8 text-white/40',
                )}>NEW</span>
              )}
            </li>
          ))}
        </ul>

        {/* CTA */}
        {isLifetime ? (
          <div className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <Sparkles size={12} />Inclus dans votre accès à vie
          </div>
        ) : isCurrent ? (
          <div className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <BadgeCheck size={13} />Plan actuel
          </div>
        ) : plan.id === 'enterprise' ? (
          <a
            href={`mailto:contact@pilot-plus.fr?subject=Abonnement%20PILOT%2B%20Entreprise`}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 text-sm font-semibold transition-all"
          >
            Nous contacter
          </a>
        ) : (
          <CheckoutButton
            tier={plan.id}
            label={`Commencer avec ${plan.name}`}
            className={cn(
              isHighlighted
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25'
                : 'bg-white/8 hover:bg-white/12 border border-white/10 text-white',
            )}
          />
        )}

      </div>
    </div>
  )
}
