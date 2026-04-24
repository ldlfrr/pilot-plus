import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/veille/results/[id]  body: { action: 'import' | 'dismiss' }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action } = await req.json() as { action: 'import' | 'dismiss' }

  // Verify ownership
  const { data: result } = await supabase
    .from('veille_results')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (action === 'dismiss') {
    await supabase.from('veille_results')
      .update({ status: 'dismissed' })
      .eq('id', id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'import') {
    if (result.status === 'imported') {
      // Already imported — return existing project link
      return NextResponse.json({ ok: true, project_id: result.project_id })
    }

    const sourceUrl = result.source_url
      ?? (result.idweb ? `https://www.boamp.fr/avis/detail/${result.idweb}` : null)

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: result.idweb ? `[${result.idweb}] ${result.name}` : result.name,
        client: result.client,
        consultation_type: result.consultation_type,
        location: result.location,
        offer_deadline: result.offer_deadline,
        status: 'draft',
        outcome: 'pending',
        source_url: sourceUrl,
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabase.from('veille_results')
      .update({ status: 'imported', project_id: project.id })
      .eq('id', id)

    return NextResponse.json({ ok: true, project_id: project.id })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

// DELETE /api/veille/results/[id]  — hard delete (permanent dismissal)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase.from('veille_results')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
