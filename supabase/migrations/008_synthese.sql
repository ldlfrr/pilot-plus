-- Migration 008: Synthèse Corporate table
-- Run in Supabase SQL editor

create table if not exists public.project_syntheses (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,

  -- Section 1: Contexte Client
  client_maitre_ouvrage  text default '',
  nom_projet_synthese    text default '',
  typologie_client       text default '' check (typologie_client in ('','C1','C2','C3')),
  opportunite_crm        text default '',
  besoin_description     text default '',
  marche_description     text default '',
  marche_objet           text default '',
  besoin_client          text default '',
  materiel_installer     text default '',

  -- Section 2: Contexte Commercial
  type_ao                text default '',
  montant_projet         text default '',
  duree_contrat          text default '',
  type_accord            text[] default '{}',
  mode_comparaison       text[] default '{}',
  environnement_offre    text default '',
  nature_prix            text default '',
  duree_validite         text default '',
  validite_type          text[] default '{}',
  negociation_prevue     text default '',
  visite_technique       text default '',
  critere_1              text default '',
  critere_2              text default '',
  critere_3              text default '',
  concurrence_identifiee text default '',
  atouts                 text default '',
  faiblesses             text default '',
  strategie_reponse      text default '',
  type_reponse           text[] default '{}',
  supervision_sous_traitance text default '',

  -- Section 3: Planning
  planning_reception_dce      text default '',
  planning_comeco              text default '',
  planning_lancement_interne   text default '',
  planning_bouclage            text default '',
  planning_remise_offre        text default '',
  planning_projet              text default '',

  -- Section 4: Solution
  analyse_prestations  text default '',
  organisation_interne text default '',

  -- Section 5: Aspects Contractuels
  aspects_contractuels text default '',

  -- Section 6: Chiffrage
  hypotheses_chiffrage text default '',
  feuille_vente        text default '',
  aleas                text default '',

  -- Section 7: Risques
  risques_operationnels text default '',
  risques_financiers    text default '',
  opportunites          text default '',

  -- Section 8: Décisions
  responsable_etude  text default '',
  date_remise_etude  text default '',

  updated_at timestamptz not null default now(),

  unique (project_id)
);

alter table public.project_syntheses enable row level security;

create policy "Users manage own syntheses"
  on public.project_syntheses for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists set_project_syntheses_updated_at on public.project_syntheses;
create trigger set_project_syntheses_updated_at
  before update on public.project_syntheses
  for each row execute procedure public.set_updated_at();
