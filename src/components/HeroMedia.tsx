import { useRef } from 'react'
import site from '../data/site.json'
import { heroImage } from '../lib/images'
import { gsap, useGSAP } from '../lib/gsap'

const hero = heroImage()
let warned = false

export function HeroMedia() {
  const section = useRef<HTMLDivElement>(null)
  const image = useRef<HTMLImageElement>(null)

  useGSAP(() => {
    if (!hero || !section.current || !image.current) {
      if (import.meta.env.DEV && !warned) {
        console.warn('Home hero image is missing from the generated image manifest.')
        warned = true
      }
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo(image.current, { clipPath: 'inset(100% 0 0 0)' }, {
      clipPath: 'inset(0)',
      duration: 1,
      ease: 'power3.out',
    })
    const heroSection = section.current.parentElement
    const headline = heroSection?.querySelector<HTMLElement>('[data-hero-headline]')
    const wordmark = heroSection?.querySelector<HTMLElement>('[data-hero-wordmark]')
    const scene = gsap.timeline({
      scrollTrigger: {
        trigger: heroSection,
        start: 'top top',
        end: '+=100%',
        pin: true,
        scrub: true,
      },
    })
    scene.to(image.current, { scale: 1.08, yPercent: -6, ease: 'none' }, 0)
    if (headline) scene.to(headline, { yPercent: -12, opacity: 0.85, ease: 'none' }, 0)
    if (wordmark) scene.to(wordmark, { yPercent: -6, opacity: 0.1, ease: 'none' }, 0)
  }, { scope: section })

  if (!hero?.widths.length) return null
  const webp = hero.widths.map((width) => `/site/hero-${width}.webp ${width}w`).join(', ')
  const avif = hero.widths.map((width) => `/site/hero-${width}.avif ${width}w`).join(', ')
  const fallbackWidth = hero.widths[hero.widths.length - 1]

  return (
    <div ref={section} className="hero-media">
      <picture>
        <source type="image/avif" srcSet={avif} sizes="100vw" />
        <source type="image/webp" srcSet={webp} sizes="100vw" />
        <img
          ref={image}
          src={`/site/hero-${fallbackWidth}.webp`}
          width={hero.width}
          height={hero.height}
          alt={site.hero.alt}
          fetchPriority="high"
          decoding="async"
          style={{ objectPosition: site.hero.focal }}
        />
      </picture>
    </div>
  )
}
