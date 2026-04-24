import Link from 'next/link'
import Image from 'next/image'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-7 w-24">
              <Image src="/logo/pilot-plus.png" alt="PILOT+" fill className="object-contain object-left" />
            </div>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/mentions-legales" className="hover:text-gray-900 transition-colors">Mentions légales</Link>
            <Link href="/politique-de-confidentialite" className="hover:text-gray-900 transition-colors">Confidentialité</Link>
            <Link href="/cgu" className="hover:text-gray-900 transition-colors">CGU</Link>
            <Link href="/cgv" className="hover:text-gray-900 transition-colors">CGV</Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50 mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Pilot Plus — PILOT+. Tous droits réservés.</p>
          <div className="flex gap-6 text-xs text-gray-400">
            <Link href="/mentions-legales" className="hover:text-gray-600 transition-colors">Mentions légales</Link>
            <Link href="/politique-de-confidentialite" className="hover:text-gray-600 transition-colors">Confidentialité</Link>
            <Link href="/cgu" className="hover:text-gray-600 transition-colors">CGU</Link>
            <Link href="/cgv" className="hover:text-gray-600 transition-colors">CGV</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
