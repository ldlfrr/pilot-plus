'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import {
  Loader2, Lock, ExternalLink, Building, MapPin, Calendar,
  Target, FileText, CheckCircle2, AlertTriangle, TrendingUp,
  ArrowUpRight, Hash, Zap,
} from 'lucide-react'
import type { Project, ProjectAnalysis, ProjectScore } from '@/types'

interface ShareData {
  project: Project
  analysis: ProjectAnalysis | null
  score: ProjectScore | null
}

const VERDICT_CFG = {
  GO:        { label: 'GO',        bg: 'bg-emerald-500/20 border-emerald-500/40', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  A_ETUDIER: { label: 'À ÉTUDIER', bg: 'bg-amber-500/20 border-amber-500/40',    text: 'text-amber-400',   dot: 'bg-amber-400' },
  NO_GO:     { label: 'NO GO',     bg: 'bg-red-500/20 border-red-500/40',         text: 'text-red-400',     dot: 'bg-red-400' },
}

export default function SharePage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData]     = useState<ShareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/share/${token}`)
      .then(r => { if (!r.ok) throw new Error('Lien invalide ou expiré'); return r.json() })
      .then((d: ShareData) => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [token])

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#05091a] gap-3">
      <Loader2 className="animate-spin text-blue-400" size={24} />
      <p className="text-white/30 text-sm">Chargement…</p>
    </div>
  )

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#05091a] gap-4">
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
        <Lock size={22} className="text-white/25" />
      </div>
      <p className="text-white/50 text-sm">{error ?? 'Lien invalide ou expiré'}</p>
      <Link href="/login" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
        Accéder à PILOT+ →
      </Link>
    </div>
  )

  const { project, analysis, score } = data
  const result = analysis?.result
  const verdict = score?.verdict
  const verdictCfg = verdict ? VERDICT_CFG[verdict] : null

  return (
    <div className="min-h-screen" style={{ background: '#05091a' }}>

      {/* ── Topbar ───────────────────────────────────────────────────── */}
      <div style={{ background: 'rgba(8,14,34,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}
        className="sticky top-0 z-20 px-4 md:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* CSS Logo */}
          <div>
            <p className="text-[15px] font-extrabold text-white tracking-tight leading-none">
              PILOT<span className="text-blue-400">+</span>
            </p>
            <p className="text-[8px] text-white/25 font-semibold tracking-widest uppercase">Copilot IA</p>
          </div>
          <span className="hidden sm:block text-white/10">|</span>
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-white/30">
            <Lock size={10} />Partagé en lecture seule
          </span>
        </div>
        <Link
          href="/login"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
        >
          Essayer PILOT+ <ArrowUpRight size={11} />
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-5">

        {/* ── Project hero ──────────────────────────────────────────── */}
        <div className="bg-[rgba(13,18,36,0.8)] border border-white/8 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              {result?.type_projet && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400/60 mb-1.5">
                  {result.type_projet}
                </p>
              )}
              <h1 className="text-xl font-bold text-white leading-tight">{project.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-white/40">
                <span className="flex items-center gap-1.5"><Building size={11} />{project.client}</span>
                <span className="flex items-center gap-1.5"><MapPin size={11} />{project.location}</span>
                {project.offer_deadline && (
                  <span className="flex items-center gap-1.5 text-amber-400/60">
                    <Calendar size={11} />
                    {new Date(project.offer_deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>

            {/* Score badge */}
            {score && verdictCfg && (
              <div className={cn('flex flex-col items-center px-5 py-3 rounded-xl border flex-shrink-0', verdictCfg.bg)}>
                <span className={cn('text-2xl font-extrabold tabular-nums', verdictCfg.text)}>{score.total_score}</span>
                <span className="text-[9px] text-white/30 mt-0.5">/ 100</span>
                <span className={cn('mt-1.5 text-xs font-bold px-2 py-0.5 rounded-full border', verdictCfg.bg, verdictCfg.text)}>
                  {verdictCfg.label}
                </span>
              </div>
            )}
          </div>

          {/* Key metrics */}
          {result && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-white/5">
              {[
                { label: 'Puissance',   value: result.puissance ?? 'N/A',     icon: Zap },
                { label: 'Sites',       value: result.sites ?? 'N/A',         icon: MapPin },
                { label: 'Complexité',  value: result.complexite ?? 'N/A',    icon: TrendingUp },
                { label: 'Objet',       value: result.objet ?? 'N/A',         icon: Target },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-white/3 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-white/30 flex items-center gap-1 mb-1"><Icon size={9} />{label}</p>
                  <p className="text-xs font-semibold text-white/70 truncate">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Résumé exécutif ───────────────────────────────────────── */}
        {result?.resume_executif && (
          <div className="bg-[rgba(13,18,36,0.8)] border border-white/8 rounded-2xl p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Résumé exécutif</p>
            <p className="text-sm text-white/60 leading-relaxed">{result.resume_executif}</p>
          </div>
        )}

        {/* ── Score détaillé ────────────────────────────────────────── */}
        {score && (
          <div className="bg-[rgba(13,18,36,0.8)] border border-white/8 rounded-2xl p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-4">Scoring Go / No Go</p>
            <div className="space-y-3">
              {Object.entries(score.score_details).map(([key, detail]) => {
                const labels: Record<string, string> = {
                  rentabilite: 'Rentabilité', complexite: 'Complexité',
                  alignement_capacite: 'Alignement capacité', probabilite_gain: 'Probabilité de gain',
                  charge_interne: 'Charge interne',
                }
                const pct = Math.round((detail.score / 20) * 100)
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-white/55">{labels[key] ?? key}</span>
                      <span className="text-xs font-bold text-white/70 tabular-nums">{detail.score}/20</span>
                    </div>
                    <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all',
                          pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500')}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-white/30 mt-1 leading-relaxed">{detail.justification}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Points clés + risques ─────────────────────────────────── */}
        {result && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {result.points_cles.length > 0 && (
              <div className="bg-[rgba(13,18,36,0.8)] border border-white/8 rounded-2xl p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400/60 mb-3 flex items-center gap-1.5">
                  <FileText size={10} />Points clés
                </p>
                <ul className="space-y-2">
                  {result.points_cles.slice(0, 5).map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/55">
                      <CheckCircle2 size={11} className="text-blue-400/50 flex-shrink-0 mt-0.5" />{p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.risques.length > 0 && (
              <div className="bg-[rgba(13,18,36,0.8)] border border-white/8 rounded-2xl p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400/60 mb-3 flex items-center gap-1.5">
                  <AlertTriangle size={10} />Risques identifiés
                </p>
                <ul className="space-y-2">
                  {result.risques.slice(0, 5).map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/55">
                      <AlertTriangle size={11} className="text-amber-400/50 flex-shrink-0 mt-0.5" />{r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── Référence AO ─────────────────────────────────────────── */}
        {result?.ref_ao && result.ref_ao !== 'NON PRÉCISÉ' && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/3 border border-white/6">
            <Hash size={12} className="text-white/30" />
            <span className="text-xs text-white/40">Référence AO :</span>
            <span className="text-xs font-semibold text-white/60">{result.ref_ao}</span>
          </div>
        )}

      </div>

      {/* ── Footer CTA ───────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(8,14,34,0.8)' }}
        className="mt-12 px-6 py-12 text-center">
        <p className="text-[22px] font-extrabold text-white mb-1">
          PILOT<span className="text-blue-400">+</span>
        </p>
        <p className="text-sm text-white/30 mb-1">Copilot IA pour l&apos;analyse DCE et la décision Go/No Go</p>
        <p className="text-xs text-white/20 mb-6">Équipes commerciales ENR & BTP</p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/25"
        >
          Essayer gratuitement <ArrowUpRight size={14} />
        </Link>
      </div>

    </div>
  )
}
