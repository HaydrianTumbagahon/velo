import site from '../data/site.json'
import { publishedBikes, brands } from '../lib/data'
import { Seo } from '../components/Seo'
import { FitText } from '../components/FitText'
import copy from '../data/copy.json'

export default function AboutPage() {
  return (
    <>
      <Seo title={`${copy.about.title} — Velo`} description={copy.meta.about} />
      <section className="min-h-svh px-6 pb-24 pt-36 text-fg md:px-12">
        <FitText as="h1" className="font-brand t-display-xl">{copy.about.title}</FitText>
        <dl className="mx-auto mt-12 max-w-5xl divide-y divide-stone-300 border-y border-stone-300">
          <div className="grid gap-3 py-7 md:grid-cols-[minmax(12rem,0.7fr)_1.3fr]">
            <dt className="font-brand text-2xl">What this is</dt>
            <dd className="max-w-3xl text-body-l">
              Velo is an independent showcase of road bikes. It sells nothing and is not affiliated with or endorsed by any brand.
            </dd>
          </div>
          <div className="grid gap-3 py-7 md:grid-cols-[minmax(12rem,0.7fr)_1.3fr]">
            <dt className="font-brand text-2xl">Where the data comes from</dt>
            <dd className="max-w-3xl text-body-l">
              Data is checked against official brand pages and specification sheets, plus named secondary sources listed on each bike. Every bike page shows its available sources and verification date.
              <ul className="mt-5 divide-y divide-stone-300 border-y border-stone-300 text-base">
                {publishedBikes.map((bike) => (
                  <li key={`${bike.brand}/${bike.slug}`} className="py-3">
                    <span>{brands.find((brand) => brand.slug === bike.brand)?.name} {bike.name}</span>
                    <span className="ml-2 text-sm text-stone-600">
                      {bike.verifiedAt ? `Verified ${bike.verifiedAt}` : 'Verification date not listed'}
                    </span>
                    {bike.sources?.map((source, index) => 'url' in source && source.url ? (
                      <a
                        key={`${source.label}-${index}`}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link mt-1 block text-sm"
                      >
                        {source.label}
                      </a>
                    ) : (
                      <span key={`${source.label}-${index}`} className="mt-1 block text-sm">
                        {source.label}
                      </span>
                    ))}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <div className="grid gap-3 py-7 md:grid-cols-[minmax(12rem,0.7fr)_1.3fr]">
            <dt className="font-brand text-2xl">Where the photos come from</dt>
            <dd className="max-w-3xl text-body-l">
              Photos come from official brand media centres and press kits where available, with credits shown alongside images.
              <ul className="mt-4 space-y-1 text-base">
                {brands.filter((brand) => brand.mediaUrl).map((brand) => (
                  <li key={brand.slug}>
                    <a href={brand.mediaUrl ?? undefined} target="_blank" rel="noopener noreferrer" className="link">
                      {brand.name} media centre
                    </a>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <div className="grid gap-3 py-7 md:grid-cols-[minmax(12rem,0.7fr)_1.3fr]">
            <dt className="font-brand text-2xl">Corrections</dt>
            <dd>
              <a href={`mailto:${site.company.email}`} className="link inline-flex min-h-11 items-center text-body-l">
                Contact Velo about a correction
              </a>
            </dd>
          </div>
        </dl>

        <section className="mx-auto mt-16 max-w-5xl" aria-labelledby="brand-list-heading">
          <h2 id="brand-list-heading" className="font-brand text-2xl">Brands in the showcase</h2>
          <ul className="mt-5 divide-y divide-stone-300 border-y border-stone-300">
            {brands.map((brand) => {
              const models = publishedBikes.filter((bike) => bike.brand === brand.slug)
              const full = models.filter((bike) => bike.dataStatus === 'full').length
              return (
                <li key={brand.slug} className="grid gap-2 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <a href={brand.website} target="_blank" rel="noopener noreferrer" className="link font-brand text-xl">
                    {brand.name}
                  </a>
                  <p className="text-sm text-stone-600">
                    {models.length} {models.length === 1 ? 'model' : 'models'} · {full} with full data
                  </p>
                </li>
              )
            })}
          </ul>
        </section>
      </section>
    </>
  )
}
