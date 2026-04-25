import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ id: string }> }

// GET — list comments
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await supabase
    .from('project_comments')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comments: data ?? [] })
}

// POST — add comment
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { content } = await req.json() as { content: string }
  if (!content?.trim()) return NextResponse.json({ error: 'Contenu requis' }, { status: 400 })

  // Get author name
  const { data: profile } = await supabase
    .from('profiles').select('full_name').eq('id', user.id).single()
  const authorName = profile?.full_name ?? user.email?.split('@')[0] ?? 'Utilisateur'

  const { data, error } = await supabase
    .from('project_comments')
    .insert({ project_id: id, user_id: user.id, author_name: authorName, content: content.trim() })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comment: data }, { status: 201 })
}

// PATCH — resolve/unresolve comment
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id: _projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { commentId, resolved } = await req.json() as { commentId: string; resolved: boolean }

  const { error } = await supabase
    .from('project_comments')
    .update({ resolved })
    .eq('id', commentId)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE — delete comment
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id: _projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { commentId } = await req.json() as { commentId: string }

  const { error } = await supabase
    .from('project_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
