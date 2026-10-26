import { revealLines } from './split'
import { gsap, SplitText, type ScrollTrigger } from './gsap'
import type { BrandMotion, RevealStyle } from '../hooks/useBrandMotion'

type TriggerConfig = Parameters<typeof ScrollTrigger.create>[0]

export function reveal(
  targets: string | Element | Element[],
  style: RevealStyle,
  motion: Pick<BrandMotion, 'ease' | 'duration' | 'stagger'>,
  scrollTrigger?: TriggerConfig,
): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const elements = gsap.utils.toArray<Element>(targets)
  if (!elements.length) return
  if (style === 'mask') {
    elements.forEach((target) => revealLines(target, scrollTrigger, motion))
    return
  }
  if (style === 'type') {
    new SplitText(elements, {
      type: 'chars',
      autoSplit: true,
      onSplit: (split) => {
        if (!split.chars.length) return
        return gsap.from(split.chars, {
          opacity: 0,
          duration: motion.duration,
          ease: motion.ease,
          stagger: Math.min(motion.stagger, 0.02),
          ...(scrollTrigger ? { scrollTrigger } : {}),
        })
      },
    })
    return
  }
  if (style === 'roll') {
    gsap.fromTo(
      targets,
      { x: -120, rotation: -25, opacity: 0 },
      {
        x: 0,
        rotation: 0,
        opacity: 1,
        transformOrigin: '50% 50%',
        duration: motion.duration,
        ease: motion.ease,
        stagger: motion.stagger,
        ...(scrollTrigger ? { scrollTrigger } : {}),
      },
    )
    return
  }

  const start = style === 'slide' ? { y: 40, opacity: 0 } : { opacity: 0 }
  const end = style === 'slide' ? { y: 0, opacity: 1 } : { opacity: 1 }

  gsap.fromTo(targets, start, {
    ...end,
    duration: motion.duration,
    ease: motion.ease,
    stagger: motion.stagger,
    ...(scrollTrigger ? { scrollTrigger } : {}),
  })
}
