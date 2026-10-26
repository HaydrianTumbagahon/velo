import {
  useRef,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { NavLink } from './NavLink'
import { Dice, type DiceHandle } from './Dice'

type ButtonProps = Omit<HTMLAttributes<HTMLElement>, 'children' | 'onClick' | 'onPointerMove' | 'onPointerLeave'> & {
  [attribute: `data-${string}`]: string | boolean | undefined
  children?: ReactNode
  variant?: 'solid' | 'outline' | 'text' | 'round'
  size?: 'default' | 'small'
  icon?: ReactNode
  as?: 'button' | 'a' | typeof NavLink
  href?: string
  to?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  target?: string
  rel?: string
  elementRef?: (element: HTMLElement | null) => void
  'data-cursor'?: 'link' | 'view' | 'drag'
  onClick?: (event: ReactMouseEvent<HTMLElement>) => void
  onPointerMove?: (event: ReactPointerEvent<HTMLElement>) => void
  onPointerLeave?: (event: ReactPointerEvent<HTMLElement>) => void
  'aria-label'?: string
}

export function Button({
  as = 'button',
  href,
  variant = 'solid',
  size = 'default',
  icon,
  className = '',
  children,
  to,
  type = 'button',
  disabled,
  elementRef,
  onPointerMove: onPointerMoveProp,
  onPointerLeave: onPointerLeaveProp,
  onClick,
  'data-cursor': cursor = 'link',
  ...attributes
}: ButtonProps) {
  const element = useRef<HTMLElement>(null)
  const dice = useRef<DiceHandle>(null)
  const classes = `velo-button velo-button--${variant} ${size === 'small' ? 'velo-button--small' : ''} ${className}`

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    onPointerMoveProp?.(event)
  }

  const onPointerEnter = () => {
    if (
      window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) dice.current?.roll()
  }
  const onPointerLeave = (event: ReactPointerEvent<HTMLElement>) => {
    if (
      window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) dice.current?.roll()
    onPointerLeaveProp?.(event)
  }

  if (variant === 'round' && !attributes['aria-label']) {
    throw new Error('Round buttons require an aria-label.')
  }

  const contents = (
    <>
      {variant === 'round'
        ? typeof children === 'string' ? <Dice ref={dice}>{children}</Dice> : icon ?? children
        : typeof children === 'string' ? <Dice ref={dice}>{children}</Dice> : children}
      {icon && variant !== 'round' && <span className="velo-button__icon">{icon}</span>}
    </>
  )

  const common = {
    ...attributes,
    className: classes,
    'data-cursor': cursor,
    onClick,
    onPointerEnter,
    onPointerMove,
    onPointerLeave,
  }

  if (as === NavLink) {
    return (
      <NavLink
        {...common}
        to={to ?? '/'}
        noUnderline
        onElementRef={(node) => {
          element.current = node
          elementRef?.(node)
        }}
      >
        {contents}
      </NavLink>
    )
  }

  if (as === 'a') {
    return (
      <a
        {...common}
        ref={(node) => {
          element.current = node
          elementRef?.(node)
        }}
        href={href}
        target={attributes.target}
        rel={attributes.rel}
      >
        {contents}
      </a>
    )
  }
  return (
    <button
      {...common}
      ref={(node) => {
        element.current = node
        elementRef?.(node)
      }}
      type={type}
      disabled={disabled}
    >
      {contents}
    </button>
  )
}
