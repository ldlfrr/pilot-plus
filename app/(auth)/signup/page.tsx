import type { Metadata } from 'next'
import SignupClient from './SignupClient'

export const metadata: Metadata = {
  title: 'Créer un compte gratuit — PILOT+ Analyseur DCE',
  description:
    'Créez votre compte PILOT+ gratuitement. Analysez vos premiers DCE par IA, obtenez un score Go/No Go personnalisé et commencez à piloter vos appels d\'offres BTP & ENR. Aucune carte bancaire requise.',
  alternates: { canonical: 'https://pilot-plus.fr/signup' },
  openGraph: {
    title: 'Créer un compte gratuit — PILOT+',
    description: 'Commencez à analyser vos DCE gratuitement avec l\'IA. Sans engagement, sans carte bancaire.',
    url: 'https://pilot-plus.fr/signup',
  },
}

export default function SignupPage() {
  return <SignupClient />
}
