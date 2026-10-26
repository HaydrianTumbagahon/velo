import type { BrandLayoutProps } from './types'
import { priceLabel } from '../lib/data'
import { useBrandMotion } from '../hooks/useBrandMotion'
import { reveal } from '../lib/reveal'
import { gsap, useGSAP } from '../lib/gsap'
import { Photo } from '../components/Photo'
import { NavLink } from '../components/NavLink'
import { CompareToggle } from './CompareToggle'
import { loadBrandFont } from '../lib/brandFonts'
import { useEffect } from 'react'
import { FitText } from '../components/FitText'
import copy from '../data/copy.json'

export default function FallbackLayout({ brand, bikes }: BrandLayoutProps) {
  const motion = useBrandMotion(brand)

  useEffect(() => {
    void loadBrandFont(brand.theme.font)
  }, [brand])

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.utils.toArray<HTMLElement>('[data-fallback-reveal]').forEach((target) => {
      reveal(target, motion.reveal, motion, { trigger: target, start: 'top 85%', once: true })
    })
  }, { dependencies: [motion], revertOnUpdate: true })

  return (
    <section className="paper min-h-svh px-6 pb-24 pt-36 text-fg md:px-12">
      <header className="mb-16">
        <FitText as="h1" min={0.45} data-fallback-reveal className="font-brand t-display-xl">
          {brand.name}
        </FitText>
        <p className="mt-6 max-w-2xl text-body-l">{brand.blurb}</p>
        <p className="mt-2 text-stone-600">{brand.origin}, {brand.founded}</p>
      </header>
      <div className="divide-y divide-stone-300">
        {bikes.map((bike, index) => {
          const price = priceLabel(bike)
          return (
            <article key={bike.slug} data-fallback-reveal className="py-10">
              <Photo bike={bike} priority={index === 0} sizes="(min-width: 768px) 70vw, 100vw" />
              <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
                <div>
                  <FitText as="h2" className="font-brand t-display-l">{bike.name}</FitText>
                  {bike.tagline && <p className="mt-2 text-stone-600">{bike.tagline}</p>}
                  {price && bike.price && (
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
                <div className="flex items-center gap-5">
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
