-- Migration 009: Add synthese template columns to company_settings
-- Run in Supabase SQL editor

alter table public.company_settings
  add column if not exists synthese_template_path text,
  add column if not exists synthese_template_name text;
