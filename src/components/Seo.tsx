import site from '../data/site.json'
import { useLocation } from 'wouter'

type SeoProps = {
  title?: string
  description?: string
  image?: string
}

export function Seo({ title = site.meta.title, description = site.meta.description, image }: SeoProps) {
  const [location] = useLocation()
  const pageUrl = new URL(location, site.seo.siteUrl).toString()
  const imageUrl = new URL(image ?? site.seo.ogImage, site.seo.siteUrl).toString()

  return (
    <>
      <title>Velo</title>
      <meta name="description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:image" content={imageUrl} />
    </>
  )
}
