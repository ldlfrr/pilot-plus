import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente — PILOT+',
  description: 'Conditions générales de vente et tarification du service PILOT+',
}

export default function CGVPage() {
  return (
    <article className="prose prose-gray max-w-none">

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Conditions Générales de Vente</h1>
      <p className="text-sm text-gray-500 mb-10">Dernière mise à jour : avril 2025</p>

      {/* 1 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Objet et champ d&apos;application</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles entre la société L2endigital,
          éditrice du service PILOT+, et tout client professionnel souscrivant à un abonnement payant.
        </p>
        <p className="text-sm text-gray-700 leading-relaxed mt-3">
          PILOT+ est un service exclusivement destiné aux professionnels (B2B). Les dispositions relatives au droit de la
          consommation (notamment le droit de rétractation de 14 jours prévu par le Code de la consommation) ne s'appliquent
          pas aux contrats conclus entre professionnels.
        </p>
      </section>

      {/* 2 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Offres et tarification</h2>
        <p className="text-sm text-gray-600 mb-4 text-sm">Tous les prix sont indiqués en euros (€) HT, hors TVA applicable.</p>

        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {/* Basic */}
          <div className="border border-gray-200 rounded-xl p-5">
            <p className="font-bold text-gray-900 text-lg mb-1">Basic</p>
            <p className="text-2xl font-extrabold text-blue-600 mb-3">49 € <span className="text-sm font-normal text-gray-500">/ mois HT</span></p>
            <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside">
              <li>Analyses DCE illimitées</li>
              <li>Score Go/No Go IA</li>
              <li>Tableau de bord projets</li>
              <li>Veille appels d'offres</li>
            </ul>
          </div>
          {/* Pro */}
          <div className="border-2 border-blue-500 rounded-xl p-5 relative">
            <span className="absolute -top-3 left-4 bg-blue-500 text-white text-xs font-bold px-3 py-0.5 rounded-full">Recommandé</span>
            <p className="font-bold text-gray-900 text-lg mb-1">Pro</p>
            <p className="text-2xl font-extrabold text-blue-600 mb-3">149 € <span className="text-sm font-normal text-gray-500">/ mois HT</span></p>
            <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside">
              <li>Tout le plan Basic</li>
              <li>Synthèses avancées</li>
              <li>Exports PDF/DOCX</li>
              <li>Accès multi-agences</li>
              <li>Support prioritaire</li>
            </ul>
          </div>
          {/* Enterprise */}
          <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
            <p className="font-bold text-gray-900 text-lg mb-1">Entreprise</p>
            <p className="text-2xl font-extrabold text-gray-700 mb-3">499 € <span className="text-sm font-normal text-gray-500">/ mois HT</span></p>
            <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside">
              <li>Tout le plan Pro</li>
              <li>Utilisateurs illimités</li>
              <li>SLA dédié</li>
              <li>Accompagnement personnalisé</li>
              <li>Facturation sur devis</li>
            </ul>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          L2endigital se réserve le droit de modifier ses tarifs à tout moment. Les nouveaux tarifs s'appliquent
          à la prochaine période de facturation, après information préalable du client par e-mail (préavis de 30 jours).
        </p>
      </section>

      {/* 3 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">3. Souscription et formation du contrat</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          La souscription à un abonnement PILOT+ s'effectue en ligne via la page d'abonnement. Le contrat est formé lors de
          la validation du paiement par Stripe. L'utilisateur reçoit une confirmation par e-mail.
          L'accès au service est activé immédiatement après confirmation du paiement.
        </p>
      </section>

      {/* 4 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">4. Facturation et paiement</h2>
        <div className="space-y-3 text-sm text-gray-700">
          <p className="leading-relaxed">
            Les abonnements sont facturés <strong>mensuellement</strong> par prélèvement automatique via Stripe.
            La date de facturation correspond à la date de souscription initiale.
          </p>
          <p className="leading-relaxed">
            En cas d'échec de paiement, L2endigital procédera à des relances automatiques. Sans régularisation sous 7 jours,
            l'accès au service pourra être suspendu jusqu'au paiement.
          </p>
          <p className="leading-relaxed">
            Les factures sont émises automatiquement et accessibles depuis le portail client Stripe, accessible via
            le bouton "Gérer mon abonnement" dans les paramètres de compte.
          </p>
          <p className="leading-relaxed">
            <strong>TVA :</strong> La TVA au taux en vigueur en France (20 %) s'applique aux clients domiciliés en France.
            Pour les clients professionnels d'autres États membres de l'UE disposant d'un numéro de TVA intracommunautaire
            valide, l'autoliquidation s'applique.
          </p>
        </div>
      </section>

      {/* 5 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">5. Résiliation et annulation</h2>
        <div className="space-y-3 text-sm text-gray-700">
          <p className="leading-relaxed">
            <strong>Résiliation par le client :</strong> L'abonnement peut être résilié à tout moment depuis le portail
            client Stripe ("Gérer mon abonnement"). La résiliation prend effet à la fin de la période de facturation en cours.
            Aucun remboursement pro-rata n'est effectué pour la période en cours.
          </p>
          <p className="leading-relaxed">
            <strong>Résiliation par L2endigital :</strong> En cas de violation des CGU ou de non-paiement persistant,
            L2endigital peut résilier l'abonnement avec un préavis de 7 jours (sauf faute grave, résiliation immédiate).
          </p>
          <p className="leading-relaxed">
            <strong>Après résiliation :</strong> L'accès au service est maintenu jusqu'à la fin de la période payée.
            Les données du client sont conservées 30 jours supplémentaires puis supprimées définitivement.
            Un export des données peut être demandé avant cette échéance à{' '}
            <a href="mailto:contact@pilotplus.app" className="text-blue-600 hover:underline">contact@pilotplus.app</a>.
          </p>
        </div>
      </section>

      {/* 6 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">6. Politique de remboursement</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          En application de l'article L. 221-28 du Code de la consommation et dans le cadre de relations B2B, aucun remboursement
          n'est accordé pour les périodes déjà facturées et consommées.
        </p>
        <p className="text-sm text-gray-700 leading-relaxed mt-3">
          Toutefois, en cas de dysfonctionnement majeur imputable à L2endigital rendant le service inutilisable pendant plus
          de 48 heures consécutives, un avoir ou remboursement proportionnel à la durée d'indisponibilité pourra être accordé,
          sur demande, à la discrétion de L2endigital.
        </p>
      </section>

      {/* 7 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">7. Changement de forfait</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          L'upgrade vers un forfait supérieur est possible à tout moment et prend effet immédiatement, avec facturation
          au prorata. Le downgrade vers un forfait inférieur prend effet à la prochaine période de facturation.
          Ces opérations s'effectuent depuis le portail client Stripe.
        </p>
      </section>

      {/* 8 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">8. Sécurité des paiements</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Les paiements sont entièrement gérés par <strong>Stripe</strong> (Stripe, Inc. / Stripe Payments Europe Ltd.),
          prestataire de services de paiement certifié PCI-DSS niveau 1. L2endigital ne stocke jamais vos données de carte
          bancaire sur ses serveurs.
        </p>
      </section>

      {/* 9 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">9. Force majeure</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          L2endigital ne saurait être tenu responsable de tout manquement à ses obligations contractuelles en cas de
          survenance d'un événement de force majeure au sens de l'article 1218 du Code civil (catastrophe naturelle,
          coupure d'électricité, panne des infrastructures tierces, cyberattaque massive, etc.).
        </p>
      </section>

      {/* 10 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">10. Droit applicable et litiges</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Les présentes CGV sont soumises au droit français. En cas de litige, les parties s'efforceront de trouver une
          solution amiable dans un délai de 30 jours. À défaut d'accord amiable, les tribunaux compétents de{' '}
          <span className="text-amber-600">[ville du siège social]</span> seront seuls compétents.
        </p>
      </section>

      {/* 11 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">11. Contact</h2>
        <p className="text-sm text-gray-700">
          Pour toute question commerciale ou litige :{' '}
          <a href="mailto:contact@pilotplus.app" className="text-blue-600 hover:underline">contact@pilotplus.app</a>
        </p>
        <p className="text-sm text-gray-700 mt-2">
          Pour gérer votre abonnement, accédez à :{' '}
          <Link href="/subscription" className="text-blue-600 hover:underline">pilotplus.app/subscription</Link>
        </p>
      </section>

    </article>
  )
}
