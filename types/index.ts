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

// ─── Task states (pièces à fournir + actions) ────────────────────────────────

export interface TaskStates {
  pieces: Record<string, boolean>   // clé = nom pièce, valeur = true si prête
  actions: Record<string, boolean>  // clé = action, valeur = true si faite
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
  zones_geo: string[]
  types_projets: string[]
  puissance_min_kwc: number
  puissance_max_kwc: number
  capacite_mensuelle_kwc: number
  certifications: string[]
  secteurs_clients: string[]
  rentabilite_min_pct: number
  poids_rentabilite: number
  poids_complexite: number
  poids_alignement: number
  poids_probabilite: number
  poids_charge: number
  points_forts: string[]
  notes: string
}

export const DEFAULT_CRITERIA: CompanyCriteria = {
  zones_geo: [],
  types_projets: [],
  puissance_min_kwc: 50,
  puissance_max_kwc: 5000,
  capacite_mensuelle_kwc: 1000,
  certifications: [],
  secteurs_clients: [],
  rentabilite_min_pct: 8,
  poids_rentabilite: 3,
  poids_complexite: 3,
  poids_alignement: 3,
  poids_probabilite: 3,
  poids_charge: 3,
  points_forts: [],
  notes: '',
}

// ─── Project with score (for rich lists) ─────────────────────────────────────

export interface ProjectWithScore extends Project {
  score?: ProjectScore | null
  file_count?: number
}
