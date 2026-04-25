'use client'

import { useState } from 'react'
import {
  PenLine, Link, Send, CheckCircle, XCircle, Clock, Euro,
  User, Calendar, Plus, Trash2, Check, Loader2, ExternalLink,
  Shield, FileCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { SignatureData, SignatureStatus } from '@/types'

const STATUS_OPTIONS: {
  value: SignatureStatus
  label: string
  desc:  string
  color: string
  bg:    string
  border: string
  icon: typeof Clock
}[] = [
  {
    value: 'en_attente',
    label: 'En attente',
    desc: 'Contrat pas encore envoyé',
    color: 'text-white/40',
    bg: 'bg-white/4',
    border: 'border-white/10',
    icon: Clock,
  },
  {
    value: 'envoye',
    label: 'Envoyé',
    desc: 'Contrat envoyé pour signature',
    color: 'text-blue-300',
    bg: 'bg-blue-500/12',
    border: 'border-blue-500/25',
    icon: Send,
  },
  {
    value: 'signe',
    label: 'Signé',
    desc: 'Contrat signé par toutes les parties',
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/12',
    border: 'border-emerald-500/25',
    icon: CheckCircle,
  },
  {
    value: 'refuse',
    label: 'Refusé',
    desc: 'Signature refusée',
    color: 'text-red-300',
    bg: 'bg-red-500/12',
    border: 'border-red-500/25',
    icon: XCircle,
  },
]

interface SignatureTabProps {
  projectId: string
  data:      SignatureData | null
  onChange:  (data: SignatureData) => void
}

export function SignatureTab({ projectId, data, onChange }: SignatureTabProps) {
  const [form, setForm]   = useState<SignatureData>(data ?? { status: 'en_attente', signataires: [] })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)
  const [newSig, setNewSig] = useState('')

  function update(patch: Partial<SignatureData>) {
    setForm(prev => ({ ...prev, ...patch }))
  }

  function addSignataire(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    const current = form.signataires ?? []
    if (!current.includes(trimmed)) {
      update({ signataires: [...current, trimmed] })
    }
    setNewSig('')
  }

  function removeSignataire(name: string) {
    update({ signataires: (form.signataires ?? []).filter(s => s !== name) })
  }

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      const payload: SignatureData = { ...form }
      if (form.status === 'envoye' && !form.envoye_at) payload.envoye_at = new Date().toISOString()
      if (form.status === 'signe' && !form.signe_at) payload.signe_at = new Date().toISOString()
      const res = await fetch(`/api/projects/${projectId}/pipeline`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ signature_data: payload }),
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

  const statusCfg = STATUS_OPTIONS.find(s => s.value === (form.status ?? 'en_attente'))!

  return (
    <div className="max-w-2xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <PenLine size={16} className="text-emerald-400" />
            Étape 7 — Signature finale
          </h2>
          <p className="text-xs text-white/40 mt-0.5">
            Signature électronique du contrat (Docusign ou autre)
          </p>
        </div>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <Check size={12} />Sauvegardé
          </span>
        )}
      </div>

      {/* Statut signature */}
      <div className="bg-[var(--bg-card)] border border-white/8 rounded-2xl p-5 space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-white/30">Statut de signature</p>
        <div className="grid grid-cols-2 gap-2">
          {STATUS_OPTIONS.map(opt => {
            const Icon = opt.icon
            const selected = (form.status ?? 'en_attente') === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => update({ status: opt.value })}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all',
                  selected ? cn(opt.bg, opt.border) : 'bg-white/3 border-white/8 hover:border-white/20',
                )}
              >
                <Icon size={16} className={cn('flex-shrink-0 mt-0.5', selected ? opt.color : 'text-white/20')} />
                <div>
                  <p className={cn('text-xs font-semibold', selected ? opt.color : 'text-white/40')}>{opt.label}</p>
                  <p className="text-[10px] text-white/25 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Status banner */}
        <div className={cn('flex items-center gap-2 px-3.5 py-2.5 rounded-xl border', statusCfg.bg, statusCfg.border)}>
          <statusCfg.icon size={14} className={statusCfg.color} />
          <span className={cn('text-sm font-semibold', statusCfg.color)}>{statusCfg.label}</span>
          {form.status === 'envoye' && form.envoye_at && (
            <span className="ml-auto text-[10px] text-white/25">
              Envoyé le {new Date(form.envoye_at).toLocaleDateString('fr-FR')}
            </span>
          )}
          {form.status === 'signe' && form.signe_at && (
            <span className="ml-auto text-[10px] text-white/25">
              Signé le {new Date(form.signe_at).toLocaleDateString('fr-FR')}
            </span>
          )}
        </div>

        {/* Signed confirmation */}
        {form.status === 'signe' && (
          <div className="flex items-center gap-3 px-4 py-3.5 bg-emerald-500/8 border border-emerald-500/20 rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <FileCheck size={20} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-300">🏆 Contrat signé !</p>
              <p className="text-xs text-emerald-400/60 mt-0.5">
                Le projet peut maintenant être clôturé comme Gagné.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Docusign */}
      <div className="bg-[var(--bg-card)] border border-white/8 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-blue-400" />
          <p className="text-xs font-bold uppercase tracking-widest text-white/30">Lien de signature</p>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-white/40">URL Docusign / HelloSign / autre</label>
          <div className="relative">
            <Link size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              type="url"
              value={form.docusign_url ?? ''}
              onChange={e => update({ docusign_url: e.target.value })}
              placeholder="https://app.docusign.com/..."
              className="w-full bg-white/4 border border-white/10 rounded-xl pl-8 pr-10 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/50 transition-colors"
            />
            {form.docusign_url && (
              <a
                href={form.docusign_url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400/60 hover:text-blue-400 transition-colors"
                title="Ouvrir le lien"
              >
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] text-white/40">Date d&apos;envoi</label>
            <div className="relative">
              <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                type="date"
                value={form.envoye_at ? form.envoye_at.slice(0, 10) : ''}
                onChange={e => update({ envoye_at: e.target.value })}
                className="w-full bg-white/4 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white/70 outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-white/40">Date de signature</label>
            <div className="relative">
              <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                type="date"
                value={form.signe_at ? form.signe_at.slice(0, 10) : ''}
                onChange={e => update({ signe_at: e.target.value })}
                className="w-full bg-white/4 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white/70 outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Signataires */}
      <div className="bg-[var(--bg-card)] border border-white/8 rounded-2xl p-5 space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-white/30">Signataires</p>
        <div className="flex flex-wrap gap-1.5">
          {(form.signataires ?? []).map(sig => (
            <span
              key={sig}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/12 border border-emerald-500/25 text-xs text-emerald-300"
            >
              <User size={10} />{sig}
              <button
                onClick={() => removeSignataire(sig)}
                className="text-emerald-400/50 hover:text-emerald-300 transition-colors"
              >×</button>
            </span>
          ))}
          {(form.signataires ?? []).length === 0 && (
            <p className="text-xs text-white/25 italic">Aucun signataire défini</p>
          )}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <User size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              type="text"
              value={newSig}
              onChange={e => setNewSig(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSignataire(newSig) } }}
              placeholder="Nom du signataire…"
              className="w-full bg-white/4 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
          <button
            onClick={() => addSignataire(newSig)}
            className="flex items-center gap-1 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold transition-all"
          >
            <Plus size={12} />Ajouter
          </button>
        </div>
      </div>

      {/* Montant final & notes */}
      <div className="bg-[var(--bg-card)] border border-white/8 rounded-2xl p-5 space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-white/30">Montant & Notes finales</p>
        <div className="space-y-1">
          <label className="text-[11px] text-white/40">Montant contractuel final (€)</label>
          <div className="relative">
            <Euro size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              type="number"
              min="0"
              value={form.montant_final ?? ''}
              onChange={e => update({ montant_final: e.target.value ? parseFloat(e.target.value) : undefined })}
              placeholder="Montant HT du contrat signé"
              className="w-full bg-white/4 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-white/40">Notes</label>
          <textarea
            rows={3}
            value={form.notes ?? ''}
            onChange={e => update({ notes: e.target.value })}
            placeholder="Conditions particulières, annexes, points importants du contrat…"
            className="w-full bg-white/4 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-emerald-500/50 transition-colors resize-none"
          />
        </div>
      </div>

      {/* Save */}
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        {saving ? 'Enregistrement…' : 'Sauvegarder'}
      </button>
    </div>
  )
}
