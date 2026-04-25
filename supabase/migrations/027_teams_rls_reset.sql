-- Migration 027: Complete reset of team RLS policies
-- Fixes: team disappearing on reload, 0 members shown, members unable to see each other.
-- Root cause: circular RLS dependency between teams ↔ team_members.
-- Solution: SECURITY DEFINER functions that bypass RLS to break the cycle.

-- ── 1. Security Definer Functions ────────────────────────────────────────────

-- Returns all team_ids the current user belongs to.
-- SECURITY DEFINER: bypasses RLS so this can safely query team_members
-- without triggering the RLS check on team_members recursively.
CREATE OR REPLACE FUNCTION public.get_my_team_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
$$;

-- Returns true if current user is admin of the given team.
CREATE OR REPLACE FUNCTION public.is_team_admin(p_team_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id
      AND user_id = auth.uid()
      AND role = 'admin'
  )
$$;

-- ── 2. Drop ALL existing team policies (exhaustive list) ─────────────────────

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'teams' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.teams', pol.policyname);
  END LOOP;

  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'team_members' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.team_members', pol.policyname);
  END LOOP;
END $$;

-- ── 3. Ensure RLS is enabled ──────────────────────────────────────────────────

ALTER TABLE public.teams        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- ── 4. teams policies ─────────────────────────────────────────────────────────

-- Any authenticated user can create a team
CREATE POLICY "teams_insert"
  ON public.teams FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Members can read teams they belong to
CREATE POLICY "teams_select"
  ON public.teams FOR SELECT
  TO authenticated
  USING (id = ANY(ARRAY(SELECT get_my_team_ids())));

-- Only admins can rename/update the team
CREATE POLICY "teams_update"
  ON public.teams FOR UPDATE
  TO authenticated
  USING (is_team_admin(id));

-- Only admins can delete the team
CREATE POLICY "teams_delete"
  ON public.teams FOR DELETE
  TO authenticated
  USING (is_team_admin(id));

-- ── 5. team_members policies ──────────────────────────────────────────────────

-- Members can see all members of teams they belong to
CREATE POLICY "team_members_select"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (team_id = ANY(ARRAY(SELECT get_my_team_ids())));

-- Users can insert their own row (for invitation acceptance or team creation)
CREATE POLICY "team_members_self_insert"
  ON public.team_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can update any member's role in their team
CREATE POLICY "team_members_admin_update"
  ON public.team_members FOR UPDATE
  TO authenticated
  USING (is_team_admin(team_id));

-- Admins can remove any member; members can leave (delete own row)
CREATE POLICY "team_members_delete"
  ON public.team_members FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_team_admin(team_id)
  );

-- ── 6. Fix role values: convert 'owner' → 'admin' ───────────────────────────

UPDATE public.team_members SET role = 'admin' WHERE role = 'owner';

-- Update role constraint to remove 'owner'
ALTER TABLE public.team_members
  DROP CONSTRAINT IF EXISTS team_members_role_check;

ALTER TABLE public.team_members
  ADD CONSTRAINT team_members_role_check
  CHECK (role IN ('admin', 'member', 'viewer'));

-- ── 7. Ensure joined_at has a default ─────────────────────────────────────────

ALTER TABLE public.team_members
  ALTER COLUMN joined_at SET DEFAULT now();
