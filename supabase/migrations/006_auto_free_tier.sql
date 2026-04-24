-- ============================================================
-- Migration 006 — Auto free tier on signup
-- Run this in Supabase SQL Editor AFTER migration 005
-- ============================================================

-- 1. Update the trigger function to explicitly set subscription_tier = 'free'
--    (the column default already handles it, but being explicit is safer)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, subscription_tier)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    'free'
  );
  return new;
end;
$$;

-- 2. Backfill existing profiles that may not have the column yet
--    (safe to run multiple times — only updates null values)
update public.profiles
  set subscription_tier = 'free'
  where subscription_tier is null
     or subscription_tier not in ('free', 'basic', 'pro', 'enterprise', 'lifetime');
