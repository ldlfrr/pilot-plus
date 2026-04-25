-- Migration 032: Fix infinite recursion in projects RLS policies
-- The SELECT policies added in 031 caused recursion during INSERT
-- because Postgres evaluates all SELECT policies even for DML operations.
-- Fix: wrap the checks in SECURITY DEFINER functions that bypass RLS.

-- ── 1. Drop the problematic policies ────────────────────────────────────────
DROP POLICY IF EXISTS "project_members_can_view"      ON public.projects;
DROP POLICY IF EXISTS "team_shared_projects_can_view" ON public.projects;

-- ── 2. Create SECURITY DEFINER helper functions ──────────────────────────────
-- These functions run with the role of their owner (postgres/service_role),
-- bypassing RLS on the tables they query, and breaking the recursion cycle.

CREATE OR REPLACE FUNCTION public.check_project_membership(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = p_project_id
      AND project_members.user_id    = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.check_project_team_access(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_projects tp
    WHERE tp.project_id = p_project_id
      AND tp.team_id = ANY(ARRAY(SELECT get_my_team_ids()))
  )
$$;

-- ── 3. Recreate policies using the safe functions ────────────────────────────

CREATE POLICY "project_members_can_view"
  ON public.projects FOR SELECT TO authenticated
  USING (public.check_project_membership(id));

CREATE POLICY "team_shared_projects_can_view"
  ON public.projects FOR SELECT TO authenticated
  USING (public.check_project_team_access(id));
