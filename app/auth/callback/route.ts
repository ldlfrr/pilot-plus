import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code        = searchParams.get('code')
  const next        = searchParams.get('next') ?? '/accueil'
  const inviteToken = searchParams.get('invite')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Auto-accept any pending invitations for this user's email
      try {
        await fetch(`${origin}/api/invitations/auto-accept`, { method: 'POST' })
      } catch { /* best effort */ }

      // If there's an invite token, redirect to the invite page to accept
      if (inviteToken) {
        return NextResponse.redirect(`${origin}/invite/${inviteToken}`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
