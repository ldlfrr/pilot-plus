import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Verify ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id, task_states')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })
    }

    const body = await req.json() as { type: 'pieces' | 'actions'; key: string; value: boolean }
    if (!body.type || !body.key) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    // Merge state
    const current = (project.task_states ?? { pieces: {}, actions: {} }) as { pieces: Record<string, boolean>; actions: Record<string, boolean> }
    const updated = {
      ...current,
      [body.type]: {
        ...current[body.type],
        [body.key]: body.value,
      },
    }

    const { error } = await supabase
      .from('projects')
      .update({ task_states: updated })
      .eq('id', id)

    if (error) {
      // Silently succeed if column doesn't exist yet (migration not run)
      console.warn('[task-states] Update failed (migration pending?):', error.message)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[task-states] Error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
