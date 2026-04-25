'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, Users, FolderOpen, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Invitation {
  id:           string
  type:         'project' | 'team'
  project_id:   string | null
  team_id:      string | null
  project_name: string | null
  team_name:    string | null
  inviter_name: string | null
  role:         string
  status:       string
}

const ROLE_LABELS: Record<string, string> = {
  editor:      'Éditeur — peut modifier le projet',
  viewer:      'Lecteur — consultation uniquement',
  avant_vente: 'Avant-Vente — chiffrage et mémoire',
  member:      'Membre',
  admin:       'Administrateur',
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const router    = useRouter()

  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [acting,     setActing]     = useState(false)
  const [done,       setDone]       = useState<'accepted' | 'declined' | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Check auth + fetch invitation in parallel
    Promise.all([
      fetch('/api/user/profile').then(r => r.ok ? r.json() : null),
      fetch(`/api/invitations/${token}`).then(r => r.json()),
    ]).then(([profile, invData]) => {
      setIsLoggedIn(!!profile)
      if (invData.error) {
        setError(invData.error)
      } else {
        setInvitation(invData.invitation)
      }
    }).catch(() => setError('Erreur lors du chargement'))
     .finally(() => setLoading(false))
  }, [token])

  async function handleAction(action: 'accept' | 'decline') {
    if (!isLoggedIn) {
      // Redirect to login with next=/invite/[token]
      router.push(`/login?next=/invite/${token}`)
      return
    }

    setActing(true)
    try {
      const res = await fetch(`/api/invitations/${token}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur')
      setDone(action === 'accept' ? 'accepted' : 'declined')

      if (action === 'accept') {
        setTimeout(() => {
          if (json.type === 'project' && json.projectId) {
            router.push(`/projects/${json.projectId}`)
          } else {
            router.push('/projects')
          }
        }, 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setActing(false)
    }
  }

  const bgStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #080e1c 0%, #0f172a 50%, #080e1c 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  }

  if (loading) return (
    <div style={bgStyle}>
      <div className="text-center">
        <Loader2 size={32} className="animate-spin text-white/20 mx-auto mb-3" />
        <p className="text-white/40 text-sm">Chargement de l&apos;invitation…</p>
      </div>
    </div>
  )

  if (done === 'accepted') return (
    <div style={bgStyle}>
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={36} className="text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Invitation acceptée !</h1>
        <p className="text-white/50 text-sm mb-6">
          {invitation?.type === 'project'
            ? `Vous faites maintenant partie du projet « ${invitation?.project_name} ».`
            : `Vous avez rejoint l'équipe « ${invitation?.team_name} ».`}
        </p>
        <p className="text-white/30 text-xs">Redirection en cours…</p>
      </div>
    </div>
  )

  if (done === 'declined') return (
    <div style={bgStyle}>
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/15 flex items-center justify-center mx-auto mb-6">
          <XCircle size={36} className="text-white/30" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Invitation refusée</h1>
        <p className="text-white/50 text-sm mb-6">Vous avez refusé cette invitation.</p>
        <Link href="/projects" className="text-blue-400 text-sm hover:text-blue-300 transition-colors">
          Retour à mes projets →
        </Link>
      </div>
    </div>
  )

  return (
    <div style={bgStyle}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-2xl font-extrabold text-white tracking-tight">
              PILOT<span className="text-blue-400">+</span>
            </span>
          </div>
        </div>

        {error ? (
          <div className="bg-[#111827] border border-white/8 rounded-2xl p-8 text-center">
            <AlertCircle size={32} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-white font-semibold mb-2">Invitation invalide</h2>
            <p className="text-white/50 text-sm mb-6">{error}</p>
            <Link href="/projects" className="text-blue-400 text-sm hover:text-blue-300 transition-colors">
              Retour à mes projets →
            </Link>
          </div>
        ) : invitation && (invitation.status !== 'pending') ? (
          <div className="bg-[#111827] border border-white/8 rounded-2xl p-8 text-center">
            <AlertCircle size={32} className="text-amber-400 mx-auto mb-4" />
            <h2 className="text-white font-semibold mb-2">Invitation déjà traitée</h2>
            <p className="text-white/50 text-sm">
              Cette invitation a déjà été {invitation.status === 'accepted' ? 'acceptée' : 'refusée ou expirée'}.
            </p>
          </div>
        ) : invitation ? (
          <div className="bg-[#111827] border border-white/8 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900/40 to-blue-800/20 px-8 py-6 border-b border-white/5">
              <div className="flex items-center gap-3 mb-1">
                {invitation.type === 'project'
                  ? <FolderOpen size={18} className="text-blue-400" />
                  : <Users size={18} className="text-blue-400" />}
                <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
                  {invitation.type === 'project' ? 'Invitation au projet' : 'Invitation à l\'équipe'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">
                {invitation.type === 'project' ? invitation.project_name : invitation.team_name}
              </h2>
            </div>

            <div className="px-8 py-6">
              <p className="text-sm text-white/50 mb-4 leading-relaxed">
                <strong className="text-white/80">{invitation.inviter_name ?? 'Quelqu\'un'}</strong>{' '}
                vous invite à {invitation.type === 'project' ? 'collaborer sur ce projet' : 'rejoindre cette équipe'}.
              </p>

              {/* Role badge */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 mb-6">
                <p className="text-xs text-white/30 mb-0.5">Votre rôle</p>
                <p className="text-sm font-semibold text-blue-300">
                  {ROLE_LABELS[invitation.role] ?? invitation.role}
                </p>
              </div>

              {!isLoggedIn && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-6">
                  <p className="text-xs text-amber-300/80 leading-relaxed">
                    Vous devez être connecté pour accepter cette invitation.
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-950/30 border border-red-800/40 rounded-xl px-4 py-3 mb-4">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleAction('accept')}
                  disabled={acting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors text-sm"
                >
                  {acting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  {isLoggedIn ? 'Accepter' : 'Se connecter et accepter'}
                </button>
                <button
                  onClick={() => handleAction('decline')}
                  disabled={acting}
                  className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white/80 rounded-xl transition-colors text-sm"
                >
                  Refuser
                </button>
              </div>

              {!isLoggedIn && (
                <p className="mt-4 text-center text-xs text-white/30">
                  Pas encore de compte ?{' '}
                  <Link href={`/signup?invite=${token}`} className="text-blue-400 hover:text-blue-300 transition-colors">
                    Créer un compte →
                  </Link>
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
