-- ── Migration 020: teams & collaboration ─────────────────────────────────────

-- Workspaces / équipes
create table if not exists public.teams (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  slug        text unique not null,
  created_at  timestamptz not null default now()
);

alter table public.teams enable row level security;

create policy "Team owner full access"
  on public.teams for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Team members
create table if not exists public.team_members (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete set null,
  email      text not null,
  role       text not null default 'member' check (role in ('admin', 'member', 'viewer')),
  status     text not null default 'pending' check (status in ('pending', 'active', 'revoked')),
  invite_token text unique default gen_random_uuid()::text,
  invited_at timestamptz not null default now(),
  joined_at  timestamptz
);

alter table public.team_members enable row level security;

create policy "Members can view their team"
  on public.team_members for select
  using (
    user_id = auth.uid() or
    team_id in (select id from public.teams where owner_id = auth.uid())
  );

create policy "Team owner manages members"
  on public.team_members for all
  using (team_id in (select id from public.teams where owner_id = auth.uid()))
  with check (team_id in (select id from public.teams where owner_id = auth.uid()));

-- Project shares within team (granular access)
create table if not exists public.project_team_shares (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  team_id    uuid not null references public.teams(id) on delete cascade,
  can_edit   boolean not null default false,
  shared_at  timestamptz not null default now(),
  unique(project_id, team_id)
);

alter table public.project_team_shares enable row level security;

create policy "Team owner manages shares"
  on public.project_team_shares for all
  using (team_id in (select id from public.teams where owner_id = auth.uid()))
  with check (team_id in (select id from public.teams where owner_id = auth.uid()));

create policy "Team members can view shares"
  on public.project_team_shares for select
  using (
    team_id in (
      select team_id from public.team_members
      where user_id = auth.uid() and status = 'active'
    )
  );
