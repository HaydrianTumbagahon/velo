import { useEffect, useRef, type ReactNode } from 'react'
import { useLocation } from 'wouter'
import { ScrollTrigger } from '../lib/gsap'
import { reveal } from '../lib/reveal'
import { getLenis, refreshLayout } from '../lib/smooth'
import type { Brand } from '../types'
import { useBrandMotion } from '../hooks/useBrandMotion'
import { Transition } from './Transition'
import { useSectionMotion } from '../hooks/useSectionMotion'

type PageProps = {
  children: ReactNode
  className?: string
  brand?: Brand | null
}

export function Page({ children, className, brand }: PageProps) {
  const [location] = useLocation()
  const page = useRef<HTMLDivElement>(null)
  const motion = useBrandMotion(brand)
  useSectionMotion(page, brand)

  useEffect(() => {
    getLenis()?.scrollTo(0, { immediate: true })
    const frame = requestAnimationFrame(() => {
      ScrollTrigger.refresh()
      const element = page.current
      if (element) reveal(element, 'fade', motion)
      refreshLayout()
    })
    return () => cancelAnimationFrame(frame)
  }, [location, motion])

  return (
    <>
      <div id="top" ref={page} className={className}>
        {children}
      </div>
      <Transition />
    </>
  )
}
