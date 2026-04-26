import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LandingPage from '@/components/landing/LandingPage'

// ── Page-level SEO (overrides root layout defaults) ───────────────────────────

export const metadata: Metadata = {
  title: 'PILOT+ — Analyseur DCE & Pilotage des Appels d\'offres par IA',
  description:
    'PILOT+ est le meilleur analyseur DCE du marché. Analysez vos dossiers de consultation en 30 secondes grâce à l\'IA, obtenez un score Go/No Go personnalisé, activez la veille BOAMP automatique et pilotez vos appels d\'offres BTP & ENR jusqu\'à la signature.',
  keywords: [
    'analyse DCE', 'analyseur DCE', 'DCE analyser', 'analyser DCE',
    'dossier consultation entreprises', 'analyse dossier consultation IA',
    'logiciel DCE', 'DCE IA', 'intelligence artificielle DCE',
    'score go no go appel offres', 'qualification appel offres',
    'veille BOAMP', 'veille marchés publics automatique',
    'logiciel appel offres BTP', 'appel offres ENR', 'marchés publics BTP',
    'pipeline commercial BTP', 'mémoire technique IA',
    'PILOT+', 'pilot plus',
  ],
  alternates: { canonical: 'https://pilot-plus.fr' },
  openGraph: {
    title: 'PILOT+ — Le meilleur analyseur DCE du marché',
    description:
      'Analyse DCE en 30 secondes par IA · Score Go/No Go · Veille BOAMP · Pipeline commercial · Mémoire technique. La solution complète pour les équipes BTP & ENR.',
    url: 'https://pilot-plus.fr',
    type: 'website',
  },
}

// ── JSON-LD Structured Data ────────────────────────────────────────────────────

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    // SoftwareApplication — le cœur du référencement SaaS
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://pilot-plus.fr/#software',
      name: 'PILOT+',
      alternateName: ['Pilot Plus', 'PilotPlus', 'Analyseur DCE', 'DCE Analyser'],
      url: 'https://pilot-plus.fr',
      description:
        'Logiciel SaaS d\'analyse DCE par intelligence artificielle. Analyse les dossiers de consultation des entreprises en 30 secondes, calcule un score Go/No Go personnalisé, surveille le BOAMP automatiquement et pilote le pipeline commercial de l\'avant-vente à la signature.',
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'Construction, Energy, Public Procurement',
      operatingSystem: 'Web browser (Chrome, Firefox, Safari, Edge)',
      browserRequirements: 'Requires JavaScript',
      inLanguage: 'fr',
      isAccessibleForFree: 'True',
      offers: [
        {
          '@type': 'Offer',
          name: 'Gratuit',
          price: '0',
          priceCurrency: 'EUR',
          description: '1 analyse IA gratuite à vie',
          availability: 'https://schema.org/InStock',
        },
        {
          '@type': 'Offer',
          name: 'Basic',
          price: '49',
          priceCurrency: 'EUR',
          description: '10 analyses IA par mois',
          priceSpecification: { '@type': 'UnitPriceSpecification', billingDuration: 'P1M' },
        },
        {
          '@type': 'Offer',
          name: 'Pro',
          price: '149',
          priceCurrency: 'EUR',
          description: '50 analyses IA par mois + veille BOAMP + export PDF',
          priceSpecification: { '@type': 'UnitPriceSpecification', billingDuration: 'P1M' },
        },
        {
          '@type': 'Offer',
          name: 'Entreprise',
          price: '499',
          priceCurrency: 'EUR',
          description: 'Analyses illimitées + équipe illimitée + API',
          priceSpecification: { '@type': 'UnitPriceSpecification', billingDuration: 'P1M' },
        },
      ],
      featureList: [
        'Analyse DCE en 30 secondes par IA',
        'Score Go/No Go personnalisé',
        'Veille BOAMP automatique',
        'Pipeline commercial 7 étapes',
        'Mémoire technique générée par IA',
        'Export PDF professionnel',
        'Find contacts IA',
        'Campagnes email IA',
        'Dashboard analytique',
        'Calendrier des remises',
        'Collaboration équipe',
        'Checklists et chiffrage',
      ],
      screenshot: 'https://pilot-plus.fr/og-image.png',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '5',
        reviewCount: '3',
        bestRating: '5',
        worstRating: '1',
      },
    },
    // Organization
    {
      '@type': 'Organization',
      '@id': 'https://pilot-plus.fr/#organization',
      name: 'PILOT+',
      url: 'https://pilot-plus.fr',
      logo: {
        '@type': 'ImageObject',
        url: 'https://pilot-plus.fr/favicon/Favicon.png',
        width: '192',
        height: '192',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'contact@pilot-plus.fr',
        contactType: 'customer support',
        availableLanguage: 'French',
      },
    },
    // WebSite — activates sitelinks search box in Google
    {
      '@type': 'WebSite',
      '@id': 'https://pilot-plus.fr/#website',
      url: 'https://pilot-plus.fr',
      name: 'PILOT+',
      description: 'Analyseur DCE et pilotage des appels d\'offres par IA',
      publisher: { '@id': 'https://pilot-plus.fr/#organization' },
      inLanguage: 'fr',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://pilot-plus.fr/signup?ref={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
    // FAQPage — génère des rich snippets dans Google
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Qu\'est-ce qu\'un analyseur DCE ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Un analyseur DCE (Dossier de Consultation des Entreprises) est un logiciel qui lit automatiquement les documents d\'appel d\'offres (règlement de consultation, CCTP, BPU, DPGF…) et en extrait les informations clés : maître d\'ouvrage, périmètre technique, critères d\'attribution, délais, budget estimé. PILOT+ analyse un DCE complet en moins de 30 secondes grâce à l\'intelligence artificielle.',
          },
        },
        {
          '@type': 'Question',
          name: 'Comment analyser un DCE avec PILOT+ ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Créez un compte gratuit, créez un projet, puis uploadez vos fichiers PDF ou DOCX. PILOT+ lance l\'analyse IA automatiquement et génère 7 onglets structurés : contexte projet, besoin client, spécificités techniques, critères d\'attribution, concurrents, points de vigilance et plan de réponse. L\'analyse complète prend moins de 30 secondes.',
          },
        },
        {
          '@type': 'Question',
          name: 'PILOT+ fonctionne-t-il pour les marchés publics BTP ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Oui, PILOT+ est spécialement conçu pour les entreprises du BTP (bâtiment, travaux publics, génie civil) et des énergies renouvelables (ENR). Il intègre une veille BOAMP automatique, un scoring Go/No Go adapté aux marchés publics français (MAPA, appels d\'offres ouverts et restreints, consultations restreintes) et un pipeline commercial complet de la prospection à la signature.',
          },
        },
        {
          '@type': 'Question',
          name: 'PILOT+ est-il gratuit ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Oui, PILOT+ propose un plan gratuit incluant 1 analyse IA complète (sans limite de durée), un accès au dashboard et au pipeline. Les plans payants (à partir de 49€/mois HT) débloquent davantage d\'analyses mensuelles, la veille BOAMP, l\'export PDF et les fonctionnalités d\'équipe.',
          },
        },
        {
          '@type': 'Question',
          name: 'Qu\'est-ce que le score Go/No Go dans PILOT+ ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Le score Go/No Go est une note sur 100 calculée automatiquement par PILOT+ pour chaque appel d\'offres. Il est basé sur vos critères personnalisés (zones géographiques cibles, types de marchés, capacités techniques, certifications requises, etc.) et compare ces critères avec les exigences extraites du DCE. Il vous permet de décider en 30 secondes si l\'opportunité vaut la peine d\'être étudiée.',
          },
        },
      ],
    },
  ],
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/accueil')
  return (
    <>
      {/* Inject JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  )
}
