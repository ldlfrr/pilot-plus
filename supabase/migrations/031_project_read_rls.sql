-- Migration 031: extend projects SELECT RLS
-- Allow project members and team members to read projects they have access to

-- Allow project members to read projects they belong to
CREATE POLICY "project_members_can_view"
  ON public.projects FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT project_id FROM public.project_members WHERE user_id = auth.uid()
    )
  );

-- Allow team members to read projects shared within their teams
CREATE POLICY "team_shared_projects_can_view"
  ON public.projects FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT tp.project_id FROM public.team_projects tp
      WHERE tp.team_id = ANY(ARRAY(SELECT get_my_team_ids()))
    )
  );
