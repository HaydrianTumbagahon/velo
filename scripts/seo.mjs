import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = join(root, 'dist')
const [template, site, brands, bikes, images, legal] = await Promise.all([
  readFile(join(dist, 'index.html'), 'utf8'),
  readFile(join(root, 'src', 'data', 'site.json'), 'utf8').then(JSON.parse),
  readFile(join(root, 'src', 'data', 'brands.json'), 'utf8').then(JSON.parse),
  readFile(join(root, 'src', 'data', 'bikes.json'), 'utf8').then(JSON.parse),
  readFile(join(root, 'src', 'data', 'images.generated.json'), 'utf8').then(JSON.parse),
  readFile(join(root, 'src', 'data', 'legal.json'), 'utf8').then(JSON.parse),
])
const copy = JSON.parse(await readFile(join(root, 'src', 'data', 'copy.json'), 'utf8'))

const pages = [
  ['/', site.meta.title, site.meta.description],
  ['/bikes', copy.bikes.title, copy.meta.bikes],
  ['/compare', copy.compare.title, copy.meta.compare],
  ['/guide', copy.guide.title, copy.meta.guide],
  ['/about', copy.about.title, copy.meta.about],
  ['/contact', copy.contact.title, copy.meta.contact],
]

const slugify = (value) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '')
  .toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const hasPhoto = (bike) => {
  if (bike.base) return false
  const own = images[`${bike.brand}/${bike.slug}`]
  const family = bike.family ? images.families?.[`${bike.brand}/${slugify(bike.family)}`] : undefined
  return [own, family].some((angles) =>
    angles && Object.values(angles).some((entry) => Array.isArray(entry.widths) && entry.widths.length > 0),
  )
}

for (const brand of brands) {
  pages.push([
    `/brands/${brand.slug}`,
    brand.name,
    brand.blurb,
  ])
  for (const bike of bikes.filter((item) => item.brand === brand.slug && hasPhoto(item))) {
    pages.push([
      `/brands/${brand.slug}/${bike.slug}`,
      `${brand.name} ${bike.name}`,
      bike.summary ?? `Photos and available listing details for ${brand.name} ${bike.name}.`,
    ])
  }
}

for (const document of ['privacy', 'terms']) {
  const legalPage = legal[document]
  if (legalPage) pages.push([`/legal/${document}`, legalPage.title, legalPage.sections?.[0]?.text ?? 'Legal information for Velo.'])
}

const escape = (value) =>
  String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')

for (const [route, title, description] of pages) {
  const pageUrl = new URL(route, site.seo.siteUrl).toString()
  const imageUrl = new URL(site.seo.ogImage, site.seo.siteUrl).toString()
  const meta = [
    `<meta name="description" content="${escape(description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escape(title)}" />`,
    `<meta property="og:description" content="${escape(description)}" />`,
    `<meta property="og:url" content="${escape(pageUrl)}" />`,
    `<meta property="og:image" content="${escape(imageUrl)}" />`,
    `<link rel="canonical" href="${escape(pageUrl)}" />`,
  ].join('\n    ')
  const html = template.replace('</head>', `    ${meta}\n  </head>`)
  const pagePath = route === '/' ? join(dist, 'index.html') : join(dist, route.slice(1), 'index.html')
  await mkdir(join(pagePath, '..'), { recursive: true })
  await writeFile(pagePath, html)
}

console.log(`Wrote SEO metadata for ${pages.length} routes.`)
