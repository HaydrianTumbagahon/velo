import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { CompareToggle } from '../layouts/CompareToggle'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { publishedBikes, brands, priceLabel, weightKg } from '../lib/data'
import { NavLink } from '../components/NavLink'
import { Photo } from '../components/Photo'
import { Seo } from '../components/Seo'
import { FitText } from '../components/FitText'
import copy from '../data/copy.json'
import { refreshLayout } from '../lib/smooth'
import { Button } from '../components/Button'

type SortMode = 'price' | 'weight' | 'newest'
const disciplines = ['Road', 'Gravel', 'Mountain', 'Triathlon & TT', 'Track', 'Cyclocross', 'E-Road']
const pageSize = 24

export default function BikesPage() {
  useBrandTheme(null)
  const [, navigate] = useLocation()
  const [search, setSearch] = useState(window.location.search)
  const query = new URLSearchParams(search)
  const selectedBrands = (query.get('brand') ?? '').split(',').filter(Boolean)
  const selectedDiscipline = query.get('discipline') ?? ''
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const sort = (['price', 'weight', 'newest'].includes(query.get('sort') ?? '')
    ? query.get('sort')
    : 'newest') as SortMode
  useEffect(() => {
    const onPopState = () => setSearch(window.location.search)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const visible = publishedBikes.filter(
    (bike) =>
      (!selectedBrands.length || selectedBrands.includes(bike.brand)) &&
      (!selectedDiscipline || bike.discipline === selectedDiscipline),
  )
  const currencies = new Set(visible.flatMap((bike) => (bike.price ? [bike.price.currency] : [])))
  const mixedCurrencies = currencies.size > 1

  const results = [...visible].sort((a, b) => {
    if (sort === 'price' && !mixedCurrencies) {
      if (!a.price) return b.price ? 1 : 0
      if (!b.price) return -1
      return a.price.amount - b.price.amount
    }
    if (sort === 'weight') {
      const aWeight = weightKg(a)
      const bWeight = weightKg(b)
      if (aWeight === null) return bWeight === null ? 0 : 1
      if (bWeight === null) return -1
      return aWeight - bWeight
    }
    return (b.year ?? 0) - (a.year ?? 0) || a.name.localeCompare(b.name)
  })

  useEffect(() => {
    refreshLayout()
  }, [results.length, search, visibleCount])

  useEffect(() => {
    setVisibleCount(pageSize)
  }, [search])

  const updateQuery = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(search)
    Object.entries(changes).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    const queryString = params.toString()
    const nextSearch = queryString ? `?${queryString}` : ''
    navigate(`/bikes${nextSearch}`)
    setSearch(nextSearch)
  }

  const toggleBrand = (slug: string) => {
    const next = selectedBrands.includes(slug)
      ? selectedBrands.filter((selected) => selected !== slug)
      : [...selectedBrands, slug]
    updateQuery({ brand: next.length ? next.join(',') : null })
  }

  return (
    <>
      <Seo title={`${copy.bikes.title} — Velo`} description={copy.meta.bikes} />
      <section className="min-h-svh px-6 pb-24 pt-36 text-fg md:px-12">
        <FitText as="h1" className="font-brand t-display-xl">{copy.bikes.title}</FitText>
        <section className="mt-10 space-y-5" aria-label="Filter bikes">
          <div className="flex flex-wrap items-center gap-2" aria-label="Filter by brand">
            <span className="mr-2 text-sm text-stone-600">Brand</span>
            {brands.map((brand) => {
              const active = selectedBrands.includes(brand.slug)
              return (
                <Button
                  variant="text"
                  key={brand.slug}
                  type="button"
                  data-cursor="link"
                  aria-pressed={active}
                  onClick={() => toggleBrand(brand.slug)}
                  className={`min-h-11 rounded-full border px-4 text-sm ${
                    active ? 'border-accent bg-accent/15' : 'border-stone-300'
                  }`}
                >
                  {brand.name}
                </Button>
              )
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2" aria-label="Filter by discipline">
            <span className="mr-2 text-sm text-stone-600">Discipline</span>
            {disciplines.map((discipline) => (
              <Button
                variant="text"
                key={discipline}
                type="button"
                data-cursor="link"
                aria-pressed={selectedDiscipline === discipline}
                onClick={() => updateQuery({ discipline: selectedDiscipline === discipline ? null : discipline })}
                className={`min-h-11 rounded-full border px-4 text-sm ${
                  selectedDiscipline === discipline ? 'border-accent bg-accent/15' : 'border-stone-300'
                }`}
              >
                {discipline}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label htmlFor="bike-sort" className="text-sm text-stone-600">Sort</label>
            <select
              id="bike-sort"
              value={sort}
              onChange={(event) => updateQuery({ sort: event.currentTarget.value })}
              className="min-h-11 border-b border-stone-300 bg-transparent px-2 text-fg"
            >
              <option value="newest">Newest</option>
              <option value="price" disabled={mixedCurrencies}>Price low to high</option>
              <option value="weight">Weight low to high</option>
            </select>
            {mixedCurrencies && (
              <p className="text-sm text-stone-600">
                Price sorting is unavailable because the visible bikes use different currencies.
              </p>
            )}
          </div>
        </section>
        <p className="mt-8 text-sm text-stone-600" aria-live="polite">
          {results.length} {results.length === 1 ? 'bike' : 'bikes'}
        </p>
        {results.length === 0 && (
          <p className="mt-6 text-body-l">{copy.bikes.empty}</p>
        )}
        <ul className="mt-5 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 sm:gap-x-7 xl:grid-cols-4">
          {results.slice(0, visibleCount).map((bike) => {
            const brand = brands.find((item) => item.slug === bike.brand)
            const price = priceLabel(bike)
            return (
              <li key={`${bike.brand}/${bike.slug}`} data-section className="bike-tile min-w-0">
                <NavLink to={`/brands/${bike.brand}/${bike.slug}`} className="block" data-cursor="view">
                  <div className="aspect-[3/2] bg-stone-100">
                    <Photo bike={bike} sizes="(min-width: 1280px) 25vw, (min-width: 640px) 33vw, 50vw" />
                  </div>
                  <p className="mt-4 text-sm text-stone-600">{brand?.name ?? bike.brand}</p>
                  <FitText as="h2" className="mt-1 font-brand t-display-m">{bike.name}</FitText>
                </NavLink>
                {price && bike.price && (
                  <a
                    href={brand?.website}
                    title={bike.price.asOf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link price mt-2 inline-flex min-h-11 items-center text-sm"
                  >
                    {price}
                  </a>
                )}
                <div className="mt-1"><CompareToggle bike={bike} /></div>
              </li>
            )
          })}
        </ul>
        {visibleCount < results.length && (
          <div className="mt-12 flex justify-center">
            <Button variant="outline" onClick={() => setVisibleCount((count) => count + pageSize)}>
              Show more
            </Button>
          </div>
        )}
      </section>
    </>
  )
}
