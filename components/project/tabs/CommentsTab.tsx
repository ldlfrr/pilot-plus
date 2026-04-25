'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils/cn'
import {
  MessageSquare, Send, Loader2, Check, Trash2, CheckCircle2, Circle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Comment {
  id: string
  user_id: string
  author_name: string
  content: string
  resolved: boolean
  created_at: string
}

interface CommentsTabProps {
  projectId: string
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  'from-blue-500 to-blue-700',
  'from-violet-500 to-violet-700',
  'from-emerald-500 to-emerald-700',
  'from-amber-500 to-amber-600',
  'from-pink-500 to-pink-700',
]
function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function CommentsTab({ projectId }: CommentsTabProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading]   = useState(true)
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const [filter, setFilter]     = useState<'all' | 'open' | 'resolved'>('all')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/comments`)
      .then(r => r.json())
      .then(d => setComments(d.comments ?? []))
      .finally(() => setLoading(false))
  }, [projectId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments.length])

  async function send() {
    if (!input.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setComments(prev => [...prev, data.comment])
        setInput('')
      }
    } finally { setSending(false) }
  }

  async function toggleResolve(comment: Comment) {
    await fetch(`/api/projects/${projectId}/comments`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId: comment.id, resolved: !comment.resolved }),
    })
    setComments(prev => prev.map(c => c.id === comment.id ? { ...c, resolved: !c.resolved } : c))
  }

  async function remove(id: string) {
    await fetch(`/api/projects/${projectId}/comments`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId: id }),
    })
    setComments(prev => prev.filter(c => c.id !== id))
  }

  const filtered = comments.filter(c =>
    filter === 'all' ? true :
    filter === 'open' ? !c.resolved :
    c.resolved
  )

  const openCount     = comments.filter(c => !c.resolved).length
  const resolvedCount = comments.filter(c => c.resolved).length

  return (
    <div className="flex flex-col h-full max-w-2xl" style={{ minHeight: '500px' }}>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        {([
          { id: 'all',      label: `Tous (${comments.length})` },
          { id: 'open',     label: `Ouverts (${openCount})` },
          { id: 'resolved', label: `Résolus (${resolvedCount})` },
        ] as const).map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              filter === f.id
                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                : 'text-white/40 hover:text-white/70 border border-transparent',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3 pr-1 mb-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-white/20" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare size={28} className="mx-auto text-white/15 mb-3" />
            <p className="text-white/35 text-sm">
              {comments.length === 0
                ? 'Aucun commentaire — soyez le premier à commenter ce projet'
                : 'Aucun commentaire dans cette catégorie'}
            </p>
          </div>
        ) : (
          filtered.map(comment => (
            <div
              key={comment.id}
              className={cn(
                'group flex gap-3 p-4 rounded-xl border transition-all',
                comment.resolved
                  ? 'bg-white/2 border-white/5 opacity-60'
                  : 'bg-[var(--bg-card)] border-white/8',
              )}
            >
              {/* Avatar */}
              <div className={cn(
                'w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
                avatarColor(comment.author_name),
              )}>
                {getInitials(comment.author_name)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-white/70">{comment.author_name}</span>
                  <span className="text-[10px] text-white/25">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: fr })}
                  </span>
                  {comment.resolved && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      Résolu
                    </span>
                  )}
                </div>
                <p className={cn(
                  'text-sm leading-relaxed',
                  comment.resolved ? 'text-white/40 line-through decoration-white/20' : 'text-white/70',
                )}>
                  {comment.content}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={() => toggleResolve(comment)}
                  title={comment.resolved ? 'Rouvrir' : 'Marquer résolu'}
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                    comment.resolved
                      ? 'bg-white/5 hover:bg-white/10 text-white/30'
                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400',
                  )}
                >
                  {comment.resolved ? <Circle size={13} /> : <CheckCircle2 size={13} />}
                </button>
                <button
                  onClick={() => remove(comment.id)}
                  title="Supprimer"
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-500/8 hover:bg-red-500/15 text-red-400/60 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ajouter un commentaire… (Entrée pour envoyer)"
          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all"
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          className="w-11 h-11 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all flex-shrink-0"
        >
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </div>
    </div>
  )
}
