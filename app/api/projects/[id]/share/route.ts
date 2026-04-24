import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: project, error } = await supabase
    .from('projects')
    .select('id, share_token')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !project) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })

  let token = project.share_token
  if (!token) {
    token = crypto.randomUUID()
    const { error: updateError } = await supabase
      .from('projects')
      .update({ share_token: token })
      .eq('id', id)
      .eq('user_id', user.id)

    if (updateError) {
      if (updateError.message.includes('share_token')) {
        return NextResponse.json({
          error: 'Exécutez la migration 004 dans Supabase (add share_token column).',
          code: 'MIGRATION_REQUIRED',
        }, { status: 500 })
      }
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
  }

  // Derive origin from env or fall back to a sensible default
  const host = _req.headers.get('host') ?? 'localhost:3000'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? `${proto}://${host}`

  return NextResponse.json({ token, url: `${origin}/share/${token}` })
}

// DELETE — revoke share link
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  await supabase
    .from('projects')
    .update({ share_token: null })
    .eq('id', id)
    .eq('user_id', user.id)

  return NextResponse.json({ success: true })
}
