import { useRef } from 'react'
import type { Brand } from '../types'
import { useBrandMotion } from '../hooks/useBrandMotion'
import { gsap, useGSAP } from '../lib/gsap'

export function Rule({ brand, className = '' }: { brand?: Brand | null; className?: string }) {
  const rule = useRef<HTMLHRElement>(null)
  const motion = useBrandMotion(brand)

  useGSAP(() => {
    if (!rule.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo(rule.current, { scaleX: 0, transformOrigin: 'left center' }, {
      scaleX: 1,
      duration: motion.duration,
      ease: motion.ease,
      scrollTrigger: { trigger: rule.current, start: 'top 88%', once: true },
    })
  }, { scope: rule, dependencies: [motion] })

  return <hr ref={rule} className={`border-0 border-t border-stone-300 ${className}`} />
}

export function VRule({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`block w-px self-stretch bg-stone-300 ${className}`} />
}
