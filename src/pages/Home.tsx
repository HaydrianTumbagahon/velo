import { useRef, type CSSProperties } from 'react'
import site from '../data/site.json'
import glossary from '../data/glossary.json'
import { brands, publishedBikes, brandBySlug, priceLabel } from '../lib/data'
import { routeChunks } from '../routes'
import { useDetail } from '../lib/detail'
import { gsap, useGSAP } from '../lib/gsap'
import { reveal } from '../lib/reveal'
import { useBrandMotion } from '../hooks/useBrandMotion'
import { DetailSwitch } from '../components/DetailSwitch'
import { Hero } from '../components/Hero'
import { Statement } from '../components/Statement'
import { Photo } from '../components/Photo'
import { NavLink } from '../components/NavLink'
import { Seo } from '../components/Seo'
import { loadBrandFont } from '../lib/brandFonts'
import { FitText } from '../components/FitText'
import copy from '../data/copy.json'
import type { Brand, Bike } from '../types'

type BrandStyle = CSSProperties & {
  '--bg': string
  '--ink': string
  '--accent': string
  '--font-display': string
}

function scheduleIdle(callback: () => void): () => void {
  const idleWindow = window as Window & {
    requestIdleCallback?: (callback: IdleRequestCallback) => number
    cancelIdleCallback?: (id: number) => void
  }
  if (idleWindow.requestIdleCallback) {
    const id = idleWindow.requestIdleCallback(() => callback())
    return () => idleWindow.cancelIdleCallback?.(id)
  }
  const timer = window.setTimeout(callback, 600)
  return () => window.clearTimeout(timer)
}

function BrandPanel({ brand }: { brand: Brand }) {
  const motion = useBrandMotion(brand)
  const panel = useRef<HTMLElement>(null)
  const fontName = brand.theme.font === 'Archivo' ? 'Archivo Variable' : brand.theme.font
  const style: BrandStyle = {
    '--bg': brand.theme.bg,
    '--ink': brand.theme.ink,
    '--accent': brand.theme.accent,
    '--font-display': `'${fontName}', sans-serif`,
    color: 'var(--ink)',
  }

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const title = panel.current?.querySelector<HTMLElement>('[data-brand-title]')
      if (title) {
        reveal(title, motion.reveal, motion, {
          trigger: panel.current,
          start: 'top 80%',
          once: true,
        })
      }
    },
    { scope: panel },
  )

  useGSAP(() => {
    const cancel = scheduleIdle(() => {
      void loadBrandFont(brand.theme.font)
    })
    return cancel
  }, { scope: panel })

  return (
    <article ref={panel} className="paper brand-panel flex min-h-svh flex-col justify-between px-6 py-28 md:px-12" style={style}>
      <div>
        <FitText as="h3" min={0.45} data-brand-title className="font-brand t-display-xl">
          {brand.name}
        </FitText>
        <p className="mt-8 max-w-xl text-body-l">{brand.blurb}</p>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-8">
        <p className="text-stone-600">{brand.origin}, {brand.founded}</p>
        <NavLink
          to={`/brands/${brand.slug}`}
          prefetch={routeChunks.brand}
          className="inline-flex min-h-11 items-center text-lg"
        >
          {copy.brand.browse.replace('{brand}', brand.name)}
        </NavLink>
      </div>
    </article>
  )
}

function BrandsScene() {
  const section = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const media = gsap.matchMedia()
      media.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        if (!section.current || !track.current) return
        const width = () => track.current!.scrollWidth - window.innerWidth
        gsap.to(track.current, {
          x: () => -width(),
          ease: 'none',
          scrollTrigger: {
            trigger: section.current,
            start: 'top top',
            end: () => `+=${width()}`,
            pin: true,
            scrub: 0.7,
            invalidateOnRefresh: true,
            snap: { snapTo: 1 / Math.max(brands.length - 1, 1), duration: { min: 0.2, max: 0.6 }, delay: 0.1 },
          },
        })
      })
      media.add('(max-width: 767px) and (prefers-reduced-motion: no-preference)', () => {
        section.current?.querySelectorAll<HTMLElement>('.brand-panel').forEach((panel) => {
          reveal(panel, 'fade', { ease: 'power3.out', duration: 0.8, stagger: 0.08 }, {
            trigger: panel,
            start: 'top 85%',
            once: true,
          })
        })
      })
      return () => media.revert()
    },
    { scope: section },
  )

  return (
    <section ref={section} id="brands" className="paper" aria-label="Brands">
      <div ref={track} className="brand-track">
        {brands.map((brand) => <BrandPanel key={brand.slug} brand={brand} />)}
      </div>
    </section>
  )
}

function FeaturedBike({ bike }: { bike: Bike }) {
  const brand = brandBySlug(bike.brand)
  const price = priceLabel(bike)
  return (
    <article data-section className="grid gap-5 py-8 md:grid-cols-[1.1fr_0.9fr] md:items-center md:gap-12">
      <NavLink
        to={`/brands/${bike.brand}/${bike.slug}`}
        prefetch={routeChunks.model}
        className="block"
        data-cursor="view"
      >
        <Photo bike={bike} sizes="(min-width: 768px) 55vw, 100vw" />
      </NavLink>
      <div>
        {brand && (
          <NavLink to={`/brands/${brand.slug}`} prefetch={routeChunks.brand} className="text-sm text-stone-600">
            {brand.name}
          </NavLink>
        )}
        <FitText as="h3" className="mt-2 font-brand t-display-m">
          <NavLink to={`/brands/${bike.brand}/${bike.slug}`} prefetch={routeChunks.model}>
            {bike.name}
          </NavLink>
        </FitText>
        {price && brand && bike.price && (
          <a
            href={brand.website}
            title={bike.price.asOf}
            target="_blank"
            rel="noopener noreferrer"
            className="link price mt-3 inline-flex min-h-11 items-center"
          >
            {price}
          </a>
        )}
      </div>
    </article>
  )
}

function GuideTeaser({ bike }: { bike: Bike }) {
  const detail = useDetail()
  const examples = (['Weight', 'Groupset', 'Tyre clearance'] as const)
    .map((label) => ({
      label,
      value: bike.facts[label],
      explanation: glossary[label]?.text,
    }))
    .filter((entry) => entry.value && entry.explanation)

  return (
    <section className="paper grid gap-10 px-6 py-24 md:grid-cols-2 md:items-center md:px-12 md:py-36">
      <div>
        <FitText as="h2" className="max-w-4xl font-brand t-display-l">{site.guideTeaser.headline}</FitText>
        <NavLink
          to="/guide"
          prefetch={routeChunks.guide}
          className="mt-8 inline-flex min-h-11 items-center"
        >
          Read the guide
        </NavLink>
      </div>
      <div>
        <DetailSwitch />
        <dl className="mt-8 divide-y divide-stone-300">
          {examples.map(({ label, value, explanation }) => (
            <div key={label} className="grid gap-2 py-4 sm:grid-cols-[minmax(8rem,0.7fr)_1.3fr]">
              <dt className="text-sm text-stone-600">{label}</dt>
              <dd>{detail === 'simple' ? explanation : value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function Outro() {
  return (
    <section className="paper flex min-h-svh flex-col items-start justify-between px-6 pb-20 pt-32 md:px-12">
      <FitText as="h2" min={0.45} className="font-brand t-display-xl">{site.outro.headline}</FitText>
      <NavLink
        to={site.outro.cta.href}
        prefetch={routeChunks.compare}
        className="inline-flex min-h-12 items-center bg-accent px-8 text-fg"
      >
        {site.outro.cta.label}
      </NavLink>
    </section>
  )
}

export function Home() {
  const featured = brands
    .map((brand) => publishedBikes.find((bike) => bike.brand === brand.slug))
    .filter((bike): bike is Bike => Boolean(bike))
  const demoBike = featured[0]

  return (
    <>
      <Seo />
      <Hero />
      <Statement />
      <BrandsScene />
      <section className="paper px-6 py-24 md:px-12 md:py-36" aria-labelledby="featured-heading">
        <FitText as="h2" id="featured-heading" className="mb-10 font-brand t-display-l">Featured bikes</FitText>
        {featured.map((bike) => <FeaturedBike key={`${bike.brand}/${bike.slug}`} bike={bike} />)}
      </section>
      {demoBike && <GuideTeaser bike={demoBike} />}
      <Outro />
    </>
  )
}
