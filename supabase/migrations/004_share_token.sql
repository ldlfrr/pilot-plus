-- Add shareable token column to projects
alter table public.projects
  add column if not exists share_token uuid unique default null;

-- Index for fast lookup by token
create index if not exists projects_share_token_idx
  on public.projects (share_token)
  where share_token is not null;
