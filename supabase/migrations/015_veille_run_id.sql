-- Link imported projects back to the veille run that created them
alter table public.projects
  add column if not exists veille_run_id uuid references public.veille_runs(id) on delete set null;

-- Index for fast lookup of "projects by run"
create index if not exists projects_veille_run_id_idx on public.projects(veille_run_id);
