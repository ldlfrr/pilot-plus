-- Migration 007: Create company_settings (if missing) + add document import columns
-- Run this entire block in your Supabase SQL editor

-- 1. Create the table if it doesn't exist yet (covers fresh databases)
create table if not exists public.company_settings (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  criteria   jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- 2. Enable RLS (safe to run even if already enabled)
alter table public.company_settings enable row level security;

-- 3. RLS policy (drop + recreate to avoid conflicts)
drop policy if exists "Users can manage own company settings" on public.company_settings;
create policy "Users can manage own company settings"
  on public.company_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. updated_at trigger (only if set_updated_at function exists)
drop trigger if exists set_company_settings_updated_at on public.company_settings;
create trigger set_company_settings_updated_at
  before update on public.company_settings
  for each row execute procedure public.set_updated_at();

-- 5. Add document import columns
alter table public.company_settings
  add column if not exists settings_mode text not null default 'form'
    check (settings_mode in ('form', 'document')),
  add column if not exists company_document_text text,
  add column if not exists company_document_name text;
