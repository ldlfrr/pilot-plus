'use client'

import { useState } from 'react'
import { Loader2, Settings } from 'lucide-react'

export function PortalButton() {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res  = await fetch('/api/stripe/portal', { method: 'POST' })
      const json = await res.json()
      if (json.url) window.location.href = json.url
      else alert(json.error ?? 'Impossible d\'ouvrir le portail')
    } catch {
      alert('Erreur serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/6 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white text-sm font-medium transition-all disabled:opacity-50"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Settings size={14} />}
      Gérer mon abonnement
    </button>
  )
}
