import { useEffect, useRef, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from 'react'
import { Link, useLocation } from 'wouter'
import type { CSSProperties } from 'react'

type NavLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick' | 'children'> & {
  to: string
  children: ReactNode
  prefetch?: () => Promise<unknown>
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
  noUnderline?: boolean
  onElementRef?: (element: HTMLAnchorElement | null) => void
  style?: CSSProperties
  'data-nav-inert'?: boolean
  'data-cursor'?: 'link' | 'view' | 'drag'
}

export function NavLink({
  to,
  children,
  className,
  prefetch,
  onClick,
  noUnderline = false,
  onElementRef,
  style,
  'data-cursor': cursor = 'link',
  'data-nav-inert': navInert,
  ...attributes
}: NavLinkProps) {
  const [location, navigate] = useLocation()
  const prefetched = useRef(false)
  const pendingBlur = useRef<HTMLAnchorElement | null>(null)
  const current = location === to || (to !== '/' && location.startsWith(`${to}/`))
  const preload = () => {
    if (prefetched.current || !prefetch) return
    prefetched.current = true
    void prefetch()
  }

  useEffect(() => {
    if (!pendingBlur.current) return
    pendingBlur.current.blur()
    pendingBlur.current = null
  }, [location])

  const onLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      to.startsWith('#') ||
      location.split('?')[0] === to.split('?')[0]
    ) return
    event.preventDefault()
    pendingBlur.current = event.currentTarget
    window.dispatchEvent(new CustomEvent('velo:navigate', { detail: { to, navigate } }))
  }

  return (
    <Link
      {...attributes}
      to={to}
      ref={onElementRef}
      className={`${className ?? ''}${noUnderline ? '' : ' link'}`}
      style={style}
      data-nav-inert={navInert || undefined}
      data-cursor={cursor}
      data-no-underline={noUnderline || undefined}
      aria-current={current ? 'page' : undefined}
      onPointerEnter={preload}
      onFocus={preload}
      onClick={onLinkClick}
    >
      {children}
    </Link>
  )
}
