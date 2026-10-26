import { useBrandMotion } from './useBrandMotion'
import type { Brand } from '../types'
import { ScrollTrigger, gsap, useGSAP } from '../lib/gsap'

export function useSectionMotion(scope: React.RefObject<HTMLElement | null>, brand?: Brand | null): void {
  const motion = useBrandMotion(brand)

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const horizontal = scope.current?.matches('[data-horizontal-layout]')
    const sections = Array.from(scope.current?.querySelectorAll<HTMLElement>('[data-section], [data-section-mobile]') ?? [])
      .filter((section) =>
        !section.closest('[data-horizontal-scene]') ||
        (section.hasAttribute('data-section-mobile') && window.matchMedia('(max-width: 767px)').matches),
      )
    sections.forEach((section, index) => {
      const x = horizontal ? (index % 2 ? 56 : -56) : 0
      const y = horizontal ? 0 : 56
      const intro = gsap.fromTo(section, { opacity: 0, x, y }, {
        opacity: 1,
        x: 0,
        y: 0,
        ease: motion.ease,
        scrollTrigger: {
          trigger: section,
          start: 'top 92%',
          end: 'top 62%',
          scrub: motion.duration * 0.4,
        },
      })
      const outro = gsap.to(section, {
        opacity: 0,
        x: horizontal ? (index % 2 ? -40 : 40) : 0,
        y: horizontal ? 0 : -40,
        ease: motion.ease,
        scrollTrigger: {
          trigger: section,
          start: 'bottom 38%',
          end: 'bottom 8%',
          scrub: motion.duration * 0.4,
        },
      })
      return () => {
        intro.scrollTrigger?.kill()
        outro.scrollTrigger?.kill()
      }
    })
    ScrollTrigger.refresh()
  }, { scope, dependencies: [motion] })
}
