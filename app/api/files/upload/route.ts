export const runtime = 'nodejs'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractTextFromBuffer } from '@/lib/utils/extract'
import { randomUUID } from 'crypto'

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
])

const MAX_SIZE = 50 * 1024 * 1024 // 50 MB

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const projectId = formData.get('projectId') as string | null

  if (!file || !projectId) {
    return NextResponse.json({ error: 'Fichier et projectId requis' }, { status: 400 })
  }

  // Verify project ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Format non supporté. Utilisez PDF ou DOCX.' },
      { status: 415 }
    )
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: 'Fichier trop volumineux (max 50 Mo)' },
      { status: 413 }
    )
  }

  // Upload to Supabase Storage
  const fileBuffer = Buffer.from(await file.arrayBuffer())
  const ext = file.name.split('.').pop() ?? 'bin'
  const storagePath = `${user.id}/${projectId}/${randomUUID()}.${ext}`

  const { error: storageError } = await supabase.storage
    .from('dce-files')
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (storageError) {
    return NextResponse.json({ error: storageError.message }, { status: 500 })
  }

  // Create DB record first (pending extraction)
  const { data: fileRecord, error: dbError } = await supabase
    .from('project_files')
    .insert({
      project_id: projectId,
      filename: file.name,
      storage_path: storagePath,
      file_type: file.type,
      file_size: file.size,
      extraction_status: 'pending',
    })
    .select()
    .single()

  if (dbError) {
    // Clean up storage on DB failure
    await supabase.storage.from('dce-files').remove([storagePath])
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  // Extract text synchronously (acceptable for files up to 50MB)
  let extractedText: string | null = null
  let extractionStatus: 'done' | 'error' = 'done'

  try {
    extractedText = await extractTextFromBuffer(fileBuffer, file.type)
  } catch (err) {
    console.error(`Text extraction failed for ${file.name}:`, err)
    extractionStatus = 'error'
  }

  // Update extraction result
  const { data: updatedFile } = await supabase
    .from('project_files')
    .update({
      extracted_text: extractedText,
      extraction_status: extractionStatus,
    })
    .eq('id', fileRecord.id)
    .select()
    .single()

  return NextResponse.json({ file: updatedFile ?? fileRecord }, { status: 201 })
}
