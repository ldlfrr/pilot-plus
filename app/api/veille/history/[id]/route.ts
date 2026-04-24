import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DELETE /api/veille/history/[id]
// Deletes a veille run and all its results
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Delete results first (FK constraint), then the run
    await supabase
      .from('veille_results')
      .delete()
      .eq('run_id', id)
      .eq('user_id', user.id)

    const { error } = await supabase
      .from('veille_runs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur serveur' },
      { status: 500 },
    )
  }
}
