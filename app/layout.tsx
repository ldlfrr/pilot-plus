import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
})

export const metadata: Metadata = {
  title: {
    default: 'PILOT+',
    template: '%s | PILOT+',
  },
  description: 'Copilot IA d\'analyse DCE & décision Go/No Go',
  icons: {
    icon: [
      { url: '/favicon/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon/Favicon.png', type: 'image/png' },
    ],
    shortcut: '/favicon/favicon.svg',
    apple: '/favicon/Favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning className={inter.variable}>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        {/* Theme bootstrap — MUST be first child of body, runs synchronously before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('pilot-theme');var v=['dark','pilot','midnight','slate','forest','aurora','dusk','light'];document.documentElement.setAttribute('data-theme',(t&&v.indexOf(t)!==-1)?t:'dark')}catch(e){document.documentElement.setAttribute('data-theme','dark')}})();` }} />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
