-- ── Migration 037: personal API keys ──────────────────────────────────────────

create table if not exists public.api_keys (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  key_value   text not null unique,          -- stored as-is, displayed masked after creation
  key_prefix  text not null,                 -- first 16 chars shown in UI
  last_used_at timestamptz,
  created_at  timestamptz not null default now()
);

alter table public.api_keys enable row level security;

create policy "api_keys_own" on public.api_keys
  for all using (auth.uid() = user_id);
