import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'wouter'
import site from '../data/site.json'
import { brands } from '../lib/data'
import { heroImage } from '../lib/images'
import { loadBrandFont } from '../lib/brandFonts'
import { useBrandMotion } from '../hooks/useBrandMotion'
import { useGSAP } from '../lib/gsap'
import { getLenis, useLenis } from '../lib/smooth'
import { useCompare } from '../lib/compare'
import { routeChunks } from '../routes'
import { Logo } from './Logo'
import { NavLink } from './NavLink'
import { gsap } from '../lib/gsap'
import { Button } from './Button'

function BrandMenuLink({ slug, close }: { slug: string; close: () => void }) {
  const brand = brands.find((item) => item.slug === slug)
  const [family, setFamily] = useState('Bodoni Moda Variable')
  const motion = useBrandMotion(brand)

  useEffect(() => {
    if (!brand) return
    let active = true
    void loadBrandFont(brand.theme.font).then((font) => {
      if (active) setFamily(font)
    })
    return () => {
      active = false
    }
  }, [brand])

  if (!brand) return null
  return (
    <NavLink
      to={`/brands/${brand.slug}`}
      prefetch={routeChunks.brand}
      className="inline-flex min-h-14 w-fit items-center font-brand text-display-l"
      onClick={close}
      style={{
        color: `color-mix(in oklab, ${brand.theme.accent} 62%, ${brand.theme.ink})`,
        fontFamily: `'${family}', sans-serif`,
        transitionDuration: `${motion.duration}s`,
      }}
    >
      {brand.name}
    </NavLink>
  )
}

export function Nav({ onSearch }: { onSearch: () => void }) {
  const [location] = useLocation()
  const nav = useRef<HTMLElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const menuButton = useRef<HTMLElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [brandPanelOpen, setBrandPanelOpen] = useState(false)
  const [brandPanelMounted, setBrandPanelMounted] = useState(false)
  const brandPanel = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const { ids } = useCompare()
  const compareCount = ids.length
  const motion = useBrandMotion()
  const lenis = useLenis()
  const menuTimeline = useRef<gsap.core.Timeline | null>(null)
  const hero = heroImage()
  const heroTone = (hero?.luma ?? 1) > 0.55 ? 'ink' : 'paper'
  const onHomeHero = location.split('?')[0] === '/' && !scrolled && !menuOpen && Boolean(hero?.widths.length)

  const closeMenu = () => {
    if (!menu.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setMenuOpen(false)
      return
    }
    menuTimeline.current?.timeScale(2.5).reverse()
  }

  useEffect(() => {
    if (brandPanelOpen) {
      setBrandPanelMounted(true)
      return
    }
    if (!brandPanel.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setBrandPanelMounted(false)
      return
    }
    const panel = brandPanel.current
    const animation = gsap.to(panel, {
      clipPath: 'inset(0 0 100% 0)',
      duration: 0.3,
      ease: 'power3.in',
      onComplete: () => setBrandPanelMounted(false),
    })
    return () => {
      animation.kill()
    }
  }, [brandPanelOpen])

  useEffect(() => {
    if (!brandPanelOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setBrandPanelOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [brandPanelOpen])

  useEffect(() => {
    if (!brandPanelOpen || !brandPanel.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const items = brandPanel.current.querySelectorAll<HTMLElement>('[data-brand-item]')
    gsap.fromTo(brandPanel.current, { clipPath: 'inset(0 0 100% 0)' }, {
      clipPath: 'inset(0)',
      duration: 0.45,
      ease: 'power3.out',
    })
    gsap.fromTo(items, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.04, ease: motion.ease, delay: 0.05 })
  }, [brandPanelOpen, brandPanelMounted, motion])

  useGSAP(
    () => {
      const node = menu.current
      if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      if (menuOpen) {
        const items = node.querySelectorAll<HTMLElement>('[data-menu-item]')
        menuTimeline.current = gsap.timeline({ onReverseComplete: () => setMenuOpen(false) })
          .fromTo(node, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0)', duration: 0.45, ease: 'power3.out' })
          .fromTo(items, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.04, ease: motion.ease }, 0.05)
      }
    },
    { scope: nav, dependencies: [menuOpen, motion], revertOnUpdate: true },
  )

  useEffect(() => {
    const main = document.querySelector('main')
    const footer = document.querySelector('footer')
    const controls = nav.current?.querySelectorAll<HTMLElement>('[data-nav-inert]')
    if (main) main.inert = menuOpen
    if (footer) footer.inert = menuOpen
    controls?.forEach((element) => {
      element.inert = menuOpen
    })
    if (menuOpen) getLenis()?.stop()
    else getLenis()?.start()
    return () => {
      if (main) main.inert = false
      if (footer) footer.inert = false
      controls?.forEach((element) => {
        element.inert = false
      })
    }
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu()
        menuButton.current?.focus()
      }
    }
    const closeOnDesktop = () => {
      if (window.matchMedia('(min-width: 768px)').matches) closeMenu()
    }
    window.addEventListener('keydown', closeOnEscape)
    window.addEventListener('resize', closeOnDesktop)
    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      window.removeEventListener('resize', closeOnDesktop)
    }
  }, [menuOpen])

  useEffect(() => {
    let lastY = lenis?.scroll ?? window.scrollY
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      const currentY = lenis?.scroll ?? window.scrollY
      setScrolled(currentY > 80)
      setHidden(!menuOpen && !reducedMotion.matches && currentY > 120 && currentY > lastY)
      if (currentY < 120 || currentY < lastY) setHidden(false)
      lastY = currentY
    }
    window.addEventListener('scroll', update, { passive: true })
    lenis?.on('scroll', update)
    return () => {
      window.removeEventListener('scroll', update)
      lenis?.off('scroll', update)
    }
  }, [lenis, menuOpen])

  useEffect(() => {
    const open = () => onSearch()
    window.addEventListener('velo:open-command', open)
    return () => window.removeEventListener('velo:open-command', open)
  }, [onSearch])

  const searchButton = (
    <Button
      variant="text"
      data-cursor="link"
      onClick={onSearch}
      className="inline-flex min-h-11 items-center gap-2 font-brand text-sm text-fg"
    >
      Search <kbd className="text-xs text-stone-600">/</kbd>
    </Button>
  )

  return (
    <header
      ref={nav}
      data-site-nav
      data-hero-tone={onHomeHero ? heroTone : undefined}
      data-hidden={hidden}
      className={`fixed inset-x-0 top-0 z-50 pb-4 pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))] pt-[max(1rem,env(safe-area-inset-top))] transition-transform duration-300 md:pl-[max(3rem,env(safe-area-inset-left))] md:pr-[max(3rem,env(safe-area-inset-right))] ${
        scrolled ? 'paper border-b border-fg/20' : 'border-b border-transparent bg-transparent'
      } data-[hidden=true]:-translate-y-full motion-reduce:translate-y-0`}
    >
      <div className="relative z-20 flex items-center justify-between gap-3">
        <NavLink
          to="/"
          className="site-wordmark inline-flex min-h-11 shrink-0 items-center"
          onClick={closeMenu}
          data-nav-inert
          noUnderline
        >
          <Logo />
        </NavLink>
        <nav data-nav-inert className="hidden items-center gap-5 min-[1100px]:flex" aria-label="Brands">
          {brands.map((brand) => (
            <NavLink
              key={brand.slug}
              to={`/brands/${brand.slug}`}
              prefetch={routeChunks.brand}
              noUnderline
              className="inline-flex min-h-11 items-center text-sm text-fg"
            >
              {brand.name}
            </NavLink>
          ))}
        </nav>
        <div data-nav-inert className="relative hidden md:block min-[1100px]:hidden">
          <Button
            variant="text"
            aria-expanded={brandPanelOpen}
            aria-controls="desktop-brand-menu"
            className="flex min-h-11 items-center text-sm text-fg"
            onClick={() => setBrandPanelOpen((open) => !open)}
            data-cursor="link"
          >
            Brands
          </Button>
          {brandPanelMounted && (
            <nav
              ref={brandPanel}
              id="desktop-brand-menu"
              className="paper absolute left-0 top-full z-30 grid min-w-48 gap-1 p-3"
              aria-label="Brands"
            >
              {brands.map((brand) => (
                <NavLink
                  key={brand.slug}
                  data-brand-item
                  to={`/brands/${brand.slug}`}
                  prefetch={routeChunks.brand}
                  className="flex min-h-11 items-center text-sm text-fg"
                  onClick={() => setBrandPanelOpen(false)}
                >
                  {brand.name}
                </NavLink>
              ))}
            </nav>
          )}
        </div>
        <nav data-nav-inert className="hidden items-center gap-3 md:flex lg:gap-5" aria-label="Site links">
          {site.nav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              prefetch={
                item.href === '/bikes'
                  ? routeChunks.bikes
                  : item.href === '/compare'
                    ? routeChunks.compare
                    : routeChunks.guide
              }
              className="relative inline-flex min-h-11 items-center text-sm text-fg"
              noUnderline
            >
              {item.label}
              {item.href === '/compare' && compareCount > 0 && (
                <span className="ml-1 text-xs text-link" aria-label={`${compareCount} bikes selected`}>
                  {compareCount}
                </span>
              )}
            </NavLink>
          ))}
          {searchButton}
        </nav>
        <div className="flex items-center gap-3 md:hidden">
          {searchButton}
          <Button
            variant="text"
            elementRef={(element) => { menuButton.current = element }}
            className="inline-flex min-h-11 min-w-11 items-center justify-end font-brand text-sm text-fg"
            aria-expanded={menuOpen}
            aria-controls={menuOpen ? 'mobile-menu' : undefined}
            onClick={() => menuOpen ? closeMenu() : setMenuOpen(true)}
            data-cursor="link"
          >
            {menuOpen ? 'Close' : 'Menu'}
          </Button>
        </div>
      </div>
      {menuOpen && (
        <div
          ref={menu}
          id="mobile-menu"
          data-lenis-prevent
          className="paper fixed inset-0 z-10 flex min-h-svh flex-col overflow-y-auto px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(6rem,env(safe-area-inset-top))] md:hidden"
        >
          <nav aria-label="Main menu" className="flex flex-col items-start gap-1">
            {brands.map((brand) => <div data-menu-item key={brand.slug}><BrandMenuLink slug={brand.slug} close={closeMenu} /></div>)}
          </nav>
          <nav aria-label="More" className="mt-8 grid grid-cols-2 gap-1">
            {[
              ...site.nav.map((item) => ({ label: item.label, href: item.href })),
              { label: 'About', href: '/about' },
              { label: 'Contact', href: '/contact' },
            ].map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                data-menu-item
                className="inline-flex min-h-12 items-center text-lg text-fg"
                noUnderline
                onClick={closeMenu}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
