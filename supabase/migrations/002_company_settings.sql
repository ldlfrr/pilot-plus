-- ============================================================
-- PILOT+ — Migration 002 : Company settings & criteria
-- ============================================================

create table if not exists public.company_settings (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  criteria   jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.company_settings enable row level security;

create policy "Users can manage own company settings"
  on public.company_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger set_company_settings_updated_at
  before update on public.company_settings
  for each row execute procedure public.set_updated_at();
