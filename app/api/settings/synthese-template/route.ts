export const runtime = 'nodejs'
export const maxDuration = 30

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** GET — returns current custom template name (if any) */
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data } = await supabase
    .from('company_settings')
    .select('synthese_template_path, synthese_template_name')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({
    template_path: data?.synthese_template_path ?? null,
    template_name: data?.synthese_template_name ?? null,
  })
}

/** POST — upload a custom template (.docx) */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })

  if (!file.name.endsWith('.docx')) {
    return NextResponse.json({ error: 'Format non supporté. Utilisez un fichier .docx' }, { status: 415 })
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 20 Mo)' }, { status: 413 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const storagePath = `${user.id}/synthese-template.docx`

  const { error: storageError } = await supabase.storage
    .from('synthese-templates')
    .upload(storagePath, buffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      upsert: true,
    })

  if (storageError) return NextResponse.json({ error: storageError.message }, { status: 500 })

  const { error: upsertError } = await supabase
    .from('company_settings')
    .upsert(
      { user_id: user.id, synthese_template_path: storagePath, synthese_template_name: file.name },
      { onConflict: 'user_id' }
    )

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 })

  return NextResponse.json({ template_name: file.name }, { status: 201 })
}

/** DELETE — remove custom template, revert to default SOGETREL template */
export async function DELETE() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const storagePath = `${user.id}/synthese-template.docx`
  await supabase.storage.from('synthese-templates').remove([storagePath])

  await supabase
    .from('company_settings')
    .upsert(
      { user_id: user.id, synthese_template_path: null, synthese_template_name: null },
      { onConflict: 'user_id' }
    )

  return NextResponse.json({ success: true })
}
