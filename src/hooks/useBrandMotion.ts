import { useMemo } from 'react'
import type { Brand } from '../types'

export type RevealStyle = 'mask' | 'slide' | 'type' | 'fade' | 'roll'

export type BrandMotion = {
  ease: string
  duration: number
  stagger: number
  reveal: RevealStyle
  transition: string
}

const defaults: BrandMotion = {
  ease: 'power3.out',
  duration: 0.8,
  stagger: 0.08,
  reveal: 'mask',
  transition: 'fade',
}

function isRevealStyle(value: string): value is RevealStyle {
  return ['mask', 'slide', 'type', 'fade', 'roll'].includes(value)
}

export function useBrandMotion(brand?: Brand | null): BrandMotion {
  return useMemo<BrandMotion>(
    () =>
      brand
        ? {
            ease: brand.motion.ease,
            duration: brand.motion.duration,
            stagger: brand.motion.stagger,
            reveal: isRevealStyle(brand.motion.reveal) ? brand.motion.reveal : defaults.reveal,
            transition: brand.motion.transition,
          }
        : defaults,
    [brand],
  )
}
