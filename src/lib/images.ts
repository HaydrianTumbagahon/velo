import images from '../data/images.generated.json'
import type { Bike } from '../types'

export type ImageCredit = {
  holder?: string
  source?: string
  terms?: string
}

export type ImageEntry = {
  width: number
  height: number
  widths: number[]
  alpha: boolean
  luma?: number
}

type ImageIndex = {
  credits?: Record<string, ImageCredit>
  families?: Record<string, Record<string, ImageEntry>>
  [key: string]: unknown
}

const imageIndex = images as ImageIndex

export const photoAngles = [
  'side',
  'three-quarter',
  'front',
  'cockpit',
  'drivetrain',
  'fork',
  'lifestyle',
] as const

type StandardPhotoAngle = (typeof photoAngles)[number]
export type PhotoAngle = StandardPhotoAngle | `detail-${number}`

export function imageFor(bike: Bike, angle: PhotoAngle): ImageEntry | undefined {
  const own = imageForEntries(bike)[angle]
  if (own?.widths.length) return own
  const familyName = 'family' in bike ? bike.family : undefined
  const family = familyName ? imageIndex.families?.[`${bike.brand}/${slugify(familyName)}`] : undefined
  return family?.[angle]
}

export function imagePathFor(bike: Bike, angle: PhotoAngle): string {
  if (imageForEntries(bike)[angle]?.widths.length) return `${bike.brand}/${bike.slug}`
  const familyName = 'family' in bike ? bike.family : ''
  return `${bike.brand}/family--${slugify(familyName ?? '')}`
}

export function heroImage(): ImageEntry | undefined {
  const entry = imageIndex['site/hero']
  if (!isImageEntry(entry)) return undefined
  return entry
}

export function creditsFor(bike: Bike): ImageCredit | undefined {
  return imageIndex.credits?.[bike.brand]
}

export function anglesOf(bike: Bike): PhotoAngle[] {
  const standard = photoAngles.filter((angle) => Boolean(imageFor(bike, angle)?.widths.length))
  const own = imageForEntries(bike)
  const familyName = 'family' in bike ? bike.family : undefined
  const family = familyName ? imageIndex.families?.[`${bike.brand}/${slugify(familyName)}`] ?? {} : {}
  const available = { ...family, ...own }
  const details = Object.keys(available)
    .filter((angle): angle is `detail-${number}` => /^detail-\d+$/.test(angle))
    .filter((angle) => Boolean(imageFor(bike, angle)?.widths.length))
    .sort((a, b) => Number(a.slice(7)) - Number(b.slice(7)))
  return [...standard, ...details]
}

function imageForEntries(bike: Bike): Record<string, ImageEntry> {
  const entry = imageIndex[`${bike.brand}/${bike.slug}`]
  if (!entry || typeof entry !== 'object') return {}
  return entry as Record<string, ImageEntry>
}

function slugify(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function isImageEntry(entry: unknown): entry is ImageEntry {
  return (
    typeof entry === 'object' &&
    entry !== null &&
    'width' in entry &&
    typeof entry.width === 'number' &&
    'height' in entry &&
    typeof entry.height === 'number' &&
    'widths' in entry &&
    Array.isArray(entry.widths) &&
    'alpha' in entry &&
    typeof entry.alpha === 'boolean'
  )
}
