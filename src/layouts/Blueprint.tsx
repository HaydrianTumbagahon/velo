import { useEffect, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react'
import { CompareToggle } from './CompareToggle'
import type { BrandLayoutProps } from './types'
import { NavLink } from '../components/NavLink'
import { Photo } from '../components/Photo'
import { useBrandMotion } from '../hooks/useBrandMotion'
import { priceLabel } from '../lib/data'
import { imageFor, imagePathFor } from '../lib/images'
import { DrawSVGPlugin, gsap, useGSAP } from '../lib/gsap'
import { FitText } from '../components/FitText'
import copy from '../data/copy.json'
import { Button } from '../components/Button'

const calloutAnchors = {
  Frame: { x: 52, y: 38 },
  'Tyre clearance': { x: 24, y: 62 },
  Wheels: { x: 78, y: 62 },
  Groupset: { x: 48, y: 66 },
  Cockpit: { x: 72, y: 34 },
} as const

type CalloutLabel = keyof typeof calloutAnchors
function getCallouts(bike: BrandLayoutProps['bikes'][number]) {
  return (Object.keys(calloutAnchors) as CalloutLabel[])
    .map((label) => ({ label, value: bike.facts[label], ...calloutAnchors[label] }))
    .filter((item) => typeof item.value === 'string')
}

const endpoints: Record<CalloutLabel, { x: number; y: number }> = {
  Frame: { x: 44, y: 19 },
  'Tyre clearance': { x: 18, y: 81 },
  Wheels: { x: 84, y: 78 },
  Groupset: { x: 45, y: 85 },
  Cockpit: { x: 82, y: 19 },
}

function preloadSidePhoto(bike: BrandLayoutProps['bikes'][number]) {
  const entry = imageFor(bike, 'side')
  const width = entry?.widths[entry.widths.length - 1]
  if (!width) return
  const image = new Image()
  image.src = `/bikes/${imagePathFor(bike, 'side')}/side-${width}.webp`
}

export default function Blueprint({ brand, bikes, groupTabs, activeGroupTabId }: BrandLayoutProps) {
  const root = useRef<HTMLElement>(null)
  const carousel = useRef<HTMLDivElement>(null)
  const items = useRef<Array<HTMLButtonElement | null>>([])
  const dragStart = useRef<number | null>(null)
  const panel = useRef<HTMLElement>(null)
  const photo = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState(0)
  const [previous, setPrevious] = useState<BrandLayoutProps['bikes'][number] | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const motion = useBrandMotion(brand)
  const bike = bikes[selected]
  const callouts = bike ? getCallouts(bike) : []
  const price = bike ? priceLabel(bike) : null

  useEffect(() => {
    bikes.slice(Math.max(0, selected - 1), selected + 2).forEach((item) => {
      if (item.slug !== bike?.slug) preloadSidePhoto(item)
    })
  }, [bikes, bike, selected])

  useGSAP(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    items.current.forEach((item, index) => {
      if (!item) return
      const offset = index - selected
      const distance = Math.abs(offset)
      const spacing = Math.max(150, Math.min(320, window.innerWidth * 0.2))
      const opacity = distance > 3 ? 0 : [1, 0.5, 0.24, 0.1][distance]
      const vars = {
        x: offset * spacing,
        z: offset === 0 ? 60 : -distance * 120,
        rotationY: -offset * 14,
        scale: offset === 0 ? 1.15 : Math.max(0.1, 1 - distance * 0.2),
        opacity,
        duration: motion.duration,
        ease: motion.ease,
        overwrite: true,
      }
      if (reduced) gsap.set(item, vars)
      else gsap.to(item, vars)
      item.style.pointerEvents = distance > 3 ? 'none' : 'auto'
    })
  }, { scope: root, dependencies: [bikes, selected, motion], revertOnUpdate: true })

  useGSAP(() => {
    if (!panel.current || !bike) return
    const activePhoto = photo.current
    const old = panel.current.querySelector<HTMLElement>('[data-previous-photo]')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      if (activePhoto) gsap.set(activePhoto, { opacity: 1 })
      if (old) gsap.set(old, { opacity: 0 })
      return
    }
    if (activePhoto) {
      gsap.fromTo(activePhoto, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: motion.ease, overwrite: true })
    }
    if (old) {
      gsap.to(old, { opacity: 0, duration: 0.5, ease: motion.ease, overwrite: true, onComplete: () => setPrevious(null) })
    }
    const lines = gsap.utils.toArray<SVGLineElement>('[data-leader]', panel.current)
    if (lines.length) {
      gsap.set(lines, { drawSVG: '0%' })
      gsap.to(lines, { drawSVG: '100%', duration: motion.duration, ease: motion.ease, stagger: motion.stagger })
    }
    panel.current.querySelectorAll<HTMLElement>('[data-callout-value]').forEach((node) => {
      const text = node.textContent ?? ''
      const match = text.match(/^(\d+(?:\.\d+)?)(.*)$/)
      if (!match) return
      const target = Number(match[1])
      const counter = { value: 0 }
      gsap.to(counter, {
        value: target,
        duration: 0.7,
        ease: 'steps(12)',
        onUpdate: () => { node.textContent = `${Number(counter.value.toFixed(1))}${match[2]}` },
        onComplete: () => { node.textContent = text },
      })
    })
  }, { scope: panel, dependencies: [bike, previous, motion], revertOnUpdate: true })

  const select = (index: number) => {
    if (!bikes.length) return
    const next = (index + bikes.length) % bikes.length
    if (next === selected) return
    setPrevious(bike ?? null)
    setSelected(next)
    setAnnouncement(bikes[next].name)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      select(index + 1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      select(index - 1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      select(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      select(bikes.length - 1)
    }
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragStart.current = event.clientX
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return
    const distance = event.clientX - dragStart.current
    dragStart.current = null
    if (Math.abs(distance) >= 40) select(selected + (distance < 0 ? 1 : -1))
  }

  if (!bike) {
    return (
      <section
        ref={root}
        id="brand-group-panel"
        data-brand-layout
        role={activeGroupTabId ? 'tabpanel' : undefined}
        aria-labelledby={activeGroupTabId}
        className="paper min-h-svh px-6 pb-20 pt-36 text-fg md:px-12"
      >
        <header><h1 className="font-brand t-display-xl">{brand.name}</h1>{groupTabs}</header>
      </section>
    )
  }

  return (
    <section
      ref={root}
      id="brand-group-panel"
      data-brand-layout
      role={activeGroupTabId ? 'tabpanel' : undefined}
      aria-labelledby={activeGroupTabId}
      className="paper relative min-h-svh px-6 pb-20 pt-36 text-fg md:px-12"
    >
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full">
        <defs>
          <pattern id="blueprint-grid-small" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="#CFCDC8" strokeWidth="1" />
          </pattern>
          <pattern id="blueprint-grid-large" width="200" height="200" patternUnits="userSpaceOnUse">
            <path d="M200 0H0V200" fill="none" stroke="#CFCDC8" strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#blueprint-grid-small)" />
        <rect width="100%" height="100%" fill="url(#blueprint-grid-large)" />
      </svg>
      <header className="relative">
        <FitText as="h1" min={0.45} className="font-brand t-display-xl">{brand.name}</FitText>
        <p className="mt-5 max-w-2xl font-brand text-sm text-stone-600">{brand.blurb}</p>
        <p className="mt-2 font-brand text-sm text-stone-600">{brand.origin}, {brand.founded}</p>
        {groupTabs}
      </header>

      <div
        ref={carousel}
        className="blueprint-carousel mt-8"
        role="tablist"
        aria-label={`${brand.name} models`}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { dragStart.current = null }}
      >
        {bikes.map((item, index) => (
          <button
            key={item.slug}
            ref={(element) => { items.current[index] = element }}
            id={`blueprint-tab-${index}`}
            role="tab"
            type="button"
            aria-selected={selected === index}
            aria-controls="blueprint-panel"
            tabIndex={selected === index ? 0 : -1}
            data-cursor="drag"
            onClick={() => select(index)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={`blueprint-carousel__item ${selected === index ? 'is-active' : ''}`}
          >
            {selected === index
              ? <FitText min={0.5} className="block max-w-[60vw] font-brand t-display-m">{item.name}</FitText>
              : <span>{item.name}</span>}
          </button>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-3">
        <Button variant="round" aria-label="Previous model" onClick={() => select(selected - 1)}>←</Button>
        <Button variant="round" aria-label="Next model" onClick={() => select(selected + 1)}>→</Button>
      </div>
      <p className="sr-only" aria-live="polite">{announcement}</p>

      <article
        ref={panel}
        id="blueprint-panel"
        role="tabpanel"
        aria-labelledby={`blueprint-tab-${selected}`}
        className="mt-8"
      >
        <div className="relative mx-auto w-full max-w-6xl">
          {previous && (
            <div data-previous-photo className="absolute inset-0 z-[1]">
              <Photo bike={previous} sizes="(min-width: 768px) 80vw, 100vw" />
            </div>
          )}
          <div ref={photo} className="relative">
            <Photo bike={bike} sizes="(min-width: 768px) 80vw, 100vw" priority />
          </div>
          <svg aria-hidden="true" className="pointer-events-none absolute inset-0 hidden h-full w-full overflow-visible md:block" viewBox="0 0 100 100" preserveAspectRatio="none">
            {callouts.map(({ label, x, y }) => (
              <line key={label} data-leader x1={x} y1={y} x2={endpoints[label].x} y2={endpoints[label].y} stroke="var(--accent)" strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
            ))}
          </svg>
          {callouts.map(({ label, value, x, y }) => (
            <div key={label} data-callout className="absolute hidden max-w-40 font-brand text-xs md:block" style={{ left: `${x}%`, top: `${y}%` }}>
              <p className="text-stone-600">{label}</p>
              <p data-callout-value className="mt-1 text-fg">{value}</p>
            </div>
          ))}
        </div>
        <dl className="mx-auto mt-6 grid max-w-6xl grid-cols-2 gap-x-5 gap-y-4 border-t border-stone-300 pt-5 font-brand text-sm md:hidden">
          {callouts.map(({ label, value }) => <div key={label}><dt className="text-stone-600">{label}</dt><dd>{value}</dd></div>)}
        </dl>
        <div className="mx-auto mt-8 flex max-w-6xl flex-wrap items-end justify-between gap-6 font-brand">
          <div>
            <FitText as="h2" className="t-display-m">{bike.name}</FitText>
            {bike.tagline && <p className="mt-2 text-sm text-stone-600">{bike.tagline}</p>}
            {price && bike.price && (
              <a href={brand.website} title={bike.price.asOf} target="_blank" rel="noopener noreferrer" className="link price mt-3 inline-flex min-h-11 items-center">
                {price}
              </a>
            )}
          </div>
          <div className="flex items-center gap-6">
            <CompareToggle bike={bike} />
            <NavLink to={`/brands/${brand.slug}/${bike.slug}`} className="inline-flex min-h-11 items-center">
              {copy.brand.open.replace('{name}', bike.name)}
            </NavLink>
          </div>
        </div>
      </article>
    </section>
  )
}

gsap.registerPlugin(DrawSVGPlugin)
