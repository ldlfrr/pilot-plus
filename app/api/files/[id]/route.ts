import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Params {
  params: Promise<{ id: string }>
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // Fetch file to verify ownership via project
  const { data: file } = await supabase
    .from('project_files')
    .select('id, storage_path, project_id')
    .eq('id', id)
    .single()

  if (!file) {
    return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 })
  }

  // Verify the file belongs to a project owned by the user
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', file.project_id)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  // Delete from storage
  await supabase.storage.from('dce-files').remove([file.storage_path])

  // Delete DB record
  const { error } = await supabase
    .from('project_files')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
