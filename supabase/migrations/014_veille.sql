-- Veille automatique BOAMP/TED
create table if not exists public.veille_settings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null unique,
  enabled      boolean not null default false,
  keywords     text[]  not null default '{}',
  regions      text[]  not null default '{}',
  types_marche text[]  not null default '{}',
  montant_min  integer not null default 0,
  montant_max  integer not null default 5000000,
  last_run_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.veille_runs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  run_at       timestamptz not null default now(),
  source       text not null default 'boamp',
  total_found  integer not null default 0,
  imported     integer not null default 0,
  skipped      integer not null default 0,
  error        text
);

alter table public.veille_settings enable row level security;
alter table public.veille_runs     enable row level security;

create policy "veille_settings_owner" on public.veille_settings
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "veille_runs_owner" on public.veille_runs
  using (auth.uid() = user_id);
