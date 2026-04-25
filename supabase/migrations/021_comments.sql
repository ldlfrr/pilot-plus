-- ── Migration 021: project comments ──────────────────────────────────────────

create table if not exists public.project_comments (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  author_name text not null default '',
  content     text not null,
  resolved    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists project_comments_project_id_idx on public.project_comments(project_id);

alter table public.project_comments enable row level security;

-- Project owner + team members can read/write comments
create policy "Project owner can manage comments"
  on public.project_comments for all
  using (
    project_id in (
      select id from public.projects where user_id = auth.uid()
    )
  )
  with check (
    project_id in (
      select id from public.projects where user_id = auth.uid()
    )
  );

create policy "Comment author can update own comment"
  on public.project_comments for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create trigger set_comments_updated_at
  before update on public.project_comments
  for each row execute procedure public.set_updated_at();
