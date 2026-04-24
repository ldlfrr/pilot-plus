import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── GET /api/user/profile ─────────────────────────────────────────────────────
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, company, job_title, phone, avatar_url, theme, subscription_tier')
    .eq('id', user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    id: profile?.id ?? user.id,
    email: user.email ?? '',
    full_name: profile?.full_name ?? null,
    company: profile?.company ?? null,
    job_title: (profile as Record<string, unknown>)?.job_title ?? null,
    phone: (profile as Record<string, unknown>)?.phone ?? null,
    avatar_url: profile?.avatar_url ?? null,
    theme: (profile as Record<string, unknown>)?.theme ?? 'dark',
    subscription_tier: profile?.subscription_tier ?? 'free',
    created_at: user.created_at ?? null,
    provider: (user.app_metadata?.provider as string) ?? 'email',
  })
}

// ── PUT /api/user/profile ─────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body: unknown = await req.json()
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })
  }

  const allowed = ['full_name', 'company', 'job_title', 'phone', 'theme'] as const
  type AllowedKey = typeof allowed[number]
  const updates: Partial<Record<AllowedKey, string>> = {}

  for (const key of allowed) {
    const val = (body as Record<string, unknown>)[key]
    if (typeof val === 'string') {
      updates[key] = val
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })
  }

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, ...updates }, { onConflict: 'id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// ── POST /api/user/profile ────────────────────────────────────────────────────
// { action: 'reset-password' } → sends reset email
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body: unknown = await req.json()
  if (
    typeof body !== 'object' ||
    body === null ||
    (body as Record<string, unknown>).action !== 'reset-password'
  ) {
    return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
  }

  const email = user.email
  if (!email) {
    return NextResponse.json({ error: 'Email introuvable' }, { status: 400 })
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/update-password`,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
