'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

export type Theme = 'dark' | 'pilot' | 'light'

const STORAGE_KEY = 'pilot-theme'

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
  theme: 'dark',
  setTheme: () => undefined,
})

// ── Provider ──────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')

  // On first mount: read from localStorage, fall back to 'dark', then sync
  // with server profile.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    const initial: Theme =
      stored === 'dark' || stored === 'pilot' || stored === 'light'
        ? stored
        : 'dark'
    setThemeState(initial)
    applyTheme(initial)

    // Async: fetch actual saved theme from server and reconcile
    fetch('/api/user/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: unknown) => {
        if (
          data &&
          typeof data === 'object' &&
          'theme' in data &&
          (data as Record<string, unknown>).theme !== initial
        ) {
          const serverTheme = (data as Record<string, unknown>).theme as Theme
          if (
            serverTheme === 'dark' ||
            serverTheme === 'pilot' ||
            serverTheme === 'light'
          ) {
            setThemeState(serverTheme)
            localStorage.setItem(STORAGE_KEY, serverTheme)
            applyTheme(serverTheme)
          }
        }
      })
      .catch(() => undefined)
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    localStorage.setItem(STORAGE_KEY, t)
    applyTheme(t)

    // Persist to server (fire-and-forget)
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
