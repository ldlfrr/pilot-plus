'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  MapPin, Plus, Trash2, Loader2, Download, Building2,
  AlertCircle, Search, X, RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Project, AnalysisResult } from '@/types'
import type { Agency } from '@/app/api/settings/agencies/route'

// ─── Exported so MapInner can import it ───────────────────────────────────────
export interface MapPoint {
  id:      string
  label:   string
  address: string
  lat:     number
  lng:     number
  type:    'project' | 'agency' | 'extra'
}

// ─── Dynamic import (no SSR) ─────────────────────────────────────────────────
const MapInner = dynamic(
  () => import('./MapInner').then(m => m.MapInner),
  { ssr: false, loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#1a1d2e] rounded-xl">
      <Loader2 size={24} className="animate-spin text-blue-400" />
    </div>
  )}
)

// ─── Nominatim geocoder ───────────────────────────────────────────────────────
async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const q   = encodeURIComponent(address)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=fr`,
      { headers: { 'Accept-Language': 'fr' } }
    )
    const json = await res.json()
    if (!json[0]) return null
    return { lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) }
  } catch { return null }
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface ExtraPoint {
  id:      string
  label:   string
  address: string
  lat:     number
  lng:     number
}

// ─── Component ────────────────────────────────────────────────────────────────
export function MapTab({
  project,
  analysisResult,
  isActive = true,
}: {
  project:         Project
  analysisResult?: AnalysisResult | null
  isActive?:       boolean
}) {
  const [points,        setPoints]       = useState<MapPoint[]>([])
  const [agencies,      setAgencies]     = useState<Agency[]>([])
  const [extras,        setExtras]       = useState<ExtraPoint[]>([])
  const [geocoding,     setGeocoding]    = useState(false)
  const [savingAgency,  setSavingAgency] = useState(false)
  const [error,         setError]        = useState<string | null>(null)

  // Add-agency form
  const [agencyName,    setAgencyName]   = useState('')
  const [agencyAddr,    setAgencyAddr]   = useState('')
  const [agencySearch,  setAgencySearch] = useState('')

  // Add-extra form
  const [extraName,     setExtraName]    = useState('')
  const [extraAddr,     setExtraAddr]    = useState('')

  const mapRef = useRef<HTMLDivElement>(null)

  // ── Build MapPoints whenever data changes ───────────────────────────────────
  useEffect(() => {
    const all: MapPoint[] = []

    // Project sites
    extras.forEach(e => {
      all.push({ id: e.id, label: e.label, address: e.address, lat: e.lat, lng: e.lng, type: 'extra' })
    })
    // Agencies
    agencies.forEach(a => {
      all.push({ id: `agency-${a.id}`, label: a.name, address: a.address, lat: a.lat, lng: a.lng, type: 'agency' })
    })

    setPoints(all)
  }, [agencies, extras])

  // ── Load agencies + geocode project on mount ────────────────────────────────
  useEffect(() => {
    // Load agencies
    fetch('/api/settings/agencies')
      .then(r => r.json())
      .then(d => setAgencies(d.agencies ?? []))
      .catch(() => {})

    // Geocode project location(s)
    geocodeProjectSites()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id])

  async function geocodeProjectSites() {
    setGeocoding(true)
    const addresses: { label: string; address: string }[] = []

    // Main project location
    if (project.location) {
      addresses.push({ label: project.name || 'Site projet', address: project.location })
    }

    // Additional sites from analysis (repartition / sites field)
    if (analysisResult?.sites && analysisResult.sites !== 'NON PRÉCISÉ') {
      // Try to parse multiple sites if comma/newline separated
      const rawSites = analysisResult.sites
      if (!rawSites.toLowerCase().includes(project.location?.toLowerCase() ?? 'XXXXXX')) {
        addresses.push({ label: 'Sites (analyse)', address: rawSites })
      }
    }

    const geocoded: ExtraPoint[] = []
    for (const { label, address } of addresses) {
      const coords = await geocode(address)
      if (coords) {
        geocoded.push({ id: `project-${geocoded.length}`, label, address, ...coords })
      }
    }

    // If project location failed, try a simpler search
    if (geocoded.length === 0 && project.location) {
      const simplified = project.location.replace(/^\d+\s+/, '').trim()
      const coords = await geocode(simplified)
      if (coords) {
        geocoded.push({ id: 'project-0', label: project.name || 'Site projet', address: project.location, ...coords })
      }
    }

    setExtras(prev => {
      // Keep user-added extras, replace auto-geocoded ones
      const userExtras = prev.filter(e => !e.id.startsWith('project-'))
      return [...geocoded, ...userExtras]
    })
    setGeocoding(false)
  }

  // ── Save agencies to Supabase ───────────────────────────────────────────────
  const saveAgencies = useCallback(async (updated: Agency[]) => {
    await fetch('/api/settings/agencies', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agencies: updated }),
    })
  }, [])

  // ── Add agency ─────────────────────────────────────────────────────────────
  async function handleAddAgency() {
    if (!agencyName.trim() || !agencyAddr.trim()) return
    setSavingAgency(true); setError(null)
    try {
      const coords = await geocode(agencyAddr)
      if (!coords) throw new Error(`Adresse introuvable : "${agencyAddr}"`)
      const agency: Agency = {
        id:      crypto.randomUUID(),
        name:    agencyName.trim(),
        address: agencyAddr.trim(),
        ...coords,
      }
      const updated = [...agencies, agency]
      setAgencies(updated)
      await saveAgencies(updated)
      setAgencyName(''); setAgencyAddr('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally { setSavingAgency(false) }
  }

  // ── Remove agency ──────────────────────────────────────────────────────────
  async function handleRemoveAgency(id: string) {
    const updated = agencies.filter(a => a.id !== id)
    setAgencies(updated)
    await saveAgencies(updated)
  }

  // ── Add extra point (project-specific) ────────────────────────────────────
  async function handleAddExtra() {
    if (!extraAddr.trim()) return
    setSavingAgency(true); setError(null)
    try {
      const coords = await geocode(extraAddr)
      if (!coords) throw new Error(`Adresse introuvable : "${extraAddr}"`)
      const extra: ExtraPoint = {
        id:      `extra-${crypto.randomUUID()}`,
        label:   extraName.trim() || extraAddr.trim(),
        address: extraAddr.trim(),
        ...coords,
      }
      setExtras(prev => [...prev, extra])
      setExtraName(''); setExtraAddr('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally { setSavingAgency(false) }
  }

  // ── Export map as PNG ──────────────────────────────────────────────────────
  async function handleExport() {
    try {
      const html2canvas = (await import('html2canvas')).default
      const mapEl = document.querySelector('.leaflet-container') as HTMLElement
      if (!mapEl) return
      const canvas = await html2canvas(mapEl, { useCORS: true, logging: false })
      const link = document.createElement('a')
      link.download = `carte_${project.name || 'projet'}_${new Date().toISOString().slice(0,10)}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch { /* html2canvas not available */ }
  }

  // ── Filter agencies by search ──────────────────────────────────────────────
  const filteredAgencies = agencies.filter(a =>
    !agencySearch || a.name.toLowerCase().includes(agencySearch.toLowerCase()) ||
    a.address.toLowerCase().includes(agencySearch.toLowerCase())
  )

  // Project points (auto-geocoded)
  const projectPoints = extras.filter(e => e.id.startsWith('project-'))
  // User-added extra points
  const userExtras    = extras.filter(e => e.id.startsWith('extra-'))

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-220px)] min-h-[500px]">

      {/* ── Map ──────────────────────────────────────────────────────────── */}
      <div ref={mapRef} className="flex-1 min-h-[300px] lg:min-h-0 relative">
        <MapInner points={points} isActive={isActive} />

        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-[999] bg-[#0e1117]/90 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2.5 space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
            <span className="text-white/60">Site projet</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-violet-500 flex-shrink-0" />
            <span className="text-white/60">Agence</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0" />
            <span className="text-white/60">Point extra</span>
          </div>
        </div>

        {/* Export button */}
        <button
          onClick={handleExport}
          className="absolute top-3 right-3 z-[999] flex items-center gap-1.5 px-3 py-2 bg-[#0e1117]/90 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white text-xs font-medium rounded-lg transition-all"
        >
          <Download size={13} />Export PNG
        </button>

        {/* Regeocode button */}
        <button
          onClick={geocodeProjectSites}
          disabled={geocoding}
          title="Repositionner le site du projet"
          className="absolute top-3 left-3 z-[999] flex items-center gap-1.5 px-3 py-2 bg-[#0e1117]/90 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white text-xs font-medium rounded-lg transition-all disabled:opacity-40"
        >
          {geocoding ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          Recalculer
        </button>
      </div>

      {/* ── Side panel ───────────────────────────────────────────────────── */}
      <div className="w-full lg:w-80 flex flex-col gap-3 overflow-y-auto">

        {/* Project sites */}
        <div className="bg-[#1a1d2e] border border-white/8 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={14} className="text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Site(s) du projet</h3>
          </div>
          {projectPoints.length > 0 ? (
            <div className="space-y-1.5">
              {projectPoints.map(p => (
                <div key={p.id} className="flex items-start gap-2 bg-blue-950/20 border border-blue-500/20 rounded-lg px-2.5 py-2">
                  <MapPin size={12} className="text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{p.label}</p>
                    <p className="text-[11px] text-white/40 truncate">{p.address}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/30 italic">
              {geocoding ? 'Géocodage...' : `Adresse : ${project.location || 'non renseignée'}`}
            </p>
          )}

          {/* Add extra point for this project */}
          <div className="mt-3 space-y-2">
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider">Ajouter un point</p>
            <input
              value={extraName}
              onChange={e => setExtraName(e.target.value)}
              placeholder="Nom (optionnel)"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50"
            />
            <div className="flex gap-1.5">
              <input
                value={extraAddr}
                onChange={e => setExtraAddr(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddExtra()}
                placeholder="Adresse..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50"
              />
              <button
                onClick={handleAddExtra}
                disabled={!extraAddr.trim() || savingAgency}
                className="px-2.5 py-1.5 bg-amber-600/30 hover:bg-amber-600/40 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Company agencies */}
        <div className="bg-[#1a1d2e] border border-white/8 rounded-xl p-4 flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={14} className="text-violet-400" />
            <h3 className="text-sm font-semibold text-white">Agences</h3>
            <span className="ml-auto text-xs text-white/30">{agencies.length}</span>
          </div>

          {/* Search */}
          {agencies.length > 3 && (
            <div className="relative mb-2">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                value={agencySearch}
                onChange={e => setAgencySearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50"
              />
            </div>
          )}

          {/* Agency list */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto mb-3">
            {filteredAgencies.length === 0 && (
              <p className="text-xs text-white/30 italic">Aucune agence ajoutée</p>
            )}
            {filteredAgencies.map(a => (
              <div key={a.id} className="flex items-start gap-2 bg-violet-950/20 border border-violet-500/20 rounded-lg px-2.5 py-2 group">
                <Building2 size={12} className="text-violet-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-white truncate">{a.name}</p>
                  <p className="text-[11px] text-white/40 truncate">{a.address}</p>
                </div>
                <button
                  onClick={() => handleRemoveAgency(a.id)}
                  className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all flex-shrink-0"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Add agency form */}
          <div className="border-t border-white/5 pt-3 space-y-2">
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider">Ajouter une agence</p>
            <input
              value={agencyName}
              onChange={e => setAgencyName(e.target.value)}
              placeholder="Nom de l'agence"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50"
            />
            <div className="flex gap-1.5">
              <input
                value={agencyAddr}
                onChange={e => setAgencyAddr(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddAgency()}
                placeholder="Adresse complète..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50"
              />
              <button
                onClick={handleAddAgency}
                disabled={!agencyName.trim() || !agencyAddr.trim() || savingAgency}
                className="px-2.5 py-1.5 bg-violet-600/30 hover:bg-violet-600/40 border border-violet-500/30 text-violet-300 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
              >
                {savingAgency ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400 bg-red-950/30 border border-red-800/40 rounded-lg px-2.5 py-2">
              <AlertCircle size={12} className="flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* User-added extra points */}
        {userExtras.length > 0 && (
          <div className="bg-[#1a1d2e] border border-white/8 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={14} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Points extra</h3>
            </div>
            <div className="space-y-1.5">
              {userExtras.map(e => (
                <div key={e.id} className="flex items-start gap-2 bg-amber-950/20 border border-amber-500/20 rounded-lg px-2.5 py-2 group">
                  <MapPin size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white truncate">{e.label}</p>
                    <p className="text-[11px] text-white/40 truncate">{e.address}</p>
                  </div>
                  <button
                    onClick={() => setExtras(prev => prev.filter(x => x.id !== e.id))}
                    className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all flex-shrink-0"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
