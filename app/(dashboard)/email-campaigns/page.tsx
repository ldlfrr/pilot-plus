'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Mail, Upload, Download, Copy, Check, Loader2, AlertTriangle, X,
  ChevronDown, ChevronUp, RefreshCw, Sparkles, Users, Zap,
  Globe, FlaskConical, MessageSquare, Clock, BarChart3,
  Send, Star, Shuffle, Layers, FileJson, ArrowRight,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { GeneratedEmail } from '@/app/api/email-campaigns/route'

// ── Types ─────────────────────────────────────────────────────────────────────

interface EmailEntry { email: string; company?: string; name?: string }
type Tone     = 'professional' | 'friendly' | 'direct' | 'urgent' | 'storytelling'
type Language = 'fr' | 'en'

// ── Constants ─────────────────────────────────────────────────────────────────

const TONE_OPTIONS = [
  { id: 'professional' as Tone, label: 'Pro',         emoji: '🎩', desc: 'Formel · Soigné',           color: '#3b82f6' },
  { id: 'friendly'     as Tone, label: 'Chaleureux',  emoji: '🤝', desc: 'Humain · Accessible',       color: '#10b981' },
  { id: 'direct'       as Tone, label: 'Direct',      emoji: '⚡', desc: 'Concis · Résultat',          color: '#f59e0b' },
  { id: 'urgent'       as Tone, label: 'Urgent',      emoji: '🔥', desc: 'Opportunité · FOMO',         color: '#ef4444' },
  { id: 'storytelling' as Tone, label: 'Story',       emoji: '📖', desc: 'Narratif · Accroche',        color: '#8b5cf6' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseEmails(raw: string): EmailEntry[] {
  const lines = raw.split(/[\n;]+/).map(l => l.trim()).filter(Boolean)
  const seen   = new Set<string>()
  const result: EmailEntry[] = []

  for (const line of lines) {
    // "Name <email>" format
    const angle = line.match(/^(.+?)\s*<([^>]+)>$/)
    if (angle) {
      const email = angle[2].toLowerCase().trim()
      if (!seen.has(email) && email.includes('@')) {
        seen.add(email); result.push({ email, name: angle[1].trim() })
      }
      continue
    }
    // CSV: email,name,company OR email,company
    const parts = line.split(',').map(p => p.trim())
    if (parts[0]?.includes('@')) {
      const email = parts[0].toLowerCase()
      if (!seen.has(email)) {
        seen.add(email)
        result.push({
          email,
          name:    parts.length >= 3 ? parts[1] : undefined,
          company: parts.length >= 3 ? parts[2] : parts.length === 2 ? parts[1] : undefined,
        })
      }
      continue
    }
    // Plain email
    if (line.includes('@') && !seen.has(line.toLowerCase())) {
      seen.add(line.toLowerCase())
      result.push({ email: line.toLowerCase() })
    }
  }
  return result
}

function getDomain(email: string) { return email.split('@')[1] ?? '' }
function getCompany(e: EmailEntry) {
  return e.company || getDomain(e.email).replace(/\.(fr|com|net|org|io|eu)$/, '').replace(/[-_.]/g, ' ').trim()
}
function qualityColor(s: number) {
  if (s >= 80) return { bg: 'rgba(16,185,129,0.15)', text: '#34d399', label: 'Élevée' }
  if (s >= 55) return { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', label: 'Moyenne' }
  return              { bg: 'rgba(239,68,68,0.12)',   text: '#f87171', label: 'Faible' }
}

function wordCount(s: string) { return s.trim().split(/\s+/).filter(Boolean).length }

// ── Email result card ─────────────────────────────────────────────────────────

function EmailCard({ result, index }: { result: GeneratedEmail; index: number }) {
  const [open,    setOpen]    = useState(index === 0)
  const [subject, setSubject] = useState(result.subject)
  const [subjectB, setSubjectB] = useState(result.subjectB ?? '')
  const [body,    setBody]    = useState(result.body)
  const [followUp, setFollowUp] = useState(result.followUp ?? '')
  const [copied,  setCopied]  = useState<string | null>(null)
  const [sent,    setSent]    = useState(false)

  function copy(key: string, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 1600)
    })
  }

  function copyAll() {
    let full = `Objet : ${subject}\n\n${body}`
    if (subjectB) full += `\n\n---\nObjet B : ${subjectB}`
    if (followUp) full += `\n\n---\nRelance J+3 :\n${followUp}`
    copy('all', full)
  }

  const qc  = qualityColor(result.qualityScore)
  const wc  = wordCount(body)
  const domain = getDomain(result.email)

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: sent
          ? 'rgba(16,185,129,0.04)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.038) 0%, rgba(255,255,255,0.018) 100%)',
        border: sent ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(255,255,255,0.08)',
        animationDelay: `${index * 35}ms`,
      }}
    >
      {/* ── Header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.025] transition-all text-left"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold text-white/60"
          style={{ background: `linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))`, border: '1px solid rgba(255,255,255,0.08)' }}>
          {result.email[0].toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-white/85 truncate">{result.email}</p>
            {domain && (
              <span className="text-[9px] text-white/30 hidden sm:block">{domain}</span>
            )}
          </div>
          <p className="text-[10px] text-white/35 truncate mt-0.5">{subject}</p>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="hidden sm:flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: qc.bg, color: qc.text }}>
            {result.qualityScore}%
          </span>
          {result.subjectB && (
            <span className="hidden sm:flex text-[8px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.25)' }}>
              A/B
            </span>
          )}
          {result.followUp && (
            <span className="hidden sm:flex text-[8px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(245,158,11,0.12)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.2)' }}>
              +J3
            </span>
          )}
          <button
            onClick={e => { e.stopPropagation(); copyAll() }}
            className="p-1.5 rounded-lg transition-all hover:bg-white/10"
            title="Copier tout"
          >
            {copied === 'all' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-white/30" />}
          </button>
          <button
            onClick={e => { e.stopPropagation(); setSent(v => !v) }}
            className={cn('p-1.5 rounded-lg transition-all', sent ? 'text-emerald-400' : 'text-white/20 hover:text-white/50')}
            title={sent ? 'Marquer comme non envoyé' : 'Marquer comme envoyé'}
          >
            <Send size={12} />
          </button>
          {open ? <ChevronUp size={14} className="text-white/25" /> : <ChevronDown size={14} className="text-white/25" />}
        </div>
      </button>

      {/* ── Expanded */}
      {open && (
        <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>

          {/* Stats row */}
          <div className="pt-3 flex items-center gap-4 flex-wrap">
            {[
              { label: 'Personnalisation', value: qc.label, color: qc.text, bg: qc.bg },
              { label: 'Mots', value: String(wc), color: 'rgba(255,255,255,0.6)', bg: 'rgba(255,255,255,0.05)' },
              { label: 'Lecture', value: `${Math.ceil(wc / 200)} min`, color: 'rgba(255,255,255,0.6)', bg: 'rgba(255,255,255,0.05)' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-lg" style={{ background: bg }}>
                <span className="text-white/30">{label}</span>
                <span className="font-bold" style={{ color }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Subject A */}
          <Field
            label="Objet A"
            copyKey="subA"
            copied={copied}
            onCopy={t => copy('subA', t)}
            highlight
          >
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-white/90 outline-none"
            />
          </Field>

          {/* Subject B (A/B) */}
          {result.subjectB && (
            <Field label="Objet B (variante)" copyKey="subB" copied={copied} onCopy={t => copy('subB', t)} highlight variant="purple">
              <input
                value={subjectB}
                onChange={e => setSubjectB(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-white/90 outline-none"
              />
            </Field>
          )}

          {/* Body */}
          <Field label="Corps de l'email" copyKey="body" copied={copied} onCopy={t => copy('body', t)}>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={Math.max(5, body.split('\n').length + 1)}
              className="w-full bg-transparent text-xs text-white/75 outline-none resize-none leading-relaxed font-sans"
            />
          </Field>

          {/* Follow-up */}
          {result.followUp && (
            <Field label="Relance J+3" copyKey="followup" copied={copied} onCopy={t => copy('followup', t)} variant="amber">
              <textarea
                value={followUp}
                onChange={e => setFollowUp(e.target.value)}
                rows={Math.max(4, followUp.split('\n').length + 1)}
                className="w-full bg-transparent text-xs text-white/75 outline-none resize-none leading-relaxed font-sans"
              />
            </Field>
          )}
        </div>
      )}
    </div>
  )
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

function Field({
  label, copyKey, copied, onCopy, highlight, variant, children,
}: {
  label: string
  copyKey: string
  copied: string | null
  onCopy: (text: string) => void
  highlight?: boolean
  variant?: 'purple' | 'amber'
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  function getText() {
    const input = ref.current?.querySelector('input, textarea')
    return (input as HTMLInputElement | HTMLTextAreaElement)?.value ?? ''
  }

  const borderColor = variant === 'purple' ? 'rgba(139,92,246,0.22)' : variant === 'amber' ? 'rgba(245,158,11,0.22)' : highlight ? 'rgba(59,130,246,0.22)' : 'rgba(255,255,255,0.07)'
  const bg          = variant === 'purple' ? 'rgba(139,92,246,0.06)' : variant === 'amber' ? 'rgba(245,158,11,0.06)' : highlight ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.03)'

  return (
    <div ref={ref}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/25">{label}</span>
        <button onClick={() => onCopy(getText())} className="flex items-center gap-1 text-[9px] text-white/30 hover:text-white/60 transition-colors">
          {copied === copyKey ? <><Check size={9} className="text-emerald-400" />Copié</> : <><Copy size={9} />Copier</>}
        </button>
      </div>
      <div className="px-3 py-2.5 rounded-xl" style={{ background: bg, border: `1px solid ${borderColor}` }}>
        {children}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EmailCampaignsPage() {
  const fileRef = useRef<HTMLInputElement>(null)

  // Form
  const [emailsRaw,   setEmailsRaw]   = useState('')
  const [context,     setContext]     = useState('')
  const [senderName,  setSenderName]  = useState('')
  const [tone,        setTone]        = useState<Tone>('professional')
  const [language,    setLanguage]    = useState<Language>('fr')
  const [abSubject,   setAbSubject]   = useState(false)
  const [followUp,    setFollowUp]    = useState(false)
  const [advOpen,     setAdvOpen]     = useState(false)

  // State
  const [results,  setResults]  = useState<GeneratedEmail[]>([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [step,     setStep]     = useState<'form' | 'results'>('form')

  const parsedEmails = parseEmails(emailsRaw)

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      setEmailsRaw(prev => prev ? `${prev}\n${text}` : text)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleGenerate = useCallback(async () => {
    setError(null); setLoading(true)
    try {
      const res = await fetch('/api/email-campaigns', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ emails: parsedEmails, context, senderName, tone, language, abSubject, includeFollowUp: followUp }),
      })
      const data = await res.json() as { results?: GeneratedEmail[]; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue')
      setResults(data.results ?? [])
      setStep('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally { setLoading(false) }
  }, [parsedEmails, context, senderName, tone, language, abSubject, followUp])

  function downloadCSV() {
    const header = abSubject
      ? 'email,subject_a,subject_b,body,followup,quality_score'
      : 'email,subject,body,followup,quality_score'
    const rows = results.map(r => {
      const cols = abSubject
        ? [r.email, r.subject, r.subjectB ?? '', r.body, r.followUp ?? '', String(r.qualityScore)]
        : [r.email, r.subject, r.body, r.followUp ?? '', String(r.qualityScore)]
      return cols.map(c => `"${String(c).replace(/"/g, '""').replace(/\n/g, '\\n')}"`).join(',')
    })
    const csv  = [header, ...rows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url
    a.download = `campagne_${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  function downloadJSON() {
    const blob = new Blob([JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url
    a.download = `campagne_${new Date().toISOString().slice(0, 10)}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  function copyAll() {
    const text = results.map(r => `=== ${r.email} ===\nObjet : ${r.subject}\n\n${r.body}`).join('\n\n')
    navigator.clipboard.writeText(text)
  }

  const canGenerate = parsedEmails.length > 0 && context.trim().length > 10 && senderName.trim().length > 1
  const avgScore    = results.length ? Math.round(results.reduce((a, r) => a + r.qualityScore, 0) / results.length) : 0
  const sentCount   = 0 // tracking via local state in cards
  const activeTone  = TONE_OPTIONS.find(t => t.id === tone)!

  return (
    <div className="flex flex-col min-h-0">

      {/* ── Top bar */}
      <div className="h-14 flex items-center justify-between px-4 md:px-6 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.055)', background: 'rgba(8,14,34,0.80)', backdropFilter: 'blur(16px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <Mail size={15} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">Campagnes email IA</h1>
            <p className="text-[10px] text-white/35">Emails personnalisés par l&apos;IA pour chaque destinataire</p>
          </div>
        </div>
        {step === 'results' && (
          <div className="flex items-center gap-2">
            <button onClick={() => { setStep('form'); setResults([]) }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white/45 hover:text-white/75 transition-all hover:bg-white/5">
              <RefreshCw size={12} />Nouvelle
            </button>
            <button onClick={copyAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white/55 hover:text-white/80 transition-all hover:bg-white/5">
              <Copy size={12} />Tout copier
            </button>
            <button onClick={downloadCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white transition-all hover:bg-white/8"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}>
              <Download size={12} />CSV
            </button>
            <button onClick={downloadJSON}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white btn-primary">
              <FileJson size={12} />JSON
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-5">

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl animate-fade-in"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)' }}>
              <AlertTriangle size={15} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300 flex-1">{error}</p>
              <button onClick={() => setError(null)} className="p-1 hover:bg-white/10 rounded-lg"><X size={12} className="text-white/40" /></button>
            </div>
          )}

          {step === 'form' ? (
            <>
              {/* ── Hero ─────────────────────────────────────────────────────── */}
              <div className="relative overflow-hidden rounded-2xl px-6 py-6"
                style={{
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.08) 60%, rgba(8,14,34,0.5) 100%)',
                  border: '1px solid rgba(59,130,246,0.20)',
                  boxShadow: '0 4px 40px rgba(59,130,246,0.08), inset 0 1px 0 rgba(255,255,255,0.07)',
                }}>
                <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
                  style={{ background: 'radial-gradient(circle at top right, rgba(59,130,246,0.10) 0%, transparent 65%)' }} />
                <div className="absolute bottom-0 left-0 w-32 h-32 pointer-events-none"
                  style={{ background: 'radial-gradient(circle at bottom left, rgba(139,92,246,0.08) 0%, transparent 70%)' }} />
                <div className="relative">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-400/60 mb-2">Propulsé par Claude IA</p>
                  <h2 className="text-xl font-extrabold text-white mb-2">Emails personnalisés à grande échelle</h2>
                  <p className="text-sm text-white/40 max-w-xl">
                    Importez une liste, décrivez votre offre — l&apos;IA génère un email unique et personnalisé pour chaque destinataire en analysant son domaine et son entreprise.
                  </p>
                  <div className="flex flex-wrap items-center gap-2.5 mt-4">
                    {[
                      { icon: Users,       text: 'Jusqu\'à 50 destinataires' },
                      { icon: Zap,         text: 'Génération en ~15s' },
                      { icon: Sparkles,    text: 'IA Claude Opus' },
                      { icon: FlaskConical, text: 'A/B sujets disponible' },
                      { icon: Clock,       text: 'Relance J+3 incluse' },
                    ].map(({ icon: Icon, text }) => (
                      <span key={text} className="flex items-center gap-1.5 text-[10px] text-white/40 px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Icon size={10} className="text-blue-400/60" />{text}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Main form grid */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                {/* Left: email list + context */}
                <div className="lg:col-span-3 space-y-4">

                  {/* Step 1: Email list */}
                  <Section step="1" title="Liste des destinataires" sub="Collez vos emails ou importez un fichier CSV / TXT">
                    <textarea
                      value={emailsRaw}
                      onChange={e => setEmailsRaw(e.target.value)}
                      rows={7}
                      placeholder={'contact@acme.fr\njean.dupont@entreprise.com\nNom Prénom <direction@societe.fr>\nemail,nom,entreprise'}
                      className="w-full px-4 py-3 rounded-xl text-sm text-white/80 placeholder:text-white/18 resize-none focus:outline-none transition-all font-mono"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.40)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)' }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.boxShadow = 'none' }}
                    />

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
                      <button onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white/75 transition-all"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                        <Upload size={11} />Importer CSV
                      </button>
                      {emailsRaw && (
                        <button onClick={() => setEmailsRaw('')}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-white/28 hover:text-white/55 transition-all hover:bg-white/4">
                          <X size={10} />Effacer
                        </button>
                      )}
                      {parsedEmails.length > 0 && (
                        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.25)' }}>
                          {parsedEmails.length} email{parsedEmails.length > 1 ? 's' : ''} détecté{parsedEmails.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Email chips preview */}
                    {parsedEmails.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                        {parsedEmails.slice(0, 20).map((e, i) => (
                          <span key={i} className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-lg"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white/50"
                              style={{ background: 'rgba(59,130,246,0.2)' }}>
                              {e.email[0].toUpperCase()}
                            </span>
                            <span className="text-white/55 truncate max-w-[120px]">{e.email}</span>
                            {e.name && <span className="text-white/30">· {e.name}</span>}
                          </span>
                        ))}
                        {parsedEmails.length > 20 && (
                          <span className="text-[10px] text-white/25 px-2 py-1">+{parsedEmails.length - 20} autres</span>
                        )}
                      </div>
                    )}
                  </Section>

                  {/* Step 2: Sender + context */}
                  <Section step="2" title="Expéditeur & contexte" sub="Plus le contexte est précis, plus les emails seront pertinents">
                    <input
                      type="text"
                      value={senderName}
                      onChange={e => setSenderName(e.target.value)}
                      placeholder="Ex: Jean Dupont · Directeur commercial · PILOT+"
                      className="w-full px-4 py-2.5 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none transition-all mb-3"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.40)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)' }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.boxShadow = 'none' }}
                    />
                    <textarea
                      value={context}
                      onChange={e => setContext(e.target.value)}
                      rows={6}
                      placeholder="Ex: Je propose PILOT+, une plateforme IA d'analyse d'appels d'offres pour les PME du BTP. Notre outil permet de gagner 80% de temps sur l'analyse des DCE. Je contacte des directeurs commerciaux pour leur proposer une démonstration gratuite de 20 minutes..."
                      className="w-full px-4 py-3 rounded-xl text-sm text-white/80 placeholder:text-white/18 resize-none focus:outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.40)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)' }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.boxShadow = 'none' }}
                    />
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-[10px] text-white/20">{context.length} caractères</p>
                      {context.length > 0 && context.length < 80 && (
                        <p className="text-[10px] text-amber-400/60">Ajoutez plus de détails pour de meilleurs résultats</p>
                      )}
                      {context.length >= 80 && (
                        <p className="text-[10px] text-emerald-400/60">✓ Contexte suffisant</p>
                      )}
                    </div>
                  </Section>
                </div>

                {/* Right: options */}
                <div className="lg:col-span-2 space-y-4">

                  {/* Langue */}
                  <Section title="Langue des emails">
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { id: 'fr' as Language, flag: '🇫🇷', label: 'Français' },
                        { id: 'en' as Language, flag: '🇬🇧', label: 'English'  },
                      ]).map(l => (
                        <button key={l.id} onClick={() => setLanguage(l.id)}
                          className={cn('flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-all', language === l.id ? 'text-white' : 'text-white/40 hover:text-white/65')}
                          style={language === l.id
                            ? { background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.35)' }
                            : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <span>{l.flag}</span>{l.label}
                        </button>
                      ))}
                    </div>
                  </Section>

                  {/* Ton */}
                  <Section title="Ton des emails">
                    <div className="space-y-1.5">
                      {TONE_OPTIONS.map(t => (
                        <button key={t.id} onClick={() => setTone(t.id)}
                          className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all', tone === t.id ? 'text-white' : 'text-white/40 hover:text-white/65')}
                          style={tone === t.id
                            ? { background: `${t.color}18`, border: `1px solid ${t.color}40` }
                            : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <span className="text-base">{t.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold">{t.label}</p>
                            <p className="text-[10px] text-white/30">{t.desc}</p>
                          </div>
                          {tone === t.id && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: t.color, boxShadow: `0 0 5px ${t.color}` }} />}
                        </button>
                      ))}
                    </div>
                  </Section>

                  {/* Advanced options */}
                  <div className="rounded-2xl overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <button onClick={() => setAdvOpen(v => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-white/55 hover:text-white/80 transition-all">
                      <span className="flex items-center gap-2"><Layers size={12} />Options avancées</span>
                      {advOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                    {advOpen && (
                      <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <Toggle
                          id="ab"
                          icon={<Shuffle size={13} />}
                          label="A/B Sujets"
                          sub="2 lignes d'objet par email pour tester"
                          value={abSubject}
                          onChange={setAbSubject}
                          color="#8b5cf6"
                        />
                        <Toggle
                          id="followup"
                          icon={<MessageSquare size={13} />}
                          label="Relance J+3"
                          sub="Email de relance si pas de réponse"
                          value={followUp}
                          onChange={setFollowUp}
                          color="#f59e0b"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Generate button */}
              <div className="space-y-2">
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate || loading}
                  className={cn(
                    'w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all',
                    canGenerate && !loading ? 'btn-primary text-white hover:scale-[1.01] active:scale-[0.99]' : 'cursor-not-allowed text-white/25',
                  )}
                  style={!canGenerate || loading ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' } : {}}
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" />Génération de {parsedEmails.length} email{parsedEmails.length > 1 ? 's' : ''} en cours…</>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Générer {parsedEmails.length > 0 ? `${parsedEmails.length} email${parsedEmails.length > 1 ? 's' : ''} personnalisé${parsedEmails.length > 1 ? 's' : ''}` : 'les emails'}
                      {(abSubject || followUp) && (
                        <span className="text-[10px] font-normal text-white/50 flex items-center gap-1.5">
                          {abSubject && <><Shuffle size={10} />A/B</>}
                          {followUp  && <><Clock size={10} />+J3</>}
                        </span>
                      )}
                      <ArrowRight size={15} className="ml-1" />
                    </>
                  )}
                </button>
                {!canGenerate && !loading && (
                  <p className="text-center text-[11px] text-white/22">
                    {parsedEmails.length === 0 ? '→ Ajoutez au moins un email valide' : !senderName.trim() ? '→ Indiquez votre nom / entreprise' : '→ Décrivez votre campagne (min. 10 caractères)'}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* ── Results header */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">{results.length} email{results.length > 1 ? 's' : ''} générés</h2>
                  <p className="text-xs text-white/35 mt-0.5">Cliquez pour déplier · Éditez directement · Copiez ou exportez</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {[
                    { icon: BarChart3, label: 'Score moyen', value: `${avgScore}%`, color: qualityColor(avgScore).text },
                    { icon: Globe,     label: 'Langue',      value: language === 'fr' ? '🇫🇷 FR' : '🇬🇧 EN', color: 'rgba(255,255,255,0.5)' },
                    { icon: BookOpen,  label: 'Ton',         value: activeTone.emoji + ' ' + activeTone.label, color: activeTone.color },
                  ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <Icon size={11} className="text-white/30" />
                      <span className="text-white/30">{label}</span>
                      <span className="font-semibold" style={{ color }}>{value}</span>
                    </div>
                  ))}
                  {abSubject && (
                    <span className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl"
                      style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#c4b5fd' }}>
                      <Shuffle size={10} />A/B activé
                    </span>
                  )}
                  {followUp && (
                    <span className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl"
                      style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.22)', color: '#fcd34d' }}>
                      <Clock size={10} />Relance J+3
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl"
                    style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.22)', color: '#34d399' }}>
                    <Star size={10} />Prêts
                  </span>
                </div>
              </div>

              {/* ── Email cards */}
              <div className="space-y-3">
                {results.map((r, i) => (
                  <EmailCard key={`${r.email}-${i}`} result={r} index={i} />
                ))}
              </div>

              {/* ── Bottom export */}
              <div className="flex items-center justify-center gap-3 pt-2 pb-4">
                <button onClick={downloadCSV}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white/65 hover:text-white transition-all hover:bg-white/6"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                  <Download size={14} />Exporter CSV
                </button>
                <button onClick={downloadJSON}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white btn-primary">
                  <FileJson size={14} />Exporter JSON
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Reusable Section wrapper ──────────────────────────────────────────────────

function Section({ step, title, sub, children }: { step?: string; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)' }}>
      <div className="flex items-start gap-2.5 mb-4">
        {step && (
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-blue-400 flex-shrink-0 mt-0.5"
            style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)' }}>
            {step}
          </span>
        )}
        <div>
          <p className="text-xs font-bold text-white/80 leading-tight">{title}</p>
          {sub && <p className="text-[10px] text-white/28 mt-0.5">{sub}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ id, icon, label, sub, value, onChange, color }: {
  id: string; icon: React.ReactNode; label: string; sub: string
  value: boolean; onChange: (v: boolean) => void; color: string
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="w-full flex items-center gap-3 py-3 px-3 rounded-xl text-left transition-all"
      style={value
        ? { background: `${color}12`, border: `1px solid ${color}30` }
        : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <span style={{ color: value ? color : 'rgba(255,255,255,0.3)' }}>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white/75">{label}</p>
        <p className="text-[10px] text-white/28 truncate">{sub}</p>
      </div>
      {/* Toggle pill */}
      <div className="w-8 h-4 rounded-full flex-shrink-0 relative transition-all"
        style={{ background: value ? color : 'rgba(255,255,255,0.10)' }}>
        <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all"
          style={{ left: value ? 'calc(100% - 14px)' : 2 }} />
      </div>
    </button>
  )
}
