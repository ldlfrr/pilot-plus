-- Migration 028: Fix team_members.user_id FK to point to profiles(id)
-- Root cause: the existing FK targets auth.users(id) which is outside the public schema,
-- so PostgREST cannot resolve the profiles(...) resource embedding.
-- Also fixes ON DELETE behaviour: SET NULL → CASCADE (deleting a user removes memberships).

ALTER TABLE public.team_members
  DROP CONSTRAINT IF EXISTS team_members_user_id_fkey;

ALTER TABLE public.team_members
  ADD CONSTRAINT team_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id)
  ON DELETE CASCADE;
