import { useSyncExternalStore } from 'react'

export type DetailMode = 'simple' | 'detailed'

const storageKey = 'velo:detail'
const eventName = 'velo:detail-change'

function readDetail(fallback: DetailMode): DetailMode {
  const value = localStorage.getItem(storageKey)
  if (value === 'simple' || value === 'detailed') return value
  return fallback
}

function subscribe(listener: () => void): () => void {
  window.addEventListener('storage', listener)
  window.addEventListener(eventName, listener)
  return () => {
    window.removeEventListener('storage', listener)
    window.removeEventListener(eventName, listener)
  }
}

export function setDetail(mode: DetailMode): void {
  localStorage.setItem(storageKey, mode)
  window.dispatchEvent(new Event(eventName))
}

export function useDetail(defaultMode: DetailMode = 'simple'): DetailMode {
  return useSyncExternalStore(
    subscribe,
    () => readDetail(defaultMode),
    () => defaultMode,
  )
}
