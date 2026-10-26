import { useRef } from 'react'
import site from '../data/site.json'
import { heroImage } from '../lib/images'
import { useBrandMotion } from '../hooks/useBrandMotion'
import { useGSAP } from '../lib/gsap'
import { reveal } from '../lib/reveal'
import { Bike } from './Bike'
import { FitText } from './FitText'
import { HeroMedia } from './HeroMedia'

export function Hero() {
  const section = useRef<HTMLElement>(null)
  const bike = useRef<SVGSVGElement>(null)
  const image = heroImage()
  const hasPhoto = Boolean(image?.widths.length)
  const tone = (image?.luma ?? 1) > 0.55 ? 'ink' : 'paper'
  const motion = useBrandMotion()

  useGSAP(() => {
    if (hasPhoto || !bike.current) return
    reveal(bike.current, 'roll', motion)
  }, { scope: section, dependencies: [hasPhoto, motion], revertOnUpdate: true })

  return (
    <section
      ref={section}
      data-hero-tone={tone}
      className={`hero relative flex min-h-svh items-end px-6 pb-16 md:px-12 md:pb-20 ${hasPhoto ? 'hero--photo' : 'paper'}`}
    >
      {hasPhoto && <HeroMedia />}
      {!hasPhoto && (
        <>
          <span className="hero-ground" aria-hidden="true" />
          <Bike ref={bike} className="hero-bike absolute bottom-[18%] right-6 z-[1] w-[min(58vw,48rem)] md:right-12" />
        </>
      )}
      <FitText as="span" data-hero-wordmark aria-hidden="true" className="hero-wordmark absolute inset-x-6 top-[18%] z-[1] block select-none text-right font-brand text-[clamp(5rem,21vw,22rem)] font-bold leading-[0.82] tracking-[0.02em] md:inset-x-12">
        VELO
      </FitText>
      <FitText as="h1" data-hero-headline min={0.4} className="relative z-10 max-w-[14ch] font-brand text-[clamp(2.25rem,6.5vw,6rem)] font-medium text-[var(--hero-foreground)]">
        {site.hero.headline}
      </FitText>
    </section>
  )
}
