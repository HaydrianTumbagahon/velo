import { useEffect, useRef } from 'react'
import { gsap } from '../lib/gsap'

export function Cursor() {
  const dot = useRef<HTMLSpanElement>(null)
  const ring = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!fine.matches || reduced.matches || !dot.current || !ring.current) return

    const root = document.documentElement
    const dotNode = dot.current
    const ringNode = ring.current
    gsap.set([dotNode, ringNode], { xPercent: -50, yPercent: -50 })
    const moveDotX = gsap.quickTo(dotNode, 'x', { duration: 0, ease: 'none' })
    const moveDotY = gsap.quickTo(dotNode, 'y', { duration: 0, ease: 'none' })
    const moveRingX = gsap.quickTo(ringNode, 'x', { duration: 0.3, ease: 'power3.out' })
    const moveRingY = gsap.quickTo(ringNode, 'y', { duration: 0.3, ease: 'power3.out' })
    let interactive = false
    let overInput = false

    const onMove = (event: PointerEvent) => {
      root.classList.add('custom-cursor-enabled')
      moveDotX(event.clientX)
      moveDotY(event.clientY)
      moveRingX(event.clientX)
      moveRingY(event.clientY)
      const target = event.target instanceof Element ? event.target : null
      overInput = Boolean(target?.closest('input, textarea, select, [contenteditable="true"]'))
      interactive = Boolean(target?.closest('a, button, [role="button"], summary, [data-cursor]'))
      gsap.to(dotNode, { opacity: overInput ? 0 : 1, duration: 0.12 })
      gsap.to(ringNode, {
        width: interactive ? 32 : 20,
        height: interactive ? 32 : 20,
        opacity: overInput ? 0 : 1,
        duration: 0.2,
        ease: 'power3.out',
      })
    }
    const onDown = () => gsap.to(ringNode, { scale: 0.85, duration: 0.12, ease: 'power3.out' })
    const onUp = () => gsap.to(ringNode, { scale: 1, duration: 0.2, ease: 'power3.out' })
    const onLeave = () => gsap.to([dotNode, ringNode], { autoAlpha: 0, duration: 0.18 })
    const onEnter = () => gsap.to([dotNode, ringNode], { autoAlpha: 1, duration: 0.18 })
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointerleave', onLeave)
    window.addEventListener('pointerenter', onEnter)
    return () => {
      root.classList.remove('custom-cursor-enabled')
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointerenter', onEnter)
    }
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[130]">
      <span ref={dot} className="custom-cursor-dot" />
      <span ref={ring} className="custom-cursor-ring" />
    </div>
  )
}
