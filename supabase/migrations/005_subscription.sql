-- Add subscription tier to profiles
alter table public.profiles
  add column if not exists subscription_tier text not null default 'free'
    check (subscription_tier in ('free', 'basic', 'pro', 'enterprise', 'lifetime'));

alter table public.profiles
  add column if not exists subscription_started_at timestamptz default null;

alter table public.profiles
  add column if not exists subscription_expires_at timestamptz default null;

-- ─── Grant lifetime access to a user (run manually in Supabase SQL Editor) ───
-- update public.profiles
--   set subscription_tier = 'lifetime',
--       subscription_started_at = now()
--   where id = '<USER_UUID>';
