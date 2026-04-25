-- Migration 029: Allow team owner to SELECT their own team even before being added as member.
-- Root cause: INSERT ... .select() on teams fails RLS because get_my_team_ids() doesn't
-- include the new team_id until the team_members row is inserted.
-- Fix: extend teams_select to also pass for owner_id = auth.uid().

DROP POLICY IF EXISTS "teams_select" ON public.teams;

CREATE POLICY "teams_select"
  ON public.teams FOR SELECT
  TO authenticated
  USING (
    id = ANY(ARRAY(SELECT get_my_team_ids()))
    OR owner_id = auth.uid()
  );
