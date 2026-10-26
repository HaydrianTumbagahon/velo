import { readdir, mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))
const brands = JSON.parse(await readFile(join(projectRoot, 'src', 'data', 'brands.json'), 'utf8'))
const bikesPath = join(projectRoot, 'src', 'data', 'bikes.json')
const originalBikes = JSON.parse(await readFile(bikesPath, 'utf8'))
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.webp', '.avif'])
const noise = new Set([
  'copy', 'final', 'web', 'hires', 'highres', 'rgb', 'cutout', 'clipped', 'transparent',
  'nobg', 'img', 'image', 'photo', 'dsc', 'hero', 'square', 'full', 'complete', 'top', 'com',
])
const editionTokens = new Set([
  'cf', 'cfr', 'slx', 'sl', 'pro', 'expert', 'comp', 'sport', 'ltd', 'replica',
  'edition', 'allroad', 'tt', 'hr', 'sp', '1k',
  ...Array.from({ length: 9 }, (_, index) => `f${index + 1}`),
  ...Array.from({ length: 9 }, (_, index) => `x${index + 1}`),
  ...Array.from({ length: 5 }, (_, index) => `e${index + 5}`),
])
const angleTokens = [
  [['side', 'profile', 'drive', 'lateral'], 'side'],
  [['3q', 'quarter', 'angled'], 'three-quarter'],
  [['front'], 'front'],
  [['cockpit', 'handlebar', 'bar', 'stem', 'hoods', 'shifter', 'drops', 'lever'], 'cockpit'],
  [['drivetrain', 'crank', 'chainring', 'derailleur', 'cassette', 'powermeter', 'bb'], 'drivetrain'],
  [['fork'], 'fork'],
  [['lifestyle', 'action', 'rider', 'riding', 'team', 'athlete', 'peloton', 'campaign'], 'lifestyle'],
  [['detail', 'seatpost', 'headset', 'tyre', 'tire', 'wheel', 'saddle', 'frame', 'brake', 'disc'], 'detail'],
]
const nonBikeTokens = new Set([
  'jersey', 'shoe', 'shoes', 'helmet', 'glove', 'gloves', 'cap', 'sock', 'socks',
  'bottle', 'logo', 'apparel', 'clothing',
])

function posix(path) {
  return path.split(sep).join('/')
}

function stripDiacritics(value) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

function textTokens(value) {
  const separated = stripDiacritics(value)
    .replace(/&/g, ' and ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
  return separated.match(/[a-z0-9]+/g) ?? []
}

function expandAlias(token) {
  if (token === 'duraace') return ['dura', 'ace']
  if (token === 'sworks') return ['s', 'works']
  if (token === 'sw') return ['s', 'works']
  if (token === 'slevel') return ['s', 'level']
  if (token === 'etap') return ['axs']
  if (token === 'wrl') return ['wireless']
  if (token === 'hanzō') return ['hanzo']
  return [token]
}

function aliases(tokens) {
  return tokens.flatMap(expandAlias)
}

function withoutBrand(tokens, brand) {
  const brandNames = new Set(aliases(textTokens(`${brand.slug} ${brand.name}`)))
  return tokens.filter((token) => !brandNames.has(token))
}

function isNoise(token) {
  return /^\d+$/.test(token) ||
    /^r\d+$/.test(token) ||
    /^p\d+$/.test(token) ||
    /^top-?\d+$/.test(token) ||
    /^com-?\d+$/.test(token) ||
    /^\d+x\d+$/.test(token) ||
    noise.has(token)
}

function pathTokens(path, brand) {
  const withoutExtension = path.replace(/\.(jpg|jpeg|png|tif|tiff|webp|avif)$/i, '')
    .replace(/\d{3,5}x\d{3,5}/gi, ' ')
  const tokens = aliases(textTokens(withoutExtension))
  return withoutBrand(tokens, brand).filter((token) => !isNoise(token))
}

function slugify(value) {
  return stripDiacritics(value)
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function sameName(left, right, brand) {
  return withoutBrand(aliases(textTokens(left)), brand).join(' ') ===
    withoutBrand(aliases(textTokens(right)), brand).join(' ')
}

function editionMarkers(tokens) {
  const found = new Set()
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (token === 's' && tokens[index + 1] === 'works') found.add('sworks')
    if (token === 's' && tokens[index + 1] === 'level') found.add('slevel')
    if (editionTokens.has(token)) found.add(token)
  }
  return found
}

function canMatchItem(fileTokens, itemTokens) {
  if (!itemTokens.length || !itemTokens.every((token) => fileTokens.includes(token))) return false
  const itemEditions = editionMarkers(itemTokens)
  return [...editionMarkers(fileTokens)].every((token) => itemEditions.has(token))
}

async function walk(directory) {
  if (!existsSync(directory)) return []
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await walk(path))
    else if (entry.isFile() && imageExtensions.has(extname(entry.name).toLowerCase())) files.push(path)
  }
  return files.sort((a, b) => a.localeCompare(b))
}

async function walkDirectories(directory) {
  const directories = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const path = join(directory, entry.name)
    directories.push(path, ...await walkDirectories(path))
  }
  return directories
}

async function findImageRoot() {
  const candidates = (await readdir(projectRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && /^(assets-src|asset-src)$/i.test(entry.name))
    .map((entry) => join(projectRoot, entry.name))
  if (!candidates.length) {
    throw new Error('No image root found. Add an assets-src or asset-src folder to the project root.')
  }
  const ranked = await Promise.all(candidates.map(async (path) => ({ path, count: (await walk(path)).length })))
  ranked.sort((a, b) => b.count - a.count || a.path.localeCompare(b.path))
  if (ranked[0].count === 0) {
    throw new Error(`Image root ${ranked[0].path} contains no supported images.`)
  }
  return { path: ranked[0].path, imageCount: ranked[0].count }
}

function parseModelList(text) {
  const items = []
  const families = new Map()
  let brandSlug = ''
  let discipline = ''
  for (const [index, rawLine] of text.split(/\r?\n/).entries()) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const brandBlock = line.match(/^\[([^\]]+)\]$/)
    if (brandBlock) {
      brandSlug = brandBlock[1].toLowerCase()
      if (!brands.some((brand) => brand.slug === brandSlug)) {
        throw new Error(`Unknown model-list brand "${brandSlug}" on line ${index + 1}.`)
      }
      discipline = ''
      continue
    }
    if (!brandSlug) throw new Error(`Model list line ${index + 1} is outside a brand block.`)
    if (line.startsWith('discipline ')) {
      discipline = line.slice('discipline '.length).trim()
      continue
    }
    if (line.startsWith('@')) {
      const [familyName, category = '', note = ''] = line.slice(1).split('|').map((part) => part.trim())
      const family = { name: familyName, category: category || null, note: note || null }
      families.set(`${brandSlug}/${familyName}`, family)
      continue
    }
    const [familyName, name, amountText = '', detailsText = ''] = line.split('|').map((part) => part.trim())
    if (!familyName || !name) throw new Error(`Invalid model list line ${index + 1}: ${rawLine}`)
    const details = {}
    for (const pair of detailsText.split(';')) {
      const separator = pair.indexOf('=')
      if (separator < 0) continue
      details[pair.slice(0, separator).trim().toLowerCase()] = pair.slice(separator + 1).trim()
    }
    const family = families.get(`${brandSlug}/${familyName}`)
    const amount = amountText ? Number(amountText) : null
    if (amountText && !Number.isFinite(amount)) throw new Error(`Invalid price on model list line ${index + 1}.`)
    const category = details.cat || family?.category
    if (!category) throw new Error(`Missing category for ${brandSlug}: ${name} (model list line ${index + 1}).`)
    const facts = {}
    if (details.groupset) facts.Groupset = details.groupset
    if (details.wheels) facts.Wheels = details.wheels
    if (details.frame) facts.Frame = details.frame
    items.push({
      brand: brandSlug,
      family: familyName,
      name,
      slug: slugify(name),
      discipline,
      category,
      price: amount === null
        ? null
        : {
            amount,
            currency: 'USD',
            asOf: 'owner list 2026-10',
            ...(details.was ? { note: `was ${details.was}` } : {}),
          },
      facts,
      summary: details.note || family?.note || null,
      line: index + 1,
      nameTokens: withoutBrand(aliases(textTokens(name)), brands.find((brand) => brand.slug === brandSlug))
        .filter((token) => !isNoise(token)),
    })
  }
  return { items, families }
}

function angleFor(tokens) {
  for (const [words, angle] of angleTokens) {
    if (tokens.some((token) => words.includes(token))) return angle
  }
  return null
}

function closeness(itemTokens, fileTokens) {
  const item = new Set(itemTokens)
  const file = new Set(fileTokens)
  if (!item.size) return 0
  let common = 0
  for (const token of item) if (file.has(token)) common += 1
  return common / item.size
}

function closestFiles(item, files, brand) {
  return [...files]
    .map((file) => ({ file, score: closeness(item.nameTokens, file.tokens) }))
    .sort((a, b) => b.score - a.score || a.file.relative.localeCompare(b.file.relative))
    .slice(0, 3)
}

const { path: imageRoot, imageCount } = await findImageRoot()
const allImagePaths = await walk(imageRoot)
const inventory = []
for (const path of allImagePaths) {
  const metadata = await sharp(path).metadata()
  const fileStats = await stat(path)
  if (!metadata.width || !metadata.height) throw new Error(`Image dimensions unavailable: ${path}`)
  inventory.push({
    path,
    relative: posix(relative(imageRoot, path)),
    bytes: fileStats.size,
    width: metadata.width,
    height: metadata.height,
    alpha: Boolean(metadata.hasAlpha),
  })
}

const docsRoot = join(projectRoot, 'docs')
await mkdir(docsRoot, { recursive: true })
const inventoryPath = join(docsRoot, 'image-inventory.txt')
await writeFile(
  inventoryPath,
  [
    `Image root: ${relative(projectRoot, imageRoot)}`,
    ...inventory.map((image) => `${image.relative}\t${image.bytes}\t${image.width}x${image.height}`),
    '',
  ].join('\n'),
)
const inventoryText = await readFile(inventoryPath, 'utf8')
const inventoriedPaths = new Set(
  inventoryText.split(/\r?\n/).slice(1).filter(Boolean).map((line) => line.split('\t')[0]),
)
if (inventoriedPaths.size !== inventory.length) {
  throw new Error('Image inventory could not be read back completely; matching has been stopped.')
}

console.log(`Image root: ${relative(projectRoot, imageRoot)} (${imageCount} images)`)
const modelList = await readFile(join(projectRoot, 'src', 'data', 'model-list.txt'), 'utf8')
const { items, families } = parseModelList(modelList)
const brandDirectories = await walkDirectories(imageRoot)
const brandFiles = new Map()
const brandFolderSummary = []
const allAssignedFiles = new Set()

for (const brand of brands) {
  const names = new Set([brand.slug.toLowerCase(), brand.name.toLowerCase()])
  const folders = brandDirectories.filter((directory) => names.has(directory.split(sep).at(-1).toLowerCase()))
  const folderFiles = [...new Set((await Promise.all(folders.map((folder) => walk(folder)))).flat())]
    .map((path) => inventory.find((image) => image.path === path))
    .filter(Boolean)
  for (const file of folderFiles) allAssignedFiles.add(file.path)
  brandFiles.set(brand.slug, folderFiles)
  brandFolderSummary.push({
    brand,
    folders: folders.map((folder) => posix(relative(imageRoot, folder))),
    count: folderFiles.length,
  })
  console.log(
    `${brand.name}: ${folders.length ? folders.map((folder) => relative(imageRoot, folder)).join(', ') : 'no matching folder'} (${folderFiles.length} images)`,
  )
}

const itemsByBrand = new Map(brands.map((brand) => [
  brand.slug,
  items.filter((item) => item.brand === brand.slug),
]))
const fileMatches = new Map()
const familyFiles = new Map()
const ambiguousFiles = []
const unmatchedFiles = []
const skippedFiles = []
const usedFiles = new Set()
const rootHeroFiles = inventory.filter((image) =>
  /^hero\.(png|jpe?g|webp|avif)$/i.test(image.relative.split('/').at(-1)),
)

for (const brand of brands) {
  const candidates = itemsByBrand.get(brand.slug) ?? []
  const declaredFamilies = [...families.entries()]
    .filter(([key]) => key.startsWith(`${brand.slug}/`))
    .map(([, family]) => family)
  for (const file of brandFiles.get(brand.slug) ?? []) {
    if (rootHeroFiles.includes(file)) continue
    const tokens = pathTokens(file.relative, brand)
    file.tokens = tokens
    if (tokens.some((token) => nonBikeTokens.has(token))) {
      skippedFiles.push({ brand: brand.slug, file })
      continue
    }
    const matchingItems = candidates.filter((item) => canMatchItem(tokens, item.nameTokens))
    if (matchingItems.length) {
      const highest = Math.max(...matchingItems.map((item) => item.nameTokens.length))
      const winners = matchingItems.filter((item) => item.nameTokens.length === highest)
      if (winners.length > 1) {
        ambiguousFiles.push({ file, items: winners })
        continue
      }
      const item = winners[0]
      const matching = fileMatches.get(item) ?? []
      matching.push(file)
      fileMatches.set(item, matching)
      usedFiles.add(file.path)
      continue
    }

    const fileEditions = editionMarkers(tokens)
    const familyMatches = declaredFamilies
      .filter((family) => {
        const familyTokens = withoutBrand(aliases(textTokens(family.name)), brand)
        return familyTokens.length &&
          familyTokens.every((token) => tokens.includes(token)) &&
          fileEditions.size === 0
      })
      .sort((a, b) =>
        withoutBrand(aliases(textTokens(b.name)), brand).length -
        withoutBrand(aliases(textTokens(a.name)), brand).length,
      )
    if (familyMatches.length) {
      const mostSpecific = familyMatches.filter((family) =>
        withoutBrand(aliases(textTokens(family.name)), brand).length ===
        withoutBrand(aliases(textTokens(familyMatches[0].name)), brand).length,
      )
      if (mostSpecific.length > 1) {
        ambiguousFiles.push({ file, items: mostSpecific.map((family) => ({ name: family.name, brand: brand.slug })) })
        continue
      }
      const family = familyMatches[0]
      const key = `${brand.slug}/${slugify(family.name)}`
      const list = familyFiles.get(key) ?? []
      list.push({ file, family, brand: brand.slug })
      familyFiles.set(key, list)
      usedFiles.add(file.path)
      continue
    }
    unmatchedFiles.push({ brand: brand.slug, file })
  }
}

const looseFiles = inventory.filter((file) =>
  !allAssignedFiles.has(file.path) && !rootHeroFiles.includes(file),
)
for (const file of looseFiles) {
  file.tokens = aliases(textTokens(file.relative)).filter((token) => !isNoise(token))
  unmatchedFiles.push({ brand: null, file })
}

const sourceMap = {}
const familySourceMap = {}
const assignedByItem = new Map()

function assignAngles(files) {
  const byAngle = new Map()
  const unnamed = []
  for (const file of files) {
    const angle = angleFor(file.tokens)
    if (!angle) {
      unnamed.push(file)
      continue
    }
    const angleFiles = byAngle.get(angle) ?? []
    angleFiles.push(file)
    byAngle.set(angle, angleFiles)
  }
  const detailFiles = []
  for (const [angle, angleFiles] of byAngle) {
    angleFiles.sort((a, b) => b.width - a.width)
    if (angle === 'detail') {
      detailFiles.push(...angleFiles)
      byAngle.delete(angle)
      continue
    }
    const [best, ...extras] = angleFiles
    if (best) byAngle.set(angle, [best])
    detailFiles.push(...extras)
  }
  const hasAngleWords = files.some((file) => angleFor(file.tokens))
  if (!hasAngleWords) {
    const landscapes = [...unnamed].filter((file) => file.width > file.height)
      .sort((a, b) => b.width - a.width)
    const side = landscapes.shift()
    if (side) byAngle.set('side', [side])
    detailFiles.push(...unnamed.filter((file) => file !== side))
  } else {
    detailFiles.push(...unnamed)
  }
  detailFiles.sort((a, b) => b.width - a.width || a.relative.localeCompare(b.relative))
  detailFiles.forEach((file, index) => byAngle.set(`detail-${index + 1}`, [file]))
  return new Map([...byAngle.entries()].map(([angle, entries]) => [angle, entries[0]]))
}

for (const [item, files] of fileMatches) assignedByItem.set(item, [...files])
for (const brand of brands) {
  for (const item of itemsByBrand.get(brand.slug) ?? []) {
    if (assignedByItem.has(item)) continue
    const familyKey = `${brand.slug}/${slugify(item.family)}`
    const fallback = familyFiles.get(familyKey) ?? []
    if (fallback.length) {
      assignedByItem.set(item, fallback.map(({ file }) => file))
    }
  }
}

for (const [item, files] of assignedByItem) {
  const isFamilyFallback = !(fileMatches.get(item)?.length)
  const angles = assignAngles(files)
  const target = isFamilyFallback ? familySourceMap : sourceMap
  const key = isFamilyFallback
    ? `${item.brand}/family--${slugify(item.family)}`
    : `${item.brand}/${item.slug}`
  target[key] = Object.fromEntries([...angles].map(([angle, file]) => [angle, posix(relative(imageRoot, file.path))]))
}
for (const [familyKey, files] of familyFiles) {
  const [brandSlug, familySlug] = familyKey.split('/')
  const targetKey = `${brandSlug}/family--${familySlug}`
  if (familySourceMap[targetKey]) continue
  const angles = assignAngles(files.map(({ file }) => file))
  familySourceMap[targetKey] = Object.fromEntries([...angles].map(([angle, file]) => [angle, posix(relative(imageRoot, file.path))]))
}

const bikesById = new Map(originalBikes.map((bike) => [`${bike.brand}/${bike.slug}`, bike]))
const usedCurated = new Set()
const listBikeByItem = new Map()
const mergeDecisions = [
  'Canyon Aeroad CFR was merged into Aeroad CFR Di2; its existing specifications were retained and the old EUR 9,499 price was replaced by the owner-list USD 7,999 price.',
  'Canyon Endurace CFR was removed because it had no curated data; the owner-list Endurace CFR builds remain as separate basic listings.',
  'Factor OSTRO VAM, O2 VAM and MONZA were merged into their curated bikes; specifications, claims and colours were retained and prices were taken from the owner list.',
  'Pinarello Dogma F, Pinarello Dogma X and Specialized Roubaix SL8 remain as data-only base bikes; owner-list builds in those families inherit only geometry, claims, Frame and Fork.',
  'Specialized Tarmac SL8 remains its own curated bike and was not replaced by the separate Tarmac SL9 or Tarmac SL7 owner-list entries.',
]
const sourceLabel = { label: 'Supplied by the site owner' }

function addOwnerSource(sources) {
  const existing = Array.isArray(sources) ? sources : []
  return existing.some((source) => source?.label === sourceLabel.label)
    ? existing
    : [...existing, sourceLabel]
}

function curatedFor(item) {
  if (item.brand === 'canyon' && sameName(item.name, 'Aeroad CFR Di2', brands.find((brand) => brand.slug === item.brand))) {
    const legacy = bikesById.get('canyon/aeroad-cfr')
    if (legacy) {
      usedCurated.add(legacy)
      return { bike: legacy, forcedName: true }
    }
  }
  const brand = brands.find((entry) => entry.slug === item.brand)
  const direct = bikesById.get(`${item.brand}/${item.slug}`)
  const named = originalBikes.find((bike) =>
    bike.brand === item.brand && !usedCurated.has(bike) && sameName(bike.name, item.name, brand),
  )
  const bike = direct && !usedCurated.has(direct) ? direct : named
  if (bike) usedCurated.add(bike)
  return { bike, forcedName: false }
}

const mergedListBikes = []
for (const item of items) {
  const existingResult = curatedFor(item)
  const existing = existingResult.bike
  const inheritedBase =
    item.brand === 'pinarello' && ['Dogma F', 'Dogma X'].includes(item.family)
      ? item.family === 'Dogma F' ? 'dogma-f' : 'dogma-x'
      : item.brand === 'specialized' && item.family === 'Roubaix SL8'
        ? 'roubaix-sl8'
      : item.brand === 'canyon' && item.family === 'Aeroad' && item.name.includes('Aeroad CFR') &&
          !sameName(item.name, 'Aeroad CFR Di2', brands.find((brand) => brand.slug === 'canyon'))
        ? 'aeroad-cfr-di2'
        : null
  const facts = { ...item.facts, ...(existing?.facts ?? {}) }
  const sources = addOwnerSource(existing?.sources)
  const merged = {
    ...(existing ?? {}),
    brand: item.brand,
    family: item.family,
    slug: existingResult.forcedName || !existing?.slug ? item.slug : existing.slug,
    name: existingResult.forcedName || !existing?.name ? item.name : existing.name,
    discipline: existing?.discipline || item.discipline,
    category: existing?.category || item.category,
    price: item.price,
    tagline: existing?.tagline ?? null,
    summary: existing?.summary || item.summary,
    facts,
    dataStatus: existing?.dataStatus ?? 'basic',
    verifiedAt: existing?.verifiedAt ?? null,
    sources,
    ...(inheritedBase ? { inherit: { brand: item.brand, slug: inheritedBase } } : {}),
  }
  if (item.name === 'Aeroad CFR Di2' && existing) {
    merged.slug = item.slug
    merged.name = item.name
  }
  if (item.brand === 'canyon' && item.name.includes('Aeroad CFR') && !sameName(item.name, 'Aeroad CFR Di2', brands.find((brand) => brand.slug === 'canyon'))) {
    mergeDecisions.push(`${item.name} inherits frame, fork, geometry and claims from Aeroad CFR Di2.`)
  }
  listBikeByItem.set(item, merged)
  mergedListBikes.push(merged)
}

for (const [baseSlug, listFamily] of [
  ['dogma-f', 'Dogma F'],
  ['dogma-x', 'Dogma X'],
  ['roubaix-sl8', 'Roubaix SL8'],
]) {
  const baseBrand = baseSlug === 'roubaix-sl8' ? 'specialized' : 'pinarello'
  const base = bikesById.get(`${baseBrand}/${baseSlug}`)
  if (base) {
    base.base = true
    base.family = listFamily
  }
}

const endurace = bikesById.get('canyon/endurace-cfr')
if (endurace) {
  usedCurated.add(endurace)
}

const finalBikes = []
for (const brand of brands) {
  const brandItems = mergedListBikes.filter((bike) => bike.brand === brand.slug)
  finalBikes.push(...brandItems)
  const retained = originalBikes.filter((bike) =>
    bike.brand === brand.slug &&
    !usedCurated.has(bike) &&
    !(bike.brand === 'canyon' && bike.slug === 'endurace-cfr') &&
    !brandItems.some((item) => item.brand === bike.brand && item.slug === bike.slug),
  )
  for (const bike of retained) {
    if (brand.groupBy === 'family' && !bike.family) bike.family = bike.name
  }
  finalBikes.push(...retained)
}
for (const bike of originalBikes) {
  if (!brands.some((brand) => brand.slug === bike.brand) && !usedCurated.has(bike)) finalBikes.push(bike)
}

await writeFile(bikesPath, `${JSON.stringify(finalBikes, null, 2)}\n`)
const catalogMap = { ...sourceMap, ...familySourceMap }
await writeFile(join(imageRoot, 'catalog.map.json'), `${JSON.stringify(catalogMap, null, 2)}\n`)

const familyFallbackLines = []
const missingItems = []
const lowResolutionItems = []
const publishedByBrand = new Map()
const reportLines = [
  '# Catalog report',
  '',
  `Images root used: ${relative(projectRoot, imageRoot)}.`,
  '',
  '## Brand folders',
  '',
  ...brandFolderSummary.map(({ brand, folders, count }) =>
    `- ${brand.name}: ${folders.length ? folders.join(', ') : 'no matching folder'}; ${count} image(s).`,
  ),
  '',
]

for (const brand of brands) {
  const brandPublished = []
  reportLines.push(`## ${brand.name}`, '')
  for (const item of itemsByBrand.get(brand.slug) ?? []) {
    const own = fileMatches.get(item) ?? []
    const familyKey = `${brand.slug}/${slugify(item.family)}`
    const fallback = own.length ? [] : familyFiles.get(familyKey) ?? []
    const sources = own.length ? own : fallback.map(({ file }) => file)
    const angles = sources.length ? assignAngles(sources) : new Map()
    const usable = [...angles.values()].some((image) => image.width >= 640)
    const publicBike = listBikeByItem.get(item)
    if (usable && publicBike && !publicBike.base) {
      brandPublished.push(publicBike)
      reportLines.push(`- ${publicBike.name} (${publicBike.slug}): ${[...angles.keys()].join(', ') || 'no generated angles'}${fallback.length ? ' (shared family photo)' : ''}.`)
    }
    if (fallback.length) {
      familyFallbackLines.push(
        `- ${brand.name} / ${publicBike?.name ?? item.name}: ${fallback.map(({ file }) => file.relative).join(', ')}.`,
      )
    }
    if (sources.length && !usable) {
      lowResolutionItems.push({
        brand,
        item,
        sources: sources.map((image) => `${image.relative} (${image.width}x${image.height}px)`),
      })
    }
    if (!sources.length) {
      const closest = closestFiles(item, brandFiles.get(brand.slug) ?? [], brand)
      missingItems.push({
        item,
        brand,
        closest: closest.map(({ file }) => `${file.relative} (${Math.round(closeness(item.nameTokens, file.tokens ?? pathTokens(file.relative, brand)) * 100)}% token match)`),
      })
    }
  }
  if (!brandPublished.length) reportLines.push('- No published models.')
  reportLines.push('')
  publishedByBrand.set(brand.slug, brandPublished)
}

reportLines.push(
  '## ITEMS WITHOUT ANY IMAGE',
  '',
  ...(missingItems.length
    ? missingItems.map(({ brand, item, closest }) =>
      `- ${brand.slug} line ${item.line}: \`${item.family} | ${item.name}\` — closest filenames considered: ${closest.length ? closest.join('; ') : 'no images in the matched brand folder'}.`,
    )
    : ['- None.']),
  '',
  '## ITEMS WITH ONLY SUB-640PX IMAGES (not published)',
  '',
  ...(lowResolutionItems.length
    ? lowResolutionItems.map(({ brand, item, sources }) =>
      `- ${brand.slug} line ${item.line}: \`${item.family} | ${item.name}\` — ${sources.join('; ')}.`,
    )
    : ['- None.']),
  '',
  '## FAMILY-PHOTO FALLBACKS',
  '',
  ...(familyFallbackLines.length ? familyFallbackLines : ['- None.']),
  '',
  '## AMBIGUOUS FILES',
  '',
  ...(ambiguousFiles.length
    ? ambiguousFiles.map(({ file, items: matches }) =>
      `- ${file.relative}: tied between ${matches.map((item) => item.name).join(', ')}; not assigned.`,
    )
    : ['- None.']),
  '',
  '## FILES THAT MATCHED NOTHING',
  '',
  ...(unmatchedFiles.length
    ? unmatchedFiles.map(({ brand: brandSlug, file }) => {
      const brand = brands.find((entry) => entry.slug === brandSlug)
      const candidates = brand
        ? itemsByBrand.get(brand.slug) ?? []
        : items
      const ranked = candidates
        .map((item) => ({ item, score: closeness(item.nameTokens, file.tokens ?? []) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
      const guess = ranked[0]
        ? `best guess: ${ranked.map(({ item, score }) => `${item.brand}/${item.slug} (${Math.round(score * 100)}%)`).join(', ')}`
        : 'best guess: none'
      return `- ${file.relative} — ${guess}; add the identified model to model-list.txt to publish it.`
    })
    : ['- None.']),
  '',
  '## FILES SKIPPED AS NON-BIKE',
  '',
  ...(skippedFiles.length
    ? skippedFiles.map(({ brand: brandSlug, file }) => `- ${brandSlug}: ${file.relative}`)
    : ['- None.']),
  '',
  '## IMAGES UNDER 1920PX WIDE',
  '',
  ...inventory.filter((image) => image.width < 1920)
    .map((image) => `- ${image.relative}: ${image.width}x${image.height}px.`),
  ...(inventory.some((image) => image.width < 1920) ? [] : ['- None.']),
  '',
  '## MERGE DECISIONS',
  '',
  ...(mergeDecisions.length ? [...new Set(mergeDecisions)].map((decision) => `- ${decision}`) : ['- No curated merges or removals.']),
  '',
)

await writeFile(join(docsRoot, 'catalog-report.md'), `${reportLines.join('\n')}\n`)
const publishedCounts = brands.map((brand) => `${brand.name}: ${publishedByBrand.get(brand.slug)?.length ?? 0} published`)
console.log(`Catalogued ${items.length} owner-list models across ${brands.length} brands.`)
console.log(publishedCounts.join('\n'))
console.log(`Items without any image: ${missingItems.length}; ambiguous files: ${ambiguousFiles.length}; files matching nothing: ${unmatchedFiles.length}.`)
