import { useEffect, useMemo, useRef, useState } from 'react'
import glossary from '../data/glossary.json'
import { useDetail } from '../lib/detail'
import { brandBySlug } from '../lib/data'
import { orderedSpecParts, specPartFor } from '../lib/specOrder'
import { useBrandMotion } from '../hooks/useBrandMotion'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap'
import { refreshLayout } from '../lib/smooth'
import type { Bike } from '../types'
import { Rule } from './Rule'
import { Button } from './Button'

type SpecRow = { label: string; value: string }
type GeometryValue = string | number | null | undefined
type GeometryRows = Record<string, GeometryValue[] | undefined>

function factRows(bike: Bike): SpecRow[] {
  return Object.entries(bike.facts).map(([label, value]) => ({ label, value }))
}

function detailedRows(bike: Bike): Map<string, SpecRow[]> {
  const parts = new Map<string, SpecRow[]>()
  const append = (group: string, label: string, value: unknown) => {
    if (typeof value !== 'string' || !value) return
    const part = specPartFor(group, label)
    const rows = parts.get(part) ?? []
    rows.push({ label, value })
    parts.set(part, rows)
  }

  factRows(bike).forEach(({ label, value }) => append(label, label, value))
  if ('specs' in bike && bike.specs) {
    Object.entries(bike.specs).forEach(([group, entries]) => {
      Object.entries(entries ?? {}).forEach(([label, value]) => append(group, label, value))
    })
  }
  if ('geometry' in bike && bike.geometry) parts.set('Sizes & fit', parts.get('Sizes & fit') ?? [])
  if ('colours' in bike && bike.colours?.length) parts.set('Colours', parts.get('Colours') ?? [])
  if ('claims' in bike && bike.claims?.length) parts.set('Claimed by the brand', parts.get('Claimed by the brand') ?? [])
  return parts
}

function glossaryText(label: string): string | undefined {
  return glossary[label as keyof typeof glossary]?.text
}

function SpecRows({ rows, large = false }: { rows: SpecRow[]; large?: boolean }) {
  return (
    <dl className="spec-rows">
      {rows.map(({ label, value }, index) => (
        <div key={`${label}:${value}:${index}`} data-section className={`spec-row ${large ? 'spec-row--large' : ''}`}>
          <dt title={glossaryText(label)}>{label}</dt>
          <dd>
            <span>{value}</span>
            {large && glossaryText(label) && <p className="mt-1 text-sm text-stone-600">{glossaryText(label)}</p>}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function TextChips({ values, label }: { values: string[]; label: string }) {
  if (!values.length) return null
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2" aria-label={label}>
      {values.map((value) => (
        <span key={value} className="inline-flex min-h-11 items-center px-3 text-sm text-fg">
          {value}
        </span>
      ))}
    </div>
  )
}

function colourNames(bike: Bike): string[] {
  if (!('colours' in bike) || !bike.colours) return []
  return bike.colours.map((colour) => (typeof colour === 'string' ? colour : colour.name))
}

function SimpleSpecs({ bike }: { bike: Bike }) {
  const sizes = bike.facts.Sizes?.split(/\s*,\s*/).filter(Boolean) ?? []
  const colours = colourNames(bike)
  return (
    <>
      <SpecRows rows={factRows(bike)} large />
      <TextChips values={sizes} label="Available sizes" />
      <TextChips values={colours} label="Available colours" />
    </>
  )
}

function parseHeightRange(value: unknown): [number, number] | null {
  if (typeof value !== 'string') return null
  const numbers = value.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? []
  if (numbers.length >= 2) return [numbers[0], numbers[1]]
  if (numbers.length === 1) return [numbers[0], numbers[0]]
  return null
}

function Geometry({ bike }: { bike: Bike }) {
  const geometry = 'geometry' in bike ? bike.geometry : undefined
  const [selectedSize, setSelectedSize] = useState(() => new URLSearchParams(window.location.search).get('size') ?? '')
  const [riderHeight, setRiderHeight] = useState('')
  const sizes = geometry?.sizes ?? []
  const rows: GeometryRows = geometry?.rows ?? {}
  const sizeLabels = sizes.map(String)
  const safeSelectedSize = sizeLabels.includes(selectedSize) ? selectedSize : ''
  const entries = Object.entries(rows).filter((entry): entry is [string, GeometryValue[]] => Boolean(entry[1]))
  const heightRow = rows['Rider height (cm)']
  const constants = entries.filter(([, values]) => {
    const present = values.filter((value) => value !== null && value !== undefined).map(String)
    return present.length === sizes.length && present.every((value) => value === present[0])
  })

  useEffect(() => {
    const syncSize = () => setSelectedSize(new URLSearchParams(window.location.search).get('size') ?? '')
    window.addEventListener('popstate', syncSize)
    return () => window.removeEventListener('popstate', syncSize)
  }, [])

  useEffect(() => {
    setSelectedSize(new URLSearchParams(window.location.search).get('size') ?? '')
    setRiderHeight('')
  }, [bike.brand, bike.slug])

  useEffect(() => {
    refreshLayout()
  }, [safeSelectedSize])

  const chooseSize = (size: string) => {
    setSelectedSize(size)
    const params = new URLSearchParams(window.location.search)
    params.set('size', size)
    window.history.replaceState(window.history.state, '', `${window.location.pathname}?${params}${window.location.hash}`)
  }

  const chooseHeight = (heightValue: string) => {
    setRiderHeight(heightValue)
    const height = Number(heightValue)
    if (!height || !heightRow) return
    const index = heightRow.findIndex((range) => {
      const parsed = parseHeightRange(range)
      return parsed && height >= parsed[0] && height <= parsed[1]
    })
    if (index >= 0 && sizeLabels[index]) chooseSize(sizeLabels[index])
  }

  if (!geometry) return null

  return (
    <div id="geometry" className="mt-8 scroll-mt-32">
      <h4 className="mb-3 font-brand text-lg font-bold">Geometry</h4>
      {geometry.note && <p className="mb-4 text-sm text-stone-600">{geometry.note}</p>}
      <div className="flex flex-wrap gap-2" aria-label="Choose geometry size">
        {sizeLabels.map((size) => (
          <Button
            variant="text"
            key={size}
            type="button"
            aria-pressed={size === safeSelectedSize}
            className="min-h-11 px-3 text-sm aria-pressed:bg-accent aria-pressed:text-ink"
            data-cursor="link"
            onClick={() => chooseSize(size)}
          >
            {size}
          </Button>
        ))}
      </div>
      {heightRow && (
        <label className="mt-4 inline-flex min-h-11 flex-wrap items-center gap-3 text-sm">
          Rider height (cm)
          <input
            className="min-h-11 w-28 border-b border-stone-300 bg-transparent px-2 tabular-nums"
            type="number"
            min={100}
            max={230}
            value={riderHeight}
            onChange={(event) => chooseHeight(event.currentTarget.value)}
          />
        </label>
      )}
      <div className="mt-4 overflow-x-auto" data-lenis-prevent>
        <table className="w-full min-w-max border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-stone-300">
              <th className="paper sticky left-0 z-10 min-w-40 p-3" scope="col">Measurement</th>
              {sizeLabels.map((size) => (
                <th key={size} scope="col" className={`p-3 ${size === safeSelectedSize ? 'bg-accent/20' : ''}`}>
                  {size}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map(([label, values]) => (
              <tr key={label} className="border-b border-stone-300">
                <th
                  scope="row"
                  title={glossaryText(label)}
                  className="paper sticky left-0 z-10 max-w-56 whitespace-normal p-3 font-medium"
                >
                  {label}
                </th>
                {sizeLabels.map((size, index) => (
                  <td key={size} className={`p-3 ${size === safeSelectedSize ? 'bg-accent/10' : ''}`}>
                    {values[index] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {constants.length > 0 && (
        <p className="mt-3 text-sm text-stone-600">
          Constants: {constants.map(([label, values]) => `${label} ${values[0]}`).join(' · ')}
        </p>
      )}
    </div>
  )
}

function PartContent({ bike, part }: { bike: Bike; part: string }) {
  const mapped = detailedRows(bike)
  const rows = mapped.get(part) ?? []
  return (
    <>
      {rows.length > 0 && <SpecRows rows={rows} />}
      {part === 'Sizes & fit' && <Geometry bike={bike} />}
      {part === 'Colours' && <TextChips values={colourNames(bike)} label="Available colours" />}
      {part === 'Claimed by the brand' && 'claims' in bike && bike.claims?.length ? (
        <ul className="space-y-3">
          {bike.claims.map((claim) => <li key={claim}>{claim}</li>)}
        </ul>
      ) : null}
    </>
  )
}

function DetailedSpecs({ bike }: { bike: Bike }) {
  const root = useRef<HTMLDivElement>(null)
  const [activePart, setActivePart] = useState('')
  const brand = brandBySlug(bike.brand)
  const partsByName = useMemo(() => detailedRows(bike), [bike])
  const parts = useMemo(() => orderedSpecParts(partsByName.keys()), [partsByName])

  useGSAP(() => {
    const nodes = gsap.utils.toArray<HTMLElement>('[data-spec-part]', root.current)
    setActivePart(nodes[0]?.id ?? '')
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    nodes.forEach((node) => {
      ScrollTrigger.create({
        trigger: node,
        start: 'top 35%',
        end: 'bottom 35%',
        onEnter: () => setActivePart(node.id),
        onEnterBack: () => setActivePart(node.id),
      })
    })
  }, { scope: root, dependencies: [bike, parts.join('|')], revertOnUpdate: true })

  return (
    <div ref={root} className="full-spec-grid">
      <nav className="full-spec-index" aria-label="Specification parts" data-lenis-prevent>
        <ul>
          {parts.map((part) => {
            const id = `spec-${part.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-')}`
            return (
              <li key={part}>
                <a
                  href={`#${id}`}
                  aria-current={activePart === id ? 'location' : undefined}
                  className="link inline-flex min-h-11 items-center text-sm aria-[current=location]:font-bold"
                  onClick={() => setActivePart(id)}
                >
                  {part}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="min-w-0">
        {parts.map((part) => {
          const id = `spec-${part.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-')}`
          return (
            <section key={part} id={id} data-spec-part data-section className="spec-part scroll-mt-32">
              <Rule brand={brand} className="mb-5" />
              <h3 className="mb-4 font-brand text-2xl font-bold">{part}</h3>
              <PartContent bike={bike} part={part} />
            </section>
          )
        })}
      </div>
    </div>
  )
}

function ClosingRow({ bike }: { bike: Bike }) {
  return (
    <div className="mt-10 flex flex-wrap items-start justify-between gap-x-8 gap-y-3 border-t border-stone-300 pt-5 text-sm text-stone-600">
      {bike.sources?.length ? (
        <div>
          <span className="mr-3 font-medium text-fg">Sources</span>
          {bike.sources.map((source, index) => (
            <span key={`${source.label}-${index}`}>
              {index > 0 && <span aria-hidden="true"> · </span>}
              {'url' in source && source.url ? (
                <a className="link" href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a>
              ) : <span>{source.label}</span>}
            </span>
          ))}
        </div>
      ) : null}
      <p className="m-0">
        {bike.verifiedAt
          ? `Verified ${bike.verifiedAt}`
          : 'Supplied by the site owner, not yet checked against the maker.'}
      </p>
    </div>
  )
}

export function SpecView({ bike }: { bike: Bike }) {
  const detail = useDetail('detailed')
  const brand = brandBySlug(bike.brand)
  const motion = useBrandMotion(brand)
  const incomplete = bike.dataStatus === 'basic' || bike.dataStatus === 'partial'

  return (
    <div className="spec-view">
      <div className="spec-view__layers">
        <div
          data-detail-content="simple"
          className={`spec-view__mode transition-opacity motion-reduce:transition-none ${detail === 'simple' ? '' : 'invisible'}`}
          aria-hidden={detail !== 'simple'}
          inert={detail !== 'simple'}
          style={{ opacity: detail === 'simple' ? 1 : 0, transitionDuration: `${motion.duration}s` }}
        >
          <SimpleSpecs bike={bike} />
        </div>
        <div
          data-detail-content="detailed"
          className={`spec-view__mode transition-opacity motion-reduce:transition-none ${detail === 'detailed' ? '' : 'invisible'}`}
          aria-hidden={detail !== 'detailed'}
          inert={detail !== 'detailed'}
          style={{ opacity: detail === 'detailed' ? 1 : 0, transitionDuration: `${motion.duration}s` }}
        >
          <DetailedSpecs bike={bike} />
          <ClosingRow bike={bike} />
        </div>
      </div>
      {incomplete && brand && (
        <p className="mt-6 text-sm text-stone-600">
          This listing is still being completed. The{' '}
          <a href={brand.website} target="_blank" rel="noopener noreferrer" className="link">brand&apos;s page</a>
          {' '}has the full specification.
        </p>
      )}
    </div>
  )
}
