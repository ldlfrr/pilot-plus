-- Project outcome tracking
alter table public.projects
  add column if not exists outcome text not null default 'pending'
    check (outcome in ('pending','won','lost','abandoned')),
  add column if not exists loss_reason text,
  add column if not exists ca_amount numeric(12,2),
  add column if not exists closed_at timestamptz;
