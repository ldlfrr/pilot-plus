-- ─── Invitations table ───────────────────────────────────────────────────────
-- Handles both team invitations and project invitations in one table.
-- A token is sent by email; the recipient clicks the link to accept or decline.

create table if not exists public.invitations (
  id             uuid        primary key default gen_random_uuid(),
  type           text        not null check (type in ('team', 'project')),
  team_id        uuid        references public.teams(id)    on delete cascade,
  project_id     uuid        references public.projects(id) on delete cascade,
  project_name   text,                     -- snapshot at invite time
  team_name      text,                     -- snapshot at invite time
  inviter_name   text,                     -- snapshot at invite time
  invited_email  text        not null,
  invited_by     uuid        references auth.users(id) on delete set null,
  role           text        not null default 'editor',
  token          text        unique not null default encode(gen_random_bytes(32), 'hex'),
  status         text        not null default 'pending'
                             check (status in ('pending', 'accepted', 'declined', 'expired')),
  expires_at     timestamptz not null default (now() + interval '7 days'),
  created_at     timestamptz not null default now()
);

-- Indexes
create index if not exists invitations_email_idx  on public.invitations(invited_email);
create index if not exists invitations_token_idx  on public.invitations(token);
create index if not exists invitations_status_idx on public.invitations(status);

-- RLS
alter table public.invitations enable row level security;

-- Anyone can read by token (accept page doesn't require login)
create policy "invitations_read_token" on public.invitations
  for select using (true);

-- Authenticated users can read invitations for their own email
create policy "invitations_read_own" on public.invitations
  for select using (
    invited_email = (select email from public.profiles where id = auth.uid())
    or invited_by = auth.uid()
  );

-- Only the inviter can create
create policy "invitations_insert" on public.invitations
  for insert with check (invited_by = auth.uid());

-- Invitee or inviter can update status
create policy "invitations_update" on public.invitations
  for update using (
    invited_email = (select email from public.profiles where id = auth.uid())
    or invited_by = auth.uid()
  );

-- Allow inviter to delete (cancel invitation)
create policy "invitations_delete" on public.invitations
  for delete using (invited_by = auth.uid());
