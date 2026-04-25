'use client'

import { useState, useRef } from 'react'
import {
  Mail, Upload, Play, Download, Copy, Check,
  Loader2, AlertTriangle, X, ChevronDown, ChevronUp,
  RefreshCw, Sparkles, Users, FileText, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ── Types ─────────────────────────────────────────────────────────────────────

interface EmailEntry { email: string; company?: string; name?: string }
interface GeneratedEmail { email: string; subject: string; body: string }

type Tone = 'professional' | 'friendly' | 'direct'

const TONE_OPTIONS: { id: Tone; label: string; description: string; color: string }[] = [
  { id: 'professional', label: 'Professionnel', description: 'Formel et soigné',       color: 'rgba(59,130,246,0.18)'  },
  { id: 'friendly',     label: 'Chaleureux',    description: 'Humain et accessible',   color: 'rgba(16,185,129,0.15)'  },
  { id: 'direct',       label: 'Direct',        description: 'Concis, orienté résultat', color: 'rgba(245,158,11,0.15)' },
]

// ── Email Card ─────────────────────────────────────────────────────────────────

function EmailCard({ result, index }: { result: GeneratedEmail; index: number }) {
  const [expanded, setExpanded] = useState(index === 0)
  const [copied, setCopied] = useState<'subject' | 'body' | 'all' | null>(null)

  function copy(type: 'subject' | 'body' | 'all') {
    const text = type === 'subject' ? result.subject
      : type === 'body' ? result.body
      : `Objet : ${result.subject}\n\n${result.body}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type)
      setTimeout(() => setCopied(null), 1800)
    })
  }

  return (
    <div className="rounded-2xl overflow-hidden animate-fade-in"
      style={{
        animationDelay: `${index * 40}ms`,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(10px)',
      }}>

      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/3 transition-all text-left"
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)' }}>
          <Mail size={13} className="text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white/80 truncate">{result.email}</p>
          <p className="text-[10px] text-white/35 truncate mt-0.5">{result.subject}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={e => { e.stopPropagation(); copy('all') }}
            className="p-1.5 rounded-lg transition-all hover:bg-white/10"
            title="Copier tout"
          >
            {copied === 'all' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-white/30" />}
          </button>
          {expanded ? <ChevronUp size={14} className="text-white/25" /> : <ChevronDown size={14} className="text-white/25" />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>

          {/* Subject */}
          <div className="pt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/25">Objet</span>
              <button onClick={() => copy('subject')} className="flex items-center gap-1 text-[9px] text-white/30 hover:text-white/60 transition-colors">
                {copied === 'subject' ? <><Check size={9} className="text-emerald-400" />Copié</> : <><Copy size={9} />Copier</>}
              </button>
            </div>
            <p className="text-sm font-semibold text-white/85 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
              {result.subject}
            </p>
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/25">Corps</span>
              <button onClick={() => copy('body')} className="flex items-center gap-1 text-[9px] text-white/30 hover:text-white/60 transition-colors">
                {copied === 'body' ? <><Check size={9} className="text-emerald-400" />Copié</> : <><Copy size={9} />Copier</>}
              </button>
            </div>
            <pre className="text-xs text-white/65 whitespace-pre-wrap leading-relaxed px-3 py-3 rounded-xl font-sans"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {result.body}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EmailCampaignsPage() {
  const fileRef = useRef<HTMLInputElement>(null)

  // Form state
  const [emailsRaw, setEmailsRaw]     = useState('')
  const [context, setContext]         = useState('')
  const [senderName, setSenderName]   = useState('')
  const [tone, setTone]               = useState<Tone>('professional')

  // Results state
  const [results, setResults]   = useState<GeneratedEmail[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [step, setStep]         = useState<'form' | 'results'>('form')

  // Parse emails from raw text
  function parseEmails(raw: string): EmailEntry[] {
    const lines = raw.split(/[\n,;]+/).map(l => l.trim()).filter(Boolean)
    const seen = new Set<string>()
    const result: EmailEntry[] = []

    for (const line of lines) {
      // Try "Name <email>" format or "email,name,company" CSV
      const angleBracket = line.match(/^(.+?)\s*<([^>]+)>$/)
      if (angleBracket) {
        const email = angleBracket[2].toLowerCase().trim()
        if (!seen.has(email) && email.includes('@')) {
          seen.add(email)
          result.push({ email, name: angleBracket[1].trim() })
        }
        continue
      }

      // CSV-style: email,name,company OR email,company
      const parts = line.split(',').map(p => p.trim())
      if (parts[0].includes('@')) {
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

  const parsedEmails = parseEmails(emailsRaw)

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      setEmailsRaw(prev => prev ? `${prev}\n${text}` : text)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  async function handleGenerate() {
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/email-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: parsedEmails,
          context,
          senderName,
          tone,
        }),
      })

      const data = await res.json() as { results?: GeneratedEmail[]; error?: string }

      if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue')

      setResults(data.results ?? [])
      setStep('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  function downloadCSV() {
    const header = 'email,subject,body'
    const rows = results.map(r =>
      `"${r.email}","${r.subject.replace(/"/g, '""')}","${r.body.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'campagne-emails.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const canGenerate = parsedEmails.length > 0 && context.trim().length > 10 && senderName.trim().length > 1

  return (
    <div className="flex flex-col min-h-0">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="h-14 flex items-center justify-between px-4 md:px-6 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.055)', background: 'rgba(8,14,34,0.80)', backdropFilter: 'blur(16px)' }}>
        <div>
          <h1 className="text-base font-semibold text-white">Campagnes email IA</h1>
          <p className="text-xs text-white/35">Emails personnalisés par l&apos;IA pour chaque destinataire</p>
        </div>
        {step === 'results' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setStep('form'); setResults([]) }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white/50 hover:text-white/80 transition-all hover:bg-white/5"
            >
              <RefreshCw size={12} />Nouvelle campagne
            </button>
            <button
              onClick={downloadCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white btn-primary"
            >
              <Download size={12} />Exporter CSV
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">

          {/* ── Error ──────────────────────────────────────────────────── */}
          {error && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)' }}>
              <AlertTriangle size={15} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-white/10 rounded-lg transition-all">
                <X size={12} className="text-white/40" />
              </button>
            </div>
          )}

          {step === 'form' ? (
            <>
              {/* ── Hero ─────────────────────────────────────────────── */}
              <div className="relative overflow-hidden rounded-2xl px-6 py-5"
                style={{
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.10) 0%, rgba(139,92,246,0.07) 55%, rgba(8,14,34,0.55) 100%)',
                  border: '1px solid rgba(59,130,246,0.18)',
                  boxShadow: '0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
                }}>
                <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
                  style={{ background: 'radial-gradient(circle at top right, rgba(59,130,246,0.12) 0%, transparent 70%)' }} />
                <div className="relative">
                  <p className="text-[10px] font-bold uppercase tracking-[0.20em] text-blue-400/65 mb-2">Propulsé par Claude IA</p>
                  <h2 className="text-lg font-extrabold text-white mb-1">Emails personnalisés à grande échelle</h2>
                  <p className="text-sm text-white/40">
                    Importez une liste d&apos;adresses email, décrivez votre offre et l&apos;IA génère un email unique et personnalisé pour chaque destinataire en analysant son domaine et son entreprise.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    {[
                      { icon: Users,    text: 'Jusqu\'à 50 destinataires' },
                      { icon: Zap,      text: 'Génération en ~10s' },
                      { icon: Sparkles, text: 'Personnalisation IA' },
                    ].map(({ icon: Icon, text }) => (
                      <span key={text} className="flex items-center gap-1.5 text-[10px] text-white/45 px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Icon size={10} className="text-blue-400/70" />{text}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Step 1: Emails ───────────────────────────────────── */}
              <div className="rounded-2xl p-5"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-bold text-white/80">Étape 1 — Liste des destinataires</p>
                    <p className="text-[10px] text-white/30 mt-0.5">Collez vos emails (un par ligne) ou importez un fichier CSV</p>
                  </div>
                  {parsedEmails.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.25)' }}>
                      {parsedEmails.length} email{parsedEmails.length > 1 ? 's' : ''} détecté{parsedEmails.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <textarea
                  value={emailsRaw}
                  onChange={e => setEmailsRaw(e.target.value)}
                  rows={6}
                  placeholder={`contact@acme.fr\njean.dupont@entreprise.com\nNom Prénom <direction@societe.fr>\nemail,nom,entreprise`}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white/80 placeholder:text-white/20 resize-none focus:outline-none transition-all font-mono"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.20)' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.45)'; e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.15), 0 0 0 3px rgba(59,130,246,0.10)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.20)' }}
                />

                <div className="flex items-center gap-3 mt-3">
                  <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white/55 hover:text-white/80 transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
                  >
                    <Upload size={12} />Importer CSV / TXT
                  </button>
                  {emailsRaw && (
                    <button
                      onClick={() => setEmailsRaw('')}
                      className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs text-white/30 hover:text-white/60 transition-all hover:bg-white/5"
                    >
                      <X size={11} />Effacer
                    </button>
                  )}
                  <p className="ml-auto text-[10px] text-white/25">Formats : email brut, &ldquo;Nom &lt;email&gt;&rdquo;, CSV (email,nom,entreprise)</p>
                </div>
              </div>

              {/* ── Step 2: Context ──────────────────────────────────── */}
              <div className="rounded-2xl p-5"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                <p className="text-xs font-bold text-white/80 mb-1">Étape 2 — Votre nom / entreprise</p>
                <p className="text-[10px] text-white/30 mb-3">Comment signer les emails</p>
                <input
                  type="text"
                  value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                  placeholder="Ex: PILOT+ · Jean Dupont · Acme SAS"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.20)' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.45)'; e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.15), 0 0 0 3px rgba(59,130,246,0.10)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.20)' }}
                />

                <p className="text-xs font-bold text-white/80 mb-1 mt-4">Contexte de la campagne</p>
                <p className="text-[10px] text-white/30 mb-3">Décrivez votre offre, votre cible et l&apos;objectif de la campagne. Plus c&apos;est précis, plus les emails seront pertinents.</p>
                <textarea
                  value={context}
                  onChange={e => setContext(e.target.value)}
                  rows={5}
                  placeholder="Ex: Nous proposons PILOT+, une plateforme IA d'analyse de DCE (dossiers de consultation des entreprises) pour les PME du BTP. Notre outil permet de gagner 80% de temps sur l'analyse des appels d'offres et d'augmenter le taux de réponse. Je contacte des directeurs commerciaux et dirigeants d'entreprises du BTP pour leur proposer une démonstration gratuite."
                  className="w-full px-4 py-3 rounded-xl text-sm text-white/80 placeholder:text-white/20 resize-none focus:outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.20)' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.45)'; e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.15), 0 0 0 3px rgba(59,130,246,0.10)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.20)' }}
                />
                <p className="text-[10px] text-white/25 mt-2">{context.length} / 1000 caractères recommandés</p>
              </div>

              {/* ── Step 3: Tone ─────────────────────────────────────── */}
              <div className="rounded-2xl p-5"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                <p className="text-xs font-bold text-white/80 mb-3">Étape 3 — Ton des emails</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {TONE_OPTIONS.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTone(t.id)}
                      className={cn(
                        'flex flex-col gap-1 p-3.5 rounded-xl border text-left transition-all',
                        tone === t.id ? 'border-blue-500/50' : 'border-white/8 hover:border-white/18',
                      )}
                      style={tone === t.id
                        ? { background: t.color, boxShadow: '0 0 16px rgba(59,130,246,0.08)' }
                        : { background: 'rgba(255,255,255,0.02)' }}
                    >
                      <p className={cn('text-xs font-bold', tone === t.id ? 'text-white/90' : 'text-white/55')}>{t.label}</p>
                      <p className="text-[10px] text-white/30">{t.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Generate button ───────────────────────────────────── */}
              <button
                onClick={handleGenerate}
                disabled={!canGenerate || loading}
                className={cn(
                  'w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl text-sm font-bold transition-all',
                  canGenerate && !loading
                    ? 'btn-primary text-white'
                    : 'text-white/30 cursor-not-allowed',
                )}
                style={!canGenerate || loading ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' } : {}}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Génération en cours pour {parsedEmails.length} email{parsedEmails.length > 1 ? 's' : ''}…
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Générer {parsedEmails.length > 0 ? `${parsedEmails.length} email${parsedEmails.length > 1 ? 's' : ''} personnalisé${parsedEmails.length > 1 ? 's' : ''}` : 'les emails'}
                  </>
                )}
              </button>

              {!canGenerate && !loading && (
                <p className="text-center text-xs text-white/25 -mt-2">
                  {parsedEmails.length === 0 ? 'Ajoutez au moins un email valide' : !senderName.trim() ? 'Indiquez votre nom / entreprise' : 'Décrivez votre campagne (min. 10 caractères)'}
                </p>
              )}
            </>
          ) : (
            <>
              {/* ── Results header ───────────────────────────────────── */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">
                    {results.length} email{results.length > 1 ? 's' : ''} générés
                  </h2>
                  <p className="text-xs text-white/35 mt-0.5">Cliquez pour déplier et copier chaque email</p>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(16,185,129,0.12)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.22)' }}>
                  <Check size={10} />Prêts à envoyer
                </span>
              </div>

              {/* ── Results list ─────────────────────────────────────── */}
              <div className="space-y-3">
                {results.map((r, i) => (
                  <EmailCard key={r.email} result={r} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
