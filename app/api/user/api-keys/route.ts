import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// ── GET /api/user/api-keys — list user's keys (masked) ────────────────────────

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, last_used_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ keys: data ?? [] })
}

// ── POST /api/user/api-keys — create a new key ────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const name = (body?.name as string | undefined)?.trim()
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  // Generate key: ppk_live_ + 32 hex chars (128-bit entropy)
  const raw       = crypto.randomBytes(16).toString('hex')
  const key_value = `ppk_live_${raw}`
  const key_prefix = key_value.slice(0, 16)   // "ppk_live_" + first 7 hex chars

  const { data, error } = await supabase
    .from('api_keys')
    .insert({ user_id: user.id, name, key_value, key_prefix })
    .select('id, name, key_prefix, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Return the full key ONCE — not stored after this response
  return NextResponse.json({ key: { ...data, key_value } }, { status: 201 })
}

// ── DELETE /api/user/api-keys — revoke a key ──────────────────────────────────

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { error } = await supabase
    .from('api_keys')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)   // RLS is on too, but belt-and-suspenders

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
