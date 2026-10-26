import { useEffect, useRef } from 'react'
import { useLocation } from 'wouter'
import { gsap } from '../lib/gsap'
import { motion } from '../lib/motion'
import { brandBySlug } from '../lib/data'

type NavigationDetail = {
  to: string
  navigate: (to: string) => void
}

function brandForPath(path: string) {
  const slug = path.match(/^\/brands\/([^/?]+)/)?.[1]
  return slug ? brandBySlug(slug) ?? null : null
}

function clearOverlay(node: HTMLDivElement | null, timeline: gsap.core.Timeline | null) {
  timeline?.kill()
  if (node) {
    gsap.set(node, { clearProps: 'all' })
    node.querySelectorAll<HTMLElement>('[data-transition-layer], [data-transition-bar]').forEach((layer) => {
      gsap.set(layer, { clearProps: 'all' })
    })
  }
  document.documentElement.classList.remove('theme-transitioning')
}

export function Transition() {
  const [location] = useLocation()
  const overlay = useRef<HTMLDivElement>(null)
  const timeline = useRef<gsap.core.Timeline | null>(null)
  const active = useRef(false)
  const expectedLocation = useRef<string | null>(null)
  const coverComplete = useRef(false)

  useEffect(() => {
    const beginReveal = () => {
      const node = overlay.current
      const activeTimeline = timeline.current
      if (!node || !activeTimeline || !active.current) return
      const layers = node.querySelectorAll<HTMLElement>('[data-transition-layer]')
      const bars = node.querySelectorAll<HTMLElement>('[data-transition-bar]')
      const variant = node.dataset.variant
      const duration = Number(node.dataset.duration)
      document.documentElement.classList.remove('theme-transitioning')
      const reveal = gsap.timeline({
        onComplete: () => {
          clearOverlay(node, timeline.current)
          timeline.current = null
          expectedLocation.current = null
          active.current = false
        },
      })
      if (variant === 'grid') {
        reveal.to(node.querySelector('[data-transition-layer="c"]'), { opacity: 0, duration, ease: 'power2.inOut' })
          .to(bars, { yPercent: -110, duration, stagger: 0.012, ease: 'power2.inOut' }, 0.16 * duration)
      } else if (variant === 'curtain') {
        reveal.to(layers[2], { yPercent: -110, duration, ease: 'power2.inOut' })
          .to(layers[1], { yPercent: -110, duration, ease: 'power2.inOut' }, 0.16 * duration)
          .to(layers[0], { yPercent: -110, duration, ease: 'power2.inOut' }, 0.32 * duration)
      } else if (variant === 'slash') {
        reveal.to(layers[2], { xPercent: 130, duration, ease: 'power2.inOut' })
          .to(layers[1], { xPercent: 130, duration, ease: 'power2.inOut' }, 0.16 * duration)
          .to(layers[0], { xPercent: 130, duration, ease: 'power2.inOut' }, 0.32 * duration)
      } else {
        reveal.to(layers[2], { opacity: 0, duration, ease: 'power2.inOut' })
          .to(layers[1], { opacity: 0, duration, ease: 'power2.inOut' }, 0.16 * duration)
          .to(layers[0], { opacity: 0, duration, ease: 'power2.inOut' }, 0.32 * duration)
      }
      timeline.current = reveal
    }

    if (coverComplete.current && expectedLocation.current === location) {
      const firstFrame = requestAnimationFrame(() => {
        requestAnimationFrame(beginReveal)
      })
      return () => cancelAnimationFrame(firstFrame)
    }
    if (active.current && expectedLocation.current && expectedLocation.current !== location) {
      clearOverlay(overlay.current, timeline.current)
      timeline.current = null
      expectedLocation.current = null
      coverComplete.current = false
      active.current = false
    }
  }, [location])

  useEffect(() => {
    const node = overlay.current
    const onNavigate = (event: Event) => {
      if (active.current) return
      const { to, navigate } = (event as CustomEvent<NavigationDetail>).detail
      if (!node) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        navigate(to)
        return
      }

      const leaving = brandBySlug(document.documentElement.dataset.brand ?? '')
      const brand = brandForPath(to) ?? leaving
      const variant = ['curtain', 'slash', 'grid', 'fade'].includes(brand?.motion.transition ?? '')
        ? brand?.motion.transition ?? 'fade'
        : 'fade'
      const duration = gsap.utils.clamp(0.9, 1.6, brand?.motion.duration ?? 0.9)
      const accent = brand?.theme.accent ?? '#B8975A'
      const bg = brand?.theme.bg ?? '#F6F5F2'
      node.style.setProperty('--transition-accent', accent)
      node.style.setProperty('--transition-bg', bg)
      node.style.setProperty('--transition-blend', `color-mix(in oklab, ${accent} 40%, ${bg})`)
      node.dataset.variant = variant
      node.dataset.duration = String(duration)
      active.current = true
      coverComplete.current = false
      gsap.set(node, { display: 'block' })

      const layers = node.querySelectorAll<HTMLElement>('[data-transition-layer]')
      const bars = node.querySelectorAll<HTMLElement>('[data-transition-bar]')
      timeline.current?.kill()
      const cover = gsap.timeline({
        onComplete: () => {
          coverComplete.current = true
          expectedLocation.current = to
          document.documentElement.classList.add('theme-transitioning')
          navigate(to)
        },
      })
      if (variant === 'grid') {
        gsap.set([layers[0], layers[1]], { opacity: 0 })
        gsap.set(bars, { yPercent: 110 })
        gsap.set(node.querySelector('[data-transition-layer="c"]'), { opacity: 0 })
        cover.to(bars, { yPercent: 0, duration: duration * 0.9, stagger: 0.012, ease: motion.ease })
          .to(node.querySelector('[data-transition-layer="c"]'), { opacity: 1, duration: duration * 0.9, ease: motion.ease }, duration * 0.36)
      } else if (variant === 'curtain') {
        gsap.set(layers, { yPercent: 110 })
        cover.to(layers[0], { yPercent: 0, duration: duration * 0.9, ease: motion.inOut })
          .to(layers[1], { yPercent: 0, duration: duration * 0.9, ease: motion.inOut }, duration * 0.18)
          .to(layers[2], { yPercent: 0, duration: duration * 0.9, ease: motion.inOut }, duration * 0.36)
      } else if (variant === 'slash') {
        gsap.set(layers, { xPercent: -130 })
        cover.to(layers[0], { xPercent: 0, duration: duration * 0.9, ease: motion.inOut })
          .to(layers[1], { xPercent: 0, duration: duration * 0.9, ease: motion.inOut }, duration * 0.18)
          .to(layers[2], { xPercent: 0, duration: duration * 0.9, ease: motion.inOut }, duration * 0.36)
      } else {
        gsap.set(layers, { opacity: 0 })
        cover.to(layers[0], { opacity: 1, duration: duration * 0.9, ease: motion.inOut })
          .to(layers[1], { opacity: 1, duration: duration * 0.9, ease: motion.inOut }, duration * 0.18)
          .to(layers[2], { opacity: 1, duration: duration * 0.9, ease: motion.inOut }, duration * 0.36)
      }
      cover.call(() => undefined, undefined, '+=0.3')
      timeline.current = cover
    }
    window.addEventListener('velo:navigate', onNavigate)
    return () => {
      window.removeEventListener('velo:navigate', onNavigate)
      clearOverlay(node, timeline.current)
    }
  }, [])

  return (
    <div ref={overlay} aria-hidden="true" className="page-transition pointer-events-none fixed inset-0 z-[100] hidden">
      <span data-transition-layer="a" className="page-transition__layer page-transition__layer--a" />
      <span data-transition-layer="b" className="page-transition__layer page-transition__layer--b" />
      <span data-transition-layer="c" className="page-transition__layer page-transition__layer--c" />
      <div className="page-transition__grid">
        {Array.from({ length: 12 }, (_, index) => (
          <span key={index} data-transition-bar style={{ left: `${(index / 12) * 100}%` }} />
        ))}
      </div>
    </div>
  )
}
