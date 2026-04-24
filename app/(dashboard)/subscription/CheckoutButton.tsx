'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Props {
  tier: string
  label: string
  className?: string
  disabled?: boolean
}

export function CheckoutButton({ tier, label, className, disabled }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res  = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const json = await res.json()
      if (json.url) window.location.href = json.url
      else alert(json.error ?? 'Erreur lors de la création du paiement')
    } catch {
      alert('Impossible de contacter le serveur de paiement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={cn(
        'flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : null}
      {loading ? 'Redirection…' : label}
    </button>
  )
}
