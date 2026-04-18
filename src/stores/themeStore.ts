import { create } from 'zustand'

/* ── Theme Types ── */
export type ThemeMode = 'light' | 'dark'
export type ThemeAccent = string  // preset key or 'custom_xxxx'
export type ThemeRadius = 'sharp' | 'default' | 'rounded' | 'pill'
export type ThemeDensity = 'compact' | 'default' | 'comfortable'

/* ── 기본 7가지 프리셋 (삭제 불가) ── */
export const PRESET_ACCENTS: { key: string; label: string; color: string }[] = [
  { key: 'blue',    label: '블루',      color: '#4f6ef7' },
  { key: 'indigo',  label: '인디고',    color: '#6366f1' },
  { key: 'violet',  label: '바이올렛',  color: '#8b5cf6' },
  { key: 'emerald', label: '에메랄드',  color: '#10b981' },
  { key: 'rose',    label: '로즈',      color: '#f43f5e' },
  { key: 'amber',   label: '앰버',      color: '#f59e0b' },
  { key: 'slate',   label: '슬레이트',  color: '#64748b' },
]

export const PRESET_KEYS = PRESET_ACCENTS.map(a => a.key)

/* ── Legacy compat exports ── */
export const ACCENT_LABELS: Record<string, string> = Object.fromEntries(PRESET_ACCENTS.map(a => [a.key, a.label]))
export const ACCENT_COLORS: Record<string, string> = Object.fromEntries(PRESET_ACCENTS.map(a => [a.key, a.color]))

/* ── Custom Color (사용자 추가) ── */
export interface CustomAccent { key: string; label: string; color: string }

const CUSTOM_LS = 'ws_custom_accents'
function loadCustomAccents(): CustomAccent[] {
  try { return JSON.parse(localStorage.getItem(CUSTOM_LS) || '[]') } catch { return [] }
}
function saveCustomAccents(list: CustomAccent[]) {
  localStorage.setItem(CUSTOM_LS, JSON.stringify(list))
}

export const RADIUS_LABELS: Record<ThemeRadius, string> = {
  sharp: '샤프', default: '기본', rounded: '라운드', pill: '필',
}

export const DENSITY_LABELS: Record<ThemeDensity, string> = {
  compact: '컴팩트', default: '기본', comfortable: '여유',
}

/* ── Color Palette Generator ── */
function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

export function generatePalette(baseColor: string): Record<string, string> {
  const [h, s] = hexToHsl(baseColor)
  return {
    '50':  hslToHex(h, Math.min(s, 30), 97),
    '100': hslToHex(h, Math.min(s, 40), 93),
    '200': hslToHex(h, Math.min(s, 50), 85),
    '300': hslToHex(h, s, 72),
    '400': hslToHex(h, s, 58),
    '500': baseColor,
    '600': hslToHex(h, s, 42),
    '700': hslToHex(h, s, 35),
    '800': hslToHex(h, s, 28),
    '900': hslToHex(h, s, 22),
  }
}

interface ThemeStore {
  theme: ThemeMode
  accent: ThemeAccent
  radius: ThemeRadius
  density: ThemeDensity
  customAccents: CustomAccent[]

  toggle: () => void
  set: (theme: ThemeMode) => void
  setAccent: (accent: ThemeAccent) => void
  setRadius: (radius: ThemeRadius) => void
  setDensity: (density: ThemeDensity) => void
  addCustomAccent: (label: string, color: string) => void
  removeCustomAccent: (key: string) => void
}

/* ── Persistence ── */
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
  localStorage.setItem('ws_theme', t.mode)
}

function applyToDOM(t: SavedTheme) {
  const html = document.documentElement
  html.classList.toggle('dark', t.mode === 'dark')
  html.setAttribute('data-radius', t.radius)
  html.setAttribute('data-density', t.density)

  // 프리셋이면 data-accent로 CSS에서 처리
  if (PRESET_KEYS.includes(t.accent)) {
    html.setAttribute('data-accent', t.accent)
    // 커스텀 변수 제거
    for (const step of ['50','100','200','300','400','500','600','700','800','900']) {
      html.style.removeProperty(`--palette-${step}`)
    }
  } else {
    // 커스텀 색상 → JS로 CSS 변수 직접 설정
    html.removeAttribute('data-accent')
    const customs = loadCustomAccents()
    const found = customs.find(c => c.key === t.accent)
    if (found) {
      const palette = generatePalette(found.color)
      for (const [step, color] of Object.entries(palette)) {
        html.style.setProperty(`--palette-${step}`, color)
      }
    }
  }
}

/* ── Store ── */
const initial = loadTheme()
applyToDOM(initial)

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: initial.mode,
  accent: initial.accent,
  radius: initial.radius,
  density: initial.density,
  customAccents: loadCustomAccents(),

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

  addCustomAccent: (label, color) => {
    const key = `custom_${Date.now()}`
    const customs = [...get().customAccents, { key, label, color }]
    saveCustomAccents(customs)
    set({ customAccents: customs })
  },

  removeCustomAccent: (key) => {
    const customs = get().customAccents.filter(c => c.key !== key)
    saveCustomAccents(customs)
    // 현재 사용 중이면 기본으로 변경
    if (get().accent === key) {
      const s: SavedTheme = { mode: get().theme, accent: 'blue', radius: get().radius, density: get().density }
      saveTheme(s); applyToDOM(s)
      set({ customAccents: customs, accent: 'blue' })
    } else {
      set({ customAccents: customs })
    }
  },
}))
