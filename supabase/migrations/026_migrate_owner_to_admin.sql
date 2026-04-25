-- Migration 026: Migrate team members with role='owner' to role='admin'
-- The 'owner' concept is replaced by 'admin' in the UI.
-- teams.owner_id is still used internally to identify the original creator.

-- Convert existing 'owner' role team_members to 'admin'
update public.team_members
set role = 'admin'
where role = 'owner';

-- Drop and recreate the role check constraint to remove 'owner'
alter table public.team_members
  drop constraint if exists team_members_role_check;

alter table public.team_members
  add constraint team_members_role_check
  check (role in ('admin', 'member', 'viewer'));
