import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'PILOT+ — Analyseur DCE & Appels d\'offres par IA'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: 'linear-gradient(145deg, #060a1c 0%, #080e28 50%, #05091a 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Grid background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />

        {/* Blue orb top-right */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(59,130,246,0.40)',
            }}
          >
            <span style={{ color: 'white', fontSize: '20px', fontWeight: 900, letterSpacing: '-0.05em' }}>P+</span>
          </div>
          <span style={{ color: 'white', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em' }}>
            PILOT<span style={{ color: '#60a5fa' }}>+</span>
          </span>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'rgba(96,165,250,0.55)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginLeft: '4px',
              marginTop: '4px',
            }}
          >
            Propulsé par Claude AI
          </span>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 18px',
              borderRadius: '999px',
              background: 'rgba(59,130,246,0.12)',
              border: '1px solid rgba(59,130,246,0.25)',
              width: 'fit-content',
            }}
          >
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#60a5fa' }} />
            <span style={{ color: '#93c5fd', fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Analyseur DCE · Score Go/No Go · Veille BOAMP
            </span>
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: '72px',
              fontWeight: 900,
              color: 'white',
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
            }}
          >
            Gagnez plus<br />
            <span
              style={{
                background: 'linear-gradient(90deg, #60a5fa, #22d3ee, #60a5fa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              d&apos;appels d&apos;offres.
            </span>
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: '22px',
              color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.5,
              maxWidth: '700px',
            }}
          >
            Analyse DCE en 30 secondes · Score Go/No Go IA · Veille BOAMP · Pipeline commercial · BTP & ENR
          </p>
        </div>

        {/* Bottom badges */}
        <div style={{ display: 'flex', gap: '16px', position: 'relative' }}>
          {[
            { text: '⚡ Analyse en 30 secondes', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)', color: '#93c5fd' },
            { text: '🎯 Score Go/No Go',          bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.22)', color: '#6ee7b7' },
            { text: '📡 Veille BOAMP auto',        bg: 'rgba(139,92,246,0.10)', border: 'rgba(139,92,246,0.22)', color: '#c4b5fd' },
            { text: '🏗️ BTP & ENR',               bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.22)', color: '#fde68a' },
          ].map(({ text, bg, border, color }) => (
            <div
              key={text}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                background: bg,
                border: `1px solid ${border}`,
                color,
                fontSize: '15px',
                fontWeight: 600,
              }}
            >
              {text}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}
