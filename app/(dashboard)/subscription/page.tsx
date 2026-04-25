import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import {
  Check, X, Zap, Star, Building2, Sparkles,
  Shield, Clock, Headphones, BarChart3,
  ArrowRight, BadgeCheck, Lock, FileText,
  Users, Infinity as InfinityIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { CheckoutButton } from './CheckoutButton'
import { PortalButton } from './PortalButton'
import type { SubscriptionTier } from '@/types'

export const metadata: Metadata = { title: 'Mon abonnement — PILOT+' }

// ── Plans ─────────────────────────────────────────────────────────────────────

interface Feature { label: string; included: boolean; highlight?: boolean; locked?: boolean }

const PLANS = [
  {
    id:       'free' as SubscriptionTier,
    name:     'Gratuit',
    price:    0,
    tagline:  'Découvrir PILOT+',
    icon:     Lock,
    color:    'free',
    badge:    null,
    features: [
      { label: '1 analyse IA / mois',     included: true  },
      { label: 'Score Go / No Go',        included: true  },
      { label: 'Historique complet',      included: false, locked: true },
      { label: 'Export PDF',              included: false, locked: true },
      { label: 'Veille BOAMP',            included: false, locked: true },
      { label: 'Support prioritaire',     included: false, locked: true },
    ] as Feature[],
  },
  {
    id:       'basic' as SubscriptionTier,
    name:     'Basic',
    price:    49,
    tagline:  'Pour démarrer sérieusement',
    icon:     Zap,
    color:    'blue',
    badge:    null,
    features: [
      { label: '10 analyses IA / mois',   included: true, highlight: true },
      { label: '1 utilisateur',            included: true  },
      { label: 'Score Go / No Go',         included: true  },
      { label: 'Support email',            included: true  },
      { label: 'Historique complet',       included: false, locked: true },
      { label: 'Export PDF',               included: false, locked: true },
      { label: 'Veille BOAMP',             included: false, locked: true },
      { label: 'Support prioritaire',      included: false, locked: true },
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
      { label: '50 analyses IA / mois',   included: true, highlight: true },
      { label: '5 utilisateurs',           included: true  },
      { label: 'Score Go / No Go',         included: true  },
      { label: 'Historique complet',       included: true, highlight: true },
      { label: 'Export PDF des rapports',  included: true, highlight: true },
      { label: 'Veille BOAMP',             included: true, highlight: true },
      { label: 'Support prioritaire',      included: true  },
      { label: 'Campagnes email IA',       included: true, highlight: true },
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
      { label: 'Analyses illimitées',            included: true, highlight: true },
      { label: 'Utilisateurs illimités',          included: true, highlight: true },
      { label: 'Score + historique complet',      included: true  },
      { label: 'Export PDF',                      included: true  },
      { label: 'Veille BOAMP avancée',            included: true  },
      { label: 'Campagnes email IA illimitées',   included: true, highlight: true },
      { label: 'Onboarding dédié',                included: true  },
      { label: 'SLA + support téléphonique',      included: true  },
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
      <div className="h-14 flex items-center px-4 md:px-6 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.055)', background: 'rgba(8,14,34,0.80)', backdropFilter: 'blur(16px)' }}>
        <div>
          <h1 className="text-base font-semibold text-white">Mon abonnement</h1>
          <p className="text-xs text-white/35">Gérez votre formule PILOT+</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-10 animate-fade-in">

          {/* ── Flash messages ──────────────────────────────────────────────── */}
          {sp.success && (
            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl relative overflow-hidden"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', boxShadow: '0 0 30px rgba(16,185,129,0.08)' }}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 0% 50%, rgba(16,185,129,0.10) 0%, transparent 60%)' }} />
              <BadgeCheck size={20} className="text-emerald-400 flex-shrink-0 relative" />
              <div className="relative">
                <p className="text-sm font-semibold text-emerald-300">Paiement confirmé !</p>
                <p className="text-xs text-emerald-400/70 mt-0.5">Votre abonnement est maintenant actif. Bienvenue sur PILOT+.</p>
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
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-white/40 px-3 py-1 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Sans engagement · Résiliation en 1 clic · Paiement sécurisé Stripe
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
              { icon: Shield,     text: 'Paiement sécurisé', sub: 'SSL + Stripe',     color: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.20)',  icon_cls: 'text-blue-400'    },
              { icon: Clock,      text: 'Annulation libre',  sub: 'Sans préavis',      color: 'rgba(16,185,129,0.10)',  border: 'rgba(16,185,129,0.18)',  icon_cls: 'text-emerald-400' },
              { icon: Headphones, text: 'Support inclus',    sub: 'Email & chat',      color: 'rgba(139,92,246,0.10)',  border: 'rgba(139,92,246,0.18)',  icon_cls: 'text-violet-400'  },
              { icon: BarChart3,  text: 'Données EU',        sub: 'RGPD compliant',    color: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.18)',  icon_cls: 'text-amber-400'   },
            ].map(({ icon: Icon, text, sub, color, border, icon_cls }) => (
              <div key={text} className="flex items-center gap-3 px-4 py-3 rounded-xl card-hover"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(8px)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: color, border: `1px solid ${border}` }}>
                  <Icon size={14} className={icon_cls} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/75">{text}</p>
                  <p className="text-[10px] text-white/30">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── FAQ ────────────────────────────────────────────────────────── */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Questions fréquentes</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FAQ.map(({ q, a }) => (
                <div key={q} className="px-5 py-4 rounded-2xl card-hover"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(8px)' }}>
                  <p className="text-sm font-semibold text-white/85 mb-2">{q}</p>
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
    <div className="relative overflow-hidden rounded-2xl p-8"
      style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.10) 0%, rgba(245,158,11,0.04) 60%, rgba(8,14,34,0.95) 100%)',
        border: '1px solid rgba(245,158,11,0.30)',
        boxShadow: '0 0 60px rgba(245,158,11,0.08), inset 0 1px 0 rgba(255,255,255,0.07)',
      }}>
      {/* Glow orbs */}
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none" style={{
        background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)',
        filter: 'blur(40px)',
      }} />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full pointer-events-none" style={{
        background: 'radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)',
        filter: 'blur(30px)',
      }} />
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.30)' }}>
              <Sparkles size={13} className="text-amber-400" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-400/80">Accès à vie activé</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2 leading-snug">
            {firstName ? `${firstName}, vous avez` : 'Vous avez'}&nbsp;
            <span style={{ color: '#fcd34d', textShadow: '0 0 20px rgba(245,158,11,0.4)' }}>l&apos;accès complet.</span>
          </h2>
          <p className="text-sm text-white/45 leading-relaxed">Toutes les fonctionnalités · Aucun renouvellement · Pour toujours.</p>
        </div>
        <div className="flex items-center gap-3 px-6 py-4 rounded-2xl flex-shrink-0"
          style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)', backdropFilter: 'blur(12px)' }}>
          <Sparkles size={22} className="text-amber-400" style={{ filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.6))' } as React.CSSProperties} />
          <div>
            <p className="text-xl font-extrabold text-amber-400 leading-none" style={{ textShadow: '0 0 16px rgba(245,158,11,0.5)' }}>Lifetime</p>
            <p className="text-[10px] text-amber-400/55 mt-0.5">Illimité à vie</p>
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
    <div className="relative overflow-hidden rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
      style={isFree ? {
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
      } : {
        background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(8,14,34,0.95) 100%)',
        border: '1px solid rgba(59,130,246,0.25)',
        boxShadow: '0 0 40px rgba(59,130,246,0.06)',
        backdropFilter: 'blur(12px)',
      }}>
      {!isFree && (
        <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }} />
      )}
      <div className="relative">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-3">Votre formule actuelle</p>
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
          <p className="text-sm text-white/45 max-w-md leading-relaxed">
            {firstName ? `${firstName}, passez` : 'Passez'} à un plan payant pour accéder à l&apos;analyse IA complète, l&apos;export PDF et la veille BOAMP.
          </p>
        )}
      </div>
      {isPaid && hasStripe && <PortalButton />}
      {isFree && (
        <a href="#plans" className="btn-primary flex-shrink-0">
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
  const isFree        = plan.color === 'free'
  const Icon          = plan.icon

  const cardStyle: React.CSSProperties = isHighlighted ? {
    background: 'linear-gradient(180deg, rgba(59,130,246,0.12) 0%, rgba(8,14,34,0.97) 100%)',
    border: '1px solid rgba(59,130,246,0.42)',
    boxShadow: '0 0 50px rgba(59,130,246,0.14), inset 0 1px 0 rgba(255,255,255,0.08)',
    backdropFilter: 'blur(16px)',
  } : isPurple ? {
    background: 'linear-gradient(180deg, rgba(139,92,246,0.09) 0%, rgba(8,14,34,0.97) 100%)',
    border: '1px solid rgba(139,92,246,0.28)',
    backdropFilter: 'blur(12px)',
  } : isFree ? {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.07)',
    backdropFilter: 'blur(12px)',
  } : isCurrent ? {
    background: 'linear-gradient(180deg, rgba(16,185,129,0.08) 0%, rgba(8,14,34,0.97) 100%)',
    border: '1px solid rgba(16,185,129,0.35)',
    boxShadow: '0 0 30px rgba(16,185,129,0.06)',
    backdropFilter: 'blur(12px)',
  } : {
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.07)',
    backdropFilter: 'blur(12px)',
  }

  return (
    <div
      id={isCurrent ? undefined : 'plans'}
      className="relative flex flex-col rounded-2xl transition-all duration-300 card-hover"
      style={cardStyle}
    >
      {/* Top glow for highlighted */}
      {isHighlighted && (
        <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.60), transparent)' }} />
      )}
      {isHighlighted && (
        <div className="absolute -top-px -inset-x-px h-32 pointer-events-none rounded-t-2xl overflow-hidden">
          <div style={{
            position: 'absolute', top: '-80%', left: '50%', transform: 'translateX(-50%)',
            width: 250, height: 200, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }} />
        </div>
      )}

      {/* Top badge */}
      {(plan.badge || isCurrent) && (
        <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
          <span className="text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap"
            style={isCurrent ? {
              background: 'rgba(16,185,129,0.85)', color: 'white', boxShadow: '0 0 12px rgba(16,185,129,0.40)',
            } : isHighlighted ? {
              background: 'linear-gradient(90deg, #2563eb, #3b82f6)', color: 'white', boxShadow: '0 0 12px rgba(59,130,246,0.50)',
            } : {
              background: 'rgba(139,92,246,0.80)', color: 'white',
            }}>
            {isCurrent ? '✓ Plan actuel' : plan.badge}
          </span>
        </div>
      )}

      <div className="p-6 flex flex-col flex-1 relative">

        {/* Icon + name */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={isHighlighted ? { background: 'rgba(59,130,246,0.18)', border: '1px solid rgba(59,130,246,0.30)', boxShadow: '0 0 12px rgba(59,130,246,0.20)' }
              : isPurple ? { background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }
              : isFree ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
              : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
            <Icon size={17} className={isHighlighted ? 'text-blue-400' : isPurple ? 'text-purple-400' : isFree ? 'text-white/30' : 'text-white/55'} />
          </div>
          <div>
            <p className="font-extrabold text-white leading-none">{plan.name}</p>
            <p className="text-[11px] text-white/35 mt-0.5">{plan.tagline}</p>
          </div>
        </div>

        {/* Price */}
        <div className="mb-5">
          <div className="flex items-end gap-1.5">
            <span className="text-4xl font-extrabold tabular-nums leading-none"
              style={isHighlighted ? { color: 'white', textShadow: '0 0 20px rgba(59,130,246,0.3)' } : { color: 'rgba(255,255,255,0.90)' }}>
              {plan.price}€
            </span>
            <span className="text-white/35 text-sm mb-1">/mois</span>
          </div>
          <p className="text-[11px] text-white/25 mt-1">HT · Facturé mensuellement</p>
        </div>

        <div className="h-px mb-5" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* Features */}
        <ul className="space-y-2 flex-1 mb-6">
          {plan.features.map(({ label, included, highlight, locked }) => (
            <li key={label} className={cn(
              'flex items-center gap-2.5 text-xs',
              included ? (highlight ? 'text-white/90 font-medium' : 'text-white/60') : locked ? 'text-white/22' : 'text-white/22',
            )}>
              {included
                ? <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={highlight
                      ? { background: 'rgba(16,185,129,0.22)', border: '1px solid rgba(16,185,129,0.28)' }
                      : { background: 'rgba(255,255,255,0.07)' }}>
                    <Check size={9} className={highlight ? 'text-emerald-400' : 'text-white/45'} />
                  </div>
                : locked
                  ? <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <Lock size={7} className="text-white/20" />
                    </div>
                  : <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <X size={8} className="text-white/20" />
                    </div>
              }
              <span className="flex-1 truncate">{label}</span>
              {included && highlight && (
                <span className="ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0"
                  style={isHighlighted
                    ? { background: 'rgba(59,130,246,0.18)', color: '#93c5fd' }
                    : isPurple
                      ? { background: 'rgba(139,92,246,0.18)', color: '#c4b5fd' }
                      : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}>INC</span>
              )}
            </li>
          ))}
        </ul>

        {/* CTA */}
        {isLifetime ? (
          <div className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-amber-400 text-xs font-semibold"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.20)' }}>
            <Sparkles size={12} />Inclus dans votre accès à vie
          </div>
        ) : isCurrent ? (
          <div className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-emerald-400 text-xs font-semibold"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.20)' }}>
            <BadgeCheck size={13} />Plan actuel
          </div>
        ) : plan.id === 'free' ? (
          <div className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-white/30 text-xs font-semibold"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            Plan de démarrage
          </div>
        ) : plan.id === 'enterprise' ? (
          <a href="mailto:contact@pilot-plus.fr?subject=Abonnement%20PILOT%2B%20Entreprise"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-purple-300 text-sm font-semibold transition-all"
            style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.30)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.25)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.15)')}>
            Nous contacter
          </a>
        ) : (
          <CheckoutButton
            tier={plan.id}
            label={`Commencer avec ${plan.name}`}
            className={isHighlighted
              ? 'w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-600/30'
              : 'w-full px-4 py-3 rounded-xl text-white text-sm font-semibold transition-all border border-white/10 hover:bg-white/8 bg-white/5'}
          />
        )}

      </div>
    </div>
  )
}
