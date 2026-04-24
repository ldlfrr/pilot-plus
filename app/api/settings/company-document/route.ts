export const runtime = 'nodejs'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractTextFromBuffer, truncateText } from '@/lib/utils/extract'

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
])

const MAX_SIZE = 20 * 1024 * 1024 // 20 MB

/** GET — returns current document info (name + mode) */
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data } = await supabase
    .from('company_settings')
    .select('settings_mode, company_document_name')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({
    settings_mode: data?.settings_mode ?? 'form',
    company_document_name: data?.company_document_name ?? null,
  })
}

/** POST — upload + extract company document, set mode to 'document' */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Format non supporté. Utilisez PDF ou DOCX.' },
      { status: 415 }
    )
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: 'Fichier trop volumineux (max 20 Mo)' },
      { status: 413 }
    )
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer())

  let extractedText: string
  try {
    extractedText = await extractTextFromBuffer(fileBuffer, file.type)
  } catch (err) {
    console.error('[company-document] extraction error:', err)
    return NextResponse.json(
      { error: "Impossible d'extraire le texte du document." },
      { status: 422 }
    )
  }

  if (!extractedText || extractedText.trim().length < 50) {
    return NextResponse.json(
      { error: 'Document vide ou illisible. Vérifiez que le PDF n\'est pas une image scannée.' },
      { status: 422 }
    )
  }

  const truncated = truncateText(extractedText, 40_000)

  const { error: upsertError } = await supabase
    .from('company_settings')
    .upsert(
      {
        user_id: user.id,
        settings_mode: 'document',
        company_document_text: truncated,
        company_document_name: file.name,
      },
      { onConflict: 'user_id' }
    )

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  return NextResponse.json({
    company_document_name: file.name,
    settings_mode: 'document',
    chars_extracted: truncated.length,
  }, { status: 201 })
}

/** DELETE — remove company document, revert to 'form' mode */
export async function DELETE() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { error } = await supabase
    .from('company_settings')
    .upsert(
      {
        user_id: user.id,
        settings_mode: 'form',
        company_document_text: null,
        company_document_name: null,
      },
      { onConflict: 'user_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ settings_mode: 'form' })
}
