'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export function UserAvatarLink() {
  const [initial, setInitial] = useState('·')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setInitial(user.email[0].toUpperCase())
    })
  }, [])

  return (
    <Link
      href="/account"
      title="Mon compte"
      className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white text-sm font-bold transition-colors flex-shrink-0"
    >
      {initial}
    </Link>
  )
}
