/**
 * IndexedDB 기반 첨부파일 이미지 저장소
 * localStorage 용량 제한(~5MB)을 우회하여 대용량 이미지 저장
 */

const DB_NAME = 'workm_attachments'
const DB_VERSION = 1
const STORE_NAME = 'images'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** 이미지 dataUrl을 IndexedDB에 저장 */
export async function saveAttachmentImage(key: string, dataUrl: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(dataUrl, key)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

/** IndexedDB에서 이미지 dataUrl 로드 */
export async function loadAttachmentImage(key: string): Promise<string | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(key)
    req.onsuccess = () => { db.close(); resolve(req.result || null) }
    req.onerror = () => { db.close(); reject(req.error) }
  })
}

/** IndexedDB에서 이미지 삭제 */
export async function deleteAttachmentImage(key: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(key)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

/** 여러 이미지를 한번에 로드 */
export async function loadMultipleImages(keys: string[]): Promise<Record<string, string>> {
  if (keys.length === 0) return {}
  const db = await openDB()
  const result: Record<string, string> = {}
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    let pending = keys.length
    keys.forEach(key => {
      const req = store.get(key)
      req.onsuccess = () => {
        if (req.result) result[key] = req.result
        pending--
        if (pending === 0) { db.close(); resolve(result) }
      }
      req.onerror = () => {
        pending--
        if (pending === 0) { db.close(); resolve(result) }
      }
    })
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}
