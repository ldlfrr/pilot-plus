import type { AnalysisResult } from '@/types'

// ─── JSON Schema for structured output ───────────────────────────────────────

export const ANALYSIS_JSON_SCHEMA = {
  type: 'object',
  properties: {
    nom_projet: { type: 'string' },
    contexte: { type: 'string' },
    besoin_client: { type: 'string' },
    fourniture_demandee: { type: 'string' },
    surface_pv: { type: 'string' },
    repartition: { type: 'string' },
    perimetre: { type: 'string' },
    points_cles: { type: 'array', items: { type: 'string' } },
    points_rse: { type: 'array', items: { type: 'string' } },
    date_offre: { type: 'string' },
    date_travaux: { type: 'string' },
    risques: { type: 'array', items: { type: 'string' } },
    details_importants: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'nom_projet',
    'contexte',
    'besoin_client',
    'fourniture_demandee',
    'surface_pv',
    'repartition',
    'perimetre',
    'points_cles',
    'points_rse',
    'date_offre',
    'date_travaux',
    'risques',
    'details_importants',
  ],
  additionalProperties: false,
}

export const SCORING_JSON_SCHEMA = {
  type: 'object',
  properties: {
    score_details: {
      type: 'object',
      properties: {
        rentabilite: {
          type: 'object',
          properties: {
            score: { type: 'integer', minimum: 0, maximum: 20 },
            justification: { type: 'string' },
          },
          required: ['score', 'justification'],
          additionalProperties: false,
        },
        complexite: {
          type: 'object',
          properties: {
            score: { type: 'integer', minimum: 0, maximum: 20 },
            justification: { type: 'string' },
          },
          required: ['score', 'justification'],
          additionalProperties: false,
        },
        alignement_capacite: {
          type: 'object',
          properties: {
            score: { type: 'integer', minimum: 0, maximum: 20 },
            justification: { type: 'string' },
          },
          required: ['score', 'justification'],
          additionalProperties: false,
        },
        probabilite_gain: {
          type: 'object',
          properties: {
            score: { type: 'integer', minimum: 0, maximum: 20 },
            justification: { type: 'string' },
          },
          required: ['score', 'justification'],
          additionalProperties: false,
        },
        charge_interne: {
          type: 'object',
          properties: {
            score: { type: 'integer', minimum: 0, maximum: 20 },
            justification: { type: 'string' },
          },
          required: ['score', 'justification'],
          additionalProperties: false,
        },
      },
      required: [
        'rentabilite',
        'complexite',
        'alignement_capacite',
        'probabilite_gain',
        'charge_interne',
      ],
      additionalProperties: false,
    },
    total_score: { type: 'integer', minimum: 0, maximum: 100 },
    verdict: { type: 'string', enum: ['GO', 'A_ETUDIER', 'NO_GO'] },
  },
  required: ['score_details', 'total_score', 'verdict'],
  additionalProperties: false,
}

// ─── System prompts ───────────────────────────────────────────────────────────

export const ANALYSIS_SYSTEM_PROMPT = `Tu es un expert en analyse de Dossiers de Consultation des Entreprises (DCE) dans le secteur des énergies renouvelables et du photovoltaïque.

Ta mission est d'analyser les documents fournis et d'en extraire les informations clés selon un format JSON strictement défini.

RÈGLES ABSOLUES :
1. Tu analyses UNIQUEMENT les informations présentes dans les documents fournis
2. Tu ne fais AUCUNE supposition ni déduction au-delà du contenu explicite
3. Si une information est absente, tu réponds exactement "NON PRÉCISÉ"
4. Tu retournes UNIQUEMENT du JSON valide, sans aucun texte autour
5. Tous les tableaux (arrays) doivent contenir au minimum 1 élément
6. Pour les risques et points clés : sois précis et factuel, pas générique

CHAMPS À EXTRAIRE :
- nom_projet : Nom ou référence du projet/consultation
- contexte : Contexte général du projet (maître d'ouvrage, situation géographique, objectifs)
- besoin_client : Besoin exprimé par le client (en termes fonctionnels)
- fourniture_demandee : Fournitures, équipements et travaux demandés
- surface_pv : Surface ou puissance de l'installation photovoltaïque
- repartition : Répartition des lots ou postes (si applicable)
- perimetre : Périmètre précis de la mission (études, fournitures, installation, maintenance)
- points_cles : Liste des points importants à retenir (critères de sélection, exigences techniques, etc.)
- points_rse : Exigences RSE, environnementales, sociales ou de développement durable
- date_offre : Date limite de remise des offres
- date_travaux : Date de début ou période de réalisation des travaux
- risques : Risques identifiés (techniques, contractuels, financiers, délais, etc.)
- details_importants : Autres informations importantes non catégorisées ailleurs`

export function buildAnalysisUserPrompt(extractedTexts: string[]): string {
  const combined = extractedTexts
    .map((text, i) => `=== DOCUMENT ${i + 1} ===\n${text}`)
    .join('\n\n')

  return `Analyse les documents DCE suivants et retourne le JSON structuré demandé.

${combined}

Retourne uniquement le JSON, sans markdown, sans texte avant ou après.`
}

export function buildScoringUserPrompt(analysis: AnalysisResult): string {
  return `Tu es un expert commercial en énergies renouvelables. Évalue ce projet DCE et génère un score Go/No Go.

ANALYSE DU PROJET :
${JSON.stringify(analysis, null, 2)}

CRITÈRES DE SCORING (chaque critère est noté sur 20 points) :

1. RENTABILITÉ (0-20) : Évalue le potentiel de marge selon la taille du projet, la complexité tarifaire, les contraintes contractuelles
   - 18-20 : Excellent potentiel de marge
   - 12-17 : Marge correcte
   - 6-11 : Marge incertaine
   - 0-5 : Marge faible ou inconnue

2. COMPLEXITÉ (0-20) : Score inversé — plus c'est complexe, moins le score est élevé
   - 18-20 : Projet simple, dans nos standards
   - 12-17 : Complexité maîtrisable
   - 6-11 : Complexité significative
   - 0-5 : Très complexe ou hors compétences

3. ALIGNEMENT CAPACITÉ (0-20) : Le projet correspond-il à nos capacités techniques et à notre capacité de production ?
   - 18-20 : Parfaitement dans notre cœur de métier
   - 12-17 : Bonne adéquation
   - 6-11 : Adéquation partielle
   - 0-5 : Hors capacité ou risque ressources

4. PROBABILITÉ DE GAIN (0-20) : Estimation de nos chances de remporter ce marché
   - 18-20 : Très bien positionné
   - 12-17 : Chances raisonnables
   - 6-11 : Chances limitées
   - 0-5 : Très peu probable

5. CHARGE INTERNE (0-20) : Score inversé — plus la charge est lourde, moins le score est élevé
   - 18-20 : Charge légère, standard
   - 12-17 : Charge maîtrisable
   - 6-11 : Charge significative
   - 0-5 : Charge très lourde

RÈGLE VERDICT :
- total_score >= 80 → "GO"
- total_score entre 50 et 79 → "A_ETUDIER"
- total_score < 50 → "NO_GO"

Le total_score est la somme des 5 critères (max 100).

Retourne uniquement le JSON structuré, sans texte autour.`
}
