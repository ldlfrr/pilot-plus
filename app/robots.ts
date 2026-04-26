import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/signup', '/cgu', '/cgv', '/mentions-legales', '/politique-de-confidentialite'],
        disallow: [
          '/accueil',
          '/dashboard',
          '/projects/',
          '/pipeline',
          '/veille',
          '/export',
          '/team',
          '/account',
          '/settings',
          '/subscription',
          '/calendrier',
          '/enrichment',
          '/api/',
          '/print/',
          '/share/',
          '/invite/',
        ],
      },
    ],
    sitemap: 'https://pilot-plus.fr/sitemap.xml',
    host: 'https://pilot-plus.fr',
  }
}
