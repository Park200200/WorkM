import { create } from 'zustand'

/* ── Theme Types ── */
export type ThemeMode = 'light' | 'dark'
export type ThemeAccent = string  // preset key or 'custom_xxxx'
export type ThemeRadius = 'sharp' | 'default' | 'rounded' | 'pill'
export type ThemeDensity = 'compact' | 'default' | 'comfortable'
export type ThemeFontScale = 'xs' | 'sm' | 'default' | 'lg' | 'xl'
export type ThemeDatePicker = 'default' | 'modern' | 'minimal' | 'bubble'
export type ThemeCheckboxStyle = 'default' | 'sharp' | 'circle'
export type ThemeCheckboxSize = 'sm' | 'default' | 'lg' | 'xl'
export type ThemeTabStyle = 'underline' | 'box' | 'pill'
export type ThemeButtonSize = 'xs' | 'sm' | 'md' | 'lg'
export type ThemeToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center'
export type ThemeTableStripe = 'on' | 'off'
export type ThemeTableDensity = 'compact' | 'default' | 'comfortable'
export type ThemeBadgeShape = 'pill' | 'rounded' | 'square'
export type ThemeSidebarWidth = 'narrow' | 'default' | 'wide'
export type ThemeProgressColor = 'auto' | 'primary' | 'success'

export const CHECKBOX_SIZE_LABELS: Record<ThemeCheckboxSize, string> = {
  sm: '소', default: '기본', lg: '대', xl: '특대',
}
export const CHECKBOX_SIZE_VALUES: Record<ThemeCheckboxSize, { box: number; icon: number; dot: number }> = {
  sm: { box: 14, icon: 9, dot: 5 },
  default: { box: 18, icon: 12, dot: 8 },
  lg: { box: 22, icon: 14, dot: 10 },
  xl: { box: 28, icon: 18, dot: 12 },
}
export const BUTTON_SIZE_LABELS: Record<ThemeButtonSize, string> = {
  xs: '초소', sm: '소', md: '기본', lg: '대',
}
export const TOAST_POSITION_LABELS: Record<ThemeToastPosition, string> = {
  'top-right': '우상단', 'top-left': '좌상단', 'bottom-right': '우하단', 'bottom-left': '좌하단', 'top-center': '상단중앙',
}
export const TABLE_STRIPE_LABELS: Record<ThemeTableStripe, string> = {
  on: '켜기', off: '끄기',
}
export const TABLE_DENSITY_LABELS: Record<ThemeTableDensity, string> = {
  compact: '컴팩트', default: '기본', comfortable: '넓음',
}
export const BADGE_SHAPE_LABELS: Record<ThemeBadgeShape, string> = {
  pill: '둥글', rounded: '둥근사각', square: '사각',
}
export const SIDEBAR_WIDTH_LABELS: Record<ThemeSidebarWidth, string> = {
  narrow: '좀음', default: '기본', wide: '넓음',
}
export const SIDEBAR_WIDTH_VALUES: Record<ThemeSidebarWidth, number> = {
  narrow: 200, default: 240, wide: 280,
}
export const PROGRESS_COLOR_LABELS: Record<ThemeProgressColor, string> = {
  auto: '자동', primary: '메인색상', success: '초록',
}

/* ── Typography Token 시스템 ── */
export interface TypoToken { size: string; weight: number; color: string }
export type TypoCategory =
  | 'page-title' | 'page-subtitle' | 'section-title' | 'card-title'
  | 'menu' | 'menu-group' | 'tab' | 'btn' | 'badge' | 'body' | 'caption' | 'input' | 'toast'

export const TYPO_CATEGORY_LABELS: Record<TypoCategory, string> = {
  'page-title': '페이지 타이틀',
  'page-subtitle': '서브타이틀',
  'section-title': '섹션 헤더',
  'card-title': '카드 제목',
  'menu': '메뉴 텍스트',
  'menu-group': '그룹 라벨',
  'tab': '탭 텍스트',
  'btn': '버튼 텍스트',
  'badge': '뱃지/태그',
  'body': '본문 텍스트',
  'caption': '캡션/힌트',
  'input': '입력 필드',
  'toast': '알림/토스트',
}

export const DEFAULT_TYPO: Record<TypoCategory, TypoToken> = {
  'page-title': { size: '1.125rem', weight: 800, color: 'var(--text-primary)' },
  'page-subtitle': { size: '0.8125rem', weight: 400, color: 'var(--text-muted)' },
  'section-title': { size: '0.875rem', weight: 700, color: 'var(--text-primary)' },
  'card-title': { size: '0.8125rem', weight: 700, color: 'var(--text-primary)' },
  'menu': { size: '0.8125rem', weight: 400, color: 'var(--text-secondary)' },
  'menu-group': { size: '0.625rem', weight: 700, color: 'var(--text-muted)' },
  'tab': { size: '0.75rem', weight: 700, color: 'var(--text-secondary)' },
  'btn': { size: '0.75rem', weight: 700, color: '#ffffff' },
  'badge': { size: '0.625rem', weight: 700, color: 'var(--text-secondary)' },
  'body': { size: '0.8125rem', weight: 400, color: 'var(--text-secondary)' },
  'caption': { size: '0.6875rem', weight: 400, color: 'var(--text-muted)' },
  'input': { size: '0.8125rem', weight: 400, color: 'var(--text-primary)' },
  'toast': { size: '0.8125rem', weight: 600, color: '#ffffff' },
}

export const TYPO_SIZE_OPTIONS = [
  { value: '0.5625rem', label: '9px' },
  { value: '0.625rem', label: '10px' },
  { value: '0.6875rem', label: '11px' },
  { value: '0.75rem', label: '12px' },
  { value: '0.8125rem', label: '13px' },
  { value: '0.875rem', label: '14px' },
  { value: '1rem', label: '16px' },
  { value: '1.125rem', label: '18px' },
  { value: '1.25rem', label: '20px' },
  { value: '1.5rem', label: '24px' },
]

export const TYPO_WEIGHT_OPTIONS = [
  { value: 300, label: 'Light' },
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'SemiBold' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'ExtraBold' },
  { value: 900, label: 'Black' },
]

export const TYPO_COLOR_OPTIONS = [
  { value: 'var(--text-primary)', label: '기본(진)' },
  { value: 'var(--text-secondary)', label: '보조' },
  { value: 'var(--text-muted)', label: '연한' },
  { value: 'var(--color-primary-500)', label: '메인색상' },
  { value: '#ffffff', label: '흰색' },
  { value: '#18181b', label: '검정' },
  { value: '#ef4444', label: '빨강' },
  { value: '#f59e0b', label: '주황' },
  { value: '#22c55e', label: '초록' },
  { value: '#3b82f6', label: '파랑' },
  { value: '#8b5cf6', label: '보라' },
]

export const DATEPICKER_LABELS: Record<ThemeDatePicker, string> = {
  default: '기본', modern: '모던', minimal: '미니멀', bubble: '버블',
}
export const CHECKBOX_STYLE_LABELS: Record<ThemeCheckboxStyle, string> = {
  default: '둥근 사각', sharp: '직각', circle: '원형',
}
export const TAB_STYLE_LABELS: Record<ThemeTabStyle, string> = {
  underline: '밑줄', box: '박스', pill: '필',
}

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

export const FONT_SCALE_LABELS: Record<ThemeFontScale, string> = {
  xs: '아주 작게', sm: '작게', default: '기본', lg: '크게', xl: '아주 크게',
}

/* ── 폰트 프리셋 색상 ── */
export interface FontColorPreset { key: string; label: string; light: string; dark: string }

export const FONT_COLOR_PRESETS: FontColorPreset[] = [
  { key: 'default',  label: '기본',   light: '#18181b', dark: '#f4f4f5' },
  { key: 'soft',     label: '소프트', light: '#3f3f46', dark: '#d4d4d8' },
  { key: 'warm',     label: '따뜻한', light: '#292524', dark: '#fafaf9' },
  { key: 'cool',     label: '시원한', light: '#1e293b', dark: '#e2e8f0' },
  { key: 'ink',      label: '잉크',   light: '#030712', dark: '#f9fafb' },
]

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
  fontScale: ThemeFontScale
  fontColor: string
  datePickerStyle: ThemeDatePicker
  checkboxStyle: ThemeCheckboxStyle
  checkboxSize: ThemeCheckboxSize
  tabStyle: ThemeTabStyle
  buttonSize: ThemeButtonSize
  toastPosition: ThemeToastPosition
  tableStripe: ThemeTableStripe
  tableDensity: ThemeTableDensity
  badgeShape: ThemeBadgeShape
  sidebarWidth: ThemeSidebarWidth
  progressColor: ThemeProgressColor
  customAccents: CustomAccent[]
  typography: Record<TypoCategory, TypoToken>

  toggle: () => void
  set: (theme: ThemeMode) => void
  setAccent: (accent: ThemeAccent) => void
  setRadius: (radius: ThemeRadius) => void
  setDensity: (density: ThemeDensity) => void
  setFontScale: (scale: ThemeFontScale) => void
  setFontColor: (color: string) => void
  setDatePickerStyle: (style: ThemeDatePicker) => void
  setCheckboxStyle: (style: ThemeCheckboxStyle) => void
  setCheckboxSize: (size: ThemeCheckboxSize) => void
  setTabStyle: (style: ThemeTabStyle) => void
  setButtonSize: (size: ThemeButtonSize) => void
  setToastPosition: (pos: ThemeToastPosition) => void
  setTableStripe: (s: ThemeTableStripe) => void
  setTableDensity: (d: ThemeTableDensity) => void
  setBadgeShape: (s: ThemeBadgeShape) => void
  setSidebarWidth: (w: ThemeSidebarWidth) => void
  setProgressColor: (c: ThemeProgressColor) => void
  addCustomAccent: (label: string, color: string) => void
  removeCustomAccent: (key: string) => void
  setTypo: (category: TypoCategory, token: TypoToken) => void
  resetTypo: () => void
}

/* ── Persistence ── */
const LS_KEY = 'ws_theme_v3'

interface SavedTheme {
  mode: ThemeMode
  accent: ThemeAccent
  radius: ThemeRadius
  density: ThemeDensity
  fontScale: ThemeFontScale
  fontColor: string
  datePickerStyle: ThemeDatePicker
  checkboxStyle: ThemeCheckboxStyle
  checkboxSize: ThemeCheckboxSize
  tabStyle: ThemeTabStyle
  buttonSize: ThemeButtonSize
  toastPosition: ThemeToastPosition
  tableStripe: ThemeTableStripe
  tableDensity: ThemeTableDensity
  badgeShape: ThemeBadgeShape
  sidebarWidth: ThemeSidebarWidth
  progressColor: ThemeProgressColor
}

function loadTheme(): SavedTheme {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
    // v2 migration
    const v2 = localStorage.getItem('ws_theme_v2')
    if (v2) {
      const old = JSON.parse(v2)
      return { ...old, fontScale: 'default', fontColor: 'default', datePickerStyle: 'default', checkboxStyle: 'default', tabStyle: 'underline' }
    }
  } catch { /* noop */ }
  const legacyMode = localStorage.getItem('ws_theme')
  return {
    mode: legacyMode === 'dark' ? 'dark' : legacyMode === 'light' ? 'light'
      : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    accent: 'blue',
    radius: 'default',
    density: 'default',
    fontScale: 'default',
    fontColor: 'default',
    datePickerStyle: 'default' as ThemeDatePicker,
    checkboxStyle: 'default' as ThemeCheckboxStyle,
    checkboxSize: 'default' as ThemeCheckboxSize,
    tabStyle: 'underline' as ThemeTabStyle,
    buttonSize: 'md' as ThemeButtonSize,
    toastPosition: 'top-right' as ThemeToastPosition,
    tableStripe: 'off' as ThemeTableStripe,
    tableDensity: 'default' as ThemeTableDensity,
    badgeShape: 'pill' as ThemeBadgeShape,
    sidebarWidth: 'default' as ThemeSidebarWidth,
    progressColor: 'auto' as ThemeProgressColor,
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
  html.setAttribute('data-font-scale', t.fontScale)
  html.setAttribute('data-datepicker', t.datePickerStyle || 'default')
  html.setAttribute('data-checkbox-style', t.checkboxStyle || 'default')
  html.setAttribute('data-tab-style', t.tabStyle || 'underline')

  // 색상 팔레트를 CSS 변수로 직접 설정 (Tailwind v4 @theme 빌드시점 해석 문제 해결)
  const applyPalette = (palette: Record<string, string>) => {
    for (const [step, color] of Object.entries(palette)) {
      html.style.setProperty(`--palette-${step}`, color)
      html.style.setProperty(`--color-primary-${step}`, color)
    }
  }

  if (PRESET_KEYS.includes(t.accent)) {
    html.setAttribute('data-accent', t.accent)
    const preset = PRESET_ACCENTS.find(a => a.key === t.accent)
    if (preset) applyPalette(generatePalette(preset.color))
  } else {
    html.removeAttribute('data-accent')
    const customs = loadCustomAccents()
    const found = customs.find(c => c.key === t.accent)
    if (found) applyPalette(generatePalette(found.color))
  }

  // 폰트 색상 적용
  const fc = FONT_COLOR_PRESETS.find(p => p.key === t.fontColor)
  if (fc && t.fontColor !== 'default') {
    html.style.setProperty('--text-primary', t.mode === 'dark' ? fc.dark : fc.light)
  } else {
    html.style.removeProperty('--text-primary')
  }

  // 타이포그래피 토큰 적용
  const typo = loadTypography()
  for (const [cat, token] of Object.entries(typo)) {
    html.style.setProperty(`--typo-${cat}-size`, token.size)
    html.style.setProperty(`--typo-${cat}-weight`, String(token.weight))
    html.style.setProperty(`--typo-${cat}-color`, token.color)
  }
}

/* ── Typography Persistence ── */
const TYPO_LS = 'ws_typography'
function loadTypography(): Record<TypoCategory, TypoToken> {
  try {
    const raw = localStorage.getItem(TYPO_LS)
    if (raw) return { ...DEFAULT_TYPO, ...JSON.parse(raw) }
  } catch { /* noop */ }
  return { ...DEFAULT_TYPO }
}
function saveTypography(t: Record<TypoCategory, TypoToken>) {
  localStorage.setItem(TYPO_LS, JSON.stringify(t))
}

/* ── Store ── */
const initial = loadTheme()
applyToDOM(initial)

export const useThemeStore = create<ThemeStore>((set, get) => {
  const getSaved = (): SavedTheme => ({
    mode: get().theme, accent: get().accent, radius: get().radius,
    density: get().density, fontScale: get().fontScale, fontColor: get().fontColor,
    datePickerStyle: get().datePickerStyle, checkboxStyle: get().checkboxStyle, checkboxSize: get().checkboxSize, tabStyle: get().tabStyle,
    buttonSize: get().buttonSize, toastPosition: get().toastPosition, tableStripe: get().tableStripe,
    tableDensity: get().tableDensity, badgeShape: get().badgeShape, sidebarWidth: get().sidebarWidth, progressColor: get().progressColor,
  })

  return {
    theme: initial.mode,
    accent: initial.accent,
    radius: initial.radius,
    density: initial.density,
    fontScale: initial.fontScale,
    fontColor: initial.fontColor,
    datePickerStyle: initial.datePickerStyle || 'default',
    checkboxStyle: initial.checkboxStyle || 'default',
    checkboxSize: initial.checkboxSize || 'default',
    tabStyle: initial.tabStyle || 'underline',
    buttonSize: initial.buttonSize || 'md',
    toastPosition: initial.toastPosition || 'top-right',
    tableStripe: initial.tableStripe || 'off',
    tableDensity: initial.tableDensity || 'default',
    badgeShape: initial.badgeShape || 'pill',
    sidebarWidth: initial.sidebarWidth || 'default',
    progressColor: initial.progressColor || 'auto',
    customAccents: loadCustomAccents(),
    typography: loadTypography(),

    toggle: () => {
      const next: ThemeMode = get().theme === 'light' ? 'dark' : 'light'
      const s: SavedTheme = { ...getSaved(), mode: next }
      saveTheme(s); applyToDOM(s)
      set({ theme: next })
    },

    set: (mode) => {
      const s = { ...getSaved(), mode }
      saveTheme(s); applyToDOM(s)
      set({ theme: mode })
    },

    setAccent: (accent) => {
      const s = { ...getSaved(), accent }
      saveTheme(s); applyToDOM(s)
      set({ accent })
    },

    setRadius: (radius) => {
      const s = { ...getSaved(), radius }
      saveTheme(s); applyToDOM(s)
      set({ radius })
    },

    setDensity: (density) => {
      const s = { ...getSaved(), density }
      saveTheme(s); applyToDOM(s)
      set({ density })
    },

    setFontScale: (fontScale) => {
      const s = { ...getSaved(), fontScale }
      saveTheme(s); applyToDOM(s)
      set({ fontScale })
    },

    setFontColor: (fontColor) => {
      const s = { ...getSaved(), fontColor }
      saveTheme(s); applyToDOM(s)
      set({ fontColor })
    },

    setDatePickerStyle: (datePickerStyle) => {
      const s = { ...getSaved(), datePickerStyle }
      saveTheme(s); applyToDOM(s)
      set({ datePickerStyle })
    },

    setCheckboxStyle: (checkboxStyle) => {
      const s = { ...getSaved(), checkboxStyle }
      saveTheme(s); applyToDOM(s)
      set({ checkboxStyle })
    },

    setCheckboxSize: (checkboxSize) => {
      const s = { ...getSaved(), checkboxSize }
      saveTheme(s); applyToDOM(s)
      set({ checkboxSize })
    },

    setTabStyle: (tabStyle) => {
      const s = { ...getSaved(), tabStyle }
      saveTheme(s); applyToDOM(s)
      set({ tabStyle })
    },

    setButtonSize: (buttonSize) => {
      const s = { ...getSaved(), buttonSize }
      saveTheme(s); applyToDOM(s)
      set({ buttonSize })
    },

    setToastPosition: (toastPosition) => {
      const s = { ...getSaved(), toastPosition }
      saveTheme(s); applyToDOM(s)
      set({ toastPosition })
    },

    setTableStripe: (tableStripe) => {
      const s = { ...getSaved(), tableStripe }
      saveTheme(s); applyToDOM(s)
      set({ tableStripe })
    },

    setTableDensity: (tableDensity) => {
      const s = { ...getSaved(), tableDensity }
      saveTheme(s); applyToDOM(s)
      set({ tableDensity })
    },

    setBadgeShape: (badgeShape) => {
      const s = { ...getSaved(), badgeShape }
      saveTheme(s); applyToDOM(s)
      set({ badgeShape })
    },

    setSidebarWidth: (sidebarWidth) => {
      const s = { ...getSaved(), sidebarWidth }
      saveTheme(s); applyToDOM(s)
      set({ sidebarWidth })
    },

    setProgressColor: (progressColor) => {
      const s = { ...getSaved(), progressColor }
      saveTheme(s); applyToDOM(s)
      set({ progressColor })
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
      if (get().accent === key) {
        const s = { ...getSaved(), accent: 'blue' }
        saveTheme(s); applyToDOM(s)
        set({ customAccents: customs, accent: 'blue' })
      } else {
        set({ customAccents: customs })
      }
    },

    setTypo: (category, token) => {
      const typo = { ...get().typography, [category]: token }
      saveTypography(typo)
      const html = document.documentElement
      html.style.setProperty(`--typo-${category}-size`, token.size)
      html.style.setProperty(`--typo-${category}-weight`, String(token.weight))
      html.style.setProperty(`--typo-${category}-color`, token.color)
      set({ typography: typo })
    },

    resetTypo: () => {
      const typo = { ...DEFAULT_TYPO }
      saveTypography(typo)
      const html = document.documentElement
      for (const [cat, token] of Object.entries(typo)) {
        html.style.setProperty(`--typo-${cat}-size`, token.size)
        html.style.setProperty(`--typo-${cat}-weight`, String(token.weight))
        html.style.setProperty(`--typo-${cat}-color`, token.color)
      }
      set({ typography: typo })
    },
  }
})
