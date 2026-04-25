'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search, User, Mail, Phone, Euro, FileText, Check,
  Loader2, Globe, Users, Inbox, HelpCircle, Star,
  Target, Calendar, AlertCircle, ChevronDown, Briefcase,
  TrendingUp, Clock, X, Plus, ArrowRight, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { ProspectionData, ProspectionSource } from '@/types'

// ── Config ─────────────────────────────────────────────────────────────────────

const SOURCE_OPTIONS: { value: ProspectionSource; label: string; icon: React.ElementType; color: string; border: string }[] = [
  { value: 'boamp',           label: 'BOAMP / TED',        icon: Globe,       color: 'text-blue-400',    border: 'border-blue-500/30'    },
  { value: 'marches_publics', label: 'Marchés publics',    icon: Search,      color: 'text-violet-400',  border: 'border-violet-500/30'  },
  { value: 'reseau',          label: 'Réseau',             icon: Users,       color: 'text-emerald-400', border: 'border-emerald-500/30' },
  { value: 'inbound',         label: 'Inbound',            icon: Inbox,       color: 'text-amber-400',   border: 'border-amber-500/30'   },
  { value: 'autre',           label: 'Autre',              icon: HelpCircle,  color: 'text-white/40',    border: 'border-white/15'       },
]

type PisteStatus = 'nouvelle' | 'en_qualification' | 'qualifiee' | 'abandonnee'
const PISTE_STATUS: { value: PisteStatus; label: string; color: string; bg: string; border: string; dot: string }[] = [
  { value: 'nouvelle',        label: 'Nouvelle piste',   color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', dot: '#64748b' },
  { value: 'en_qualification',label: 'En qualification', color: '#fbbf24', bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.25)', dot: '#f59e0b' },
  { value: 'qualifiee',       label: 'Qualifiée ✓',      color: '#34d399', bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.25)', dot: '#10b981' },
  { value: 'abandonnee',      label: 'Abandonnée',       color: '#f87171', bg: 'rgba(248,113,113,0.10)',border: 'rgba(248,113,113,0.25)',dot: '#ef4444' },
]

const MATURITE_LABELS = ['', 'Très faible', 'Faible', 'Modérée', 'Forte', 'Très forte']
const MATURITE_COLORS = ['', '#ef4444', '#f97316', '#fbbf24', '#34d399', '#10b981']

interface ProspectionFormData extends ProspectionData {
  piste_status?: PisteStatus
  score_qualification?: number   // 1-5
  maturite_prospect?: number     // 1-5
  concurrents?: string[]
  delai_decision?: string
  action_suivante?: string
  action_date?: string
}

interface ProspectionTabProps {
  projectId: string
  data:      ProspectionData | null
  onChange:  (data: ProspectionData) => void
}

// ── Input atoms ────────────────────────────────────────────────────────────────

const inputCls = 'w-full bg-[#0c1428] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all'

function Field({ label, icon: Icon, children }: { label: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/40">
        {Icon && <Icon size={10} />}{label}
      </label>
      {children}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────

export function ProspectionTab({ projectId, data, onChange }: ProspectionTabProps) {
  const [form, setForm] = useState<ProspectionFormData>((data as ProspectionFormData) ?? {})
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)
  const [concurrentInput, setConcurrentInput] = useState('')

  useEffect(() => {
    if (data) setForm(data as ProspectionFormData)
  }, [data])

  function update(patch: Partial<ProspectionFormData>) {
    setForm(prev => ({ ...prev, ...patch }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      const payload = { ...form, detected_at: form.detected_at ?? new Date().toISOString().slice(0, 10) }
      const res = await fetch(`/api/projects/${projectId}/pipeline`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ prospection: payload }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error((j as { error?: string }).error ?? 'Erreur')
      }
      onChange(payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  function addConcurrent() {
    const v = concurrentInput.trim()
    if (!v) return
    const current = form.concurrents ?? []
    if (!current.includes(v)) update({ concurrents: [...current, v] })
    setConcurrentInput('')
  }

  const pisteStatusCfg = PISTE_STATUS.find(s => s.value === (form.piste_status ?? 'nouvelle'))!

  return (
    <div className="max-w-2xl space-y-5">

      {/* ── Header + Save ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Search size={14} className="text-blue-400" />
            </span>
            Étape 1 — Prospection & Détection
          </h2>
          <p className="text-xs text-white/35 mt-1">Origine de l&apos;opportunité, qualification et contact</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all flex-shrink-0',
            saved
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25',
            saving && 'opacity-60 cursor-not-allowed',
          )}
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : saved ? <Check size={12} /> : null}
          {saving ? 'Enregistrement…' : saved ? 'Enregistré !' : 'Sauvegarder'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          <AlertCircle size={13} />{error}
        </div>
      )}

      {/* ── Statut de la piste ── */}
      <div className="bg-[var(--bg-card)] border border-white/8 rounded-2xl p-5 space-y-4">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/25">Statut de la piste</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PISTE_STATUS.map(s => (
            <button
              key={s.value}
              onClick={() => update({ piste_status: s.value })}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-center transition-all"
              style={form.piste_status === s.value || (!form.piste_status && s.value === 'nouvelle')
                ? { background: s.bg, borderColor: s.border, color: s.color }
                : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }
              }
            >
              <span className="w-2 h-2 rounded-full" style={{ background: s.dot }} />
              <span className="text-[11px] font-semibold leading-tight" style={
                form.piste_status === s.value || (!form.piste_status && s.value === 'nouvelle') ? { color: s.color } : { color: 'rgba(255,255,255,0.35)' }
              }>{s.label}</span>
            </button>
          ))}
        </div>
        <div
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border"
          style={{ background: pisteStatusCfg.bg, borderColor: pisteStatusCfg.border }}
        >
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: pisteStatusCfg.dot }} />
          <span className="text-sm font-semibold" style={{ color: pisteStatusCfg.color }}>{pisteStatusCfg.label}</span>
        </div>
      </div>

      {/* ── Score qualification & maturité ── */}
      <div className="bg-[var(--bg-card)] border border-white/8 rounded-2xl p-5 space-y-5">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/25">Scores de qualification</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Score qualification */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white/50 flex items-center gap-1.5"><Star size={11} />Score de qualification</label>
              <span className="text-sm font-bold" style={{ color: form.score_qualification ? MATURITE_COLORS[form.score_qualification] : 'rgba(255,255,255,0.2)' }}>
                {form.score_qualification ? `${form.score_qualification}/5` : '—'}
              </span>
            </div>
            <div className="flex gap-1.5">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => update({ score_qualification: n })}
                  className="flex-1 h-2 rounded-full transition-all"
                  style={{ background: (form.score_qualification ?? 0) >= n ? MATURITE_COLORS[n] : 'rgba(255,255,255,0.08)' }} />
              ))}
            </div>
            <p className="text-[10px] text-white/20">
              {form.score_qualification ? MATURITE_LABELS[form.score_qualification] : 'Non évalué'}
            </p>
          </div>
          {/* Maturité prospect */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white/50 flex items-center gap-1.5"><TrendingUp size={11} />Maturité prospect</label>
              <span className="text-sm font-bold" style={{ color: form.maturite_prospect ? MATURITE_COLORS[form.maturite_prospect] : 'rgba(255,255,255,0.2)' }}>
                {form.maturite_prospect ? `${form.maturite_prospect}/5` : '—'}
              </span>
            </div>
            <div className="flex gap-1.5">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => update({ maturite_prospect: n })}
                  className="flex-1 h-2 rounded-full transition-all"
                  style={{ background: (form.maturite_prospect ?? 0) >= n ? MATURITE_COLORS[n] : 'rgba(255,255,255,0.08)' }} />
              ))}
            </div>
            <p className="text-[10px] text-white/20">
              {form.maturite_prospect ? MATURITE_LABELS[form.maturite_prospect] : 'Non évalué'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Source de détection ── */}
      <div className="bg-[var(--bg-card)] border border-white/8 rounded-2xl p-5 space-y-3">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/25">Source de détection</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SOURCE_OPTIONS.map(opt => {
            const Icon = opt.icon
            const selected = form.source === opt.value
            return (
              <button key={opt.value} onClick={() => update({ source: opt.value })}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all',
                  selected ? cn(opt.color, opt.border, 'bg-white/5') : 'border-white/8 bg-white/2 text-white/35 hover:border-white/18 hover:text-white/55',
                )}
              >
                <Icon size={12} className="flex-shrink-0" />{opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Contact principal ── */}
      <div className="bg-[var(--bg-card)] border border-white/8 rounded-2xl p-5 space-y-4">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/25">Contact principal</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nom du contact" icon={User}>
            <input type="text" value={form.contact_nom ?? ''} onChange={e => update({ contact_nom: e.target.value })}
              placeholder="Jean Dupont" className={inputCls} />
          </Field>
          <Field label="Poste / Fonction" icon={Briefcase}>
            <input type="text" value={form.contact_poste ?? ''} onChange={e => update({ contact_poste: e.target.value })}
              placeholder="Directeur des achats" className={inputCls} />
          </Field>
          <Field label="Email" icon={Mail}>
            <input type="email" value={form.contact_email ?? ''} onChange={e => update({ contact_email: e.target.value })}
              placeholder="jean.dupont@mairie.fr" className={inputCls} />
          </Field>
          <Field label="Téléphone" icon={Phone}>
            <input type="tel" value={form.contact_phone ?? ''} onChange={e => update({ contact_phone: e.target.value })}
              placeholder="06 XX XX XX XX" className={inputCls} />
          </Field>
        </div>
      </div>

      {/* ── Budget & Timing ── */}
      <div className="bg-[var(--bg-card)] border border-white/8 rounded-2xl p-5 space-y-4">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/25">Budget & Timing</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Budget estimé (€)" icon={Euro}>
            <div className="relative">
              <Euro size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
              <input type="number" min="0" value={form.budget_estime ?? ''} onChange={e => update({ budget_estime: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="250 000" className={cn(inputCls, 'pl-8')} />
            </div>
          </Field>
          <Field label="Délai de décision" icon={Clock}>
            <input type="text" value={form.delai_decision ?? ''} onChange={e => update({ delai_decision: e.target.value })}
              placeholder="ex: 3 semaines" className={inputCls} />
          </Field>
          <Field label="Date de détection" icon={Calendar}>
            <input type="date" value={form.detected_at ? form.detected_at.slice(0, 10) : ''} onChange={e => update({ detected_at: e.target.value })}
              className={inputCls} style={{ colorScheme: 'dark' }} />
          </Field>
        </div>
      </div>

      {/* ── Concurrents ── */}
      <div className="bg-[var(--bg-card)] border border-white/8 rounded-2xl p-5 space-y-3">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/25">Concurrents identifiés</p>
        <div className="flex flex-wrap gap-2 min-h-[32px]">
          {(form.concurrents ?? []).map(c => (
            <span key={c} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
              {c}
              <button onClick={() => update({ concurrents: (form.concurrents ?? []).filter(x => x !== c) })}
                className="text-red-400/50 hover:text-red-300 transition-colors"><X size={10} /></button>
            </span>
          ))}
          {(form.concurrents ?? []).length === 0 && (
            <span className="text-xs text-white/20 italic">Aucun concurrent identifié</span>
          )}
        </div>
        <div className="flex gap-2">
          <input type="text" value={concurrentInput} onChange={e => setConcurrentInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addConcurrent() } }}
            placeholder="Nom d'un concurrent…" className={cn(inputCls, 'flex-1')} />
          <button onClick={addConcurrent}
            className="flex items-center gap-1 px-3.5 py-2 bg-white/6 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-xl text-xs font-semibold transition-all">
            <Plus size={12} />Ajouter
          </button>
        </div>
      </div>

      {/* ── Prochaine action ── */}
      <div className="bg-[var(--bg-card)] border border-white/8 rounded-2xl p-5 space-y-3">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/25">Prochaine action de suivi</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Action à réaliser" icon={ArrowRight}>
            <input type="text" value={form.action_suivante ?? ''} onChange={e => update({ action_suivante: e.target.value })}
              placeholder="ex: Envoyer une plaquette commerciale" className={inputCls} />
          </Field>
          <Field label="Date limite" icon={Calendar}>
            <input type="date" value={form.action_date ?? ''} onChange={e => update({ action_date: e.target.value })}
              className={inputCls} style={{ colorScheme: 'dark' }} />
          </Field>
        </div>
      </div>

      {/* ── Notes ── */}
      <div className="bg-[var(--bg-card)] border border-white/8 rounded-2xl p-5 space-y-3">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/25">Notes de prospection</p>
        <textarea rows={5} value={form.notes ?? ''} onChange={e => update({ notes: e.target.value })}
          placeholder="Contexte du projet, historique client, points d'attention, informations stratégiques…"
          className={cn(inputCls, 'resize-none')} />
      </div>

      {/* Bottom save */}
      <button onClick={handleSave} disabled={saving}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all',
          saved ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20',
          saving && 'opacity-60 cursor-not-allowed',
        )}
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} /> : <Zap size={15} />}
        {saving ? 'Enregistrement…' : saved ? 'Données sauvegardées !' : 'Sauvegarder la prospection'}
      </button>
    </div>
  )
}
