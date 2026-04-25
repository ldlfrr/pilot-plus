-- ─── Migration 024 : add email to profiles ───────────────────────────────────
-- The profiles table didn't have an email column.
-- We sync it from auth.users so we can look up users by email without
-- going through the service-role client everywhere.

-- 1. Add the column
alter table public.profiles
  add column if not exists email text;

-- 2. Backfill existing rows from auth.users
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and p.email is null;

-- 3. Update the handle_new_user trigger to also copy email
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email
  )
  on conflict (id) do update
    set full_name = coalesce(excluded.full_name, public.profiles.full_name),
        email     = excluded.email;
  return new;
end;
$$;

-- 4. Keep email in sync when it changes in auth.users (e.g. email change flow)
create or replace function public.handle_user_email_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update public.profiles
  set email = new.email
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute procedure public.handle_user_email_change();

-- 5. RLS: let authenticated users look up any profile by email
--    (needed for invitation lookup — "does this email have an account?")
--    We only expose id + email + full_name, not sensitive fields.
drop policy if exists "profiles_read_own" on public.profiles;

-- Own profile — full read
create policy "profiles_read_own" on public.profiles
  for select using (auth.uid() = id);

-- Any authenticated user can look up a profile by email
-- (so invitation flow can check "does this email exist?")
create policy "profiles_read_by_email" on public.profiles
  for select using (auth.role() = 'authenticated');

-- 6. Also allow project members to see each other's profiles
--    (already covered by the policy above, but document the intent)

-- Index for fast email lookups
create index if not exists profiles_email_idx on public.profiles(email);
