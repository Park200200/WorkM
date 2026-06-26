/**
 * localStorage 안전 래퍼 — 기존 WorkM 데이터 호환
 */

export function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function setItem<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (e) {
    console.error(`[storage] Failed to set "${key}"`, e)
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
      alert('저장 공간이 부족합니다. 불필요한 데이터를 삭제하거나 관리자에게 문의하세요.')
    }
    return false
  }
}

export function removeItem(key: string): void {
  localStorage.removeItem(key)
}
