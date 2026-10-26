import { useRef } from 'react'
import { CompareToggle } from './CompareToggle'
import type { BrandLayoutProps } from './types'
import { NavLink } from '../components/NavLink'
import { Photo } from '../components/Photo'
import { useBrandMotion } from '../hooks/useBrandMotion'
import { priceLabel } from '../lib/data'
import { gsap, useGSAP } from '../lib/gsap'
import { reveal } from '../lib/reveal'
import { FitText } from '../components/FitText'
import copy from '../data/copy.json'

export default function Editorial({ brand, bikes, groupTabs, activeGroupTabId }: BrandLayoutProps) {
  const root = useRef<HTMLElement>(null)
  const motion = useBrandMotion(brand)

  useGSAP(
    () => {
      const media = gsap.matchMedia()
      media.add('(prefers-reduced-motion: no-preference)', () => {
        root.current?.querySelectorAll<HTMLElement>('[data-editorial-reveal]').forEach((target) => {
          reveal(target, 'fade', motion, { trigger: target, start: 'top 85%', once: true })
        })
        root.current?.querySelectorAll<HTMLElement>('[data-editorial-parallax]').forEach((image, index) => {
          gsap.fromTo(
            image,
            { yPercent: index % 2 === 0 ? -8 : 8 },
            {
              yPercent: index % 2 === 0 ? 8 : -8,
              ease: 'none',
              scrollTrigger: {
                trigger: image.parentElement,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              },
            },
          )
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
      className="paper min-h-svh px-6 pb-24 pt-36 text-fg md:px-12"
    >
      <header className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-6">
        <div className="md:col-span-12">
          <FitText as="h1" min={0.45}
            data-editorial-reveal
            className="font-brand t-display-xl font-normal"
          >
            {brand.name}
          </FitText>
        </div>
        <p data-editorial-reveal className="text-body-l md:col-span-8">
          {brand.blurb}
        </p>
        <p data-editorial-reveal className="self-end text-sm text-stone-600 md:col-span-4">
          {brand.origin}, {brand.founded}
        </p>
        <div className="md:col-span-12">{groupTabs}</div>
      </header>

      <nav aria-label={`${brand.name} models`} className="mt-16 border-y border-stone-300 py-5">
        <ul className="flex flex-wrap gap-x-8 gap-y-3">
          {bikes.map((bike) => (
            <li key={bike.slug}>
              <a className="link inline-flex min-h-11 items-center" href={`#${bike.slug}`}>
                {bike.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-10">
        {bikes.map((bike, index) => {
          const price = priceLabel(bike)
          return (
            <article
              key={bike.slug}
              id={bike.slug}
              data-section
              className="grid scroll-mt-24 grid-cols-1 items-center gap-8 border-b border-stone-300 py-14 md:grid-cols-12 md:gap-6 md:py-20"
            >
              <div
                data-editorial-reveal
                className={`overflow-hidden md:col-span-8 ${index % 2 ? 'md:col-start-5 md:row-start-1' : ''}`}
              >
                <div data-editorial-parallax>
                  <Photo bike={bike} priority={index === 0} sizes="(min-width: 768px) 66vw, 100vw" />
                </div>
              </div>
              <div
                data-editorial-reveal
                className={`md:col-span-4 ${index % 2 ? 'md:col-start-1 md:row-start-1' : ''}`}
              >
                <div className="mb-6 h-px w-16 bg-accent" />
                <FitText as="h2" className="t-display-m">{bike.name}</FitText>
                {bike.tagline && <p className="mt-4 text-body-l">{bike.tagline}</p>}
                {price && bike.price && (
                  <a
                    href={brand.website}
                    title={bike.price.asOf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link price mt-5 inline-flex min-h-11 items-center"
                  >
                    {price}
                  </a>
                )}
                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
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
    </section>
  )
}
