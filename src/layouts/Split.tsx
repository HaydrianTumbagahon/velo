import { useEffect, useRef, useState } from 'react'
import { CompareToggle } from './CompareToggle'
import type { BrandLayoutProps } from './types'
import { NavLink } from '../components/NavLink'
import { Photo } from '../components/Photo'
import { useBrandMotion } from '../hooks/useBrandMotion'
import { priceLabel } from '../lib/data'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap'
import { reveal } from '../lib/reveal'
import { FitText } from '../components/FitText'
import copy from '../data/copy.json'

function factsFor(bike: BrandLayoutProps['bikes'][number]) {
  return (['Weight', 'Groupset', 'Tyre clearance'] as const)
    .map((key) => [key, bike.facts[key]] as const)
    .filter(
      (entry): entry is readonly ['Weight' | 'Groupset' | 'Tyre clearance', string] =>
        typeof entry[1] === 'string',
    )
}

export default function Split({ brand, bikes, groupTabs, activeGroupTabId }: BrandLayoutProps) {
  const root = useRef<HTMLElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const motion = useBrandMotion(brand)

  useEffect(() => {
    const images = root.current?.querySelectorAll<HTMLElement>('[data-split-image]')
    if (!images) return
    images.forEach((image, index) => {
      if (index === activeIndex && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.fromTo(
          image,
          { scale: 1.04, opacity: 0 },
          { scale: 1, opacity: 1, duration: motion.duration, ease: motion.ease, overwrite: true },
        )
      } else {
        gsap.set(image, { opacity: index === activeIndex ? 1 : 0, scale: 1 })
      }
    })
  }, [activeIndex, motion.duration, motion.ease])

  useGSAP(
    () => {
      const images = gsap.utils.toArray<HTMLElement>('[data-split-image]')
      images.forEach((image, index) => gsap.set(image, { opacity: index === 0 ? 1 : 0, scale: 1 }))

      const media = gsap.matchMedia()
      media.add('(min-width: 768px)', () => {
        bikes.forEach((_, index) => {
          const block = root.current?.querySelector<HTMLElement>(`[data-bike-index="${index}"]`)
          if (!block) return
          ScrollTrigger.create({
            trigger: block,
            start: 'top 55%',
            end: 'bottom 55%',
            onEnter: () => setActiveIndex(index),
            onEnterBack: () => setActiveIndex(index),
          })
        })
      })
      media.add('(prefers-reduced-motion: no-preference)', () => {
        root.current?.querySelectorAll<HTMLElement>('[data-split-reveal]').forEach((target) => {
          reveal(target, motion.reveal, motion, { trigger: target, start: 'top 85%', once: true })
        })
      })
      return () => media.revert()
    },
    { scope: root, dependencies: [bikes, motion], revertOnUpdate: true },
  )

  return (
    <section
      ref={root}
      id="brand-group-panel"
      data-brand-layout
      role={activeGroupTabId ? 'tabpanel' : undefined}
      aria-labelledby={activeGroupTabId}
      className="paper min-h-svh text-fg"
    >
      <header className="flex min-h-[62svh] flex-col justify-end px-6 pb-12 pt-36 md:px-12">
        <FitText as="h1" min={0.4}
          data-split-reveal
          className="font-brand t-display-xl font-medium"
          style={{ color: 'var(--link)' }}
        >
          {brand.name}
        </FitText>
        <p data-split-reveal className="mt-7 max-w-2xl text-body-l">{brand.blurb}</p>
        <p data-split-reveal className="mt-3 text-stone-600">{brand.origin}, {brand.founded}</p>
        {groupTabs}
      </header>
      <div className="px-6 pb-24 md:grid md:grid-cols-[1fr_1fr] md:gap-12 md:px-12">
        <div className="sticky top-0 hidden h-svh items-center md:flex">
          <div className="relative w-full">
            {bikes.map((bike, index) => (
              <div
                key={bike.slug}
                data-split-image
                className={`absolute inset-0 ${index === 0 ? 'relative' : ''}`}
                style={{ opacity: index === activeIndex ? 1 : 0 }}
              >
                <Photo bike={bike} priority={index === 0} sizes="48vw" />
              </div>
            ))}
          </div>
        </div>
        <div>
          {bikes.map((bike, index) => {
            const price = priceLabel(bike)
            return (
              <article
                key={bike.slug}
                data-bike-index={index}
                data-section
                className="flex min-h-[85svh] flex-col justify-center py-10"
              >
                <div data-split-reveal className="md:hidden">
                  <Photo bike={bike} sizes="100vw" />
                </div>
                <div data-split-reveal>
                  <FitText as="h2" min={0.45} className="mt-7 font-brand t-display-l font-medium">
                    {bike.name}
                  </FitText>
                  {bike.tagline && <p className="mt-4 text-body-l">{bike.tagline}</p>}
                  {factsFor(bike).length > 0 && (
                    <dl className="mt-6 divide-y divide-stone-300">
                      {factsFor(bike).map(([label, value]) => (
                        <div key={label} className="grid grid-cols-[minmax(8rem,0.7fr)_1.3fr] gap-4 py-3">
                          <dt className="text-sm text-stone-600">{label}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  {price && bike.price && (
                    <a
                      href={brand.website}
                      title={bike.price.asOf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link price mt-4 inline-flex min-h-11 items-center"
                    >
                      {price}
                    </a>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-6">
                    <NavLink
                      to={`/brands/${brand.slug}/${bike.slug}`}
                      className="inline-flex min-h-11 items-center"
                    >
                      {copy.brand.open.replace('{name}', bike.name)}
                    </NavLink>
                    <CompareToggle bike={bike} />
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
