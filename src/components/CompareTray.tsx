import { useLocation } from 'wouter'
import { useCompare } from '../lib/compare'
import { publishedBikes, brandBySlug } from '../lib/data'
import { NavLink } from './NavLink'
import { gsap } from '../lib/gsap'
import { useEffect, useRef, useState } from 'react'
import { Button } from './Button'

export function CompareTray() {
  const tray = useRef<HTMLElement>(null)
  const [location] = useLocation()
  const { ids, clear } = useCompare()
  const shouldShow = ids.length > 0 && location.split('?')[0] !== '/compare'
  const [mounted, setMounted] = useState(shouldShow)
  const names = ids
    .map((id) => {
      const bike = publishedBikes.find((item) => `${item.brand}/${item.slug}` === id)
      return bike ? `${brandBySlug(bike.brand)?.name ?? bike.brand} ${bike.name}` : undefined
    })
    .filter(Boolean)

  useEffect(() => {
    if (shouldShow) {
      setMounted(true)
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const frame = window.requestAnimationFrame(() => {
        if (tray.current) gsap.fromTo(tray.current, { yPercent: 100 }, { yPercent: 0, duration: 0.35, ease: 'power3.out' })
      })
      return () => window.cancelAnimationFrame(frame)
    }
    if (!tray.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setMounted(false)
      return
    }
    const animation = gsap.to(tray.current, {
      yPercent: 100,
      duration: 0.3,
      ease: 'power3.in',
      onComplete: () => setMounted(false),
    })
    return () => animation.kill()
  }, [shouldShow])

  if (!mounted) return null
  return (
    <aside
      ref={tray}
      aria-label="Selected bikes for comparison"
      className="paper compare-tray fixed inset-x-0 bottom-0 z-40 border-t border-stone-300 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:px-8"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <p aria-live="polite" className="text-sm">
          {names.join(' · ')}
        </p>
        <div className="flex items-center gap-5">
          <NavLink
            to={`/compare?b=${encodeURIComponent(ids.join(','))}`}
            className="inline-flex min-h-11 items-center"
          >
            Compare
          </NavLink>
          <Button type="button" variant="text" className="min-h-11 px-2" onClick={clear}>
            Clear
          </Button>
        </div>
      </div>
    </aside>
  )
}
