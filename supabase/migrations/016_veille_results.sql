-- Separate staging table for BOAMP results before the user decides to import them
create table public.veille_results (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete cascade not null,
  run_id            uuid references public.veille_runs(id) on delete cascade,
  idweb             text,                        -- BOAMP reference id
  name              text not null,
  client            text not null default 'Acheteur inconnu',
  location          text not null default 'Non précisé',
  consultation_type text not null default 'Travaux',
  offer_deadline    date,
  dateparution      date,
  status            text not null default 'pending'
                      check (status in ('pending', 'imported', 'dismissed')),
  project_id        uuid references public.projects(id) on delete set null,
  created_at        timestamptz default now()
);

create index on public.veille_results(user_id, status);
create index on public.veille_results(run_id);
create index on public.veille_results(user_id, idweb);

alter table public.veille_results enable row level security;

create policy "Users manage their own veille results"
  on public.veille_results for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
