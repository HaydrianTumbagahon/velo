import { Suspense, useEffect, useState } from 'react'
import { useLocation, useRoute } from 'wouter'
import { Seo } from '../components/Seo'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { loadBrandFont } from '../lib/brandFonts'
import { brandBySlug, bikesOf, groups } from '../lib/data'
import { layouts } from '../layouts'
import { NotFound } from './NotFoundView'
import { GroupTabs } from '../components/GroupTabs'
import { useBrandMotion } from '../hooks/useBrandMotion'
import { reveal } from '../lib/reveal'
import { useRef } from 'react'
import { useGSAP } from '../lib/gsap'

export default function BrandPage() {
  const [, params] = useRoute('/brands/:brand')
  const [location, navigate] = useLocation()
  const [search, setSearch] = useState(window.location.search)
  const page = useRef<HTMLDivElement>(null)
  const brand = params ? brandBySlug(params.brand) : undefined
  const motion = useBrandMotion(brand)
  useBrandTheme(brand ?? null)

  useEffect(() => {
    const onPopState = () => setSearch(window.location.search)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    setSearch(window.location.search)
  }, [location])

  useEffect(() => {
    if (brand) void loadBrandFont(brand.theme.font)
  }, [brand])

  if (!brand) return <NotFound />
  const availableGroups = groups(brand)
  const requestedGroup = new URLSearchParams(search).get('g')
  const activeGroup = requestedGroup && availableGroups.includes(requestedGroup)
    ? requestedGroup
    : availableGroups[0]
  const bikes = bikesOf(brand, activeGroup)
  const Layout = layouts[brand.layout] ?? layouts.editorial
  const selectGroup = (group: string) => {
    if (group === activeGroup) return
    const query = new URLSearchParams(search)
    if (group === availableGroups[0]) query.delete('g')
    else query.set('g', group)
    const queryText = query.toString()
    const nextSearch = queryText ? `?${queryText}` : ''
    navigate(`/brands/${brand.slug}${nextSearch}`)
    setSearch(nextSearch)
  }

  useGSAP(() => {
    if (!page.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const layout = page.current.querySelector<HTMLElement>('[data-brand-layout]')
    if (layout) reveal(layout, motion.reveal, motion)
  }, { scope: page, dependencies: [activeGroup, motion], revertOnUpdate: true })

  return (
    <>
      <Seo title={`${brand.name} bikes — Velo`} description={brand.blurb} />
      <div ref={page}>
        <Suspense fallback={<div className="paper min-h-svh" />}>
          <Layout
            key={activeGroup}
            brand={brand}
            bikes={bikes}
            activeGroupTabId={availableGroups.length > 1 ? `brand-group-tab-${availableGroups.indexOf(activeGroup)}` : undefined}
            groupTabs={availableGroups.length > 1
              ? <GroupTabs brand={brand} groups={availableGroups} activeGroup={activeGroup} onSelect={selectGroup} />
              : undefined}
          />
        </Suspense>
      </div>
    </>
  )
}
