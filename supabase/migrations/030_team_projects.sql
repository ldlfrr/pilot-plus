-- Migration 030: team_projects — shared projects within a team
-- A project owner can share their project with a team so all members
-- can see it, follow its pipeline progress, and request/join access.

CREATE TABLE IF NOT EXISTS public.team_projects (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid        NOT NULL REFERENCES public.teams(id)    ON DELETE CASCADE,
  project_id  uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  shared_by   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, project_id)
);

ALTER TABLE public.team_projects ENABLE ROW LEVEL SECURITY;

-- Any member of the team can see its shared projects
CREATE POLICY "team_projects_select"
  ON public.team_projects FOR SELECT TO authenticated
  USING (team_id = ANY(ARRAY(SELECT get_my_team_ids())));

-- Only the project owner can share their project with a team they belong to
CREATE POLICY "team_projects_insert"
  ON public.team_projects FOR INSERT TO authenticated
  WITH CHECK (
    shared_by = auth.uid()
    AND project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
    AND team_id = ANY(ARRAY(SELECT get_my_team_ids()))
  );

-- The sharer or a team admin can unshare
CREATE POLICY "team_projects_delete"
  ON public.team_projects FOR DELETE TO authenticated
  USING (
    shared_by = auth.uid()
    OR is_team_admin(team_id)
  );

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS team_projects_team_id_idx    ON public.team_projects (team_id);
CREATE INDEX IF NOT EXISTS team_projects_project_id_idx ON public.team_projects (project_id);
