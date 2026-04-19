/**
 * 주컬러(accent color)로부터 Primary 팔레트(50~900)를 생성하고
 * CSS 커스텀 프로퍼티로 적용하는 유틸리티
 */

/* ── hex → HSL 변환 ── */
function hexToHsl(hex: string): [number, number, number] {
  hex = hex.replace('#', '')
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0, s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

/* ── HSL → hex 변환 ── */
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

/* ── 메인 색상으로부터 팔레트 생성 ── */
export function generatePalette(hex: string): Record<string, string> {
  const [h, s, l] = hexToHsl(hex)
  // 선택한 색상을 500으로 그대로 사용하고, 나머지를 밝기 차이로 생성
  const palette: Record<string, string> = {}
  // 밝은 톤(50~400): 선택색 기준으로 밝기를 올림
  const lightSteps: [string, number][] = [
    ['50',  95], ['100', 90], ['200', 82], ['300', 72], ['400', (l + 62) / 2],
  ]
  // 어두운 톤(600~900): 선택색 기준으로 밝기를 내림
  const darkSteps: [string, number][] = [
    ['600', l * 0.78], ['700', l * 0.62], ['800', l * 0.48], ['900', l * 0.36],
  ]
  lightSteps.forEach(([key, lit]) => {
    palette[key] = hslToHex(h, Math.max(s - (95 - lit) * 0.15, 10), lit)
  })
  palette['500'] = hex // 선택한 색상 그대로
  darkSteps.forEach(([key, lit]) => {
    palette[key] = hslToHex(h, Math.min(s + 5, 100), Math.max(lit, 8))
  })
  return palette
}

/* ── CSS 커스텀 프로퍼티에 팔레트 적용 ── */
export function applyAccentToDOM(hex: string) {
  const palette = generatePalette(hex)
  const root = document.documentElement
  Object.entries(palette).forEach(([key, val]) => {
    root.style.setProperty(`--color-primary-${key}`, val)
  })
  // 이전에 인라인으로 설정된 값을 제거 → CSS의 var(--color-primary-*) 참조가 동작
  root.style.removeProperty('--sidebar-active')
  root.style.removeProperty('--border-focus')
  // --sidebar-active, --border-focus 등은 globals.css에서 var(--color-primary-500)을 참조하므로
  // 여기서 별도 setProperty 하지 않음 (인라인이 CSS를 덮어쓰는 문제 방지)
  root.style.setProperty('--shadow-glow', `0 0 20px ${palette['500']}25`)
}

/* ── 초기 로딩 시 저장된 색상 복원 ── */
export function restoreAccent() {
  const saved = localStorage.getItem('ws_accent_color')
  if (saved) {
    try {
      const hex = JSON.parse(saved)
      if (typeof hex === 'string' && hex.startsWith('#')) {
        applyAccentToDOM(hex)
      }
    } catch { /* ignore */ }
  }
}

/* ── 색상 저장 + 적용 ── */
export function setAccentColor(hex: string) {
  localStorage.setItem('ws_accent_color', JSON.stringify(hex))
  applyAccentToDOM(hex)
}

/* ── 저장된 색상 가져오기 ── */
export function getAccentColor(): string {
  try {
    const saved = localStorage.getItem('ws_accent_color')
    if (saved) {
      const hex = JSON.parse(saved)
      if (typeof hex === 'string' && hex.startsWith('#')) return hex
    }
  } catch { /* ignore */ }
  return '#4f6ef7'
}
