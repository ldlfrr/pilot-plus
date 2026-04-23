-- ============================================================
-- PILOT+ — Initial Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ─── profiles ────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  company     text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── projects ─────────────────────────────────────────────────
create table if not exists public.projects (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  name              text not null,
  client            text not null,
  consultation_type text not null,
  location          text not null,
  offer_deadline    date,
  status            text not null default 'draft'
                    check (status in ('draft', 'analyzed', 'scored')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists projects_status_idx on public.projects(status);

alter table public.projects enable row level security;

create policy "Users can CRUD own projects"
  on public.projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── project_files ────────────────────────────────────────────
create table if not exists public.project_files (
  id                 uuid primary key default uuid_generate_v4(),
  project_id         uuid not null references public.projects(id) on delete cascade,
  filename           text not null,
  storage_path       text not null,
  file_type          text not null,
  file_size          integer not null default 0,
  extracted_text     text,
  extraction_status  text not null default 'pending'
                     check (extraction_status in ('pending', 'done', 'error')),
  created_at         timestamptz not null default now()
);

create index if not exists project_files_project_id_idx on public.project_files(project_id);

alter table public.project_files enable row level security;

create policy "Users can manage files of own projects"
  on public.project_files for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_files.project_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_files.project_id
        and p.user_id = auth.uid()
    )
  );

-- ─── project_analyses ─────────────────────────────────────────
create table if not exists public.project_analyses (
  id             uuid primary key default uuid_generate_v4(),
  project_id     uuid not null references public.projects(id) on delete cascade,
  version        integer not null default 1,
  result         jsonb not null,
  prompt_version text not null default 'v1',
  model_used     text not null default 'gpt-4o',
  tokens_used    integer,
  created_at     timestamptz not null default now()
);

create index if not exists project_analyses_project_id_idx on public.project_analyses(project_id);

alter table public.project_analyses enable row level security;

create policy "Users can manage analyses of own projects"
  on public.project_analyses for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_analyses.project_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_analyses.project_id
        and p.user_id = auth.uid()
    )
  );

-- ─── project_scores ───────────────────────────────────────────
create table if not exists public.project_scores (
  id            uuid primary key default uuid_generate_v4(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  analysis_id   uuid not null references public.project_analyses(id) on delete cascade,
  score_details jsonb not null,
  total_score   integer not null check (total_score between 0 and 100),
  verdict       text not null check (verdict in ('GO', 'A_ETUDIER', 'NO_GO')),
  created_at    timestamptz not null default now()
);

create index if not exists project_scores_project_id_idx on public.project_scores(project_id);

alter table public.project_scores enable row level security;

create policy "Users can manage scores of own projects"
  on public.project_scores for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_scores.project_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_scores.project_id
        and p.user_id = auth.uid()
    )
  );

-- ─── updated_at trigger ───────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_projects_updated_at
  before update on public.projects
  for each row execute procedure public.set_updated_at();

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ─── Storage bucket ───────────────────────────────────────────
-- Run this separately in Storage settings or via SQL:
insert into storage.buckets (id, name, public)
values ('dce-files', 'dce-files', false)
on conflict do nothing;

create policy "Authenticated users can upload"
  on storage.objects for insert
  with check (auth.role() = 'authenticated' and bucket_id = 'dce-files');

create policy "Users can read own files"
  on storage.objects for select
  using (auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own files"
  on storage.objects for delete
  using (auth.uid()::text = (storage.foldername(name))[1]);
