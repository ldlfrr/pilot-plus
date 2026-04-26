// ─── Domain types ────────────────────────────────────────────────────────────

export type ProjectStatus  = 'draft' | 'analyzed' | 'scored'
export type ProjectOutcome = 'pending' | 'won' | 'lost' | 'abandoned'
export type ExtractionStatus = 'pending' | 'done' | 'error'
export type GoNoGoVerdict = 'GO' | 'A_ETUDIER' | 'NO_GO'

// ─── Database row types ───────────────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise' | 'lifetime'

export interface Profile {
  id: string
  full_name: string | null
  company: string | null
  avatar_url: string | null
  subscription_tier: SubscriptionTier
  subscription_started_at: string | null
  subscription_expires_at: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  client: string
  consultation_type: string
  location: string
  offer_deadline: string | null
  status: ProjectStatus
  outcome: ProjectOutcome
  loss_reason: string | null
  ca_amount: number | null
  closed_at: string | null
  task_states: TaskStates | null
  share_token?: string | null
  created_at: string
  updated_at: string
}

export interface ProjectFile {
  id: string
  project_id: string
  filename: string
  storage_path: string
  file_type: string
  file_size: number
  extracted_text: string | null
  extraction_status: ExtractionStatus
  created_at: string
}

// ─── Rich AnalysisResult (renvoyé par Claude) ─────────────────────────────────

export interface BesoinClientDetail {
  objectifs: string[]
  besoins_metier: string[]
  contraintes: string[]
  priorites: string[]
  attentes_implicites: string[]
  points_a_appuyer: string[]
}

export interface PieceAFournir {
  nom: string
  type: 'obligatoire' | 'recommande'
}

export interface Specificites {
  exigences_techniques: string[]
  contraintes_site: string[]
  normes_applicables: string[]
  materiaux: string[]
}

export interface AnalysisResult {
  // ─ Champs historiques ─
  nom_projet: string
  contexte: string
  besoin_client: string
  fourniture_demandee: string
  surface_pv: string
  repartition: string
  perimetre: string
  points_cles: string[]
  points_rse: string[]
  date_offre: string
  date_travaux: string
  risques: string[]
  details_importants: string[]

  // ─ Nouveaux champs synthèse ─
  type_projet?: string
  objet?: string
  puissance?: string
  sites?: string
  complexite?: string
  ref_ao?: string
  resume_executif?: string
  points_vigilance?: string[]

  // ─ Besoin client structuré ─
  besoin_client_detail?: BesoinClientDetail

  // ─ Pièces à fournir ─
  pieces_a_fournir?: PieceAFournir[]

  // ─ Spécificités techniques ─
  specificites?: Specificites

  // ─ Actions suggérées ─
  actions_suggerees?: string[]
}

export interface ProjectAnalysis {
  id: string
  project_id: string
  version: number
  result: AnalysisResult
  prompt_version: string
  model_used: string
  tokens_used: number | null
  created_at: string
}

export interface ScoreDetails {
  rentabilite: { score: number; justification: string }
  complexite: { score: number; justification: string }
  alignement_capacite: { score: number; justification: string }
  probabilite_gain: { score: number; justification: string }
  charge_interne: { score: number; justification: string }
}

export interface ProjectScore {
  id: string
  project_id: string
  analysis_id: string
  score_details: ScoreDetails
  total_score: number
  verdict: GoNoGoVerdict
  created_at: string
}

// ─── Commercial pipeline (7 stages A→Z) ─────────────────────────────────────

export type PipelineStage =
  | 'prospection'       // Étape 1 — Prospection & détection
  | 'qualification'     // Étape 2 — Qualification / Scoring Go/No Go
  | 'vente_interne'     // Étape 3 — Vente interne / approbation direction
  | 'avant_vente'       // Étape 4 — Mobilisation avant-vente / technique
  | 'echanges_client'   // Étape 5 — Échanges client
  | 'juridique'         // Étape 6 — Analyse juridique
  | 'signature'         // Étape 7 — Signature finale (Docusign)
  | 'cloture'           // Pipeline terminé

export type IntervenantRole =
  | 'commercial'
  | 'directeur_agence'
  | 'charge_affaires'
  | 'avant_vente'

export interface Intervenant {
  role:   IntervenantRole
  name:   string
  email?: string
  phone?: string
}

export type ChiffrageStatus = 'a_chiffrer' | 'en_cours' | 'chiffre' | 'valide'

export interface ChiffrageData {
  status:      ChiffrageStatus
  montant?:    number
  deadline?:   string   // ISO date
  notes?:      string
  updated_at?: string
}

export interface ChecklistRemise {
  memoire_technique:    boolean
  chiffrage_valide:     boolean
  dc1_dc2_dc4:          boolean
  references_chantiers: boolean
  attestations:         boolean
  relecture_commerciale: boolean
  remise_effectuee:     boolean
}

// ─── Stage-specific data structures ──────────────────────────────────────────

export type ProspectionSource = 'boamp' | 'marches_publics' | 'reseau' | 'inbound' | 'autre'

export interface ProspectionData {
  source?:            ProspectionSource
  contact_nom?:       string
  contact_poste?:     string
  contact_email?:     string
  contact_phone?:     string
  budget_estime?:     number
  notes?:             string
  detected_at?:       string   // ISO date
}

export type VenteInterneStatus = 'en_attente' | 'en_cours' | 'approuve' | 'refuse'

export interface VenteInterneData {
  status?:           VenteInterneStatus
  date_reunion?:     string   // ISO date
  participants?:     string[]
  notes_direction?:  string
  decision_at?:      string   // ISO datetime
  decideur?:         string
}

export type AvantVenteStatus = 'transmis' | 'en_chiffrage' | 'prep_memoire' | 'termine'

export interface AvantVenteData {
  status?:     AvantVenteStatus
  notes?:      string
  updated_at?: string
}

export type EchangeType = 'email' | 'reunion' | 'appel' | 'visio' | 'autre'

export interface EchangeClient {
  id:         string
  date:       string
  type:       EchangeType
  sujet:      string
  participants?: string
  notes?:     string
  next_step?: string
}

export interface ClientNote {
  id:          string
  date:        string   // ISO datetime
  author_name: string
  content:     string
}

export interface EchangesClientData {
  echanges: EchangeClient[]
  notes?:   ClientNote[]
}

export type JuridiqueStatus = 'envoye_juridique' | 'en_cours' | 'modif_attente' | 'valide'

export type JuridiqueRisque = 'faible' | 'moyen' | 'eleve'

export interface JuridiqueData {
  status?:              JuridiqueStatus
  risque_global?:       JuridiqueRisque
  clauses_penalites?:   boolean
  conditions_paiement?: string
  sous_traitance?:      boolean
  assurances?:          boolean
  duree_contrat?:       string
  notes_juridiques?:    string
  revu_par?:            string
  revue_at?:            string   // ISO date
}

export type SignatureStatus = 'en_attente' | 'envoye' | 'signe' | 'refuse'

export interface SignatureData {
  status?:           SignatureStatus
  docusign_url?:     string
  envoye_at?:        string
  signe_at?:         string
  signataires?:      string[]
  montant_final?:    number
  notes?:            string
}

// ─── Task states (pièces à fournir + actions + pipeline) ─────────────────────

export interface TaskStates {
  pieces:  Record<string, boolean>  // clé = nom pièce, valeur = true si prête
  actions: Record<string, boolean>  // clé = action, valeur = true si faite
  // ── Pipeline commercial ──────────────────────────────────────────────────
  pipeline_stage?:                 PipelineStage
  intervenants?:                   Intervenant[]
  chiffrage?:                      ChiffrageData
  checklist?:                      ChecklistRemise
  memoire_technique?:              string   // texte IA généré
  brief_avant_vente_generated_at?: string   // ISO datetime
  // ── Stage-specific data ───────────────────────────────────────────────────
  prospection?:                    ProspectionData
  vente_interne?:                  VenteInterneData
  avant_vente_data?:               AvantVenteData
  echanges_client?:                EchangesClientData
  juridique?:                      JuridiqueData
  signature_data?:                 SignatureData
}

// ─── API payload types ────────────────────────────────────────────────────────

export interface CreateProjectPayload {
  name: string
  client: string
  consultation_type: string
  location: string
  offer_deadline?: string
}

export interface UpdateProjectPayload extends Partial<CreateProjectPayload> {
  status?: ProjectStatus
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_projects: number
  analyzed_projects: number
  go_count: number
  no_go_count: number
  a_etudier_count: number
  transformation_rate: number
  en_cours_count: number
}

export interface ActivityDataPoint {
  date: string
  projects: number
  analyses: number
}

export interface MonthlyDataPoint {
  month: string
  count: number
}

export interface TopClient {
  client: string
  count: number
}

// ─── AI scoring payload ───────────────────────────────────────────────────────

export interface ScoringResult {
  score_details: ScoreDetails
  total_score: number
  verdict: GoNoGoVerdict
}

// ─── Company criteria ─────────────────────────────────────────────────────────

export interface CompanyCriteria {
  // ── Profil entreprise ──────────────────────────────────────────────────────
  raison_sociale?: string
  siren?: string
  site_web?: string
  description_courte?: string
  effectifs?: string
  ca_annuel?: string
  secteur_principal?: string
  annee_creation?: string

  // ── Périmètre & marchés ───────────────────────────────────────────────────
  zones_geo: string[]
  types_projets: string[]
  secteurs_clients: string[]
  marche_type?: 'public' | 'prive' | 'mixte'

  // ── Capacités techniques ──────────────────────────────────────────────────
  puissance_min_kwc: number
  puissance_max_kwc: number
  capacite_mensuelle_kwc: number
  budget_min_eur?: number
  budget_max_eur?: number
  nb_projets_simultanees?: number
  delai_execution?: string

  // ── Scoring Go/No Go ──────────────────────────────────────────────────────
  certifications: string[]
  rentabilite_min_pct: number
  poids_rentabilite: number
  poids_complexite: number
  poids_alignement: number
  poids_probabilite: number
  poids_charge: number
  points_forts: string[]
  notes: string
  mots_cles_exclusion?: string[]
}

export const DEFAULT_CRITERIA: CompanyCriteria = {
  raison_sociale: '',
  siren: '',
  site_web: '',
  description_courte: '',
  effectifs: '',
  ca_annuel: '',
  secteur_principal: '',
  annee_creation: '',
  zones_geo: [],
  types_projets: [],
  secteurs_clients: [],
  marche_type: 'mixte',
  puissance_min_kwc: 50,
  puissance_max_kwc: 5000,
  capacite_mensuelle_kwc: 1000,
  budget_min_eur: 0,
  budget_max_eur: 0,
  nb_projets_simultanees: 3,
  delai_execution: '',
  certifications: [],
  rentabilite_min_pct: 8,
  poids_rentabilite: 3,
  poids_complexite: 3,
  poids_alignement: 3,
  poids_probabilite: 3,
  poids_charge: 3,
  points_forts: [],
  notes: '',
  mots_cles_exclusion: [],
}

// ─── Project with score (for rich lists) ─────────────────────────────────────

export interface ProjectWithScore extends Project {
  score?:        ProjectScore | null
  file_count?:   number
  member_count?: number   // number of project_members (excludes owner)
}
