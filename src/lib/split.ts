import { gsap, ScrollTrigger, SplitText } from './gsap'

export function revealLines(
  el: Element,
  scrollTrigger?: Parameters<typeof ScrollTrigger.create>[0],
  motion: { ease: string; duration: number; stagger: number } = {
    ease: 'power3.out',
    duration: 0.8,
    stagger: 0.08,
  },
): SplitText {
  return new SplitText(el, {
    type: 'lines',
    mask: 'lines',
    linesClass: 'reveal-line',
    autoSplit: true,
    onSplit: (split) =>
      gsap.from(split.lines, {
        yPercent: 110,
        duration: motion.duration,
        ease: motion.ease,
        stagger: motion.stagger,
        ...(scrollTrigger ? { scrollTrigger } : {}),
      }),
  })
}
