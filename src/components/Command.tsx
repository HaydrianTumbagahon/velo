import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useLocation } from 'wouter'
import { useCompare } from '../lib/compare'
import { publishedBikes, brands } from '../lib/data'
import { getLenis } from '../lib/smooth'
import { gsap } from '../lib/gsap'
import { useBrandMotion } from '../hooks/useBrandMotion'
import { useGSAP } from '../lib/gsap'
import { Button } from './Button'

type CommandProps = {
  open: boolean
  mode?: 'navigate' | 'compare'
  onClose: () => void
}

type Result = {
  kind: 'brand' | 'bike'
  id: string
  label: string
  detail: string
  href: string
}

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}

export function Command({ open, mode = 'navigate', onClose }: CommandProps) {
  const [mounted, setMounted] = useState(open)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const dialog = useRef<HTMLDivElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const [, navigate] = useLocation()
  const compare = useCompare()
  const motion = useBrandMotion()

  useGSAP(() => {
    if (open) {
      setMounted(true)
      return
    }
    if (!mounted || !dialog.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setMounted(false)
      getLenis()?.start()
      returnFocus.current?.focus()
      returnFocus.current = null
      return
    }
    gsap.to(dialog.current, {
      opacity: 0,
      scale: 0.98,
      duration: motion.duration,
      ease: motion.ease,
      onComplete: () => {
        setMounted(false)
        getLenis()?.start()
        returnFocus.current?.focus()
        returnFocus.current = null
      },
    })
  }, { scope: dialog, dependencies: [open, mounted, motion], revertOnUpdate: true })

  useGSAP(() => {
    if (!open || !dialog.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo(dialog.current, { opacity: 0, scale: 0.98 }, {
      opacity: 1,
      scale: 1,
      duration: motion.duration,
      ease: motion.ease,
    })
  }, { scope: dialog, dependencies: [open, motion] })

  useEffect(() => {
    if (!open) return
    getLenis()?.stop()
    if (!returnFocus.current) {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    }
    const app = document.getElementById('app-shell')
    if (app) app.inert = true
    input.current?.focus()
    return () => {
      if (app) app.inert = false
    }
  }, [open, mounted])

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      const shortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k'
      const slash = event.key === '/' && !isTypingTarget(event.target)
      if (shortcut || slash) {
        event.preventDefault()
        window.dispatchEvent(new Event('velo:open-command'))
      }
      if (open && event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, open])

  const results = useMemo(() => {
    const search = query.trim().toLocaleLowerCase()
    const brandResults: Result[] = brands
      .filter((brand) => !search || brand.name.toLocaleLowerCase().includes(search))
      .map((brand) => ({
        kind: 'brand',
        id: brand.slug,
        label: brand.name,
        detail: brand.origin,
        href: `/brands/${brand.slug}`,
      }))
    const bikeResults: Result[] = publishedBikes
      .filter((bike) => {
        const brandName = brands.find((brand) => brand.slug === bike.brand)?.name ?? bike.brand
        const family = 'family' in bike ? bike.family : ''
        return !search || [brandName, bike.name, family, bike.discipline, bike.facts.Groupset, bike.category, String(bike.year ?? '')]
          .filter((value): value is string => typeof value === 'string')
          .some((value) => value.toLocaleLowerCase().includes(search))
      })
      .map((bike) => ({
        kind: 'bike',
        id: `${bike.brand}/${bike.slug}`,
        label: bike.name,
        detail: [
          brands.find((brand) => brand.slug === bike.brand)?.name ?? bike.brand,
          bike.discipline,
          bike.facts.Groupset,
        ].filter(Boolean).join(' · '),
        href: `/brands/${bike.brand}/${bike.slug}`,
      }))
    return { brands: brandResults, bikes: bikeResults, flat: [...brandResults, ...bikeResults] }
  }, [query])

  const choose = (result: Result) => {
    if (mode === 'compare' && result.kind === 'bike') {
      if (compare.ids.length >= 3 && !compare.has(result.id)) return
      compare.add(result.id)
      window.dispatchEvent(new CustomEvent('velo:compare-add', { detail: result.id }))
    } else {
      navigate(result.href)
    }
    onClose()
  }

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!results.flat.length) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, results.flat.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter' && results.flat[activeIndex]) {
      choose(results.flat[activeIndex])
    }
  }

  if (!mounted) return null
  let resultIndex = -1

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'compare' ? 'Choose a bike to compare' : 'Search brands and bikes'}
      data-lenis-prevent
      data-cursor="drag"
      className="paper fixed inset-0 z-[110] overflow-y-auto px-5 py-16"
      onMouseDown={(event) => {
        if (event.target === dialog.current) onClose()
      }}
    >
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-4 border-b border-stone-300">
          <input
            ref={input}
            value={query}
            onChange={(event) => {
              setQuery(event.currentTarget.value)
              setActiveIndex(0)
            }}
            onKeyDown={onInputKeyDown}
            className="min-h-16 w-full bg-transparent text-2xl text-fg outline-none placeholder:text-stone-600"
            type="search"
            placeholder="Search brands and bikes"
            aria-label="Search brands and bikes"
          />
          <Button variant="text" onClick={onClose} className="min-h-11 px-3">
            Close
          </Button>
        </div>
        <div className="mt-10">
          {mode === 'compare' && compare.ids.length >= 3 && (
            <p role="status" className="mb-5 text-sm text-stone-600">
              Remove a bike from the comparison before adding another.
            </p>
          )}
          {(['brands', 'bikes'] as const).map((group) => {
            const items = results[group]
            if (!items.length) return null
            return (
              <section key={group} className="mb-8" aria-labelledby={`command-${group}`}>
                <h2 id={`command-${group}`} className="mb-3 text-sm text-stone-600">
                  {group === 'brands' ? 'Brands' : 'Bikes'}
                </h2>
                <ul>
                  {items.map((item) => {
                    resultIndex += 1
                    const index = resultIndex
                    return (
                      <li key={item.id}>
                        <Button
                          variant="text"
                          disabled={mode === 'compare' && item.kind === 'bike' && compare.ids.length >= 3 && !compare.has(item.id)}
                          className={`flex min-h-14 w-full items-center justify-between gap-4 border-b border-stone-300 py-3 text-left ${
                            activeIndex === index ? 'text-link' : 'text-fg'
                          }`}
                          data-cursor="link"
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => choose(item)}
                        >
                          <span className="text-lg">{item.label}</span>
                          <span className="text-sm text-stone-600">{item.detail}</span>
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
          {!results.flat.length && <p className="text-stone-600">No matches.</p>}
        </div>
      </div>
    </div>
  )
}
