import type { AnalysisResult, ScoringResult } from '@/types'

// ─── Mock analysis — realistic DCE data ──────────────────────────────────────

export function getMockAnalysis(projectName: string): AnalysisResult {
  return {
    nom_projet: projectName || 'Consultation photovoltaïque — Bâtiment industriel',
    contexte:
      'Maître d\'ouvrage : collectivité territoriale souhaitant réduire sa facture énergétique et atteindre ses objectifs RSE. Bâtiment existant de 8 000 m² situé en zone industrielle. Toiture en bac acier, charpente métallique, orientation favorable.',
    besoin_client:
      'Installation d\'une centrale photovoltaïque en autoconsommation avec revente de surplus au réseau. Objectif : couvrir 60% de la consommation électrique annuelle estimée à 850 MWh.',
    fourniture_demandee:
      'Modules monocristallins haute performance (≥ 400 Wc), onduleurs string, câblage DC/AC, système de monitoring en temps réel, protection foudre, coffrets de coupure, structure de fixation adaptée à la charpente existante.',
    surface_pv: '4 200 m² utiles — puissance cible : 600 kWc (±10% selon étude d\'ombrage)',
    repartition:
      'Lot unique — fourniture, installation, raccordement Enedis, mise en service et formation exploitation inclus. Option maintenance préventive 5 ans à chiffrer séparément.',
    perimetre:
      'Études d\'exécution et plans d\'implantation, fourniture complète du matériel, installation et câblage, dossier de raccordement CONSUEL + Enedis, mise en service, formation des équipes techniques du client, garanties constructeur et main-d\'œuvre.',
    points_cles: [
      'Critères de sélection : 55% prix, 35% valeur technique, 10% délais',
      'Garantie modules : 25 ans performance, 12 ans produit minimum',
      'Délai de réalisation : 14 semaines à compter de l\'ordre de service',
      'Visite obligatoire du site avant remise d\'offre — date à confirmer avec le MO',
      'Attestation d\'assurance décennale et RC professionnelle à fournir',
      'Qualification QualiPV Bat ou équivalent exigée',
    ],
    points_rse: [
      'Priorité aux modules certifiés avec bilan carbone < 550 kg CO₂/kWc',
      'Plan de gestion et valorisation des déchets chantier obligatoire',
      'Clause d\'insertion : 5% minimum des heures travaillées réservées à des publics éloignés de l\'emploi',
      'Rapport de fin de chantier incluant bilan carbone et économies CO₂ générées',
    ],
    date_offre: '15 juin 2026 — 17h00 (heure locale)',
    date_travaux: 'Démarrage : septembre 2026 — Livraison : décembre 2026',
    risques: [
      'Délai de raccordement Enedis potentiellement supérieur au planning travaux (4 à 8 mois)',
      'Pénalités de retard : 0,1% du montant HT par jour ouvré, plafond à 8%',
      'Clause de production garantie P90 sur 3 ans avec indemnisation si écart > 5%',
      'Accès toiture soumis aux procédures QHSE du client — risque de retard organisationnel',
      'Contrat à prix ferme non révisable — exposition au risque matière première',
    ],
    details_importants: [
      'Dossier de consultation disponible sur la plateforme e-marchespublics.com',
      'Règlement de consultation précise : pas de variante autorisée',
      'Paiement à 45 jours fin de mois sur présentation de facture',
      'Caution de bonne fin de 5% retenue pendant 1 an après réception',
      'BIM non exigé — plans 2D suffisants pour les livrables d\'études',
    ],
  }
}

export function getMockScore(): ScoringResult {
  return {
    score_details: {
      rentabilite: {
        score: 15,
        justification:
          'Projet de taille standard (600 kWc). Contrat à prix ferme avec exposition matière. Délai de paiement 45 jours correct. Marge estimée entre 8 et 12% selon notre grille tarifaire habituelle.',
      },
      complexite: {
        score: 14,
        justification:
          'Lot unique simplifie les interfaces. Qualification exigée disponible en interne. Clause P90 et pénalités de retard à surveiller. Délai Enedis potentiellement critique.',
      },
      alignement_capacite: {
        score: 18,
        justification:
          'Installation toiture industrielle 600 kWc — parfaitement dans notre cœur de métier. Équipe disponible sur la période. Qualifications et assurances à jour.',
      },
      probabilite_gain: {
        score: 13,
        justification:
          'Pondération technique favorable (35%) — notre valeur technique est reconnue. Prix compétitif nécessaire. Estimation 4 à 6 soumissionnaires qualifiés sur ce type de marché.',
      },
      charge_interne: {
        score: 14,
        justification:
          '14 semaines de chantier, formation client et dossier CONSUEL à gérer. Charge équipe commerciale pour le chiffrage : environ 2 jours. Gérable avec les ressources actuelles.',
      },
    },
    total_score: 74,
    verdict: 'A_ETUDIER',
  }
}
