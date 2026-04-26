-- Migration 034: Fix project_comments RLS so all project members can participate
-- Currently only the project owner can read/write comments (migration 021).
-- This extends access to project members (invited collaborators).

-- ── 1. Add SELECT policy for project members ────────────────────────────────
-- Allows any user who is in project_members to read all comments for that project.
-- The owner already has SELECT via "Project owner can manage comments" (all policy).
CREATE POLICY "project_members_can_view_comments"
  ON public.project_comments FOR SELECT TO authenticated
  USING (
    public.check_project_membership(project_id)
  );

-- ── 2. Add INSERT policy for project members ────────────────────────────────
-- Allows project members to post new comments.
-- They must set user_id = their own uid (enforced by WITH CHECK).
CREATE POLICY "project_members_can_insert_comments"
  ON public.project_comments FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.check_project_membership(project_id)
  );

-- ── 3. Add UPDATE policy for project members ────────────────────────────────
-- Allows any project member to mark ANY comment as resolved/unresolved.
-- This enables team collaboration (anyone can resolve a thread).
CREATE POLICY "project_members_can_update_comments"
  ON public.project_comments FOR UPDATE TO authenticated
  USING (public.check_project_membership(project_id))
  WITH CHECK (public.check_project_membership(project_id));

-- ── 4. Add DELETE policy for comment author (project member) ─────────────────
-- Authors can delete their own comments.
-- (Project owner already has DELETE via "Project owner can manage comments")
CREATE POLICY "comment_author_can_delete"
  ON public.project_comments FOR DELETE TO authenticated
  USING (user_id = auth.uid());
