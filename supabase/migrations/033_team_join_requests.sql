-- ── Team join requests ────────────────────────────────────────────────────────
-- Allows users to request to join a team by its ID.
-- Team admins receive a notification and can accept or reject.

CREATE TABLE IF NOT EXISTS team_join_requests (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    uuid        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status     text        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'accepted', 'rejected')),
  message    text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

ALTER TABLE team_join_requests ENABLE ROW LEVEL SECURITY;

-- User can read their own requests
CREATE POLICY "jr_own_read" ON team_join_requests
  FOR SELECT USING (user_id = auth.uid());

-- Team admins can read all pending requests for their teams
CREATE POLICY "jr_admin_read" ON team_join_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_id = team_join_requests.team_id
        AND user_id = auth.uid()
        AND role    = 'admin'
    )
  );

-- Any authenticated user can create a request (one per team)
CREATE POLICY "jr_insert" ON team_join_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Team admins can update (accept / reject)
CREATE POLICY "jr_admin_update" ON team_join_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_id = team_join_requests.team_id
        AND user_id = auth.uid()
        AND role    = 'admin'
    )
  );

-- User can delete (cancel) their own pending request
CREATE POLICY "jr_own_delete" ON team_join_requests
  FOR DELETE USING (user_id = auth.uid() AND status = 'pending');
