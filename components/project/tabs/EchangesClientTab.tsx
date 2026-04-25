'use client'

import { useState } from 'react'
import {
  MessageSquare, Mail, Phone, Video, Calendar, Users,
  FileText, Plus, Trash2, Check, Loader2, ChevronDown, ChevronUp,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { EchangesClientData, EchangeClient, EchangeType } from '@/types'

const TYPE_OPTIONS: { value: EchangeType; label: string; icon: typeof Mail; color: string; bg: string; border: string }[] = [
  { value: 'email',   label: 'Email',     icon: Mail,          color: 'text-blue-300',    bg: 'bg-blue-500/12',    border: 'border-blue-500/25'    },
  { value: 'reunion', label: 'Réunion',   icon: Users,         color: 'text-violet-300',  bg: 'bg-violet-500/12',  border: 'border-violet-500/25'  },
  { value: 'appel',   label: 'Appel',     icon: Phone,         color: 'text-emerald-300', bg: 'bg-emerald-500/12', border: 'border-emerald-500/25' },
  { value: 'visio',   label: 'Visio',     icon: Video,         color: 'text-amber-300',   bg: 'bg-amber-500/12',   border: 'border-amber-500/25'   },
  { value: 'autre',   label: 'Autre',     icon: MessageSquare, color: 'text-white/40',    bg: 'bg-white/5',        border: 'border-white/12'       },
]

function getTypeCfg(type: EchangeType) {
  return TYPE_OPTIONS.find(t => t.value === type) ?? TYPE_OPTIONS[4]
}

function genId() {
  return Math.random().toString(36).slice(2, 9)
}

const EMPTY_ECHANGE: Omit<EchangeClient, 'id'> = {
  date:         new Date().toISOString().slice(0, 10),
  type:         'email',
  sujet:        '',
  participants: '',
  notes:        '',
  next_step:    '',
}

interface EchangesClientTabProps {
  projectId: string
  data:      EchangesClientData | null
  onChange:  (data: EchangesClientData) => void
}

export function EchangesClientTab({ projectId, data, onChange }: EchangesClientTabProps) {
  const [echanges, setEchanges] = useState<EchangeClient[]>(data?.echanges ?? [])
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState<Omit<EchangeClient, 'id'>>(EMPTY_ECHANGE)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  function updateForm(patch: Partial<Omit<EchangeClient, 'id'>>) {
    setForm(prev => ({ ...prev, ...patch }))
  }

  async function saveAll(updated: EchangeClient[]) {
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/pipeline`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ echanges_client: { echanges: updated } }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { error?: string }).error ?? 'Erreur')
      }
      onChange({ echanges: updated })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  function handleAdd() {
    if (!form.sujet.trim()) return
    const newEchange: EchangeClient = { id: genId(), ...form }
    const updated = [newEchange, ...echanges]
    setEchanges(updated)
    saveAll(updated)
    setForm(EMPTY_ECHANGE)
    setShowForm(false)
    setExpanded(newEchange.id)
  }

  function handleDelete(id: string) {
    const updated = echanges.filter(e => e.id !== id)
    setEchanges(updated)
    saveAll(updated)
  }

  return (
    <div className="max-w-2xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <MessageSquare size={16} className="text-pink-400" />
            Étape 5 — Échanges client
          </h2>
          <p className="text-xs text-white/40 mt-0.5">
            Historique des interactions avec le client
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <Check size={12} />Sauvegardé
            </span>
          )}
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-400 rounded-xl text-xs font-semibold transition-all"
          >
            <Plus size={13} />
            Nouvel échange
          </button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-[var(--bg-card)] border border-pink-500/20 rounded-2xl p-5 space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-white/30">Nouvel échange</p>

          {/* Type selector */}
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map(opt => {
              const Icon = opt.icon
              const selected = form.type === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => updateForm({ type: opt.value })}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all',
                    selected ? cn(opt.bg, opt.border, opt.color) : 'bg-white/3 border-white/8 text-white/30 hover:border-white/20',
                  )}
                >
                  <Icon size={11} />{opt.label}
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-white/40">Date</label>
              <div className="relative">
                <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                <input
                  type="date"
                  value={form.date}
                  onChange={e => updateForm({ date: e.target.value })}
                  className="w-full bg-white/4 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white/70 outline-none focus:border-pink-500/50 transition-colors"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-white/40">Participants</label>
              <div className="relative">
                <Users size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                <input
                  type="text"
                  value={form.participants ?? ''}
                  onChange={e => updateForm({ participants: e.target.value })}
                  placeholder="ex: Jean D., Marie T."
                  className="w-full bg-white/4 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-pink-500/50 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-white/40">Sujet *</label>
            <input
              type="text"
              value={form.sujet}
              onChange={e => updateForm({ sujet: e.target.value })}
              placeholder="ex: Clarification technique sur les spécifications"
              className="w-full bg-white/4 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-pink-500/50 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-white/40">Notes / Compte-rendu</label>
            <textarea
              rows={3}
              value={form.notes ?? ''}
              onChange={e => updateForm({ notes: e.target.value })}
              placeholder="Résumé de l'échange, points importants soulevés…"
              className="w-full bg-white/4 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-pink-500/50 transition-colors resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-white/40 flex items-center gap-1.5">
              <ArrowRight size={10} />Prochaine étape / Action requise
            </label>
            <input
              type="text"
              value={form.next_step ?? ''}
              onChange={e => updateForm({ next_step: e.target.value })}
              placeholder="ex: Envoyer la proposition révisée avant le 15"
              className="w-full bg-white/4 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-pink-500/50 transition-colors"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!form.sujet.trim() || saving}
              className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Ajouter
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(EMPTY_ECHANGE) }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 text-sm rounded-xl transition-all"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Échanges list */}
      {echanges.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-dashed border-white/8 rounded-2xl p-10 text-center">
          <MessageSquare size={24} className="mx-auto text-white/15 mb-3" />
          <p className="text-sm text-white/35">Aucun échange enregistré</p>
          <p className="text-xs text-white/20 mt-1">
            Ajoutez vos emails, réunions et appels avec le client pour garder un historique complet.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {echanges.map(echange => {
            const cfg = getTypeCfg(echange.type)
            const Icon = cfg.icon
            const isExpanded = expanded === echange.id
            return (
              <div
                key={echange.id}
                className={cn('bg-[var(--bg-card)] border rounded-2xl overflow-hidden transition-all', cfg.border)}
              >
                {/* Header row */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : echange.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/2 transition-colors"
                >
                  <span className={cn('flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center', cfg.bg, cfg.border, 'border')}>
                    <Icon size={14} className={cfg.color} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/85 truncate">{echange.sujet}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">
                      {new Date(echange.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {echange.participants && ` · ${echange.participants}`}
                    </p>
                  </div>
                  <span className={cn('flex-shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full', cfg.bg, cfg.color)}>
                    {cfg.label}
                  </span>
                  {isExpanded
                    ? <ChevronUp size={13} className="text-white/30 flex-shrink-0" />
                    : <ChevronDown size={13} className="text-white/30 flex-shrink-0" />}
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                    {echange.notes && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/20 mb-1">
                          <FileText size={9} className="inline mr-1" />Notes
                        </p>
                        <p className="text-sm text-white/60 whitespace-pre-wrap">{echange.notes}</p>
                      </div>
                    )}
                    {echange.next_step && (
                      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/8 border border-amber-500/20 rounded-xl">
                        <ArrowRight size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/60 mb-0.5">Prochaine étape</p>
                          <p className="text-sm text-amber-300/80">{echange.next_step}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDelete(echange.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-400/50 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-all"
                      >
                        <Trash2 size={11} />Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
