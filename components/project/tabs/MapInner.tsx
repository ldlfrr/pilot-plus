'use client'

import { useEffect, useRef } from 'react'
import type { MapPoint } from './MapTab'

// All leaflet imports done lazily to avoid SSR issues
export function MapInner({ points, isActive }: { points: MapPoint[]; isActive: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<import('leaflet').Map | null>(null)
  const markersRef   = useRef<import('leaflet').Marker[]>([])

  // ── Init map once ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let map: import('leaflet').Map

    ;(async () => {
      const L = (await import('leaflet')).default

      // Fix default icons
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (!containerRef.current) return
      map = L.map(containerRef.current, {
        center:    [46.8, 2.3],
        zoom:      6,
        zoomControl: true,
        attributionControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map
    })()

    return () => {
      map?.remove()
      mapRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Invalidate size when tab becomes visible ────────────────────────────────
  useEffect(() => {
    if (!isActive || !mapRef.current) return
    setTimeout(() => mapRef.current?.invalidateSize(), 50)
  }, [isActive])

  // ── Update markers when points change ──────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) {
      // Map not ready yet — retry shortly
      const t = setTimeout(() => {
        updateMarkers()
      }, 300)
      return () => clearTimeout(t)
    }
    updateMarkers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points])

  function updateMarkers() {
    const map = mapRef.current
    if (!map) return

    ;(async () => {
      const L = (await import('leaflet')).default

      // Clear old markers
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []

      if (points.length === 0) return

      const COLORS: Record<MapPoint['type'], string> = {
        project: '#3b82f6',
        agency:  '#8b5cf6',
        extra:   '#f59e0b',
      }

      const newMarkers = points.map(p => {
        const color = COLORS[p.type]
        const icon  = L.divIcon({
          html: `
            <div style="
              position:relative;
              width:28px;height:28px;
              filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));
            ">
              <div style="
                width:22px;height:22px;
                background:${color};
                border:3px solid rgba(255,255,255,0.95);
                border-radius:50% 50% 50% 0;
                transform:rotate(-45deg);
                position:absolute;top:0;left:3px;
              "></div>
            </div>`,
          className:   '',
          iconSize:    [28, 28],
          iconAnchor:  [14, 28],
          popupAnchor: [0, -30],
        })

        const typeLabel = p.type === 'project' ? '📍 Site projet' : p.type === 'agency' ? '🏢 Agence' : '📌 Extra'
        const marker = L.marker([p.lat, p.lng], { icon })
          .bindPopup(`
            <div style="min-width:140px">
              <div style="font-weight:700;font-size:13px;margin-bottom:3px">${p.label}</div>
              <div style="font-size:11px;color:#94a3b8;margin-bottom:6px">${p.address}</div>
              <span style="
                font-size:10px;font-weight:600;padding:2px 8px;border-radius:999px;
                background:${color}22;color:${color};border:1px solid ${color}44;
              ">${typeLabel}</span>
            </div>
          `)
          .addTo(map)

        return marker
      })

      markersRef.current = newMarkers

      // Fit bounds
      if (newMarkers.length === 1) {
        map.setView([points[0].lat, points[0].lng], 13, { animate: true })
      } else {
        const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]))
        map.fitBounds(bounds, { padding: [60, 60], animate: true, maxZoom: 14 })
      }
    })()
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-xl overflow-hidden"
      style={{ minHeight: 300 }}
    />
  )
}
