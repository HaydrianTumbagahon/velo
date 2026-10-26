import { useEffect, useRef } from 'react'
import { useGSAP } from '../lib/gsap'
import { revealLines } from '../lib/split'
import { loadBrandFont } from '../lib/brandFonts'
import type { Brand } from '../types'
import { useBrandMotion } from '../hooks/useBrandMotion'

type BigLinesProps = {
  lines: string[]
  accentWord?: string
  className?: string
  brand?: Brand | null
}

export function BigLines({ lines, accentWord, className, brand }: BigLinesProps) {
  const container = useRef<HTMLDivElement>(null)
  const motion = useBrandMotion(brand)

  useEffect(() => {
    if (accentWord) void loadBrandFont('Newsreader')
  }, [accentWord])

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      container.current
        ?.querySelectorAll<HTMLElement>('[data-big-line]')
        .forEach((line) =>
          revealLines(
            line,
            {
              trigger: line,
              start: 'top 80%',
              end: 'bottom 35%',
              scrub: true,
            },
            motion,
          ),
        )
    },
    { scope: container },
  )

  return (
    <div ref={container}>
      {lines.map((line) => {
        const accent = accentWord
        const wordIndex = accent ? line.indexOf(accent) : -1
        if (!accent || wordIndex < 0) {
          return (
            <h2 key={line} data-big-line className={className}>
              {line}
            </h2>
          )
        }
        return (
          <h2 key={line} data-big-line className={className}>
            {line.slice(0, wordIndex)}
            <em className="font-serif font-normal italic text-gold-ink">{accent}</em>
            {line.slice(wordIndex + accent.length)}
          </h2>
        )
      })}
    </div>
  )
}
