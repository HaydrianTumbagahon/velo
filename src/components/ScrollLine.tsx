import { useEffect, useRef } from 'react'
import type Lenis from 'lenis'
import { useLenis } from '../lib/smooth'

export function ScrollLine() {
  const track = useRef<HTMLSpanElement>(null)
  const thumb = useRef<HTMLSpanElement>(null)
  const lenis = useLenis()

  useEffect(() => {
    const update = (instance?: Lenis) => {
      const active = instance ?? lenis
      if (!track.current || !thumb.current) return
      const viewport = window.innerHeight
      const limit = active?.limit ?? Math.max(0, document.documentElement.scrollHeight - viewport)
      const scroll = active?.scroll ?? window.scrollY
      const page = limit + viewport
      const ratio = page > 0 ? viewport / page : 1
      const distance = Math.max(0, 1 - ratio)
      const progress = limit > 0 ? scroll / limit : 0
      thumb.current.style.height = `${ratio * 100}%`
      thumb.current.style.transform = `translateY(${Math.max(0, Math.min(1, progress)) * distance * viewport}px)`
    }
    update()
    lenis?.on('scroll', update)
    const onScroll = () => update()
    if (!lenis) window.addEventListener('scroll', onScroll, { passive: true })
    const onResize = () => update()
    window.addEventListener('resize', onResize)
    return () => {
      lenis?.off('scroll', update)
      if (!lenis) window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [lenis])

  return (
    <span ref={track} aria-hidden="true" className="scroll-line">
      <span ref={thumb} className="scroll-line__thumb" />
    </span>
  )
}
