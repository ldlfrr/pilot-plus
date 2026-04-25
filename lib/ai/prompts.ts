import type { AnalysisResult, CompanyCriteria } from '@/types'

// ─── Scoring context types ────────────────────────────────────────────────────
export type ScoringContext =
  | { mode: 'form';     criteria: CompanyCriteria | null }
  | { mode: 'document'; documentText: string }

// ─── Analysis system prompt ───────────────────────────────────────────────────

export const ANALYSIS_SYSTEM_PROMPT = `Tu es un expert en analyse de Dossiers de Consultation des Entreprises (DCE) dans le secteur des énergies renouvelables et du photovoltaïque.

Ta mission est d'analyser les documents fournis et d'en extraire les informations clés de façon EXHAUSTIVE et STRUCTURÉE.

RÈGLES ABSOLUES :
1. Tu analyses UNIQUEMENT les informations présentes dans les documents fournis
2. Tu ne fais AUCUNE supposition au-delà du contenu explicite
3. Si une information est absente, tu réponds exactement "NON PRÉCISÉ"
4. Tu retournes UNIQUEMENT du JSON valide, sans aucun texte autour (pas de \`\`\`json, pas d'explication)
5. Tous les tableaux doivent contenir au minimum 1 élément (mets "NON PRÉCISÉ" si vide)
6. Pour les risques, points clés, actions : sois précis et factuel, jamais générique

STRUCTURE JSON ATTENDUE (respecte EXACTEMENT ces clés) :
{
  "nom_projet": "...",
  "contexte": "...",
  "type_projet": "ex: Photovoltaïque au sol / Toiture industrielle / Ombrière...",
  "objet": "ex: Construction clé en main / Fourniture et pose / EPC...",
  "puissance": "ex: 2,5 MWc / 500 kWc / NON PRÉCISÉ",
  "sites": "ex: 3 sites / 1 site principal / NON PRÉCISÉ",
  "complexite": "Faible / Moyenne / Élevée / Très élevée",
  "ref_ao": "Référence de l'appel d'offres si mentionnée, sinon NON PRÉCISÉ",
  "resume_executif": "Résumé factuel en 3-5 phrases du projet, du maître d'ouvrage et des enjeux principaux",
  "points_vigilance": ["Point critique 1", "Point critique 2", "..."],
  "besoin_client": "Description générale du besoin",
  "besoin_client_detail": {
    "objectifs": ["Objectif 1", "Objectif 2"],
    "besoins_metier": ["Besoin métier 1", "Besoin métier 2"],
    "contraintes": ["Contrainte 1", "Contrainte 2"],
    "priorites": ["Priorité 1", "Priorité 2"],
    "attentes_implicites": ["Attente implicite 1", "Attente implicite 2"],
    "points_a_appuyer": ["Point fort à valoriser 1", "Point fort à valoriser 2"]
  },
  "fourniture_demandee": "...",
  "surface_pv": "...",
  "repartition": "...",
  "perimetre": "...",
  "pieces_a_fournir": [
    { "nom": "DC1 – Lettre de candidature", "type": "obligatoire" },
    { "nom": "Mémoire technique", "type": "obligatoire" },
    { "nom": "Plan de gestion environnementale", "type": "recommande" }
  ],
  "specificites": {
    "exigences_techniques": ["Exigence 1", "Exigence 2"],
    "contraintes_site": ["Contrainte site 1", "Contrainte site 2"],
    "normes_applicables": ["NF EN 62548", "UTE C 15-712"],
    "materiaux": ["Panneaux monocristallins ≥ 400Wc", "Onduleurs certifiés G99"]
  },
  "points_cles": ["Point clé 1", "Point clé 2"],
  "points_rse": ["Critère RSE 1"],
  "date_offre": "JJ/MM/AAAA ou NON PRÉCISÉ",
  "date_travaux": "JJ/MM/AAAA ou période ou NON PRÉCISÉ",
  "risques": ["Risque 1", "Risque 2"],
  "details_importants": ["Détail 1"],
  "actions_suggerees": [
    "Répondre à la consultation avant la date limite",
    "Contacter Enedis pour le raccordement",
    "Préparer les références similaires",
    "Planifier la visite de site"
  ]
}`

export function buildAnalysisUserPrompt(extractedTexts: string[]): string {
  const combined = extractedTexts
    .map((text, i) => `=== DOCUMENT ${i + 1} ===\n${text}`)
    .join('\n\n')

  return `Analyse les documents DCE suivants et retourne le JSON structuré demandé.

${combined}

Retourne uniquement le JSON, sans markdown, sans texte avant ou après.`
}

// ─── Scoring prompt (with company criteria injection) ─────────────────────────

export function buildScoringSystemPrompt(): string {
  return `Tu es un expert commercial senior en énergies renouvelables. Tu évalues des projets DCE et génères des scores Go/No Go précis, justifiés et contextualisés par rapport au profil de l'entreprise.

Tu retournes UNIQUEMENT du JSON valide, sans aucun texte autour.`
}

export function buildScoringUserPrompt(
  analysis: AnalysisResult,
  criteriaOrContext: CompanyCriteria | null | ScoringContext
): string {
  // Support both legacy call (criteria | null) and new ScoringContext union
  let criteriaBlock: string
  let poidsBlock: string
  let criteria: CompanyCriteria | null = null

  if (
    criteriaOrContext !== null &&
    typeof criteriaOrContext === 'object' &&
    'mode' in criteriaOrContext
  ) {
    const ctx = criteriaOrContext as ScoringContext
    if (ctx.mode === 'document') {
      criteriaBlock = `[DOCUMENT D'ENTREPRISE IMPORTÉ]\n${ctx.documentText}`
      poidsBlock = `Pondérations : égales (1x) sur tous les critères (pas de pondérations personnalisées dans ce mode).`
    } else {
      criteria = ctx.criteria
      criteriaBlock = criteria
        ? buildCriteriaContext(criteria)
        : `Aucun profil entreprise configuré — utilise des critères standards de l'industrie photovoltaïque.`
      poidsBlock = criteria
        ? buildPoidsContext(criteria)
        : `Pondérations : égales (1x) sur tous les critères.`
    }
  } else {
    criteria = criteriaOrContext as CompanyCriteria | null
    criteriaBlock = criteria
      ? buildCriteriaContext(criteria)
      : `Aucun profil entreprise configuré — utilise des critères standards de l'industrie photovoltaïque.`
    poidsBlock = criteria
      ? buildPoidsContext(criteria)
      : `Pondérations : égales (1x) sur tous les critères.`
  }

  return `## PROFIL ENTREPRISE
${criteriaBlock}

## PONDÉRATIONS DES CRITÈRES
${poidsBlock}

## ANALYSE DU PROJET DCE
\`\`\`json
${JSON.stringify(analysis, null, 2)}
\`\`\`

## MISSION
Évalue ce projet DCE en tenant compte du profil entreprise ci-dessus.

CRITÈRES DE SCORING (chaque critère est noté sur 20 points) :

**1. RENTABILITÉ (0-20)**
Évalue le potentiel de marge en tenant compte de :
- Taille et valeur estimée du projet vs ${criteria?.rentabilite_min_pct ?? 8}% de marge minimum attendue
- Complexité contractuelle (clauses de pénalité, prix ferme, révision)
- Conditions de paiement

Échelle : 18-20 excellent | 12-17 correct | 6-11 incertain | 0-5 faible

**2. COMPLEXITÉ (0-20)** — score INVERSÉ (complexe = score bas)
Évalue la difficulté technique et organisationnelle :
- Interfaces multi-lots, coordination
- Exigences techniques spéciales (BIM, qualifications particulières)
- Risques planning (délai Enedis, conditions d'accès)

Échelle : 18-20 simple | 12-17 maîtrisable | 6-11 significative | 0-5 très complexe

**3. ALIGNEMENT CAPACITÉ (0-20)**
Compare le projet avec les capacités déclarées de l'entreprise :
- Zones géographiques : ${criteria?.zones_geo?.join(', ') || 'non précisées'}
- Types de projets maîtrisés : ${criteria?.types_projets?.join(', ') || 'non précisés'}
- Puissance cible vs capacité [${criteria?.puissance_min_kwc ?? 50}–${criteria?.puissance_max_kwc ?? 5000} kWc]
- Certifications disponibles : ${criteria?.certifications?.join(', ') || 'non précisées'}

Échelle : 18-20 cœur de métier | 12-17 bonne adéquation | 6-11 partielle | 0-5 hors capacité

**4. PROBABILITÉ DE GAIN (0-20)**
Estime les chances de remporter le marché selon :
- Positionnement sur les secteurs clients : ${criteria?.secteurs_clients?.join(', ') || 'tous secteurs'}
- Points forts de l'entreprise : ${criteria?.points_forts?.join(', ') || 'non précisés'}
- Critères de sélection du dossier (pondération prix vs technique)
- Nombre estimé de concurrents

Échelle : 18-20 très bien positionné | 12-17 raisonnable | 6-11 limité | 0-5 très peu probable

**5. CHARGE INTERNE (0-20)** — score INVERSÉ (charge lourde = score bas)
Évalue l'effort interne requis vs capacité [${criteria?.capacite_mensuelle_kwc ?? 1000} kWc/mois] :
- Durée et intensité du chantier
- Charge administrative (études, livrables, dossiers)
- Ressources humaines mobilisées

Échelle : 18-20 légère | 12-17 maîtrisable | 6-11 significative | 0-5 très lourde

## CALCUL DU SCORE TOTAL
Le score total est calculé avec les pondérations suivantes :
- rentabilite × ${criteria?.poids_rentabilite ?? 3}
- complexite × ${criteria?.poids_complexite ?? 3}
- alignement_capacite × ${criteria?.poids_alignement ?? 3}
- probabilite_gain × ${criteria?.poids_probabilite ?? 3}
- charge_interne × ${criteria?.poids_charge ?? 3}

Formule : (somme pondérée) / (somme des poids × 20) × 100

## VERDICT
- total_score >= 80 → "GO"
- total_score entre 50 et 79 → "A_ETUDIER"
- total_score < 50 → "NO_GO"

## FORMAT DE RÉPONSE (JSON uniquement)
{
  "score_details": {
    "rentabilite": { "score": <0-20>, "justification": "<2-3 phrases factuelles>" },
    "complexite": { "score": <0-20>, "justification": "<2-3 phrases factuelles>" },
    "alignement_capacite": { "score": <0-20>, "justification": "<2-3 phrases factuelles>" },
    "probabilite_gain": { "score": <0-20>, "justification": "<2-3 phrases factuelles>" },
    "charge_interne": { "score": <0-20>, "justification": "<2-3 phrases factuelles>" }
  },
  "total_score": <0-100>,
  "verdict": "<GO|A_ETUDIER|NO_GO>"
}

Retourne uniquement ce JSON, sans texte avant ou après.`
}

// ─── Response Plan prompt ─────────────────────────────────────────────────────

export const RESPONSE_PLAN_SYSTEM_PROMPT = `Tu es un expert en réponse aux appels d'offres dans le secteur des énergies renouvelables et du BTP.
Ta mission : générer un plan de mémoire technique détaillé, directement exploitable par une équipe commerciale.

RÈGLES :
1. Sois précis et factuel — base-toi uniquement sur l'analyse fournie
2. Chaque section doit avoir des arguments béton, adaptés au projet
3. Retourne UNIQUEMENT du JSON valide, sans texte autour
4. Les arguments doivent être rédigés comme des phrases d'accroche professionnelles`

export function buildResponsePlanUserPrompt(analysis: AnalysisResult, companyCriteria: CompanyCriteria | null): string {
  const companyCtx = companyCriteria ? `
PROFIL ENTREPRISE :
- Certifications : ${companyCriteria.certifications.join(', ') || 'non précisées'}
- Points forts : ${companyCriteria.points_forts.join(', ') || 'non précisés'}
- Zones d'intervention : ${companyCriteria.zones_geo.join(', ') || 'non précisées'}
- Types de projets : ${companyCriteria.types_projets.join(', ') || 'non précisés'}
- Capacité : ${companyCriteria.puissance_min_kwc}–${companyCriteria.puissance_max_kwc} kWc` : ''

  return `## ANALYSE DU DCE
\`\`\`json
${JSON.stringify(analysis, null, 2)}
\`\`\`
${companyCtx}

## MISSION
Génère un plan de mémoire technique complet pour répondre à ce DCE.

## FORMAT JSON ATTENDU
{
  "titre_propose": "Titre professionnel du mémoire technique",
  "accroche": "Phrase d'accroche percutante pour l'introduction (2-3 lignes)",
  "sections": [
    {
      "numero": "1",
      "titre": "Titre de la section",
      "objectif": "Objectif de cette section dans le dossier",
      "contenu_cle": ["Point à traiter 1", "Point à traiter 2", "Point à traiter 3"],
      "arguments": ["Argument différenciant 1", "Argument différenciant 2"],
      "longueur_suggeree": "X à Y pages",
      "pieces_liees": ["DC2", "Références chantiers similaires"]
    }
  ],
  "points_forts_a_valoriser": ["Point fort 1", "Point fort 2", "Point fort 3"],
  "risques_a_adresser": ["Risque identifié 1 à désamorcer dans le mémoire", "Risque 2"],
  "criteres_selection_cibles": ["Critère prix", "Critère technique", "Critère RSE"],
  "conclusion_suggeree": "Suggestion de conclusion percutante",
  "estimation_pages": "X à Y pages au total"
}

Les sections typiques pour un DCE ENR/PV : présentation entreprise & références, méthodologie et planning, solution technique proposée, gestion HSE, organisation et équipe projet, démarche RSE, annexes.
Adapte selon le contenu du DCE.

Retourne uniquement le JSON.`
}

function buildCriteriaContext(c: CompanyCriteria): string {
  const lines: string[] = []
  if (c.zones_geo.length > 0)
    lines.push(`- Zones géographiques d'intervention : ${c.zones_geo.join(', ')}`)
  if (c.types_projets.length > 0)
    lines.push(`- Types de projets maîtrisés : ${c.types_projets.join(', ')}`)
  lines.push(`- Capacité technique : ${c.puissance_min_kwc}–${c.puissance_max_kwc} kWc par projet, ${c.capacite_mensuelle_kwc} kWc/mois`)
  if (c.certifications.length > 0)
    lines.push(`- Certifications & qualifications : ${c.certifications.join(', ')}`)
  if (c.secteurs_clients.length > 0)
    lines.push(`- Secteurs clients ciblés : ${c.secteurs_clients.join(', ')}`)
  lines.push(`- Marge minimale attendue : ${c.rentabilite_min_pct}%`)
  if (c.points_forts.length > 0)
    lines.push(`- Points forts : ${c.points_forts.join(', ')}`)
  if (c.notes.trim())
    lines.push(`- Notes complémentaires : ${c.notes.trim()}`)
  return lines.join('\n')
}

function buildPoidsContext(c: CompanyCriteria): string {
  return [
    `- Rentabilité : ×${c.poids_rentabilite}`,
    `- Complexité : ×${c.poids_complexite}`,
    `- Alignement capacité : ×${c.poids_alignement}`,
    `- Probabilité de gain : ×${c.poids_probabilite}`,
    `- Charge interne : ×${c.poids_charge}`,
  ].join('\n')
}
