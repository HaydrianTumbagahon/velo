import bikes from '../data/bikes.json'
import rawBrands from '../data/brands.json'
import type { Bike, Brand } from '../types'
import { anglesOf } from './images'

export const brands: Brand[] = rawBrands
export const allBikes: Bike[] = bikes
const rawBikeById = new Map(allBikes.map((bike) => [`${bike.brand}/${bike.slug}`, bike]))

type InheritanceFields = {
  brand: string
  slug: string
  inherit?: string | { brand?: string; slug: string }
  geometry?: unknown
  claims?: unknown
  specs?: Record<string, unknown>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export const brandBySlug = (slug: string): Brand | undefined =>
  brands.find((brand) => brand.slug === slug)

export function resolveBike(bike: Bike): Bike {
  const fields = bike as InheritanceFields
  if (!fields.inherit) return bike
  const inherited = fields.inherit
  const sourceBrand = typeof inherited === 'string' ? fields.brand : inherited.brand ?? fields.brand
  const sourceSlug = typeof inherited === 'string' ? inherited : inherited.slug
  const source = rawBikeById.get(`${sourceBrand}/${sourceSlug}`)
  if (!source) throw new Error(`Missing inheritance source ${sourceBrand}/${sourceSlug} for ${fields.brand}/${fields.slug}.`)
  const sourceFields = source as InheritanceFields
  const geometry = fields.geometry || sourceFields.geometry
  const ownClaims = Array.isArray(fields.claims) && fields.claims.length ? fields.claims : undefined
  const inheritedClaims = Array.isArray(sourceFields.claims) && sourceFields.claims.length
    ? sourceFields.claims
    : undefined
  const claims = ownClaims ?? inheritedClaims
  const specs = { ...(isRecord(fields.specs) ? fields.specs : {}) }
  for (const group of ['Frame', 'Fork'] as const) {
    if (isRecord(specs[group]) && Object.keys(specs[group]).length) continue
    const inheritedGroup = sourceFields.specs?.[group]
    if (isRecord(inheritedGroup) && Object.keys(inheritedGroup).length) {
      specs[group] = inheritedGroup
    }
  }
  const resolved = { ...bike }
  if (geometry) Object.assign(resolved, { geometry })
  if (claims) Object.assign(resolved, { claims })
  if (Object.keys(specs).length) Object.assign(resolved, { specs })
  return resolved as Bike
}

export function published(bike: Bike): boolean {
  return !('base' in bike && bike.base) && anglesOf(bike).length > 0
}

export const publishedBikes = allBikes
  .map(resolveBike)
  .filter(published)

export function groups(brand: Brand | string): string[] {
  const details = typeof brand === 'string' ? brandBySlug(brand) : brand
  if (!details) return []
  const field = details.groupBy
  return [...new Set(publishedBikes
    .filter((bike) => bike.brand === details.slug)
    .map((bike) => 'family' in bike && field === 'family'
      ? bike.family
      : 'discipline' in bike && field === 'discipline' ? bike.discipline : '')
    .filter((group): group is string => Boolean(group)))]
}

export function bikesOf(brand: Brand | string, group?: string): Bike[] {
  const slug = typeof brand === 'string' ? brand : brand.slug
  const details = brandBySlug(slug)
  if (!details) return []
  const field = details.groupBy
  return publishedBikes.filter((bike) => {
    if (bike.brand !== slug) return false
    if (!group) return true
    return field === 'family'
      ? 'family' in bike && bike.family === group
      : 'discipline' in bike && bike.discipline === group
  })
}

export const bikeOf = (brand: Brand | string, slug: string): Bike | undefined => {
  const brandSlug = typeof brand === 'string' ? brand : brand.slug
  return publishedBikes.find((bike) => bike.brand === brandSlug && bike.slug === slug)
}

export function priceLabel(bike: Bike): string | null {
  if (!bike.price) return null
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: bike.price.currency,
    maximumFractionDigits: Number.isInteger(bike.price.amount) ? 0 : 2,
  }).format(bike.price.amount)
}

export function weightKg(bike: Bike): number | null {
  const weight = bike.facts.Weight
  const match = weight?.match(/^\s*(\d+(?:\.\d+)?)/)
  return match ? Number(match[1]) : null
}
