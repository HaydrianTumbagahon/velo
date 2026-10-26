import { useEffect, useRef, type KeyboardEvent } from 'react'
import { getLenis } from '../lib/smooth'
import { useBrandMotion } from '../hooks/useBrandMotion'
import { Button } from './Button'
import type { Brand } from '../types'

type GroupTabsProps = {
  brand: Brand
  groups: string[]
  activeGroup: string
  onSelect: (group: string) => void
}

export function GroupTabs({ brand, groups, activeGroup, onSelect }: GroupTabsProps) {
  const tabs = useRef<Array<HTMLElement | null>>([])
  const motion = useBrandMotion(brand)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const layout = document.querySelector<HTMLElement>('[data-brand-layout]')
      if (layout) {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        getLenis()?.scrollTo(window.scrollY + layout.getBoundingClientRect().top, {
          duration: reducedMotion ? 0 : motion.duration,
          easing: (t) => 1 - (1 - t) ** 3,
        })
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [activeGroup, motion.duration])

  const onKeyDown = (event: KeyboardEvent<HTMLElement>, index: number) => {
    let next = index
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % groups.length
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + groups.length) % groups.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = groups.length - 1
    else return
    event.preventDefault()
    tabs.current[next]?.focus()
    onSelect(groups[next])
  }

  return (
    <nav className="brand-group-tabs flex flex-wrap gap-x-6 gap-y-1 px-6 md:px-12" role="tablist" aria-label={`${brand.name} groups`}>
      {groups.map((group, index) => (
        <Button
          key={group}
          variant="text"
          elementRef={(element) => { tabs.current[index] = element }}
          role="tab"
          id={`brand-group-tab-${index}`}
          aria-selected={group === activeGroup}
          aria-controls="brand-group-panel"
          tabIndex={group === activeGroup ? 0 : -1}
          onClick={() => onSelect(group)}
          onKeyDown={(event) => onKeyDown(event, index)}
          className={`brand-group-tab ${group === activeGroup ? 'is-active' : ''}`}
        >
          {group === activeGroup && <span className="brand-group-tab__dot" aria-hidden="true" />}
          {group}
        </Button>
      ))}
    </nav>
  )
}
