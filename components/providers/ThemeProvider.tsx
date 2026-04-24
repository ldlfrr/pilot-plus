'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

export type Theme = 'dark' | 'pilot' | 'midnight' | 'slate' | 'forest' | 'aurora' | 'dusk' | 'light'

const VALID_THEMES: Theme[] = ['dark', 'pilot', 'midnight', 'slate', 'forest', 'aurora', 'dusk', 'light']
const STORAGE_KEY = 'pilot-theme'
const DEFAULT_THEME: Theme = 'dark'

function readLocalTheme(): Theme {
  try {
    const t = localStorage.getItem(STORAGE_KEY) as Theme | null
    return t && VALID_THEMES.includes(t) ? t : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

function applyTheme(theme: Theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => undefined,
})

// ── Provider ──────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialise from localStorage immediately so React state matches what
  // the inline <script> already applied to the DOM.
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME
    return readLocalTheme()
  })

  useEffect(() => {
    // 1. Read localStorage — this is the definitive source of truth.
    const local = readLocalTheme()
    setThemeState(local)
    applyTheme(local)

    // 2. Push local theme to server so it's available on other devices.
    //    We do NOT read from server and override local — localStorage wins.
    fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: local }),
    }).catch(() => undefined)
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    localStorage.setItem(STORAGE_KEY, t)
    applyTheme(t)

    // Persist to server (fire-and-forget — localStorage is already updated)
    fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: t }),
    }).catch(() => undefined)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
