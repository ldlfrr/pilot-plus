-- Store BOAMP URL + description on veille results
alter table public.veille_results
  add column if not exists source_url    text,
  add column if not exists description   text,
  add column if not exists montant_estime text,
  add column if not exists procedure_type text;

-- Persist the source URL on projects so it stays visible after import
alter table public.projects
  add column if not exists source_url text;
