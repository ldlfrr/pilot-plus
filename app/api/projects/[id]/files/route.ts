import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getProjectAccess } from '@/lib/project-access'

const BUCKET = 'project-files'

interface Params { params: Promise<{ id: string }> }

// ── GET /api/projects/[id]/files?folder=chiffrage ────────────────────────────
// List uploaded files and return them with signed download URLs.
export async function GET(req: Request, { params }: Params) {
  const { id } = await params
  const folder = new URL(req.url).searchParams.get('folder') ?? 'chiffrage'

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const access = await getProjectAccess(supabase, id, user.id)
  if (!access) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const service = createServiceClient()
  const prefix = `${id}/${folder}`

  const { data: files, error } = await service.storage
    .from(BUCKET)
    .list(prefix, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Generate signed URLs for each file (1-hour TTL)
  const withUrls = await Promise.all(
    (files ?? []).filter(f => f.name !== '.emptyFolderPlaceholder').map(async f => {
      const path = `${prefix}/${f.name}`
      const { data: signed } = await service.storage
        .from(BUCKET)
        .createSignedUrl(path, 3600)
      return {
        name:        f.name,
        size:        f.metadata?.size ?? 0,
        created_at:  f.created_at ?? f.updated_at ?? '',
        mime_type:   f.metadata?.mimetype ?? '',
        url:         signed?.signedUrl ?? '',
        path,
      }
    })
  )

  return NextResponse.json({ files: withUrls })
}

// ── POST /api/projects/[id]/files ────────────────────────────────────────────
// Upload a file. Body: multipart/form-data with field "file" and optionally "folder".
export async function POST(req: Request, { params }: Params) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const access = await getProjectAccess(supabase, id, user.id)
  if (!access || !access.canEdit) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  const folder = (form.get('folder') as string) ?? 'chiffrage'

  if (!file) return NextResponse.json({ error: 'Aucun fichier' }, { status: 400 })
  if (file.size > 52_428_800) return NextResponse.json({ error: 'Fichier trop volumineux (max 50 Mo)' }, { status: 400 })

  // Sanitize filename: replace spaces, keep extension
  const safeName = file.name.replace(/\s+/g, '_')
  const path = `${id}/${folder}/${safeName}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const service = createServiceClient()

  const { error: uploadError } = await service.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: true,
    })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  // Return signed URL
  const { data: signed } = await service.storage.from(BUCKET).createSignedUrl(path, 3600)

  return NextResponse.json({
    name:       safeName,
    size:       file.size,
    mime_type:  file.type,
    url:        signed?.signedUrl ?? '',
    path,
  })
}

// ── DELETE /api/projects/[id]/files?path=xxx ─────────────────────────────────
export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params
  const filePath = new URL(req.url).searchParams.get('path')
  if (!filePath) return NextResponse.json({ error: 'path requis' }, { status: 400 })

  // Security: path must start with projectId to prevent cross-project deletion
  if (!filePath.startsWith(`${id}/`)) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const access = await getProjectAccess(supabase, id, user.id)
  if (!access || !access.canEdit) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const service = createServiceClient()
  const { error } = await service.storage.from(BUCKET).remove([filePath])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
