-- Migration 036: Per-user personal pipeline stage tracking
-- Each user can freely arrange their pipeline view independently
-- without affecting the shared project pipeline_stage.
-- The team pipeline continues to use task_states->pipeline_stage (shared).

CREATE TABLE IF NOT EXISTS public.user_pipeline_stages (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage      text NOT NULL DEFAULT 'prospection',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, project_id)
);

-- Users can only see and modify their own pipeline rows
ALTER TABLE public.user_pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_full_access_pipeline_stages"
  ON public.user_pipeline_stages FOR ALL TO authenticated
  USING    (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_pipeline_stages_user_id
  ON public.user_pipeline_stages (user_id);
