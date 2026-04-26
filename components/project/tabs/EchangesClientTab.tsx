'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Plus, Send, Loader2, Check, AlertCircle, Trash2 } from 'lucide-react'
import type { EchangesClientData, ClientNote } from '@/types'

const AUTHOR_KEY = 'echanges_client_author'

function genId() { return Math.random().toString(36).slice(2, 9) }

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
}

function avatarColor(name: string): string {
  const colors = [
    'rgba(59,130,246,0.85)',   // blue
    'rgba(139,92,246,0.85)',   // violet
    'rgba(16,185,129,0.85)',   // emerald
    'rgba(245,158,11,0.85)',   // amber
    'rgba(236,72,153,0.85)',   // pink
    'rgba(20,184,166,0.85)',   // teal
  ]
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff
  return colors[h % colors.length]
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    + ' · ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

interface EchangesClientTabProps {
  projectId: string
  data:      EchangesClientData | null
  onChange:  (data: EchangesClientData) => void
}

export function EchangesClientTab({ projectId, data, onChange }: EchangesClientTabProps) {
  const [notes,    setNotes]    = useState<ClientNote[]>(data?.notes ?? [])
  const [author,   setAuthor]   = useState('')
  const [content,  setContent]  = useState('')
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)

  // Load persisted author name from localStorage
  useEffect(() => {
    try { setAuthor(localStorage.getItem(AUTHOR_KEY) ?? '') } catch { /* */ }
  }, [])

  async function saveAll(updated: ClientNote[]) {
    setSaving(true); setError(null)
    try {
      const payload: EchangesClientData = {
        echanges: data?.echanges ?? [],
        notes:    updated,
      }
      const res = await fetch(`/api/projects/${projectId}/pipeline`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ echanges_client: payload }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { error?: string }).error ?? 'Erreur')
      }
      onChange(payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  function handleSubmit() {
    if (!content.trim() || !author.trim()) return
    // Persist author
    try { localStorage.setItem(AUTHOR_KEY, author) } catch { /* */ }
    const note: ClientNote = {
      id:          genId(),
      date:        new Date().toISOString(),
      author_name: author.trim(),
      content:     content.trim(),
    }
    const updated = [...notes, note]
    setNotes(updated)
    saveAll(updated)
    setContent('')
    textRef.current?.focus()
  }

  function handleDelete(id: string) {
    const updated = notes.filter(n => n.id !== id)
    setNotes(updated)
    saveAll(updated)
  }

  return (
    <div className="max-w-xl space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(236,72,153,0.14)', border: '1px solid rgba(236,72,153,0.22)' }}>
          <MessageSquare size={16} className="text-pink-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">Échanges client</h2>
          <p className="text-xs text-white/35">Notes partagées — chacun annote ses discussions client</p>
        </div>
        {saved && (
          <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
            <Check size={11} />Sauvegardé
          </span>
        )}
        {saving && <Loader2 size={13} className="ml-auto animate-spin text-white/30" />}
      </div>

      {/* Notes feed */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(8,8,28,0.72)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>

        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: 'rgba(236,72,153,0.10)', border: '1px solid rgba(236,72,153,0.18)' }}>
              <MessageSquare size={20} className="text-pink-400/60" />
            </div>
            <p className="text-sm font-semibold text-white/40">Aucune note</p>
            <p className="text-xs text-white/20 mt-1">Annotez vos discussions avec le client</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            {notes.map((note, i) => {
              const color = avatarColor(note.author_name)
              return (
                <div key={note.id} className="px-5 py-4 group hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[11px] font-bold"
                      style={{ background: color, boxShadow: `0 0 12px ${color.replace('0.85', '0.25')}` }}>
                      {initials(note.author_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xs font-bold text-white/80">{note.author_name}</span>
                        <span className="text-[10px] text-white/25">{fmtDate(note.date)}</span>
                      </div>
                      <p className="text-sm text-white/65 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                    </div>
                    {/* Delete (shown on hover) */}
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-950/30"
                      title="Supprimer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Input area */}
        <div className="border-t px-4 py-4 space-y-3" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          {/* Author name row */}
          <input
            type="text"
            value={author}
            onChange={e => setAuthor(e.target.value)}
            placeholder="Votre nom…"
            className="w-full text-xs font-semibold bg-transparent text-white/60 placeholder-white/20 outline-none border-none"
          />
          {/* Content */}
          <textarea
            ref={textRef}
            rows={3}
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit() }}
            placeholder="Notez votre échange client — appel, réunion, email reçu…"
            className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/18 outline-none focus:border-pink-500/40 transition-colors resize-none"
          />
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-white/20">Ctrl+Entrée pour envoyer</p>
            <button
              onClick={handleSubmit}
              disabled={saving || !content.trim() || !author.trim()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-30"
              style={{ background: 'rgba(236,72,153,0.20)', border: '1px solid rgba(236,72,153,0.35)', color: 'rgba(249,168,212,0.90)' }}
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Ajouter
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1.5 px-1">
          <AlertCircle size={11} />{error}
        </p>
      )}
    </div>
  )
}
