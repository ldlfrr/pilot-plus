-- ── Migration 011: account profile columns ────────────────────────────────────
alter table public.profiles
  add column if not exists theme text not null default 'dark'
    check (theme in ('dark', 'pilot', 'light'));

alter table public.profiles
  add column if not exists job_title text;

alter table public.profiles
  add column if not exists phone text;
