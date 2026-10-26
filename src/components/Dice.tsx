import { forwardRef, useImperativeHandle, useRef, type ReactNode } from 'react'
import { gsap } from '../lib/gsap'

export type DiceHandle = {
  roll: () => void
}

type DiceProps = {
  children: ReactNode
}

export const Dice = forwardRef<DiceHandle, DiceProps>(function Dice({ children }, ref) {
  const cube = useRef<HTMLSpanElement>(null)
  const rolling = useRef(false)
  const pending = useRef(false)
  const rotation = useRef(0)

  const roll = () => {
    if (!cube.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (rolling.current) {
      pending.current = true
      return
    }

    rolling.current = true
    rotation.current += 90
    gsap.to(cube.current, {
      rotationX: rotation.current,
      duration: 0.55,
      ease: 'power3.inOut',
      onComplete: () => {
        rolling.current = false
        if (pending.current) {
          pending.current = false
          roll()
        }
      },
    })
  }

  useImperativeHandle(ref, () => ({ roll }))

  return (
    <span className="dice">
      <span className="dice__sizer" aria-hidden="true">{children}</span>
      <span ref={cube} className="dice__cube">
        {[0, 1, 2, 3].map((face) => (
          <span
            key={face}
            className="dice__face"
            aria-hidden={face !== 0}
            style={{ transform: `rotateX(${-90 * face}deg) translateZ(calc(var(--h, 1.3em) / 2))` }}
          >
            {children}
          </span>
        ))}
      </span>
    </span>
  )
})
