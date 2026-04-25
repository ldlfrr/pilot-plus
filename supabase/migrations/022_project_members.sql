-- ── Migration 022: project members (per-project collaboration) ────────────────
--
-- Allows adding specific users to a project so they can view and edit it,
-- regardless of team membership. The project owner (user_id on projects)
-- always has full access; this table grants access to additional users.

create table if not exists public.project_members (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid not null references auth.users(id)  on delete cascade,
  role        text not null default 'member'
              check (role in ('editor', 'viewer', 'avant_vente')),
  invited_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique(project_id, user_id)
);

alter table public.project_members enable row level security;

-- The project owner and the member themselves can see memberships
create policy "View project memberships"
  on public.project_members for select
  using (
    user_id = auth.uid()
    or project_id in (select id from public.projects where user_id = auth.uid())
  );

-- Only the project owner can insert/update/delete memberships
create policy "Owner manages project members"
  on public.project_members for all
  using  (project_id in (select id from public.projects where user_id = auth.uid()))
  with check (project_id in (select id from public.projects where user_id = auth.uid()));

-- ── Allow project members to read projects ────────────────────────────────────
-- NOTE: If your projects table already has an RLS SELECT policy called
-- "Users can view own projects", you may need to drop it first with:
--   DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
-- Then recreate it with the broader check below.

-- The API routes already handle auth manually via server-side Supabase client,
-- so this migration is for direct Supabase client queries.
-- The API routes in /api/projects/ are updated separately to check project_members.

-- Index for fast lookups
create index if not exists project_members_user_id_idx    on public.project_members(user_id);
create index if not exists project_members_project_id_idx on public.project_members(project_id);
