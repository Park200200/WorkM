/**
 * 회계 모듈 공통 유틸리티 함수
 */

/** 로컬 시간 기준 YYYY-MM-DD */
export function getLocalDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

/** 로컬 시간 기준 ISO 형식 문자열 */
export function getLocalISOString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
}

/** 전화번호 포맷 (02-XXXX-XXXX / 010-XXXX-XXXX) */
export function fmtPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.startsWith('02')) {
    if (d.length <= 2) return d
    if (d.length <= 6) return `${d.slice(0, 2)}-${d.slice(2)}`
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6)}`
  }
  if (d.length <= 3) return d
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

/** 사업자번호 포맷 (XXX-XX-XXXXX) */
export function fmtBizNo(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 10)
  if (d.length <= 3) return d
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`
}

/** 숫자 포맷 (1,234,567) */
export function formatNumber(n: number): string {
  return n.toLocaleString('ko-KR')
}

/** 타임스탬프 기반 고유 ID 생성 */
export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7)
}
