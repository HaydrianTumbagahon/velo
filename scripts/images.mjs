import { readdir, mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))
const brands = JSON.parse(await readFile(join(projectRoot, 'src', 'data', 'brands.json'), 'utf8'))
const bikes = JSON.parse(await readFile(join(projectRoot, 'src', 'data', 'bikes.json'), 'utf8'))
const supported = new Set(['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.webp', '.avif'])
const bikeWidths = [640, 1280, 1920]
const heroWidths = [1280, 1920, 2560]
const sourceManifestPath = join(projectRoot, 'src', 'data', 'images.generated.json')
const outputRoot = join(projectRoot, 'public', 'bikes')
const siteOutputRoot = join(projectRoot, 'public', 'site')

function posix(path) {
  return path.split(sep).join('/')
}

async function walk(directory) {
  if (!existsSync(directory)) return []
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await walk(path))
    else if (entry.isFile() && supported.has(extname(entry.name).toLowerCase())) files.push(path)
  }
  return files
}

async function chooseImageRoot() {
  const candidates = (await readdir(projectRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && /^(assets-src|asset-src)$/i.test(entry.name))
    .map((entry) => join(projectRoot, entry.name))
  if (!candidates.length) throw new Error('No image root found. Run npm run catalog after adding assets-src or asset-src.')
  const ranked = await Promise.all(candidates.map(async (path) => ({ path, count: (await walk(path)).length })))
  ranked.sort((a, b) => b.count - a.count || a.path.localeCompare(b.path))
  if (!ranked[0].count) throw new Error(`Image root ${ranked[0].path} contains no supported images.`)
  return ranked[0].path
}

async function findDirectories(directory) {
  const directories = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const path = join(directory, entry.name)
    directories.push(path, ...await findDirectories(path))
  }
  return directories
}

function withinRoot(root, source) {
  const path = resolve(root, source)
  if (path !== root && !path.startsWith(`${root}${sep}`)) {
    throw new Error(`Catalog source escapes the image root: ${source}`)
  }
  if (!existsSync(path)) throw new Error(`Catalog source does not exist: ${source}`)
  return path
}

function alpha(metadata) {
  return Boolean(metadata.hasAlpha)
}

async function convert(source, destinationDirectory, name, targets) {
  const metadata = await sharp(source).metadata()
  if (!metadata.width || !metadata.height) throw new Error(`Image dimensions unavailable: ${source}`)
  const widths = targets.filter((width) => width <= metadata.width)
  if (!widths.length) {
    console.log(`Skipped source narrower than ${Math.min(...targets)}px: ${posix(relative(projectRoot, source))}`)
    return null
  }
  await mkdir(destinationDirectory, { recursive: true })
  for (const width of widths) {
    const resized = sharp(source).resize({ width, withoutEnlargement: true })
    await Promise.all([
      resized.clone().avif({ quality: 50 }).toFile(join(destinationDirectory, `${name}-${width}.avif`)),
      resized.clone().webp({ quality: 80 }).toFile(join(destinationDirectory, `${name}-${width}.webp`)),
    ])
  }
  return {
    width: metadata.width,
    height: metadata.height,
    widths,
    alpha: alpha(metadata),
  }
}

async function findCredits(root, brand) {
  const brandNames = new Set([brand.slug.toLowerCase(), brand.name.toLowerCase()])
  const directories = await findDirectories(root)
  const brandRoots = directories.filter((directory) =>
    brandNames.has(directory.split(sep).at(-1).toLowerCase()),
  )
  for (const directory of brandRoots) {
    const creditsPath = await findCreditsFile(directory)
    if (creditsPath) return JSON.parse(await readFile(creditsPath, 'utf8'))
  }
  return { holder: brand.name }
}

async function findCreditsFile(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isFile() && entry.name.toLowerCase() === 'credits.json') return path
    if (entry.isDirectory()) {
      const nested = await findCreditsFile(path)
      if (nested) return nested
    }
  }
  return undefined
}

const imageRoot = await chooseImageRoot()
const catalogPath = join(imageRoot, 'catalog.map.json')
if (!existsSync(catalogPath)) throw new Error(`Missing ${catalogPath}; run npm run catalog first.`)
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'))
const bikeMap = {}
const familyMap = {}
const bikeIds = new Set(bikes.map((bike) => `${bike.brand}/${bike.slug}`))
const activeBrands = new Set(brands.map((brand) => brand.slug))
const manifest = { credits: {}, families: {} }

for (const [key, sources] of Object.entries(catalog)) {
  if (!sources || typeof sources !== 'object' || Array.isArray(sources)) {
    throw new Error(`Invalid catalog entry for ${key}.`)
  }
  const [brandSlug, slug, ...extra] = key.split('/')
  if (extra.length || !activeBrands.has(brandSlug)) continue
  const isFamily = slug.startsWith('family--')
  const familySlug = isFamily ? slug.slice('family--'.length) : ''
  if (!isFamily && !bikeIds.has(key)) continue
  const destinationSlug = slug
  const destination = join(outputRoot, brandSlug, destinationSlug)
  const entries = {}
  for (const [angle, relativeSource] of Object.entries(sources)) {
    if (!/^(side|three-quarter|front|cockpit|drivetrain|fork|lifestyle|detail-\d+)$/.test(angle)) {
      throw new Error(`Unsupported angle "${angle}" in ${key}.`)
    }
    if (typeof relativeSource !== 'string') throw new Error(`Invalid source path for ${key}/${angle}.`)
    const input = withinRoot(imageRoot, relativeSource)
    const entry = await convert(input, destination, angle, bikeWidths)
    if (entry) entries[angle] = entry
  }
  if (Object.keys(entries).length) {
    if (isFamily) familyMap[`${brandSlug}/${familySlug}`] = entries
    else bikeMap[key] = entries
  }
}

for (const brand of brands) {
  manifest.credits[brand.slug] = await findCredits(imageRoot, brand)
}
manifest.families = familyMap
Object.assign(manifest, bikeMap)

async function directHero(directory) {
  if (!existsSync(directory)) return undefined
  const files = await readdir(directory, { withFileTypes: true })
  const match = files.find((file) => file.isFile() && /^hero\.(png|jpe?g|webp|avif)$/i.test(file.name))
  return match ? join(directory, match.name) : undefined
}

const hero = await directHero(imageRoot) ?? await directHero(join(imageRoot, 'site'))
if (hero) {
  const metadata = await sharp(hero).metadata()
  if (!metadata.width || !metadata.height) throw new Error(`Hero dimensions unavailable: ${hero}`)
  const widths = heroWidths
  const stats = await sharp(hero).stats()
  const [red = { mean: 0 }, green = { mean: 0 }, blue = { mean: 0 }] = stats.channels
  const luma = (0.2126 * red.mean + 0.7152 * green.mean + 0.0722 * blue.mean) / 255
  const entry = { width: metadata.width, height: metadata.height, widths, alpha: alpha(metadata), luma }
  await mkdir(siteOutputRoot, { recursive: true })
  for (const width of widths) {
    const resized = sharp(hero).resize({ width })
    await Promise.all([
      resized.clone().avif({ quality: 50 }).toFile(join(siteOutputRoot, `hero-${width}.avif`)),
      resized.clone().webp({ quality: 80 }).toFile(join(siteOutputRoot, `hero-${width}.webp`)),
    ])
  }
  manifest['site/hero'] = entry
  console.log(`Hero found: ${posix(relative(imageRoot, hero))} (${metadata.width}x${metadata.height}, luma ${luma.toFixed(3)}).`)
} else {
  console.log('Hero not found at the image root or in its site/ folder.')
}

await writeFile(sourceManifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`Generated image variants for ${Object.keys(bikeMap).length} bikes and ${Object.keys(familyMap).length} shared families.`)
