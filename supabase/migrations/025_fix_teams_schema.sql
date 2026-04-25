-- ─── Migration 025 : fix team schema for new invitation system ───────────────
--
-- Migration 020 created teams/team_members with constraints that are
-- incompatible with the new invitation-based API:
--   • teams.slug       — NOT NULL with no default  → inserts without slug fail
--   • team_members.email — NOT NULL                → inserts without email fail
--   • team_members.role  — only admin/member/viewer → 'owner' inserts fail
--   • team_members.joined_at — nullable, no default → ordering issues
--
-- Also adds self-insert RLS policies so invited users can accept invitations.

-- 1. teams.slug — make nullable (slugs are unused in the current UI)
alter table public.teams
  alter column slug drop not null;

-- 2. team_members.email — make nullable (email comes from profiles via FK join)
alter table public.team_members
  alter column email drop not null;

-- 3. team_members.role — add 'owner' to the allowed values
alter table public.team_members
  drop constraint if exists team_members_role_check;
alter table public.team_members
  add constraint team_members_role_check
  check (role in ('owner', 'admin', 'member', 'viewer'));

-- 4. team_members.joined_at — set a default so new rows get a timestamp
alter table public.team_members
  alter column joined_at set default now();

-- 5. Allow any authenticated user to insert themselves into team_members
--    (needed when accepting a team invitation — the invitee is not the owner)
drop policy if exists "Users can accept team invitation" on public.team_members;
create policy "Users can accept team invitation"
  on public.team_members for insert
  with check (user_id = auth.uid());

-- 6. Allow any authenticated user to insert themselves into project_members
--    (needed when accepting a project invitation)
drop policy if exists "Users can accept project invitation" on public.project_members;
create policy "Users can accept project invitation"
  on public.project_members for insert
  with check (user_id = auth.uid());

-- 7. Allow team members (not just owner) to read team details
drop policy if exists "Team members can read their teams" on public.teams;
create policy "Team members can read their teams"
  on public.teams for select
  using (
    auth.uid() = owner_id
    or id in (
      select team_id from public.team_members where user_id = auth.uid()
    )
  );
