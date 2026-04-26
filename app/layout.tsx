import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
})

// ── Site-wide constants ────────────────────────────────────────────────────────

const SITE_URL  = 'https://pilot-plus.fr'
const SITE_NAME = 'PILOT+'

// ── Root metadata ──────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  // ── Title ──
  title: {
    default: 'PILOT+ — Analyseur DCE & Pilotage des Appels d\'offres par IA',
    template: '%s | PILOT+ — Analyse DCE & Appels d\'offres IA',
  },

  // ── Description ──
  description:
    'PILOT+ est le meilleur analyseur DCE du marché. Analyse DCE en 30 secondes par IA, score Go/No Go personnalisé, veille BOAMP automatique, pipeline commercial et mémoire technique. BTP, ENR, marchés publics.',

  // ── Keywords ── (ciblés sur les requêtes prioritaires)
  keywords: [
    // Requêtes prioritaires (user targets)
    'analyse DCE',
    'analyseur DCE',
    'DCE analyser',
    'analyser un DCE',
    'analyse dossier de consultation',
    // Variantes et longue traîne
    'analyse DCE IA',
    'intelligence artificielle DCE',
    'logiciel analyse appel offres',
    'logiciel appel offres BTP',
    'score go no go appel offres',
    'go no go marché public',
    'veille BOAMP',
    'veille marchés publics',
    'pipeline commercial BTP',
    'mémoire technique IA',
    'qualification appel offres',
    'décision appel offres',
    'pilotage appels offres',
    'gestion appels offres PME',
    // Secteur
    'BTP appel offres',
    'énergie renouvelable marché public',
    'appel offres ENR',
    // Marque
    'PILOT+',
    'pilotplus',
    'pilot plus',
  ],

  // ── Canonical / alternates ──
  alternates: {
    canonical: SITE_URL,
    languages: { 'fr-FR': SITE_URL },
  },

  // ── Authors / publisher ──
  authors: [{ name: 'PILOT+', url: SITE_URL }],
  creator: 'PILOT+',
  publisher: 'PILOT+',

  // ── Robots ──
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // ── Open Graph ──
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'PILOT+ — Analyseur DCE & Appels d\'offres par IA',
    description:
      'Analysez vos DCE en 30 secondes grâce à l\'IA. Score Go/No Go personnalisé, veille BOAMP automatique, pipeline commercial 7 étapes. La solution de référence pour les entreprises BTP & ENR.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PILOT+ — Analyseur DCE et pilotage des appels d\'offres par IA',
        type: 'image/png',
      },
    ],
  },

  // ── Twitter / X Card ──
  twitter: {
    card: 'summary_large_image',
    title: 'PILOT+ — Analyseur DCE par IA',
    description:
      'Analysez vos DCE en 30 secondes, obtenez un score Go/No Go et pilotez vos appels d\'offres BTP & ENR avec l\'IA.',
    images: ['/og-image.png'],
    creator: '@pilotplusapp',
    site: '@pilotplusapp',
  },

  // ── Favicons ──
  icons: {
    icon: [
      { url: '/favicon/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon/Favicon.png', type: 'image/png', sizes: '32x32' },
    ],
    shortcut: '/favicon/favicon.svg',
    apple: [{ url: '/favicon/Favicon.png', sizes: '180x180' }],
  },

  // ── App manifest ──
  manifest: '/manifest.json',

  // ── Verification (à remplir quand disponibles) ──
  verification: {
    // google: 'VOTRE_CODE_VERIFICATION_GOOGLE',
    // yandex: 'VOTRE_CODE_YANDEX',
  },

  // ── App metadata ──
  applicationName: SITE_NAME,
  referrer: 'origin-when-cross-origin',
  category: 'business',
}

// ── Viewport ──────────────────────────────────────────────────────────────────

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: dark)',  color: '#060a1c' },
    { media: '(prefers-color-scheme: light)', color: '#060a1c' },
  ],
}

// ── Root layout ────────────────────────────────────────────────────────────────

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Preconnect to key external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS prefetch for Supabase */}
        <link rel="dns-prefetch" href="https://supabase.co" />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        {/* Theme bootstrap — runs synchronously before React hydrates to prevent FOUC */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('pilot-theme');var v=['dark','pilot','midnight','slate','forest','aurora','dusk','cyber','sunset','ocean','rose','holographic','light'];document.documentElement.setAttribute('data-theme',(t&&v.indexOf(t)!==-1)?t:'dark')}catch(e){document.documentElement.setAttribute('data-theme','dark')}})();` }} />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
