'use client'

import { useEffect, useRef, useState } from 'react'

type ShapeType = 'circle' | 'square' | 'diamond' | 'cross'

interface Shape {
  id: number
  type: ShapeType
  size: number
  color: string
  opacity: number
  x: number   // vw %
  y: number   // vh %
  moveDuration: number   // ms — how long the movement takes
}

const COLORS = [
  'rgb(59,130,246)',   // blue
  'rgb(139,92,246)',   // purple
  'rgb(34,211,238)',   // cyan
  'rgb(255,255,255)',  // white
  'rgb(96,165,250)',   // blue-light
  'rgb(167,139,250)',  // violet-light
]

function rnd(min: number, max: number) { return min + Math.random() * (max - min) }
function rndInt(min: number, max: number) { return Math.floor(rnd(min, max + 1)) }

function makeShape(id: number): Shape {
  const types: ShapeType[] = ['circle', 'square', 'diamond', 'cross']
  return {
    id,
    type:         types[rndInt(0, 3)],
    size:         rnd(3.5, 6.5),
    color:        COLORS[rndInt(0, COLORS.length - 1)],
    opacity:      rnd(0.04, 0.10),
    x:            rnd(1, 99),
    y:            rnd(1, 99),
    moveDuration: rnd(9000, 20000),
  }
}

const COUNT = 16

// ── Cross shape as SVG dataURI ─────────────────────────────────────────────

function crossStyle(size: number, color: string, opacity: number) {
  const arm = Math.max(1, Math.round(size / 4))
  return {
    width:  size,
    height: size,
    opacity,
    background: `
      linear-gradient(${color}, ${color}) top/100% ${arm}px no-repeat center,
      linear-gradient(${color}, ${color}) left/${arm}px 100% no-repeat center
    `.trim(),
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FloatingShapes() {
  const [shapes, setShapes] = useState<Shape[]>([])
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Init once
  useEffect(() => {
    setShapes(Array.from({ length: COUNT }, (_, i) => makeShape(i)))
    return () => timersRef.current.forEach(clearTimeout)
  }, [])

  // Schedule movement per shape once shapes are initialized
  useEffect(() => {
    if (shapes.length === 0) return

    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    function scheduleMove(id: number) {
      // pause duration = how long the shape stays still before moving again
      const pause = rnd(2000, 9000)
      const t = setTimeout(() => {
        setShapes(prev => prev.map(s =>
          s.id !== id ? s : {
            ...s,
            x:            rnd(1, 99),
            y:            rnd(1, 99),
            moveDuration: rnd(9000, 20000),
          }
        ))
        scheduleMove(id)
      }, pause)
      timersRef.current.push(t)
    }

    shapes.forEach(s => {
      // Stagger initial moves so they don't all start together
      const initial = setTimeout(() => scheduleMove(s.id), rnd(0, 4000))
      timersRef.current.push(initial)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapes.length])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden>
      {shapes.map(s => {
        const base: React.CSSProperties = {
          position:   'absolute',
          left:       `${s.x}%`,
          top:        `${s.y}%`,
          transition: `left ${s.moveDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1), top ${s.moveDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`,
          willChange: 'left, top',
        }

        if (s.type === 'circle') {
          return (
            <div key={s.id} style={{ ...base, width: s.size, height: s.size, borderRadius: '50%', background: s.color, opacity: s.opacity }} />
          )
        }
        if (s.type === 'square') {
          return (
            <div key={s.id} style={{ ...base, width: s.size, height: s.size, borderRadius: 1, background: s.color, opacity: s.opacity }} />
          )
        }
        if (s.type === 'diamond') {
          return (
            <div key={s.id} style={{ ...base, width: s.size, height: s.size, background: s.color, opacity: s.opacity, transform: 'rotate(45deg)' }} />
          )
        }
        // cross
        return (
          <div key={s.id} style={{ ...base, ...crossStyle(s.size, s.color, s.opacity) }} />
        )
      })}
    </div>
  )
}
