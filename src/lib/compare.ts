import { useSyncExternalStore } from 'react'
import { publishedBikes } from './data'

const storageKey = 'velo:compare'
const eventName = 'velo:compare-change'
const validIds = new Set(publishedBikes.map((bike) => `${bike.brand}/${bike.slug}`))
let ids = readIds()

function parseIds(value: string | null): string[] {
  if (!value) return []
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return [...new Set(parsed.filter((id): id is string => typeof id === 'string' && validIds.has(id)))].slice(0, 3)
  } catch {
    return []
  }
}

function readIds(): string[] {
  return typeof localStorage === 'undefined' ? [] : parseIds(localStorage.getItem(storageKey))
}

function notify(): void {
  window.dispatchEvent(new Event(eventName))
}

function onStorage(): void {
  ids = readIds()
  notify()
}

function subscribe(listener: () => void): () => void {
  window.addEventListener(eventName, listener)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(eventName, listener)
    window.removeEventListener('storage', onStorage)
  }
}

function persist(next: string[]): void {
  ids = next.slice(0, 3)
  localStorage.setItem(storageKey, JSON.stringify(ids))
  notify()
}

function add(id: string): void {
  if (!validIds.has(id) || ids.includes(id) || ids.length >= 3) return
  persist([...ids, id])
}

function remove(id: string): void {
  if (ids.includes(id)) persist(ids.filter((item) => item !== id))
}

function clear(): void {
  if (ids.length) persist([])
}

export function useCompare() {
  const selectedIds = useSyncExternalStore(subscribe, () => ids, () => [])
  const has = (id: string) => selectedIds.includes(id)
  return { ids: selectedIds, add, remove, clear, has }
}
