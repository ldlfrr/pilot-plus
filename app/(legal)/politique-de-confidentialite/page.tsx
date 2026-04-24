import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — PILOT+',
  description: 'Politique de confidentialité et protection des données personnelles (RGPD) de PILOT+',
}

export default function PolitiqueConfidentialitePage() {
  return (
    <article className="prose prose-gray max-w-none">

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Politique de confidentialité</h1>
      <p className="text-sm text-gray-500 mb-2">Conforme au Règlement Général sur la Protection des Données (RGPD — UE 2016/679)</p>
      <p className="text-sm text-gray-500 mb-10">Dernière mise à jour : avril 2025</p>

      {/* Intro */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-10 text-sm text-blue-900 leading-relaxed">
        Pilot Plus accorde une importance fondamentale à la protection de vos données personnelles. Cette politique explique
        quelles données nous collectons, pourquoi, comment nous les utilisons et quels sont vos droits.
      </div>

      {/* 1 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Responsable du traitement</h2>
        <div className="bg-gray-50 rounded-xl p-5 text-sm text-gray-700 space-y-1">
          <p><strong>Société :</strong> Pilot Plus</p>
          <p><strong>SIRET :</strong> <span className="text-amber-600">[À compléter]</span></p>
          <p><strong>Adresse :</strong> <span className="text-amber-600">[À compléter]</span></p>
          <p><strong>Contact DPO / données :</strong> <a href="mailto:privacy@pilotplus.app" className="text-blue-600 hover:underline">privacy@pilotplus.app</a></p>
        </div>
      </section>

      {/* 2 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Données collectées et finalités</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left px-4 py-3 font-semibold text-gray-700 border border-gray-200 rounded-tl-lg">Catégorie</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 border border-gray-200">Données</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 border border-gray-200">Finalité</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 border border-gray-200 rounded-tr-lg">Base légale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 border border-gray-200 font-medium">Compte</td>
                <td className="px-4 py-3 border border-gray-200">Adresse e-mail, nom complet, mot de passe (chiffré)</td>
                <td className="px-4 py-3 border border-gray-200">Création et gestion du compte, authentification</td>
                <td className="px-4 py-3 border border-gray-200">Exécution du contrat</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 border border-gray-200 font-medium">Profil entreprise</td>
                <td className="px-4 py-3 border border-gray-200">Nom de l'entreprise, secteur, agences, critères de sélection</td>
                <td className="px-4 py-3 border border-gray-200">Personnalisation des analyses IA</td>
                <td className="px-4 py-3 border border-gray-200">Exécution du contrat</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 border border-gray-200 font-medium">Projets</td>
                <td className="px-4 py-3 border border-gray-200">Noms de projets, clients, montants, fichiers DCE</td>
                <td className="px-4 py-3 border border-gray-200">Analyse Go/No Go et scoring IA</td>
                <td className="px-4 py-3 border border-gray-200">Exécution du contrat</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 border border-gray-200 font-medium">Paiement</td>
                <td className="px-4 py-3 border border-gray-200">Données de facturation, identifiant client Stripe</td>
                <td className="px-4 py-3 border border-gray-200">Gestion des abonnements et facturation</td>
                <td className="px-4 py-3 border border-gray-200">Exécution du contrat</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 border border-gray-200 font-medium">Utilisation</td>
                <td className="px-4 py-3 border border-gray-200">Logs de connexion, adresse IP, actions utilisateur</td>
                <td className="px-4 py-3 border border-gray-200">Sécurité, prévention des fraudes, amélioration du service</td>
                <td className="px-4 py-3 border border-gray-200">Intérêt légitime</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">3. Durée de conservation</h2>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-1 bg-blue-400 rounded-full flex-shrink-0" />
            <div>
              <p className="font-medium">Données de compte actif</p>
              <p className="text-gray-500 mt-0.5">Conservées pendant toute la durée de l'abonnement actif.</p>
            </div>
          </div>
          <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-1 bg-blue-400 rounded-full flex-shrink-0" />
            <div>
              <p className="font-medium">Après résiliation ou suppression du compte</p>
              <p className="text-gray-500 mt-0.5">Les données sont anonymisées ou supprimées dans un délai maximum de 30 jours, sauf obligation légale de conservation.</p>
            </div>
          </div>
          <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-1 bg-blue-400 rounded-full flex-shrink-0" />
            <div>
              <p className="font-medium">Données de facturation</p>
              <p className="text-gray-500 mt-0.5">Conservées 10 ans conformément aux obligations comptables et fiscales françaises.</p>
            </div>
          </div>
          <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-1 bg-blue-400 rounded-full flex-shrink-0" />
            <div>
              <p className="font-medium">Logs de sécurité</p>
              <p className="text-gray-500 mt-0.5">Conservés 12 mois maximum.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">4. Sous-traitants et destinataires</h2>
        <p className="text-sm text-gray-600 mb-4">
          Vos données peuvent être transmises aux sous-traitants suivants, dans le strict cadre de la fourniture du service.
          Pilot Plus s'assure que ces partenaires offrent des garanties suffisantes au titre du RGPD.
        </p>
        <div className="grid gap-3">
          {[
            {
              name: 'Supabase',
              role: 'Base de données et authentification',
              location: 'UE (eu-west)',
              link: 'https://supabase.com/privacy',
              note: 'Données hébergées en Europe',
            },
            {
              name: 'Vercel',
              role: 'Hébergement de l\'application',
              location: 'UE / USA (SCCs)',
              link: 'https://vercel.com/legal/privacy-policy',
              note: 'Clauses contractuelles types UE-USA',
            },
            {
              name: 'Anthropic',
              role: 'Intelligence artificielle (analyse de documents)',
              location: 'USA (SCCs)',
              link: 'https://www.anthropic.com/privacy',
              note: 'Les contenus des DCE sont transmis pour analyse. Anthropic ne conserve pas les données pour entraînement.',
            },
            {
              name: 'Stripe',
              role: 'Traitement des paiements',
              location: 'USA / UE (SCCs)',
              link: 'https://stripe.com/fr/privacy',
              note: 'Données de paiement jamais stockées côté PILOT+',
            },
          ].map(p => (
            <div key={p.name} className="border border-gray-200 rounded-xl p-4 text-sm">
              <div className="flex items-start justify-between gap-4 mb-1">
                <span className="font-semibold text-gray-800">{p.name}</span>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">{p.location}</span>
              </div>
              <p className="text-gray-500">{p.role}</p>
              <p className="text-gray-400 text-xs mt-1 italic">{p.note}</p>
              <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs mt-1 inline-block">
                Politique de confidentialité →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* 5 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">5. Transferts hors Union européenne</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Certains de nos sous-traitants (Anthropic, Vercel, Stripe) sont établis aux États-Unis. Ces transferts sont encadrés
          par des <strong>Clauses Contractuelles Types (CCT)</strong> adoptées par la Commission européenne, conformément à
          l'article 46 du RGPD, garantissant un niveau de protection adéquat de vos données.
        </p>
      </section>

      {/* 6 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">6. Vos droits</h2>
        <p className="text-sm text-gray-700 mb-4">Conformément au RGPD, vous disposez des droits suivants :</p>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          {[
            { title: 'Droit d\'accès', desc: 'Obtenir une copie de vos données personnelles que nous détenons.' },
            { title: 'Droit de rectification', desc: 'Corriger des données inexactes ou incomplètes vous concernant.' },
            { title: 'Droit à l\'effacement', desc: 'Demander la suppression de vos données (droit à l\'oubli).' },
            { title: 'Droit à la portabilité', desc: 'Recevoir vos données dans un format structuré et lisible par machine.' },
            { title: 'Droit d\'opposition', desc: 'Vous opposer à certains traitements fondés sur l\'intérêt légitime.' },
            { title: 'Droit à la limitation', desc: 'Demander la suspension temporaire d\'un traitement vous concernant.' },
          ].map(r => (
            <div key={r.title} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="font-medium text-gray-800 mb-1">{r.title}</p>
              <p className="text-gray-500 text-xs leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-900">
          <p className="font-medium mb-1">Exercer vos droits</p>
          <p>
            Envoyez votre demande à{' '}
            <a href="mailto:privacy@pilotplus.app" className="text-blue-600 hover:underline font-medium">privacy@pilotplus.app</a>.
            Nous répondrons dans un délai maximum de <strong>30 jours</strong>.
          </p>
          <p className="mt-2 text-xs text-blue-700">
            En cas de litige non résolu, vous pouvez saisir la{' '}
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="underline">CNIL</a> (Commission Nationale de l'Informatique et des Libertés).
          </p>
        </div>
      </section>

      {/* 7 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">7. Cookies et traceurs</h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          PILOT+ utilise exclusivement des cookies et données de stockage local <strong>strictement nécessaires</strong> au
          fonctionnement du service. Aucun cookie publicitaire ou de suivi tiers n'est utilisé.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left px-4 py-2 font-semibold text-gray-700 border border-gray-200">Cookie / stockage</th>
                <th className="text-left px-4 py-2 font-semibold text-gray-700 border border-gray-200">Finalité</th>
                <th className="text-left px-4 py-2 font-semibold text-gray-700 border border-gray-200">Durée</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-2 border border-gray-200 font-mono text-xs">sb-auth-token</td>
                <td className="px-4 py-2 border border-gray-200">Session d'authentification Supabase</td>
                <td className="px-4 py-2 border border-gray-200">Session</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border border-gray-200 font-mono text-xs">pilot-theme</td>
                <td className="px-4 py-2 border border-gray-200">Préférence de thème visuel (localStorage)</td>
                <td className="px-4 py-2 border border-gray-200">Persistant</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border border-gray-200 font-mono text-xs">pilot_dismissed_notifs</td>
                <td className="px-4 py-2 border border-gray-200">Notifications masquées (localStorage)</td>
                <td className="px-4 py-2 border border-gray-200">Persistant</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Ces traceurs n'étant pas soumis au consentement préalable (article 82 de la loi Informatique et Libertés),
          aucun bandeau de consentement n'est requis.
        </p>
      </section>

      {/* 8 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">8. Sécurité</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Pilot Plus met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données
          contre tout accès non autorisé, perte, destruction ou altération, notamment :
        </p>
        <ul className="mt-3 space-y-1 text-sm text-gray-700 list-disc list-inside">
          <li>Chiffrement des communications via HTTPS (TLS 1.3)</li>
          <li>Mots de passe hachés avec bcrypt (via Supabase Auth)</li>
          <li>Accès à la base de données restreint par Row Level Security (RLS)</li>
          <li>Clés API stockées comme variables d'environnement chiffrées</li>
          <li>Accès aux données de production limité aux personnes habilitées</li>
        </ul>
      </section>

      {/* 9 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">9. Modification de la politique</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Cette politique peut être mise à jour pour refléter des changements légaux, techniques ou de service.
          En cas de modification substantielle, vous serez informé par e-mail au moins 15 jours avant l'entrée en vigueur des
          nouvelles dispositions. La date de dernière mise à jour est indiquée en haut de cette page.
        </p>
      </section>

      {/* 10 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">10. Contact</h2>
        <p className="text-sm text-gray-700">
          Pour toute question relative à la protection de vos données :{' '}
          <a href="mailto:privacy@pilotplus.app" className="text-blue-600 hover:underline">privacy@pilotplus.app</a>
        </p>
      </section>

    </article>
  )
}
