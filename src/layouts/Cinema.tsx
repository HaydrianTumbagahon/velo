import { useRef, useState } from 'react'
import { NavLink } from '../components/NavLink'
import { Photo } from '../components/Photo'
import { useBrandMotion } from '../hooks/useBrandMotion'
import { priceLabel } from '../lib/data'
import { gsap, useGSAP } from '../lib/gsap'
import { reveal } from '../lib/reveal'
import { CompareToggle } from './CompareToggle'
import { FitText } from '../components/FitText'
import copy from '../data/copy.json'
import type { BrandLayoutProps } from './types'

function CinemaHeader({ brand, groupTabs }: BrandLayoutProps) {
  const header = useRef<HTMLElement>(null)
  const motion = useBrandMotion(brand)

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !header.current) return
    reveal(Array.from(header.current.querySelectorAll('[data-cinema-header]')), motion.reveal, motion, {
      trigger: header.current,
      start: 'top 85%',
      once: true,
    })
  }, { scope: header, dependencies: [motion], revertOnUpdate: true })

  return (
    <header ref={header} className="flex min-h-[78svh] flex-col justify-end px-6 pb-12 pt-36 md:px-12 md:pb-16">
      <FitText as="h1" min={0.45}
        data-cinema-header
        className="font-brand t-display-xl italic"
        style={{ color: 'var(--link)' }}
      >
        {brand.name}
      </FitText>
      <p data-cinema-header className="mt-8 max-w-2xl text-body-l text-fg">
        {brand.blurb}
      </p>
      <p data-cinema-header className="mt-3 text-stone-600">
        {brand.origin}, {brand.founded}
      </p>
      {groupTabs}
    </header>
  )
}

function CinemaSlide({
  brand,
  bike,
  index,
  trackTween,
}: {
  brand: BrandLayoutProps['brand']
  bike: BrandLayoutProps['bikes'][number]
  index: number
  trackTween: gsap.core.Tween | null
}) {
  const slide = useRef<HTMLElement>(null)
  const photo = useRef<HTMLDivElement>(null)
  const motion = useBrandMotion(brand)
  const price = priceLabel(bike)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !slide.current) return
      const desktop = window.matchMedia('(min-width: 768px)').matches
      const trigger = desktop && trackTween
        ? {
            trigger: slide.current,
            containerAnimation: trackTween,
            start: 'left 80%',
            once: true,
          }
        : { trigger: slide.current, start: 'top 80%', once: true }
      const image = photo.current
      const heading = slide.current.querySelector<HTMLElement>('[data-cinema-name]')
      const supporting = Array.from(
        slide.current.querySelectorAll<HTMLElement>('[data-cinema-support]'),
      )
      if (image) {
        reveal(image, 'fade', motion, trigger)
        gsap.fromTo(
          image,
          { clipPath: 'inset(0 100% 0 0)' },
          { clipPath: 'inset(0 0% 0 0)', duration: motion.duration, ease: motion.ease, scrollTrigger: trigger },
        )
        if (desktop && trackTween) {
          gsap.to(image, {
            xPercent: 10,
            ease: 'none',
            scrollTrigger: {
              trigger: slide.current,
              containerAnimation: trackTween,
              start: 'left right',
              end: 'right left',
              scrub: true,
            },
          })
        }
      }
      if (heading) reveal(heading, motion.reveal, motion, trigger)
      if (supporting.length) reveal(supporting, motion.reveal, motion, trigger)
    },
    { scope: slide, dependencies: [motion, trackTween], revertOnUpdate: true },
  )

  return (
    <article ref={slide} data-section-mobile className="relative flex min-h-svh w-full shrink-0 flex-col justify-center px-6 py-20 md:w-screen md:px-12">
      <p data-cinema-support className="absolute right-6 top-28 z-10 max-w-[40%] text-right text-sm text-stone-600 md:right-12 md:top-12">
        {bike.tagline}
      </p>
      <div ref={photo} className="relative z-[1] mx-auto w-full max-w-[78vw]">
        <Photo bike={bike} priority={index === 0} sizes="78vw" />
      </div>
      <FitText as="h2" min={0.4}
        data-cinema-name
        className="pointer-events-none absolute bottom-[19%] left-6 z-0 max-w-[90vw] font-brand text-[clamp(2.5rem,8vw,8.5rem)] font-medium italic text-fg md:left-12"
      >
        {bike.name}
      </FitText>
      <div data-cinema-support className="relative z-10 mt-6 flex flex-wrap items-center justify-between gap-5">
        {price && bike.price ? (
          <a
            href={brand.website}
            title={bike.price.asOf}
            target="_blank"
            rel="noopener noreferrer"
            className="link price text-sm text-stone-600"
          >
            {price}
          </a>
        ) : <span />}
        <div className="flex items-center gap-6">
          <CompareToggle bike={bike} />
          <NavLink
            to={`/brands/${brand.slug}/${bike.slug}`}
            className="inline-flex min-h-11 items-center text-fg"
          >
            {copy.brand.open.replace('{name}', bike.name)}
          </NavLink>
        </div>
      </div>
    </article>
  )
}

export default function Cinema({ brand, bikes, groupTabs, activeGroupTabId }: BrandLayoutProps) {
  const scene = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [trackTween, setTrackTween] = useState<gsap.core.Tween | null>(null)

  useGSAP(
    () => {
      const media = gsap.matchMedia()
      media.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        if (!track.current || !scene.current) return
        const tween = gsap.to(track.current, {
          x: () => -(track.current!.scrollWidth - window.innerWidth),
          ease: 'none',
          scrollTrigger: {
            trigger: scene.current,
            start: 'top top',
            end: () => `+=${track.current!.scrollWidth - window.innerWidth}`,
            pin: true,
            scrub: true,
            invalidateOnRefresh: true,
            snap: {
              snapTo: bikes.length > 1 ? 1 / (bikes.length - 1) : 1,
              delay: 0.1,
              duration: { min: 0.2, max: 0.6 },
            },
          },
        })
        setTrackTween(tween)
      })
      return () => media.revert()
    },
    { scope: scene, dependencies: [bikes.length], revertOnUpdate: true },
  )

  return (
    <div
      id="brand-group-panel"
      data-brand-layout
      role={activeGroupTabId ? 'tabpanel' : undefined}
      aria-labelledby={activeGroupTabId}
    >
      <CinemaHeader brand={brand} bikes={bikes} groupTabs={groupTabs} />
      <section ref={scene} data-horizontal-scene aria-label={`${brand.name} models`} className="paper overflow-hidden">
        <div ref={track} className="flex flex-col md:flex-row">
          {bikes.map((bike, index) => (
            <CinemaSlide
              key={bike.slug}
              brand={brand}
              bike={bike}
              index={index}
              trackTween={trackTween}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
