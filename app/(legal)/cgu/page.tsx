import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — PILOT+",
  description: "Conditions générales d'utilisation du service PILOT+",
}

export default function CGUPage() {
  return (
    <article className="prose prose-gray max-w-none">

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Conditions Générales d&apos;Utilisation</h1>
      <p className="text-sm text-gray-500 mb-10">Dernière mise à jour : avril 2025</p>

      {/* 1 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Objet</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation du service PILOT+,
          plateforme SaaS d'analyse de dossiers de consultation d'entreprises (DCE) et d'aide à la décision Go/No Go par
          intelligence artificielle, accessible à l'adresse <strong>pilotplus.app</strong>, édité par la société L2endigital.
        </p>
        <p className="text-sm text-gray-700 leading-relaxed mt-3">
          Toute utilisation du service implique l'acceptation pleine et entière des présentes CGU. Si vous n'acceptez pas
          ces conditions, vous ne devez pas utiliser le service.
        </p>
      </section>

      {/* 2 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Description du service</h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          PILOT+ est un outil professionnel destiné aux entreprises du secteur de la construction, des travaux publics et
          des services, leur permettant de :
        </p>
        <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
          <li>Importer et analyser des DCE (Dossiers de Consultation des Entreprises)</li>
          <li>Obtenir un score de pertinence et une recommandation Go/No Go générés par IA</li>
          <li>Gérer un portefeuille de projets et leurs échéances</li>
          <li>Effectuer une veille automatisée des appels d'offres publics (BOAMP)</li>
          <li>Générer des synthèses et rapports de décision</li>
        </ul>
      </section>

      {/* 3 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">3. Inscription et compte utilisateur</h2>
        <div className="space-y-3 text-sm text-gray-700">
          <p className="leading-relaxed">
            L'utilisation de PILOT+ nécessite la création d'un compte. L'inscription est réservée aux professionnels
            (personnes morales ou personnes physiques agissant dans le cadre de leur activité professionnelle).
          </p>
          <p className="leading-relaxed">
            L'utilisateur s'engage à fournir des informations exactes, complètes et à les maintenir à jour. Il est
            seul responsable de la confidentialité de ses identifiants de connexion et de toutes les actions effectuées
            sous son compte.
          </p>
          <p className="leading-relaxed">
            En cas de perte ou de compromission de ses identifiants, l'utilisateur doit en informer L2endigital sans délai
            à l'adresse <a href="mailto:contact@pilotplus.app" className="text-blue-600 hover:underline">contact@pilotplus.app</a>.
          </p>
        </div>
      </section>

      {/* 4 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">4. Utilisation du service — obligations de l&apos;utilisateur</h2>
        <p className="text-sm text-gray-700 mb-3">L'utilisateur s'engage à :</p>
        <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
          <li>Utiliser le service conformément à sa destination et à la législation applicable</li>
          <li>Ne pas tenter de contourner les systèmes de sécurité ou d'accéder à des données non autorisées</li>
          <li>Ne pas transmettre de contenu illicite, diffamatoire, portant atteinte aux droits de tiers</li>
          <li>Ne pas utiliser le service pour des activités concurrentes à L2endigital sans autorisation écrite préalable</li>
          <li>Ne pas procéder à une ingénierie inverse, décompiler ou désassembler tout ou partie du service</li>
          <li>Respecter les droits de propriété intellectuelle de L2endigital et des tiers</li>
        </ul>
      </section>

      {/* 5 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">5. Propriété intellectuelle</h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          L2endigital est et demeure titulaire de l'ensemble des droits de propriété intellectuelle sur le service PILOT+,
          son interface, ses algorithmes, sa documentation et ses marques. L'accès au service ne confère à l'utilisateur
          aucun droit de propriété sur ces éléments.
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">
          L'utilisateur reste propriétaire de ses données (projets, documents, analyses). Il accorde à L2endigital une
          licence limitée, non exclusive, permettant uniquement de fournir le service tel que décrit.
        </p>
      </section>

      {/* 6 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">6. Intelligence artificielle — avertissement</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-900 leading-relaxed">
          <p className="font-semibold mb-2">⚠️ Nature indicative des analyses</p>
          <p>
            Les scores, recommandations Go/No Go et synthèses générés par l'IA de PILOT+ sont fournis à titre indicatif
            uniquement. Ils constituent une aide à la décision et ne remplacent pas le jugement professionnel de l'utilisateur.
            L2endigital ne saurait être tenu responsable des décisions commerciales prises sur la base de ces analyses.
          </p>
          <p className="mt-3">
            L'utilisateur est seul responsable de l'évaluation finale de la pertinence de répondre à un appel d'offres.
          </p>
        </div>
      </section>

      {/* 7 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">7. Disponibilité du service</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          L2endigital s'efforce d'assurer la disponibilité du service 24h/24 et 7j/7. Cependant, des interruptions peuvent
          survenir pour maintenance, mise à jour ou en cas de force majeure. L2endigital ne pourra être tenu responsable
          d'une quelconque indisponibilité temporaire du service.
        </p>
        <p className="text-sm text-gray-700 leading-relaxed mt-3">
          L2endigital se réserve le droit de faire évoluer, modifier ou interrompre tout ou partie du service à tout moment,
          avec un préavis raisonnable sauf urgence technique ou sécuritaire.
        </p>
      </section>

      {/* 8 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">8. Limitation de responsabilité</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Dans toute la mesure permise par la loi, la responsabilité de L2endigital au titre du présent contrat est limitée
          aux sommes effectivement payées par l'utilisateur au cours des 12 derniers mois précédant le fait générateur du litige.
          L2endigital ne saurait être tenu responsable des dommages indirects, pertes de données, pertes de chiffre d'affaires
          ou préjudices commerciaux de quelque nature que ce soit.
        </p>
      </section>

      {/* 9 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">9. Suspension et résiliation du compte</h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          L2endigital se réserve le droit de suspendre ou de résilier l'accès d'un utilisateur sans préavis en cas de :
        </p>
        <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
          <li>Violation des présentes CGU</li>
          <li>Activité frauduleuse ou contraire à la loi</li>
          <li>Non-paiement de l'abonnement</li>
          <li>Utilisation nuisible au service ou aux autres utilisateurs</li>
        </ul>
        <p className="text-sm text-gray-700 leading-relaxed mt-3">
          L'utilisateur peut supprimer son compte à tout moment depuis les paramètres de son profil ou en contactant
          <a href="mailto:contact@pilotplus.app" className="text-blue-600 hover:underline"> contact@pilotplus.app</a>.
          Les données seront supprimées dans un délai de 30 jours.
        </p>
      </section>

      {/* 10 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">10. Modifications des CGU</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          L2endigital se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés
          par e-mail des modifications substantielles au moins 15 jours avant leur entrée en vigueur.
          La poursuite de l'utilisation du service après cette date vaut acceptation des nouvelles conditions.
        </p>
      </section>

      {/* 11 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">11. Droit applicable et juridiction</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Les présentes CGU sont soumises au droit français. En cas de litige, les parties s'efforceront de trouver une
          solution amiable. À défaut, les tribunaux compétents de <span className="text-amber-600">[ville du siège social]</span> seront
          seuls compétents.
        </p>
      </section>

      {/* 12 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">12. Contact</h2>
        <p className="text-sm text-gray-700">
          Pour toute question relative aux présentes CGU :{' '}
          <a href="mailto:contact@pilotplus.app" className="text-blue-600 hover:underline">contact@pilotplus.app</a>
        </p>
      </section>

    </article>
  )
}
