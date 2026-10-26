import type { KeyboardEvent } from 'react'
import type { Brand } from '../types'
import { setDetail, useDetail, type DetailMode } from '../lib/detail'
import { useBrandMotion } from '../hooks/useBrandMotion'
import copy from '../data/copy.json'
import { gsap } from '../lib/gsap'
import { useEffect, useRef } from 'react'
import { refreshLayout } from '../lib/smooth'
import { Button } from './Button'

const modes: DetailMode[] = ['simple', 'detailed']

export function DetailSwitch({ brand }: { brand?: Brand | null }) {
  const detail = useDetail(brand ? 'detailed' : 'simple')
  const motion = useBrandMotion(brand)
  const switchRoot = useRef<HTMLDivElement>(null)

  useEffect(() => {
    refreshLayout()
  }, [detail])

  useEffect(() => {
    const thumb = switchRoot.current?.querySelector<HTMLElement>('[data-detail-thumb]')
    if (!thumb) return
    const xPercent = detail === 'detailed' ? 100 : 0
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(thumb, { xPercent })
      return
    }
    gsap.to(thumb, { xPercent, duration: motion.duration, ease: motion.ease })
  }, [detail, motion])

  const selectByKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const index = modes.indexOf(detail)
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? modes.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : modes.length - 1)) % modes.length
    const next = modes[nextIndex]
    setDetail(next)
    document.getElementById(`detail-${next}`)?.focus()
  }

  return (
    <div
      ref={switchRoot}
      role="radiogroup"
      aria-label="Specification detail"
      onKeyDown={selectByKey}
      className="relative grid h-11 w-fit grid-cols-2 rounded-full border border-accent"
      style={{ minWidth: '12rem' }}
      data-cursor="drag"
    >
      <span
        aria-hidden="true"
        data-detail-thumb
        className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-accent"
        style={{
          transform: 'translateX(0)',
        }}
      />
      {modes.map((mode) => (
        <Button
          variant="text"
          key={mode}
          id={`detail-${mode}`}
          type="button"
          role="radio"
          aria-checked={detail === mode}
          tabIndex={detail === mode ? 0 : -1}
          onClick={() => setDetail(mode)}
          className="relative z-10 min-h-11 px-4 text-sm capitalize text-fg focus-visible:outline-offset-[-3px]"
          data-cursor="link"
        >
          {mode === 'simple' ? copy.detail.simple : copy.detail.full}
        </Button>
      ))}
    </div>
  )
}
