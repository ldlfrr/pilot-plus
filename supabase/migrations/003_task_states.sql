-- ============================================================
-- PILOT+ — Migration 003 : Task states on projects
-- ============================================================

alter table public.projects
  add column if not exists task_states jsonb not null default '{"pieces": {}, "actions": {}}';
