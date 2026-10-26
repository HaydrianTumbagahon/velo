import { brandBySlug } from '../lib/data'
import { creditsFor, imageFor, imagePathFor, type PhotoAngle } from '../lib/images'
import type { Bike } from '../types'
import { Bike as BikePlaceholder } from './Bike'
import type { ReactNode } from 'react'
import { refreshLayout } from '../lib/smooth'

type PhotoProps = {
  bike: Bike
  angle?: PhotoAngle
  sizes?: string
  priority?: boolean
  className?: string
}

export function Photo({
  bike,
  angle = 'side',
  sizes = '100vw',
  priority = false,
  className,
}: PhotoProps) {
  const entry = imageFor(bike, angle)
  const credits = creditsFor(bike)
  const isDetailAngle =
    angle === 'cockpit' || angle === 'drivetrain' || angle === 'fork' || angle.startsWith('detail-')
  const frameClass = `block w-full ${className ?? ''}`
  const imageFrame = `relative block w-full ${isDetailAngle ? 'aspect-[4/3]' : 'aspect-[3/2]'}`
  const alt = `${brandBySlug(bike.brand)?.name ?? bike.brand} ${bike.name}, ${angle} view`
  const frameContent = (children: ReactNode) => (
    <div className={`${imageFrame} photo-frame`} data-cursor="view">
      {children}
      <span className="photo-crop photo-crop--tl" />
      <span className="photo-crop photo-crop--tr" />
      <span className="photo-crop photo-crop--bl" />
      <span className="photo-crop photo-crop--br" />
    </div>
  )

  if (!entry?.widths.length) {
    return (
      <figure className={frameClass}>
        {frameContent(<BikePlaceholder className="h-full w-full object-contain" />)}
      </figure>
    )
  }

  const basePath = `/bikes/${imagePathFor(bike, angle)}/${angle}`
  const srcSet = (format: 'avif' | 'webp') =>
    entry.widths.map((width) => `${basePath}-${width}.${format} ${width}w`).join(', ')

  return (
    <figure className={frameClass}>
      <picture className={`${imageFrame} photo-frame`} data-cursor="view">
        <source type="image/avif" srcSet={srcSet('avif')} sizes={sizes} />
        <img
          className="h-full w-full object-contain"
          src={`${basePath}-${entry.widths[0]}.webp`}
          srcSet={srcSet('webp')}
          sizes={sizes}
          width={entry.width}
          height={entry.height}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          alt={alt}
          onLoad={refreshLayout}
        />
        <span className="photo-crop photo-crop--tl" />
        <span className="photo-crop photo-crop--tr" />
        <span className="photo-crop photo-crop--bl" />
        <span className="photo-crop photo-crop--br" />
      </picture>
      {(credits?.holder || credits?.source || credits?.terms) && (
        <figcaption className="mt-2 text-xs text-stone-600">
          {[credits.holder, credits.source, credits.terms].filter(Boolean).join(' · ')}
        </figcaption>
      )}
    </figure>
  )
}
