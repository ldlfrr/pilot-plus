-- ── Migration 019: criteria templates ────────────────────────────────────────
-- Stores named company profiles (templates) per user

alter table public.company_settings
  add column if not exists criteria_templates jsonb not null default '[]'::jsonb;
