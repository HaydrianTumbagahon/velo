import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useRoute } from 'wouter'
import type { PhotoAngle } from '../lib/images'
import { anglesOf } from '../lib/images'
import { brandBySlug, bikeOf, bikesOf, priceLabel } from '../lib/data'
import { loadBrandFont } from '../lib/brandFonts'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { useBrandMotion } from '../hooks/useBrandMotion'
import { useDetail } from '../lib/detail'
import { gsap, useGSAP } from '../lib/gsap'
import { reveal } from '../lib/reveal'
import site from '../data/site.json'
import { BigLines } from '../components/BigLines'
import { DetailSwitch } from '../components/DetailSwitch'
import { NavLink } from '../components/NavLink'
import { Photo } from '../components/Photo'
import { Seo } from '../components/Seo'
import { SpecView } from '../components/SpecView'
import { CompareToggle } from '../layouts/CompareToggle'
import { NotFound } from './NotFoundView'
import type { Bike } from '../types'
import { FitText } from '../components/FitText'
import copy from '../data/copy.json'
import { getLenis } from '../lib/smooth'
import { Button } from '../components/Button'

function AtAGlance({ bike, brand }: { bike: Bike; brand: NonNullable<ReturnType<typeof brandBySlug>> }) {
  const entries: Array<{ label: string; value: string; href?: string; title?: string }> = []
  const price = priceLabel(bike)
  if (bike.price && price) {
    entries.push({ label: 'Price', value: price, href: brand.website, title: bike.price.asOf })
  }
  for (const label of ['Weight', 'Groupset', 'Wheels', 'Brakes', 'Tyre clearance', 'Sizes'] as const) {
    const value = bike.facts[label]
    if (value) entries.push({ label, value })
  }
  if (!entries.length) return null
  return (
    <section className="at-a-glance mx-auto grid max-w-7xl grid-cols-2 px-6 md:px-12 lg:grid-cols-7" aria-label="At a glance">
      {entries.map((entry, index) => (
        <div key={entry.label} className={`at-a-glance__item ${index ? 'at-a-glance__item--divided' : ''}`}>
          {entry.href ? (
            <a href={entry.href} target="_blank" rel="noopener noreferrer" title={entry.title} className="link block">
              <strong className="block text-base font-bold text-fg sm:text-lg">{entry.value}</strong>
              <span className="mt-1 block text-sm text-stone-600">{entry.label}</span>
            </a>
          ) : (
            <>
              <strong className="block text-base font-bold text-fg sm:text-lg">{entry.value}</strong>
              <span className="mt-1 block text-sm text-stone-600">{entry.label}</span>
            </>
          )}
        </div>
      ))}
    </section>
  )
}

const heroClasses: Record<string, { root: string; image: string; content: string; title: string }> = {
  cinema: {
    root: 'model-hero--cinema',
    image: 'model-hero__image',
    content: 'model-hero__content',
    title: 'model-hero__title',
  },
  split: {
    root: 'model-hero--split',
    image: 'model-hero__image',
    content: 'model-hero__content',
    title: 'model-hero__title',
  },
  blueprint: {
    root: 'model-hero--blueprint',
    image: 'model-hero__image',
    content: 'model-hero__content',
    title: 'model-hero__title',
  },
  editorial: {
    root: 'model-hero--editorial',
    image: 'model-hero__image',
    content: 'model-hero__content',
    title: 'model-hero__title',
  },
}

function Hero({
  bike,
  brand,
  angle,
  angles,
  onSelectAngle,
}: {
  bike: Bike
  brand: NonNullable<ReturnType<typeof brandBySlug>>
  angle: PhotoAngle
  angles: PhotoAngle[]
  onSelectAngle: (angle: PhotoAngle) => void
}) {
  const motion = useBrandMotion(brand)
  const gallery = useRef<HTMLDivElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const photoButton = useRef<HTMLElement>(null)
  const lastThumbnail = useRef<HTMLElement | null>(null)
  const previousAngle = useRef<PhotoAngle | null>(null)
  const [oldAngle, setOldAngle] = useState<PhotoAngle | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const classes = heroClasses[brand.layout] ?? heroClasses.editorial
  const price = priceLabel(bike)
  const galleryEnabled = angles.length > 1
  const previousPrice = bike.price?.note?.match(/\bwas\s+([0-9]+(?:\.[0-9]+)?)/i)?.[1]
  const previousPriceLabel = previousPrice && bike.price
    ? new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: bike.price.currency,
        maximumFractionDigits: previousPrice.includes('.') ? 2 : 0,
      }).format(Number(previousPrice))
    : null
  const priceNote = bike.price?.note && !previousPrice ? bike.price.note : null

  useGSAP(
    () => {
      if (!gallery.current || !galleryEnabled) return
      const current = gallery.current.querySelector<HTMLElement>('[data-angle-current]')
      const previous = gallery.current.querySelector<HTMLElement>('[data-angle-previous]')
      if (!current) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(current, { opacity: 1 })
        if (previous) gsap.set(previous, { opacity: 0 })
        return
      }
      gsap.fromTo(
        current,
        { opacity: previousAngle.current ? 0 : 1 },
        { opacity: 1, duration: motion.duration, ease: motion.ease, overwrite: true },
      )
      if (previous) {
        gsap.to(previous, { opacity: 0, duration: motion.duration, ease: motion.ease, overwrite: true })
      }
    },
    { scope: gallery, dependencies: [angle, oldAngle, motion, galleryEnabled], revertOnUpdate: true },
  )

  useEffect(() => {
    if (lightboxOpen && dialog.current && !dialog.current.open) {
      dialog.current.showModal()
      getLenis()?.stop()
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.fromTo(dialog.current, { opacity: 0, scale: 0.98 }, { opacity: 1, scale: 1, duration: 0.35, ease: motion.ease })
      }
    }
  }, [lightboxOpen])

  const selectAngle = (nextAngle: PhotoAngle) => {
    if (nextAngle === angle) return
    previousAngle.current = angle
    setOldAngle(angle)
    onSelectAngle(nextAngle)
  }

  const openLightbox = () => {
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    getLenis()?.start()
    window.requestAnimationFrame(() => (lastThumbnail.current ?? photoButton.current)?.focus())
  }

  const requestLightboxClose = () => {
    const node = dialog.current
    if (!node?.open) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.close()
      return
    }
    gsap.to(node, { opacity: 0, scale: 0.98, duration: 0.2, ease: 'power3.in', onComplete: () => node.close() })
  }

  const moveAngle = (direction: number) => {
    if (!angles.length) return
    const currentIndex = angles.indexOf(angle)
    const nextIndex = (currentIndex + direction + angles.length) % angles.length
    selectAngle(angles[nextIndex])
  }

  const onThumbnailKeyDown = (event: KeyboardEvent<HTMLElement>, current: PhotoAngle) => {
    const index = angles.indexOf(current)
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      const next = angles[(index + 1) % angles.length]
      selectAngle(next)
      gallery.current?.querySelector<HTMLButtonElement>(`[data-thumbnail="${next}"]`)?.focus()
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      const next = angles[(index - 1 + angles.length) % angles.length]
      selectAngle(next)
      gallery.current?.querySelector<HTMLButtonElement>(`[data-thumbnail="${next}"]`)?.focus()
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      const next = event.key === 'Home' ? angles[0] : angles[angles.length - 1]
      selectAngle(next)
      gallery.current?.querySelector<HTMLButtonElement>(`[data-thumbnail="${next}"]`)?.focus()
    }
  }

  return (
    <section className={`model-hero ${classes.root} relative px-6 pb-14 pt-32 text-fg md:px-12`}>
      <svg aria-hidden="true" className="model-hero__grid pointer-events-none absolute inset-0 -z-10 h-full w-full">
        <defs>
          <pattern id="model-blueprint-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="#CFCDC8" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#model-blueprint-grid)" />
      </svg>

      <div ref={gallery} className={`model-hero__visual ${classes.image}`}>
        <div className="model-hero__photo relative">
          {oldAngle && galleryEnabled && (
            <div data-angle-previous className="pointer-events-none absolute inset-0" aria-hidden="true">
              <Photo bike={bike} angle={oldAngle} sizes="100vw" />
            </div>
          )}
          <div data-angle-current className="relative">
            <Photo bike={bike} angle={angle} priority sizes="(min-width: 1024px) 70vw, 100vw" />
          </div>
          {angles.length > 0 && (
            <Button
              variant="text"
              elementRef={(element) => { photoButton.current = element }}
              data-cursor="view"
              aria-label={copy.model.gallery.replace('{bike}', bike.name).replace('{angle}', angle)}
              onClick={openLightbox}
              className={`absolute inset-x-0 top-0 z-10 w-full focus-visible:outline-offset-[-4px] [&:focus-visible]:outline ${
                angle === 'cockpit' || angle === 'drivetrain' || angle === 'fork' ? 'aspect-[4/3]' : 'aspect-[3/2]'
              }`}
              data-no-wipe
            />
          )}
        </div>
        {galleryEnabled && (
          <div data-lenis-prevent className="model-gallery model-hero__gallery mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2" aria-label="Photo angles">
            {angles.map((thumbnailAngle) => (
              <Button
                variant="text"
                className="block w-24 min-w-24 snap-start p-0 pb-1 aria-[current=true]:outline aria-[current=true]:outline-1 aria-[current=true]:outline-accent focus-visible:outline"
                data-no-wipe
                elementRef={(element) => {
                  if (thumbnailAngle === angle) lastThumbnail.current = element
                }}
                key={thumbnailAngle}
                data-cursor="view"
                data-thumbnail={thumbnailAngle}
                aria-label={`${thumbnailAngle} view`}
                aria-current={thumbnailAngle === angle ? 'true' : undefined}
                onClick={(event) => {
                  lastThumbnail.current = event.currentTarget
                  selectAngle(thumbnailAngle)
                }}
                onKeyDown={(event) => onThumbnailKeyDown(event, thumbnailAngle)}
              >
                <Photo bike={bike} angle={thumbnailAngle} sizes="96px" />
                <span className="mt-1 block text-left text-xs capitalize text-stone-600">{thumbnailAngle}</span>
              </Button>
            ))}
          </div>
        )}
        {angles.length > 0 && (
          <dialog
            ref={dialog}
            data-lenis-prevent
            aria-label={`${bike.name} photo gallery`}
            onClose={closeLightbox}
            onCancel={(event) => {
              event.preventDefault()
              requestLightboxClose()
            }}
            onClick={(event) => {
              if (event.target === dialog.current) requestLightboxClose()
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') {
                event.preventDefault()
                moveAngle(1)
              } else if (event.key === 'ArrowLeft') {
                event.preventDefault()
                moveAngle(-1)
              }
            }}
            className="paper m-auto max-h-[92svh] w-[min(96vw,1920px)] max-w-none p-4 text-fg backdrop:bg-black/80"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="capitalize">{bike.name} · {angle}</p>
              <Button variant="text" onClick={requestLightboxClose} className="min-h-11 px-3">
                Close
              </Button>
            </div>
            <Photo bike={bike} angle={angle} sizes="1920px" priority className="max-h-[82svh]" />
          </dialog>
        )}
      </div>

      <div className={`model-hero__copy ${classes.content}`}>
        <NavLink
          to={`/brands/${brand.slug}`}
          className="inline-flex min-h-11 items-center text-sm text-stone-600"
        >
          {brand.name}
        </NavLink>
        <FitText as="h1" min={0.4} className={`mt-4 font-brand t-display-xl ${classes.title}`}>{bike.name}</FitText>
        <p className="mt-5 text-sm text-stone-600">{bike.year} · {bike.category}</p>
        {bike.tagline && <p className="mt-4 text-body-l">{bike.tagline}</p>}
        {bike.summary && <p className="mt-4 max-w-2xl text-stone-600">{bike.summary}</p>}
        {priceNote && <p className="mt-3 text-sm text-stone-600">{priceNote}</p>}
        {price && bike.price && (
          <div className="mt-6">
            <a
              href={brand.website}
              title={bike.price.asOf}
              target="_blank"
              rel="noopener noreferrer"
              className="link price inline-flex min-h-11 items-center text-xl"
            >
              {price}
            </a>
            <p className="mt-1 text-sm text-stone-600">Prices are indicative.</p>
            {previousPriceLabel && <p className="mt-1 text-sm text-stone-600">Previously {previousPriceLabel}</p>}
          </div>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <CompareToggle bike={bike} />
          <a
            href={brand.website}
            target="_blank"
            rel="noopener noreferrer"
            className="link inline-flex min-h-11 items-center border border-fg px-4"
          >
            {copy.model.brandSite.replace('{brand}', brand.name)}
          </a>
        </div>
      </div>
    </section>
  )
}

function ModelPage() {
  const [, params] = useRoute('/brands/:brand/:slug')
  const brand = params ? brandBySlug(params.brand) : undefined
  const bike = brand && params ? bikeOf(brand, params.slug) : undefined
  const allBrandBikes = brand ? bikesOf(brand) : []
  const bikeIndex = bike ? allBrandBikes.findIndex((item) => item.slug === bike.slug) : -1
  const nextBike = bikeIndex >= 0 ? allBrandBikes[bikeIndex + 1] : undefined
  const otherBikes = allBrandBikes.filter((item) => item.slug !== bike?.slug)
  const angleList = bike ? anglesOf(bike) : []
  const [gallerySelection, setGallerySelection] = useState<{ bikeId: string; angle: PhotoAngle } | null>(null)
  const bikeId = bike ? `${bike.brand}/${bike.slug}` : ''
  const angle = gallerySelection?.bikeId === bikeId && angleList.includes(gallerySelection.angle)
    ? gallerySelection.angle
    : angleList[0] ?? 'side'
  const detail = useDetail('detailed')
  const specSection = useRef<HTMLElement>(null)
  const motion = useBrandMotion(brand)

  useBrandTheme(brand ?? null)
  useEffect(() => {
    if (brand) void loadBrandFont(brand.theme.font)
  }, [brand])

  useGSAP(
    () => {
      if (!specSection.current) return
      reveal(specSection.current, motion.reveal, motion, {
        trigger: specSection.current,
        start: 'top 80%',
        once: true,
      })
    },
    { scope: specSection, dependencies: [bike, motion], revertOnUpdate: true },
  )

  if (!brand || !bike) return <NotFound />

  const claims = 'claims' in bike && Array.isArray(bike.claims) ? bike.claims.slice(0, 3) : []
  const mailSubject = encodeURIComponent(`Correction: ${brand.name} ${bike.name}`)

  return (
    <>
      <Seo title={`${brand.name} ${bike.name}`} description={bike.summary ?? ''} />
      <article className="model-page pb-24">
        <Hero
          key={bike.slug}
          bike={bike}
          brand={brand}
          angle={angle}
          angles={angleList}
          onSelectAngle={(nextAngle) => setGallerySelection({ bikeId, angle: nextAngle })}
        />

        <AtAGlance bike={bike} brand={brand} />

        <div className="paper model-detail-switch sticky top-20 z-30 px-6 py-3 md:px-12">
          <DetailSwitch brand={brand} />
        </div>

        <section ref={specSection} className="mx-auto max-w-5xl px-6 py-12 md:px-12" aria-label="Specifications">
          <SpecView bike={bike} />
          {detail === 'simple' && claims.length > 0 && (
            <section className="mt-16" aria-labelledby="simple-claims-heading">
              <h2 id="simple-claims-heading" className="mb-5 text-sm text-stone-600">
                Claimed by the brand
              </h2>
              <BigLines lines={claims} brand={brand} className="mb-3 t-display-m" />
            </section>
          )}
        </section>

        {(otherBikes.length > 0 || nextBike) && (
          <section className="mx-auto max-w-7xl px-6 pt-12 md:px-12" aria-labelledby="more-models-heading">
            <h2 id="more-models-heading" className="font-brand text-2xl">More from {brand.name}</h2>
            <ul className="mt-5 divide-y divide-stone-300 border-y border-stone-300">
              {otherBikes.map((other) => (
                <li key={other.slug}>
                  <NavLink
                    to={`/brands/${brand.slug}/${other.slug}`}
                    className="grid min-h-24 grid-cols-[6rem_1fr] items-center gap-5 py-3 sm:grid-cols-[8rem_1fr_auto]"
                  >
                    <Photo bike={other} sizes="128px" className="w-24 sm:w-32" />
                    <FitText as="span" className="font-brand text-xl">{other.name}</FitText>
                    <span className="hidden text-sm text-stone-600 sm:block">{other.category}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
            {nextBike && (
              <NavLink
                to={`/brands/${brand.slug}/${nextBike.slug}`}
                className="mt-14 flex min-h-32 flex-col justify-center border-t border-stone-300 pt-7"
              >
                <span className="text-sm text-stone-600">Next</span>
                <FitText as="span" className="mt-2 font-brand t-display-l">{nextBike.name}</FitText>
              </NavLink>
            )}
          </section>
        )}

        <div className="mx-auto mt-16 flex max-w-7xl flex-wrap gap-x-8 gap-y-3 px-6 text-sm text-stone-600 md:px-12">
          <a href={`mailto:${site.company.email}?subject=${mailSubject}`} className="link inline-flex min-h-11 items-center">
            {copy.model.correction}
          </a>
          <Button variant="text" onClick={() => window.print()} className="inline-flex min-h-11 items-center">
            Print spec sheet
          </Button>
        </div>
      </article>
    </>
  )
}

export default ModelPage
