import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions légales — PILOT+',
  description: 'Mentions légales du service PILOT+',
}

export default function MentionsLegalesPage() {
  return (
    <article className="prose prose-gray max-w-none">

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Mentions légales</h1>
      <p className="text-sm text-gray-500 mb-10">Dernière mise à jour : avril 2025</p>

      {/* 1 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Éditeur du site</h2>
        <div className="bg-gray-50 rounded-xl p-6 text-sm text-gray-700 space-y-1">
          <p><strong>Raison sociale :</strong> L2endigital</p>
          <p><strong>Forme juridique :</strong> <span className="text-amber-600">[À compléter : SAS / SARL / Auto-entrepreneur…]</span></p>
          <p><strong>Capital social :</strong> <span className="text-amber-600">[À compléter]</span></p>
          <p><strong>SIRET :</strong> <span className="text-amber-600">[À compléter]</span></p>
          <p><strong>RCS :</strong> <span className="text-amber-600">[À compléter]</span></p>
          <p><strong>Siège social :</strong> <span className="text-amber-600">[Adresse complète]</span></p>
          <p><strong>Adresse e-mail :</strong> contact@pilotplus.app</p>
          <p><strong>Site web :</strong> https://pilotplus.app</p>
        </div>
      </section>

      {/* 2 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Directeur de la publication</h2>
        <p className="text-sm text-gray-700">
          Le directeur de la publication est le représentant légal de la société L2endigital.
          <br />
          Contact : contact@pilotplus.app
        </p>
      </section>

      {/* 3 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">3. Hébergement</h2>
        <div className="bg-gray-50 rounded-xl p-6 text-sm text-gray-700 space-y-4">
          <div>
            <p className="font-semibold mb-1">Hébergeur principal (front-end & API)</p>
            <p>Vercel Inc.</p>
            <p>340 Pine Street, Suite 900, San Francisco, CA 94104 — États-Unis</p>
            <p>Site : <a href="https://vercel.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">vercel.com</a></p>
          </div>
          <div>
            <p className="font-semibold mb-1">Base de données</p>
            <p>Supabase Inc. — données stockées en région Europe (eu-west)</p>
            <p>Site : <a href="https://supabase.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">supabase.com</a></p>
          </div>
        </div>
      </section>

      {/* 4 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">4. Propriété intellectuelle</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          L'ensemble du contenu du site pilotplus.app (textes, graphismes, logos, icônes, sons, logiciels) est la propriété exclusive
          de L2endigital ou de ses partenaires et est protégé par les lois françaises et internationales relatives à la propriété
          intellectuelle. Toute reproduction, distribution, modification, adaptation, retransmission ou publication, même partielle,
          de ces différents éléments est strictement interdite sans l'accord exprès et écrit de L2endigital.
        </p>
      </section>

      {/* 5 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">5. Limitation de responsabilité</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Les informations contenues sur ce site sont aussi précises que possible et le site est régulièrement mis à jour.
          Cependant, L2endigital ne peut garantir l'exactitude, la complétude et l'actualité des informations diffusées.
          L2endigital décline toute responsabilité pour tout dommage, direct ou indirect, quel qu'en soit la nature, résultant
          de l'utilisation du site pilotplus.app.
        </p>
        <p className="text-sm text-gray-700 leading-relaxed mt-3">
          Les analyses et scores générés par l'intelligence artificielle de PILOT+ sont fournis à titre indicatif uniquement
          et ne sauraient remplacer le jugement professionnel de l'utilisateur. L2endigital ne saurait être tenu responsable
          des décisions commerciales prises sur la base de ces analyses.
        </p>
      </section>

      {/* 6 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">6. Droit applicable</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Les présentes mentions légales sont soumises au droit français. En cas de litige, et à défaut de résolution amiable,
          les tribunaux français seront seuls compétents.
        </p>
      </section>

      {/* 7 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">7. Contact</h2>
        <p className="text-sm text-gray-700">
          Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter à :{' '}
          <a href="mailto:contact@pilotplus.app" className="text-blue-600 hover:underline">contact@pilotplus.app</a>
        </p>
      </section>

    </article>
  )
}
