import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { DetailSwitch } from '../components/DetailSwitch'
import { Photo } from '../components/Photo'
import { Seo } from '../components/Seo'
import { useDetail } from '../lib/detail'
import { publishedBikes, brandBySlug, priceLabel } from '../lib/data'
import { useCompare } from '../lib/compare'
import { NavLink } from '../components/NavLink'
import type { Bike } from '../types'
import { FitText } from '../components/FitText'
import copy from '../data/copy.json'
import { Button } from '../components/Button'

type SpecRow = { id: string; label: string; values: string[] }
type SpecGroups = Array<{ group: string; entries: Array<[string, string]> }>

function parseBikeIds(value: string | null): string[] {
  if (!value) return []
  return [...new Set(value.split(',').filter((id) =>
    publishedBikes.some((bike) => `${bike.brand}/${bike.slug}` === id),
  ))].slice(0, 3)
}

function factsRows(bikes: Bike[]): SpecRow[] {
  const labels = [...new Set(bikes.flatMap((bike) => Object.keys(bike.facts)))]
  return labels.map((label) => ({
    id: `fact:${label}`,
    label,
    values: bikes.map((bike) => Object.entries(bike.facts).find(([key]) => key === label)?.[1] ?? '—'),
  }))
}

function specGroupsOf(bike: Bike): SpecGroups {
  if (!('specs' in bike) || !bike.specs) return []
  return Object.entries(bike.specs).flatMap(([group, entries]) => {
    if (!entries) return []
    const values = Object.entries(entries).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    return values.length ? [{ group, entries: values }] : []
  })
}

function detailedRows(bikes: Bike[], size: string): SpecRow[] {
  const bikeSpecs = bikes.map(specGroupsOf)
  const specGroups = [...new Set(bikeSpecs.flatMap((groups) => groups.map(({ group }) => group)))]
  const specs = specGroups.flatMap((group) => {
    const labels = [...new Set(bikeSpecs.flatMap((groups) =>
      groups.find((item) => item.group === group)?.entries.map(([label]) => label) ?? [],
    ))]
    return labels.map((label) => ({
      id: `spec:${group}:${label}`,
      label: `${group} · ${label}`,
      values: bikeSpecs.map((groups) =>
        groups.find((item) => item.group === group)?.entries.find(([key]) => key === label)?.[1] ?? '—',
      ),
    }))
  })

  const geometryLabels = [...new Set(bikes.flatMap((bike) =>
    'geometry' in bike && bike.geometry ? Object.keys(bike.geometry.rows) : [],
  ))]
  const geometry = geometryLabels.map((label) => ({
    id: `geometry:${label}`,
    label: `Geometry · ${label}`,
    values: bikes.map((bike) => {
      if (!('geometry' in bike) || !bike.geometry) return '—'
      const sizeIndex = bike.geometry.sizes.findIndex((item) => String(item) === size)
      const value = Object.entries(bike.geometry.rows).find(([key]) => key === label)?.[1]?.[sizeIndex]
      return value === undefined ? '—' : String(value)
    }),
  }))
  return [...factsRows(bikes), ...specs, ...geometry]
}

function sameValues(values: string[]): boolean {
  return values.every((value) => value === values[0])
}

export default function ComparePage() {
  const [location, navigate] = useLocation()
  const { ids: storedIds, add: addCompareBike, remove: removeCompareBike, clear: clearCompare } = useCompare()
  const [search, setSearch] = useState(window.location.search)
  const query = new URLSearchParams(search)
  const queryHasIds = query.has('b')
  const queryIds = parseBikeIds(query.get('b'))
  const queryIdKey = queryIds.join(',')
  const ids = queryHasIds ? queryIds : storedIds
  const idsKey = ids.join(',')
  const bikes = ids
    .map((id) => publishedBikes.find((bike) => `${bike.brand}/${bike.slug}` === id))
    .filter((bike): bike is Bike => bike !== undefined)
  const detail = useDetail()
  const [onlyDifferences, setOnlyDifferences] = useState(false)
  const sizeOptions = [...new Set(bikes.flatMap((bike) =>
    'geometry' in bike && bike.geometry ? bike.geometry.sizes.map(String) : [],
  ))].sort((a, b) => Number(a) - Number(b))
  const [chosenSize, setChosenSize] = useState('')
  const activeSize = sizeOptions.includes(chosenSize) ? chosenSize : sizeOptions[0] ?? ''

  useEffect(() => {
    const onPopState = () => setSearch(window.location.search)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (!queryHasIds) return
    clearCompare()
    queryIdKey.split(',').filter(Boolean).forEach(addCompareBike)
  }, [location, search, queryHasIds, queryIdKey, addCompareBike, clearCompare])

  const rows = detail === 'simple' ? factsRows(bikes) : detailedRows(bikes, activeSize)
  const visibleRows = onlyDifferences ? rows.filter((row) => !sameValues(row.values)) : rows

  const setIds = useCallback((next: string[]) => {
    const unique = [...new Set(next)].slice(0, 3)
    const nextSearch = unique.length ? `?b=${encodeURIComponent(unique.join(','))}` : ''
    navigate(`/compare${nextSearch}`)
    setSearch(nextSearch)
  }, [navigate])

  useEffect(() => {
    const onAdd = (event: Event) => {
      const id = (event as CustomEvent<string>).detail
      if (typeof id === 'string') setIds([...idsKey.split(',').filter(Boolean), id])
    }
    window.addEventListener('velo:compare-add', onAdd)
    return () => window.removeEventListener('velo:compare-add', onAdd)
  }, [idsKey, setIds])

  const empty = bikes.length === 0
  return (
    <>
      <Seo title={`${copy.compare.title} — Velo`} description={copy.meta.compare} />
      <section className="min-h-svh px-6 pb-24 pt-36 text-fg md:px-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <FitText as="h1" className="font-brand t-display-xl">{copy.compare.title}</FitText>
          {!empty && (
            <Button
              variant="text"
              data-cursor="link"
              onClick={() => window.dispatchEvent(new CustomEvent('velo:open-compare-command'))}
              className="inline-flex min-h-11 items-center"
            >
              Add a bike
            </Button>
          )}
        </div>

        {empty ? (
          <p className="mt-10 text-body-l">
            {copy.compare.empty} <NavLink to="/bikes">{copy.compare.browse}</NavLink>
          </p>
        ) : (
          <>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bikes.map((bike) => {
                const brand = brandBySlug(bike.brand)
                const price = priceLabel(bike)
                const id = `${bike.brand}/${bike.slug}`
                return (
                  <li key={id} data-section className="grid grid-cols-[6rem_1fr_auto] items-center gap-4 border-b border-stone-300 pb-4">
                    <Photo bike={bike} sizes="96px" />
                    <div className="min-w-0">
                      <p className="text-sm text-stone-600">{brand?.name}</p>
                      <FitText as="h2" className="font-brand text-xl">{bike.name}</FitText>
                      {price && bike.price && (
                        <a href={brand?.website} title={bike.price.asOf} target="_blank" rel="noopener noreferrer" className="link price text-sm">
                          {price}
                        </a>
                      )}
                    </div>
                    <Button
                      variant="text"
                      data-cursor="link"
                      onClick={() => {
                        removeCompareBike(id)
                        setIds(ids.filter((item) => item !== id))
                      }}
                      aria-label={`Remove ${brand?.name ?? bike.brand} ${bike.name}`}
                      className="min-h-11 min-w-11"
                    >
                      Remove
                    </Button>
                  </li>
                )
              })}
            </ul>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-5">
              <DetailSwitch />
              <label className="inline-flex min-h-11 items-center gap-3">
                <input type="checkbox" checked={onlyDifferences} onChange={(event) => setOnlyDifferences(event.currentTarget.checked)} />
                Only differences
              </label>
            </div>
            {detail === 'detailed' && sizeOptions.length > 0 && (
              <label className="mt-5 inline-flex items-center gap-3 text-sm">
                Geometry size
                <select value={activeSize} onChange={(event) => setChosenSize(event.currentTarget.value)} className="min-h-11 border-b border-stone-300 bg-transparent px-2">
                  {sizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
            )}
            <div className="mt-6 overflow-x-auto" data-lenis-prevent>
              <table className="w-full min-w-max border-collapse text-left">
                <thead>
                  <tr className="border-b border-stone-300">
                    <th scope="col" className="paper sticky left-0 z-10 min-w-48 p-3">Specification</th>
                    {bikes.map((bike) => <th key={`${bike.brand}/${bike.slug}`} scope="col" className="min-w-48 p-3">{bike.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr key={row.id} data-section className="border-b border-stone-300">
                      <th scope="row" className="paper sticky left-0 z-10 p-3 font-medium">{row.label}</th>
                      {row.values.map((value, index) => (
                        <td key={`${row.id}:${index}`} className={`max-w-[22rem] whitespace-normal p-3 ${value === '—' ? 'text-stone-600' : ''}`}>
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  )
}
