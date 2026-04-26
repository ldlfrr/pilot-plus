import type { Metadata } from 'next'
import LoginClient from './LoginClient'

export const metadata: Metadata = {
  title: 'Connexion — PILOT+ Analyseur DCE',
  description:
    'Connectez-vous à PILOT+ pour accéder à votre analyseur DCE IA, votre pipeline commercial, votre veille BOAMP automatique et tous vos appels d\'offres BTP & ENR.',
  alternates: { canonical: 'https://pilot-plus.fr/login' },
  openGraph: {
    title: 'Connexion — PILOT+',
    description: 'Accédez à votre espace d\'analyse DCE et de pilotage des appels d\'offres.',
    url: 'https://pilot-plus.fr/login',
  },
}

export default function LoginPage() {
  return <LoginClient />
}
