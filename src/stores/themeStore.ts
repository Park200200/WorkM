import { create } from 'zustand'

/* ── Theme Types ── */
export type ThemeMode = 'light' | 'dark'
export type ThemeAccent = 'blue' | 'indigo' | 'violet' | 'emerald' | 'rose' | 'amber' | 'slate'
export type ThemeRadius = 'sharp' | 'default' | 'rounded' | 'pill'
export type ThemeDensity = 'compact' | 'default' | 'comfortable'

export const ACCENT_LABELS: Record<ThemeAccent, string> = {
  blue: '블루', indigo: '인디고', violet: '바이올렛',
  emerald: '에메랄드', rose: '로즈', amber: '앰버', slate: '슬레이트',
}

export const ACCENT_COLORS: Record<ThemeAccent, string> = {
  blue: '#4f6ef7', indigo: '#6366f1', violet: '#8b5cf6',
  emerald: '#10b981', rose: '#f43f5e', amber: '#f59e0b', slate: '#64748b',
}

export const RADIUS_LABELS: Record<ThemeRadius, string> = {
  sharp: '샤프', default: '기본', rounded: '라운드', pill: '필',
}

export const DENSITY_LABELS: Record<ThemeDensity, string> = {
  compact: '컴팩트', default: '기본', comfortable: '여유',
}

interface ThemeStore {
  /* current settings */
  theme: ThemeMode
  accent: ThemeAccent
  radius: ThemeRadius
  density: ThemeDensity

  /* legacy compat */
  toggle: () => void
  set: (theme: ThemeMode) => void

  /* new setters */
  setAccent: (accent: ThemeAccent) => void
  setRadius: (radius: ThemeRadius) => void
  setDensity: (density: ThemeDensity) => void
}

/* ── Persistence helpers ── */
const LS_KEY = 'ws_theme_v2'

interface SavedTheme {
  mode: ThemeMode
  accent: ThemeAccent
  radius: ThemeRadius
  density: ThemeDensity
}

function loadTheme(): SavedTheme {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* noop */ }

  // legacy migration
  const legacyMode = localStorage.getItem('ws_theme')
  return {
    mode: legacyMode === 'dark' ? 'dark' : legacyMode === 'light' ? 'light'
      : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    accent: 'blue',
    radius: 'default',
    density: 'default',
  }
}

function saveTheme(t: SavedTheme) {
  localStorage.setItem(LS_KEY, JSON.stringify(t))
  localStorage.setItem('ws_theme', t.mode) // legacy compat
}

function applyToDOM(t: SavedTheme) {
  const html = document.documentElement
  html.classList.toggle('dark', t.mode === 'dark')
  html.setAttribute('data-accent', t.accent)
  html.setAttribute('data-radius', t.radius)
  html.setAttribute('data-density', t.density)
}

/* ── Store ── */
const initial = loadTheme()
applyToDOM(initial)

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: initial.mode,
  accent: initial.accent,
  radius: initial.radius,
  density: initial.density,

  toggle: () => {
    const next = get().theme === 'light' ? 'dark' : 'light'
    const s: SavedTheme = { mode: next, accent: get().accent, radius: get().radius, density: get().density }
    saveTheme(s); applyToDOM(s)
    set({ theme: next })
  },

  set: (mode) => {
    const s: SavedTheme = { mode, accent: get().accent, radius: get().radius, density: get().density }
    saveTheme(s); applyToDOM(s)
    set({ theme: mode })
  },

  setAccent: (accent) => {
    const s: SavedTheme = { mode: get().theme, accent, radius: get().radius, density: get().density }
    saveTheme(s); applyToDOM(s)
    set({ accent })
  },

  setRadius: (radius) => {
    const s: SavedTheme = { mode: get().theme, accent: get().accent, radius, density: get().density }
    saveTheme(s); applyToDOM(s)
    set({ radius })
  },

  setDensity: (density) => {
    const s: SavedTheme = { mode: get().theme, accent: get().accent, radius: get().radius, density }
    saveTheme(s); applyToDOM(s)
    set({ density })
  },
}))
