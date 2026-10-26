import { gsap } from './gsap'
import { getLenis } from './smooth'

let timeline: gsap.core.Timeline | null = null
let cleanupInput: (() => void) | null = null

function restoreScroll() {
  timeline?.kill()
  timeline = null
  cleanupInput?.()
  cleanupInput = null
  getLenis()?.start()
}

export function scrollToTop(): void {
  restoreScroll()
  const lenis = getLenis()
  const start = lenis?.scroll ?? window.scrollY
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || start <= 0) {
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
    else window.scrollTo(0, 0)
    return
  }
  if (!lenis) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  lenis.stop()
  const proxy = { y: start }
  const update = () => lenis.scrollTo(proxy.y, { immediate: true, force: true })
  const interrupt = () => restoreScroll()
  window.addEventListener('wheel', interrupt, { passive: true })
  window.addEventListener('touchstart', interrupt, { passive: true })
  window.addEventListener('keydown', interrupt)
  cleanupInput = () => {
    window.removeEventListener('wheel', interrupt)
    window.removeEventListener('touchstart', interrupt)
    window.removeEventListener('keydown', interrupt)
  }

  const ascent = gsap.utils.clamp(0.9, 1.7, 0.7 + start / 7000)
  timeline = gsap.timeline({
    onUpdate: update,
    onComplete: () => {
      cleanupInput?.()
      cleanupInput = null
      timeline = null
      lenis.start()
    },
  })
    .to(proxy, { y: start + 18, duration: 0.22, ease: 'power2.out' })
    .to(proxy, { y: 0, duration: ascent, ease: 'power4.inOut' })
    .to(proxy, { y: 42, duration: 0.18, ease: 'power2.out' })
    .to(proxy, { y: 0, duration: 0.5, ease: 'elastic.out(1, 0.55)' })
}
