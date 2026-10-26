import { useEffect, useRef, type ElementType, type HTMLAttributes, type ReactNode } from 'react'
import { fitText } from '../lib/fit'

type FitTextProps = Omit<HTMLAttributes<HTMLElement>, 'children' | 'className'> & {
  as?: ElementType
  className?: string
  children: ReactNode
  min?: number
}

export function FitText({ as: Component = 'span', className = '', children, min, ...props }: FitTextProps) {
  const element = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!element.current) return
    return fitText(element.current, min === undefined ? {} : { min })
  }, [min, children])

  return (
    <Component ref={element} className={`fit-text ${className}`} {...props}>
      {children}
    </Component>
  )
}
