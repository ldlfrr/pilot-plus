/**
 * Shared helper — check if the authenticated user can access a project.
 * Allows either the project owner (user_id) or a project_member.
 * Returns the access level or null if no access.
 */

type SupabaseClient = Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>

export type ProjectAccessRole = 'owner' | 'editor' | 'viewer' | 'avant_vente'

export interface ProjectAccess {
  role:    ProjectAccessRole
  canEdit: boolean  // true for owner, editor, avant_vente
}

export async function getProjectAccess(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
): Promise<ProjectAccess | null> {
  // 1. Owner check (fastest path)
  const { data: owned } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single()

  if (owned) return { role: 'owner', canEdit: true }

  // 2. Project member check
  try {
    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single()

    if (membership) {
      const role = membership.role as ProjectAccessRole
      return {
        role,
        canEdit: role !== 'viewer',
      }
    }
  } catch { /* project_members table may not exist yet */ }

  return null
}
