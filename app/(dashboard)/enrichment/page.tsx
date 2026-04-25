'use client'

import { useState, useRef } from 'react'
import {
  Linkedin, Search, Upload, Download, Copy, Check,
  Loader2, AlertTriangle, X, ChevronDown, ChevronUp,
  RefreshCw, Users, Mail, Phone, Globe, Building2,
  ShieldCheck, ShieldAlert, Shield, Zap, Database,
  ExternalLink, Plus, Trash2, BarChart3, Hash,
  UserSearch, Briefcase, MapPin, ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { EnrichedContact, ContactInput } from '@/lib/types/enrichment'

// ── LinkedIn Profile types ────────────────────────────────────────────────────

interface LinkedInProfile {
  name: string
  title: string
  company: string
  location?: string
  linkedin_url: string
  snippet?: string
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ParsedRow { first_name: string; last_name: string; company: string; linkedin_url?: string; domain?: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

function confidenceBadge(c: 'high' | 'medium' | 'low') {
  const map = {
    high:   { icon: ShieldCheck, label: 'Élevée',  cls: 'text-emerald-400', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.22)' },
    medium: { icon: ShieldAlert, label: 'Moyenne', cls: 'text-amber-400',   bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.22)' },
    low:    { icon: Shield,      label: 'Faible',  cls: 'text-red-400',     bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.20)' },
  }
  return map[c]
}

function scoreBar(score: number) {
  const color = score >= 80 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171'
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[10px] font-bold tabular-nums flex-shrink-0" style={{ color }}>{score}%</span>
    </div>
  )
}

// ── Contact card ──────────────────────────────────────────────────────────────

function ContactCard({ result, index }: { result: EnrichedContact; index: number }) {
  const [expanded, setExpanded] = useState(index < 3)
  const [copied, setCopied] = useState<string | null>(null)
  const conf = confidenceBadge(result.confidence)
  const ConfIcon = conf.icon

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 1600)
    })
  }

  const topEmail = result.emails[0]

  return (
    <div className="rounded-2xl overflow-hidden animate-fade-in"
      style={{
        animationDelay: `${index * 50}ms`,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
        border: result.confidence === 'high'
          ? '1px solid rgba(16,185,129,0.20)'
          : result.confidence === 'medium'
          ? '1px solid rgba(245,158,11,0.18)'
          : '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(10px)',
      }}>

      {/* ── Header row ─────────────────────────────────────────────────── */}
      <button onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/3 transition-all text-left">

        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-extrabold text-white"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', boxShadow: '0 0 10px rgba(59,130,246,0.25)' }}>
          {result.first_name[0]}{result.last_name[0]}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-white/90 leading-none">{result.full_name}</p>
            {result.job_title && <span className="text-[10px] text-white/35 truncate">· {result.job_title}</span>}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] text-white/40 flex items-center gap-1">
              <Building2 size={9} />{result.company}
            </span>
            {result.domain && (
              <span className="text-[10px] text-blue-400/60 flex items-center gap-1">
                <Globe size={9} />{result.domain}
              </span>
            )}
            {topEmail && (
              <span className="text-[10px] text-white/35 truncate">{topEmail.address}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Confidence badge */}
          <span className="hidden sm:flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: conf.bg, color: conf.cls.replace('text-', ''), border: `1px solid ${conf.border}` }}>
            <ConfIcon size={9} />{conf.label}
          </span>

          {/* Source count */}
          <span className="text-[9px] text-white/25 flex items-center gap-0.5">
            <Database size={8} />{result.sources.length}
          </span>

          {expanded ? <ChevronUp size={13} className="text-white/25" /> : <ChevronDown size={13} className="text-white/25" />}
        </div>
      </button>

      {/* ── Expanded content ────────────────────────────────────────────── */}
      {expanded && (
        <div className="space-y-4 px-4 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>

          {/* Emails */}
          {result.emails.length > 0 && (
            <div className="pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/25 flex items-center gap-1.5">
                  <Mail size={9} />Emails ({result.emails.length})
                </span>
              </div>
              <div className="space-y-1.5">
                {result.emails.map((e, i) => (
                  <div key={e.address} className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-xl group',
                    i === 0 ? 'bg-white/5' : 'hover:bg-white/3',
                  )} style={i === 0 ? { border: '1px solid rgba(255,255,255,0.09)' } : {}}>

                    {/* Verified dot */}
                    <div className={cn(
                      'w-1.5 h-1.5 rounded-full flex-shrink-0',
                      e.verified ? 'bg-emerald-400' : 'bg-white/15',
                    )} style={e.verified ? { boxShadow: '0 0 4px rgba(52,211,153,0.6)' } : {}} />

                    <p className="text-xs font-mono text-white/75 flex-1 truncate">{e.address}</p>

                    {/* Score bar */}
                    <div className="w-24 hidden sm:block">
                      {scoreBar(e.confidence)}
                    </div>

                    {/* Pattern tag */}
                    <span className="text-[8px] text-white/25 px-1.5 py-0.5 rounded-md hidden md:block"
                      style={{ background: 'rgba(255,255,255,0.04)' }}>
                      {e.pattern}
                    </span>

                    {/* Source */}
                    <span className={cn(
                      'text-[8px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0',
                      e.source === 'website' ? 'text-emerald-400/70' : e.source === 'smtp_verify' ? 'text-blue-400/70' : 'text-white/20',
                    )} style={{ background: 'rgba(255,255,255,0.04)' }}>
                      {e.source === 'website' ? 'site web' : e.source === 'smtp_verify' ? 'smtp' : e.source}
                    </span>

                    {/* Copy */}
                    <button onClick={() => copy(e.address, `email-${e.address}`)}
                      className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all flex-shrink-0">
                      {copied === `email-${e.address}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} className="text-white/30" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phones */}
          {result.phones.length > 0 && (
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/25 flex items-center gap-1.5 mb-2">
                <Phone size={9} />Téléphones
              </span>
              <div className="flex flex-wrap gap-2">
                {result.phones.map(p => (
                  <button key={p} onClick={() => copy(p, `phone-${p}`)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono text-white/65 hover:text-white/90 transition-all group"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {p}
                    {copied === `phone-${p}` ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} className="text-white/20 group-hover:text-white/50" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 pt-1"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {result.siren && (
              <span className="flex items-center gap-1 text-[10px] text-white/30">
                <Hash size={9} />SIREN {result.siren}
              </span>
            )}
            {result.linkedin_url && (
              <a href={result.linkedin_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-blue-400/50 hover:text-blue-400 transition-colors">
                <Linkedin size={9} />Profil LinkedIn
                <ExternalLink size={8} />
              </a>
            )}
            {result.domain && (
              <a href={`https://${result.domain}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-white/25 hover:text-white/55 transition-colors">
                <Globe size={9} />{result.domain}
                <ExternalLink size={8} />
              </a>
            )}
            {/* Sources */}
            <div className="ml-auto flex items-center gap-1.5 flex-wrap justify-end">
              {result.sources.map(s => (
                <span key={s} className="text-[8px] text-white/20 px-1.5 py-0.5 rounded-md"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Input row editor ──────────────────────────────────────────────────────────

function ContactRow({
  row, index, onChange, onRemove,
}: {
  row: ParsedRow
  index: number
  onChange: (r: ParsedRow) => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-2 group animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <input
          value={row.first_name} onChange={e => onChange({ ...row, first_name: e.target.value })}
          placeholder="Prénom"
          className="px-3 py-2 rounded-xl text-xs text-white/80 placeholder:text-white/20 focus:outline-none transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          onFocus={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.40)'}
          onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
        />
        <input
          value={row.last_name} onChange={e => onChange({ ...row, last_name: e.target.value })}
          placeholder="Nom"
          className="px-3 py-2 rounded-xl text-xs text-white/80 placeholder:text-white/20 focus:outline-none transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          onFocus={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.40)'}
          onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
        />
        <input
          value={row.company} onChange={e => onChange({ ...row, company: e.target.value })}
          placeholder="Entreprise"
          className="px-3 py-2 rounded-xl text-xs text-white/80 placeholder:text-white/20 focus:outline-none transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          onFocus={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.40)'}
          onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
        />
        <input
          value={row.linkedin_url ?? ''} onChange={e => onChange({ ...row, linkedin_url: e.target.value })}
          placeholder="URL LinkedIn (optionnel)"
          className="px-3 py-2 rounded-xl text-xs text-white/80 placeholder:text-white/20 focus:outline-none transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          onFocus={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.40)'}
          onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
        />
      </div>
      <button onClick={onRemove}
        className="p-2 rounded-xl text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0">
        <Trash2 size={12} />
      </button>
    </div>
  )
}

// ── LinkedIn Search Section ───────────────────────────────────────────────────

function LinkedInSearchSection() {
  const [company, setCompany]     = useState('')
  const [jobTitle, setJobTitle]   = useState('')
  const [profiles, setProfiles]   = useState<LinkedInProfile[]>([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [searched, setSearched]   = useState(false)
  const [isDemo, setIsDemo]       = useState(false)
  const [source, setSource]       = useState<string>('')
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  async function handleSearch() {
    if (!company.trim() || !jobTitle.trim()) return
    setLoading(true); setError(null); setSearched(false)
    try {
      const res = await fetch('/api/enrichment/linkedin-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: company.trim(), job_title: jobTitle.trim(), max_results: 15 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur de recherche')
      setProfiles(data.profiles ?? [])
      setIsDemo(data.demo ?? false)
      setSource(data.source ?? '')
      setSearched(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 1600)
    })
  }

  function downloadCSV() {
    const header = 'Nom,Poste,Entreprise,Localisation,URL LinkedIn'
    const rows = profiles.map(p => [
      `"${p.name}"`, `"${p.title}"`, `"${p.company}"`,
      `"${p.location ?? ''}"`, `"${p.linkedin_url}"`,
    ].join(','))
    const csv = [header, ...rows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `linkedin-${company}-${jobTitle}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const inputStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }
  const inputFocus = { background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.40)' }

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl px-5 py-5"
        style={{
          background: 'linear-gradient(135deg, rgba(10,102,194,0.12) 0%, rgba(139,92,246,0.07) 60%, rgba(8,14,34,0.55) 100%)',
          border: '1px solid rgba(10,102,194,0.22)',
          boxShadow: '0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}>
        <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
          style={{ background: 'radial-gradient(circle at top right, rgba(10,102,194,0.12) 0%, transparent 70%)' }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(10,102,194,0.20)', border: '1px solid rgba(10,102,194,0.30)' }}>
              <Linkedin size={14} className="text-[#0a66c2]" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.20em] text-blue-400/65">Recherche LinkedIn</p>
          </div>
          <h2 className="text-lg font-extrabold text-white mb-1">Trouvez tous les profils LinkedIn d&apos;une entreprise</h2>
          <p className="text-sm text-white/40 max-w-2xl">
            Entrez le nom d&apos;une entreprise et un poste. PILOT+ recherche tous les profils LinkedIn correspondants et vous retourne la liste des contacts à cibler.
          </p>
        </div>
      </div>

      {/* Search form */}
      <div className="rounded-2xl p-5"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Company */}
          <div>
            <label className="block text-[11px] font-bold text-white/35 uppercase tracking-widest mb-2">
              Entreprise *
            </label>
            <div className="relative">
              <Building2 size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
              <input
                type="text" value={company}
                onChange={e => setCompany(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Ex: Bouygues Construction, EDF Renouvelables…"
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white/80 placeholder-white/18 focus:outline-none transition-all"
                style={inputStyle}
                onFocus={e => Object.assign(e.currentTarget.style, inputFocus)}
                onBlur={e => Object.assign(e.currentTarget.style, inputStyle)}
              />
            </div>
          </div>

          {/* Job title */}
          <div>
            <label className="block text-[11px] font-bold text-white/35 uppercase tracking-widest mb-2">
              Poste / Fonction *
            </label>
            <div className="relative">
              <Briefcase size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
              <input
                type="text" value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Ex: Directeur commercial, Responsable appels d'offres…"
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white/80 placeholder-white/18 focus:outline-none transition-all"
                style={inputStyle}
                onFocus={e => Object.assign(e.currentTarget.style, inputFocus)}
                onBlur={e => Object.assign(e.currentTarget.style, inputStyle)}
              />
            </div>
          </div>
        </div>

        {/* Quick job suggestions */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-[10px] text-white/25 font-medium self-center">Postes fréquents :</span>
          {['Directeur commercial', 'Responsable marchés publics', 'Chef de projet', 'Ingénieur d\'affaires', 'Responsable appels d\'offres', 'DG', 'PDG'].map(s => (
            <button key={s} onClick={() => setJobTitle(s)}
              className="text-[10px] px-2.5 py-1 rounded-lg transition-all font-medium"
              style={{
                background: jobTitle === s ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.04)',
                border: jobTitle === s ? '1px solid rgba(59,130,246,0.30)' : '1px solid rgba(255,255,255,0.08)',
                color: jobTitle === s ? '#93c5fd' : 'rgba(255,255,255,0.38)',
              }}>
              {s}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-4"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)' }}>
            <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        <button
          onClick={handleSearch}
          disabled={!company.trim() || !jobTitle.trim() || loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all"
          style={{
            background: !company.trim() || !jobTitle.trim() || loading
              ? 'rgba(255,255,255,0.05)'
              : 'linear-gradient(135deg, #0a66c2, #0052a3)',
            border: !company.trim() || !jobTitle.trim() || loading
              ? '1px solid rgba(255,255,255,0.08)'
              : '1px solid rgba(10,102,194,0.40)',
            color: !company.trim() || !jobTitle.trim() || loading ? 'rgba(255,255,255,0.25)' : 'white',
            boxShadow: !company.trim() || !jobTitle.trim() || loading ? 'none' : '0 4px 16px rgba(10,102,194,0.30)',
            cursor: !company.trim() || !jobTitle.trim() || loading ? 'not-allowed' : 'pointer',
          }}>
          {loading
            ? <><Loader2 size={15} className="animate-spin" />Recherche en cours…</>
            : <><Linkedin size={15} />Rechercher les profils LinkedIn</>
          }
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl p-5 space-y-3"
          style={{ background: 'rgba(10,102,194,0.06)', border: '1px solid rgba(10,102,194,0.18)' }}>
          <div className="flex items-center gap-3">
            <Loader2 size={16} className="text-blue-400 animate-spin flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white/80">Recherche des profils LinkedIn…</p>
              <p className="text-[10px] text-white/35 mt-0.5">
                Recherche <strong className="text-white/55">&ldquo;{jobTitle}&rdquo;</strong> chez <strong className="text-white/55">&ldquo;{company}&rdquo;</strong>
              </p>
            </div>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full animate-pulse" style={{ width: '70%', background: 'linear-gradient(90deg, #0a66c2, #3b82f6)' }} />
          </div>
        </div>
      )}

      {/* Results */}
      {searched && !loading && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-sm font-bold text-white">{profiles.length} profil{profiles.length > 1 ? 's' : ''} trouvé{profiles.length > 1 ? 's' : ''}</span>
              <span className="text-xs text-white/30">{jobTitle} · {company}</span>
              {isDemo ? (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#fcd34d' }}>
                  ✦ Démo — aucun résultat réel trouvé
                </span>
              ) : source && (
                <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
                  ✓ {source === 'duckduckgo' ? 'DuckDuckGo' : source === 'scraperapi' ? 'Bing · ScraperAPI' : source === 'serpapi' ? 'Google · SerpAPI' : source === 'rapidapi' ? 'LinkedIn API' : source}
                </span>
              )}
            </div>
            {profiles.length > 0 && (
              <button onClick={downloadCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white/65 hover:text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
                <Download size={12} />Exporter CSV
              </button>
            )}
          </div>

          {profiles.length === 0 ? (
            <div className="rounded-2xl p-10 text-center"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.09)' }}>
              <UserSearch size={28} className="mx-auto text-white/15 mb-3" />
              <p className="text-sm text-white/45 font-semibold">Aucun profil trouvé</p>
              <p className="text-xs text-white/25 mt-1">Essayez avec un autre nom d&apos;entreprise ou un poste différent</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {profiles.map((p, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group hover:-translate-y-px"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    animationDelay: `${i * 35}ms`,
                  }}>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-extrabold text-white"
                    style={{ background: `linear-gradient(135deg, hsl(${(i * 40) % 360}, 60%, 40%), hsl(${(i * 40 + 60) % 360}, 60%, 30%))` }}>
                    {p.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-white/88 truncate">{p.name}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[11px] text-blue-400/70 flex items-center gap-1 flex-shrink-0">
                        <Briefcase size={9} />{p.title}
                      </span>
                      <span className="text-white/15">·</span>
                      <span className="text-[11px] text-white/38 flex items-center gap-1">
                        <Building2 size={9} />{p.company}
                      </span>
                      {p.location && (
                        <>
                          <span className="text-white/15">·</span>
                          <span className="text-[11px] text-white/28 flex items-center gap-1">
                            <MapPin size={9} />{p.location}
                          </span>
                        </>
                      )}
                    </div>
                    {p.snippet && (
                      <p className="text-[10px] text-white/25 mt-0.5 truncate">{p.snippet}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => copyUrl(p.linkedin_url)}
                      className="p-2 rounded-xl text-white/25 hover:text-white/60 hover:bg-white/8 transition-all"
                      title="Copier l'URL">
                      {copiedUrl === p.linkedin_url
                        ? <Check size={13} className="text-emerald-400" />
                        : <Copy size={13} />
                      }
                    </button>
                    <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
                      style={{ background: 'rgba(10,102,194,0.15)', border: '1px solid rgba(10,102,194,0.25)', color: '#5b9bd5' }}>
                      <Linkedin size={11} />Voir le profil
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

const BLANK_ROW: ParsedRow = { first_name: '', last_name: '', company: '', linkedin_url: '' }

function parseBulkText(text: string): ParsedRow[] {
  const rows: ParsedRow[] = []
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // linkedin.com URL → extract slug as hint
    const liMatch = trimmed.match(/linkedin\.com\/in\/([\w-]+)/i)

    // CSV: prenom,nom,entreprise[,linkedin]
    const parts = trimmed.split(/[,;\t]/).map(p => p.trim())
    if (parts.length >= 3 && !parts[0].startsWith('http')) {
      rows.push({
        first_name:   parts[0],
        last_name:    parts[1],
        company:      parts[2],
        linkedin_url: parts[3] ?? '',
      })
      continue
    }

    // Just a LinkedIn URL — extract name hint from slug
    if (liMatch) {
      const slug = liMatch[1]
      const nameParts = slug.split('-').filter(p => p.length > 1)
      rows.push({
        first_name:   nameParts[0] ?? '',
        last_name:    nameParts.slice(1).join(' ') ?? '',
        company:      '',
        linkedin_url: trimmed,
      })
    }
  }
  return rows.slice(0, 20)
}

export default function EnrichmentPage() {
  const [pageMode, setPageMode] = useState<'find-contacts' | 'linkedin-search'>('find-contacts')
  const [rows, setRows]       = useState<ParsedRow[]>([{ ...BLANK_ROW }])
  const [bulkText, setBulk]   = useState('')
  const [inputMode, setMode]  = useState<'manual' | 'bulk'>('manual')
  const [results, setResults] = useState<EnrichedContact[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError]     = useState<string | null>(null)
  const [step, setStep]       = useState<'form' | 'results'>('form')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      if (inputMode === 'bulk') setBulk(prev => prev ? `${prev}\n${text}` : text)
      else setRows(parseBulkText(text))
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const activeRows = inputMode === 'bulk' ? parseBulkText(bulkText) : rows.filter(r => r.first_name && r.last_name && r.company)
  const canSearch = activeRows.length > 0

  async function handleSearch() {
    setError(null)
    setLoading(true)
    setProgress(0)

    try {
      const contacts: ContactInput[] = activeRows.map(r => ({
        first_name:   r.first_name.trim(),
        last_name:    r.last_name.trim(),
        company:      r.company.trim(),
        linkedin_url: r.linkedin_url?.trim() || undefined,
        domain:       r.domain?.trim() || undefined,
      }))

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 100 / (contacts.length * 3 + 5), 88))
      }, 400)

      const res = await fetch('/api/enrichment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts }),
      })

      clearInterval(progressInterval)
      setProgress(100)

      const data = await res.json() as { results?: EnrichedContact[]; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue')

      setResults(data.results ?? [])
      setStep('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
      setTimeout(() => setProgress(0), 500)
    }
  }

  function downloadCSV() {
    const header = 'Nom,Entreprise,Email principal,Confiance,Emails alternatifs,Téléphones,LinkedIn,SIREN,Domain,Sources'
    const rows = results.map(r => {
      const mainEmail = r.emails[0]?.address ?? ''
      const altEmails = r.emails.slice(1).map(e => e.address).join(' | ')
      const phones    = r.phones.join(' | ')
      return [
        `"${r.full_name}"`, `"${r.company}"`, `"${mainEmail}"`, r.confidence,
        `"${altEmails}"`, `"${phones}"`,
        `"${r.linkedin_url ?? ''}"`, `"${r.siren ?? ''}"`,
        `"${r.domain ?? ''}"`, `"${r.sources.join(', ')}"`,
      ].join(',')
    })
    const csv = [header, ...rows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'contacts-enrichis.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  // Stats
  const highCount   = results.filter(r => r.confidence === 'high').length
  const emailsFound = results.filter(r => r.emails.length > 0).length
  const phonesFound = results.filter(r => r.phones.length > 0).length
  const verifiedEmails = results.reduce((acc, r) => acc + r.emails.filter(e => e.verified).length, 0)

  return (
    <div className="flex flex-col min-h-0">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 md:px-6 flex-shrink-0 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.055)', background: 'rgba(8,14,34,0.80)', backdropFilter: 'blur(16px)', minHeight: '3.5rem' }}>
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-base font-semibold text-white">Find contacts IA</h1>
            <p className="text-xs text-white/35">Enrichissement emails · Profils LinkedIn</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Mode tabs */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {([
              { id: 'find-contacts', icon: Mail,       label: 'Find emails' },
              { id: 'linkedin-search', icon: Linkedin, label: 'Profils LinkedIn' },
            ] as const).map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setPageMode(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[11px] font-bold transition-all"
                style={pageMode === id
                  ? { background: 'rgba(59,130,246,0.22)', border: '1px solid rgba(59,130,246,0.35)', color: '#93c5fd' }
                  : { color: 'rgba(255,255,255,0.35)', border: '1px solid transparent' }}>
                <Icon size={11} />{label}
              </button>
            ))}
          </div>
          {pageMode === 'find-contacts' && step === 'results' && (
            <div className="flex items-center gap-2">
              <button onClick={() => { setStep('form'); setResults([]) }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white/50 hover:text-white/80 transition-all hover:bg-white/5">
                <RefreshCw size={12} />Nouvelle recherche
              </button>
              <button onClick={downloadCSV}
                className="btn-primary flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white">
                <Download size={12} />Exporter CSV
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* LinkedIn search mode */}
        {pageMode === 'linkedin-search' && <LinkedInSearchSection />}

        {/* Find contacts mode */}
        {pageMode === 'find-contacts' && (
        <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">

          {/* ── Error ──────────────────────────────────────────────────── */}
          {error && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)' }}>
              <AlertTriangle size={15} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300 flex-1">{error}</p>
              <button onClick={() => setError(null)} className="p-1 hover:bg-white/10 rounded-lg transition-all flex-shrink-0">
                <X size={12} className="text-white/40" />
              </button>
            </div>
          )}

          {step === 'form' ? (
            <>
              {/* ── Hero ─────────────────────────────────────────────── */}
              <div className="relative overflow-hidden rounded-2xl px-5 py-5"
                style={{
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.10) 0%, rgba(139,92,246,0.07) 55%, rgba(8,14,34,0.55) 100%)',
                  border: '1px solid rgba(59,130,246,0.18)',
                  boxShadow: '0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
                }}>
                <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
                  style={{ background: 'radial-gradient(circle at top right, rgba(59,130,246,0.12) 0%, transparent 70%)' }} />
                <div className="relative">
                  <p className="text-[10px] font-bold uppercase tracking-[0.20em] text-blue-400/65 mb-1.5">Multi-sources · SMTP · IA</p>
                  <h2 className="text-lg font-extrabold text-white mb-1">Trouvez les emails et téléphones de vos prospects</h2>
                  <p className="text-sm text-white/40 mb-4 max-w-2xl">
                    Renseignez nom + entreprise (+ URL LinkedIn optionnelle). Le pipeline cherche sur le site web de l&apos;entreprise, le registre SIRENE/Pappers, vérifie les emails par SMTP et classe les résultats avec l&apos;IA.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { icon: Globe,    label: 'Scraping site web', color: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.20)',  text: 'text-blue-400'   },
                      { icon: Zap,      label: 'Vérif. SMTP',       color: 'rgba(16,185,129,0.10)',  border: 'rgba(16,185,129,0.18)',  text: 'text-emerald-400' },
                      { icon: Database, label: 'Pappers/SIRENE',    color: 'rgba(139,92,246,0.10)',  border: 'rgba(139,92,246,0.18)',  text: 'text-violet-400' },
                      { icon: BarChart3, label: 'Scoring IA',       color: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.18)',  text: 'text-amber-400'  },
                    ].map(({ icon: Icon, label, color, border, text }) => (
                      <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                        style={{ background: color, border: `1px solid ${border}` }}>
                        <Icon size={12} className={text} />
                        <p className="text-[10px] font-semibold text-white/60">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Input mode toggle ─────────────────────────────────── */}
              <div className="rounded-2xl p-5"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>

                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold text-white/80">Liste de contacts</p>
                  <div className="flex items-center gap-0.5 p-0.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {(['manual', 'bulk'] as const).map(m => (
                      <button key={m} onClick={() => setMode(m)}
                        className={cn('px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all', inputMode === m ? 'text-white' : 'text-white/35 hover:text-white/60')}
                        style={inputMode === m ? { background: 'rgba(59,130,246,0.25)', border: '1px solid rgba(59,130,246,0.35)' } : {}}>
                        {m === 'manual' ? 'Manuel' : 'Import texte'}
                      </button>
                    ))}
                  </div>
                </div>

                {inputMode === 'manual' ? (
                  <div className="space-y-2">
                    {rows.map((row, i) => (
                      <ContactRow key={i} row={row} index={i}
                        onChange={r => setRows(prev => prev.map((x, j) => j === i ? r : x))}
                        onRemove={() => setRows(prev => prev.filter((_, j) => j !== i))} />
                    ))}
                    <button onClick={() => setRows(prev => [...prev, { ...BLANK_ROW }])}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white/45 hover:text-white/70 transition-all mt-2"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid dashed', borderColor: 'rgba(255,255,255,0.08)' }}>
                      <Plus size={12} />Ajouter un contact
                    </button>
                  </div>
                ) : (
                  <div>
                    <textarea
                      value={bulkText}
                      onChange={e => setBulk(e.target.value)}
                      rows={8}
                      placeholder={`Collez une liste (une par ligne) :\n\nPrenom,Nom,Entreprise\nPrenom,Nom,Entreprise,https://linkedin.com/in/...\nhttps://linkedin.com/in/jean-dupont\nhttps://linkedin.com/in/marie-martin-acmesas`}
                      className="w-full px-4 py-3 rounded-xl text-xs text-white/75 placeholder:text-white/18 resize-none focus:outline-none font-mono transition-all"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
                      onFocus={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.40)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}
                    />
                    {bulkText && (
                      <p className="text-[10px] text-white/30 mt-2">
                        {parseBulkText(bulkText).length} contact{parseBulkText(bulkText).length > 1 ? 's' : ''} détecté{parseBulkText(bulkText).length > 1 ? 's' : ''}
                        {parseBulkText(bulkText).some(r => !r.company) && ' · ⚠️ Certains contacts n\'ont pas d\'entreprise (requis)'}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
                  <button onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white/45 hover:text-white/70 transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                    <Upload size={12} />Importer fichier CSV/TXT
                  </button>
                  <p className="text-[10px] text-white/20 ml-auto hidden sm:block">Max 20 contacts par recherche</p>
                </div>
              </div>

              {/* ── Progress bar (when loading) ───────────────────────── */}
              {loading && (
                <div className="rounded-2xl p-5 space-y-3"
                  style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.18)' }}>
                  <div className="flex items-center gap-3">
                    <Loader2 size={16} className="text-blue-400 animate-spin flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white/80">
                        Enrichissement de {activeRows.length} contact{activeRows.length > 1 ? 's' : ''}…
                      </p>
                      <p className="text-[10px] text-white/35 mt-0.5">SMTP · Pappers · Scraping · IA scoring</p>
                    </div>
                    <span className="text-sm font-bold text-blue-400 tabular-nums">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }} />
                  </div>
                </div>
              )}

              {/* ── Search button ─────────────────────────────────────── */}
              {!loading && (
                <button onClick={handleSearch} disabled={!canSearch}
                  className={cn(
                    'w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl text-sm font-bold transition-all',
                    canSearch ? 'btn-primary text-white' : 'text-white/30 cursor-not-allowed',
                  )}
                  style={!canSearch ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' } : {}}>
                  <Search size={16} />
                  {canSearch
                    ? `Enrichir ${activeRows.length} contact${activeRows.length > 1 ? 's' : ''}`
                    : 'Ajoutez des contacts pour commencer'}
                </button>
              )}
            </>
          ) : (
            <>
              {/* ── Stats summary ─────────────────────────────────────── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Contacts enrichis', value: results.length,  icon: Users,      color: 'rgba(59,130,246,0.12)',   text: 'text-blue-400'    },
                  { label: 'Emails trouvés',     value: emailsFound,    icon: Mail,       color: 'rgba(16,185,129,0.10)',   text: 'text-emerald-400' },
                  { label: 'Emails vérifiés',    value: verifiedEmails, icon: ShieldCheck, color: 'rgba(139,92,246,0.10)',  text: 'text-violet-400'  },
                  { label: 'Téléphones',         value: phonesFound,    icon: Phone,      color: 'rgba(245,158,11,0.10)',   text: 'text-amber-400'   },
                ].map(({ label, value, icon: Icon, color, text }) => (
                  <div key={label} className="rounded-xl p-3 relative overflow-hidden"
                    style={{ background: color, border: '1px solid rgba(255,255,255,0.07)' }}>
                    <Icon size={13} className={cn(text, 'mb-2')} />
                    <p className={cn('text-2xl font-extrabold tabular-nums leading-none', text)}>{value}</p>
                    <p className="text-[9px] text-white/35 mt-1">{label}</p>
                  </div>
                ))}
              </div>

              {/* ── Confidence breakdown ──────────────────────────────── */}
              {highCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)' }}>
                  <ShieldCheck size={14} className="text-emerald-400 flex-shrink-0" />
                  <p className="text-xs text-emerald-300/80">
                    <span className="font-bold">{highCount} contact{highCount > 1 ? 's' : ''}</span> avec confiance élevée — email vérifié par SMTP ou trouvé directement sur le site web
                  </p>
                </div>
              )}

              {/* ── Results ───────────────────────────────────────────── */}
              <div className="space-y-3">
                {results.map((r, i) => (
                  <ContactCard key={`${r.full_name}-${i}`} result={r} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
        )}
      </div>
    </div>
  )
}
