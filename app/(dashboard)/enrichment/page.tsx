'use client'

import { useState } from 'react'
import {
  Linkedin, Download, Copy, Check,
  Loader2, AlertTriangle,
  UserSearch, Building2, Briefcase, MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ── Types ─────────────────────────────────────────────────────────────────────

interface LinkedInProfile {
  name:         string
  title:        string
  company:      string
  location?:    string
  linkedin_url: string
  snippet?:     string
}

// ── Styles ────────────────────────────────────────────────────────────────────

const inputStyle  = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.8)' } as const
const inputFocus  = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(10,102,194,0.45)', outline: 'none' } as const

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LinkedInSearchPage() {
  const [company,   setCompany]   = useState('')
  const [jobTitle,  setJobTitle]  = useState('')
  const [profiles,  setProfiles]  = useState<LinkedInProfile[]>([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [searched,  setSearched]  = useState(false)
  const [isDemo,    setIsDemo]    = useState(false)
  const [source,    setSource]    = useState('')
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  async function handleSearch() {
    if (!company.trim() || !jobTitle.trim()) return
    setLoading(true); setError(null); setSearched(false)
    try {
      const res  = await fetch('/api/enrichment/linkedin-search', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ company: company.trim(), job_title: jobTitle.trim(), max_results: 15 }),
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
    const rows = profiles.map(p =>
      [`"${p.name}"`, `"${p.title}"`, `"${p.company}"`, `"${p.location ?? ''}"`, `"${p.linkedin_url}"`].join(',')
    )
    const csv  = ['Nom,Poste,Entreprise,Localisation,LinkedIn', ...rows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url
    a.download = `linkedin-${company.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const sourceLabel =
    source === 'duckduckgo' ? 'DuckDuckGo'       :
    source === 'scraperapi' ? 'Bing · ScraperAPI' :
    source === 'serpapi'    ? 'Google · SerpAPI'  :
    source === 'rapidapi'   ? 'LinkedIn API'      : source

  return (
    <div className="flex flex-col min-h-0">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 md:px-6 flex-shrink-0 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.055)', background: 'rgba(8,14,34,0.80)', backdropFilter: 'blur(16px)', minHeight: '3.5rem' }}>
        <div>
          <h1 className="text-base font-semibold text-white">Find LinkedIn</h1>
          <p className="text-xs text-white/35">Recherche de profils LinkedIn</p>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
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
              <div>
                <label className="block text-[11px] font-bold text-white/35 uppercase tracking-widest mb-2">Entreprise *</label>
                <div className="relative">
                  <Building2 size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                  <input
                    type="text" value={company}
                    onChange={e => setCompany(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Ex: Bouygues Construction, EDF Renouvelables…"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm placeholder-white/18 focus:outline-none transition-all"
                    style={inputStyle}
                    onFocus={e => Object.assign(e.currentTarget.style, inputFocus)}
                    onBlur={e => Object.assign(e.currentTarget.style, inputStyle)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-white/35 uppercase tracking-widest mb-2">Poste / Fonction *</label>
                <div className="relative">
                  <Briefcase size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                  <input
                    type="text" value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Ex: Directeur commercial, Responsable appels d'offres…"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm placeholder-white/18 focus:outline-none transition-all"
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
                    border:     jobTitle === s ? '1px solid rgba(59,130,246,0.30)' : '1px solid rgba(255,255,255,0.08)',
                    color:      jobTitle === s ? '#93c5fd' : 'rgba(255,255,255,0.38)',
                  }}>
                  {s}
                </button>
              ))}
            </div>

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
                  ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #0a66c2, #0052a3)',
                border: !company.trim() || !jobTitle.trim() || loading
                  ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(10,102,194,0.40)',
                color:  !company.trim() || !jobTitle.trim() || loading ? 'rgba(255,255,255,0.25)' : 'white',
                boxShadow: !company.trim() || !jobTitle.trim() || loading ? 'none' : '0 4px 16px rgba(10,102,194,0.30)',
                cursor: !company.trim() || !jobTitle.trim() || loading ? 'not-allowed' : 'pointer',
              }}>
              {loading
                ? <><Loader2 size={15} className="animate-spin" />Recherche en cours…</>
                : <><Linkedin size={15} />Rechercher les profils LinkedIn</>
              }
            </button>
          </div>

          {/* Loading bar */}
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
                  ) : sourceLabel && (
                    <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
                      ✓ {sourceLabel}
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
                        border:     '1px solid rgba(255,255,255,0.08)',
                      }}>

                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-extrabold text-white"
                        style={{ background: `linear-gradient(135deg, hsl(${(i * 40) % 360}, 60%, 40%), hsl(${(i * 40 + 60) % 360}, 60%, 30%))` }}>
                        {p.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white/88 truncate">{p.name}</p>
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
                        {p.snippet && <p className="text-[10px] text-white/25 mt-0.5 truncate">{p.snippet}</p>}
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
      </div>
    </div>
  )
}
