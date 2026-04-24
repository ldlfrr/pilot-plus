-- Migration 010: Company agencies for map tab
-- Run in Supabase SQL editor

alter table public.company_settings
  add column if not exists agencies jsonb not null default '[]';
