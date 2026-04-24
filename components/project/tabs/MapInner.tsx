'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Loader2 } from 'lucide-react'
import type { Agency } from '@/app/api/settings/agencies/route'

// Fix default icon paths broken by webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Custom marker icons
function makeIcon(color: string, size = 32) {
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:3px solid rgba(255,255,255,0.9);
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 2px 8px rgba(0,0,0,0.4);
    "></div>`,
    className: '',
    iconSize:   [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor:[0, -size],
  })
}

const ICON_PROJECT  = makeIcon('#3b82f6', 34)  // blue
const ICON_AGENCY   = makeIcon('#8b5cf6', 28)  // violet
const ICON_EXTRA    = makeIcon('#f59e0b', 28)  // amber

export interface MapPoint {
  id:      string
  label:   string
  address: string
  lat:     number
  lng:     number
  type:    'project' | 'agency' | 'extra'
}

// Auto-fits the map to show all markers
function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 12)
      return
    }
    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]))
    map.fitBounds(bounds, { padding: [50, 50] })
  }, [map, points])
  return null
}

interface Props {
  points: MapPoint[]
  loading?: boolean
}

export function MapInner({ points, loading }: Props) {
  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      {loading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-[#0e1117]/60 backdrop-blur-sm">
          <Loader2 size={24} className="animate-spin text-blue-400" />
        </div>
      )}
      <MapContainer
        center={[46.8, 2.3]}
        zoom={6}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {points.map(p => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={p.type === 'project' ? ICON_PROJECT : p.type === 'agency' ? ICON_AGENCY : ICON_EXTRA}
          >
            <Popup>
              <div className="text-sm font-semibold">{p.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{p.address}</div>
              <div className="text-[10px] mt-1 px-1.5 py-0.5 rounded-full inline-block font-medium"
                style={{
                  background: p.type === 'project' ? '#eff6ff' : p.type === 'agency' ? '#f5f3ff' : '#fffbeb',
                  color:      p.type === 'project' ? '#1d4ed8' : p.type === 'agency' ? '#6d28d9' : '#b45309',
                }}>
                {p.type === 'project' ? '📍 Site projet' : p.type === 'agency' ? '🏢 Agence' : '📌 Point extra'}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
