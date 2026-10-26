import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsap'
import { useEffect, useSyncExternalStore, type ReactNode } from 'react'

let lenis: Lenis | null = null
const lenisListeners = new Set<() => void>()

function notifyLenis(): void {
  lenisListeners.forEach((listener) => listener())
}

function subscribeLenis(listener: () => void): () => void {
  lenisListeners.add(listener)
  return () => lenisListeners.delete(listener)
}

export function startSmoothScroll(): () => void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => {}
  }

  const instance = new Lenis({ autoRaf: false, anchors: true, lerp: 0.1 })
  lenis = instance
  notifyLenis()
  const tick = (time: number) => instance.raf(time * 1000)

  instance.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)

  return () => {
    gsap.ticker.remove(tick)
    instance.off('scroll', ScrollTrigger.update)
    instance.destroy()
    if (lenis === instance) {
      lenis = null
      notifyLenis()
    }
  }
}

export function getLenis(): Lenis | null {
  return lenis
}

let refreshTimer = 0

export function refreshLayout(): void {
  getLenis()?.resize()
  window.clearTimeout(refreshTimer)
  refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 80)
}

export function LenisProvider({ children }: { children: ReactNode }) {
  useEffect(() => startSmoothScroll(), [])
  return children
}

export function useLenis(): Lenis | null {
  return useSyncExternalStore(subscribeLenis, getLenis, () => null)
}
