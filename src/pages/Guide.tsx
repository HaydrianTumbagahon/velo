import glossary from '../data/glossary.json'
import { brands } from '../lib/data'
import { Seo } from '../components/Seo'
import { FitText } from '../components/FitText'
import copy from '../data/copy.json'

const groupOrder = ['Frame', 'Drivetrain', 'Wheels and tyres', 'Geometry', 'Fit'] as const

export default function GuidePage() {
  const grouped = groupOrder.map((group) => ({
    group,
    terms: Object.entries(glossary).filter(([, entry]) => entry.group === group),
  }))

  return (
    <>
      <Seo title={`${copy.guide.title} — Velo`} description={copy.meta.guide} />
      <section className="min-h-svh px-6 pb-24 pt-36 text-fg md:px-12">
        <FitText as="h1" className="max-w-5xl font-brand t-display-xl">{copy.guide.title}</FitText>
        <p className="mt-8 max-w-2xl text-body-l">
          {copy.guide.intro}
        </p>
        <div className="mt-16">
          {grouped.map(({ group, terms }) => terms.length > 0 && (
            <section key={group} className="py-8" aria-labelledby={`guide-${group}`}>
              <h2 id={`guide-${group}`} className="mb-7 font-brand text-2xl">{group}</h2>
              <dl className="divide-y divide-stone-300 border-t border-stone-300">
                {terms.map(([term, entry]) => (
                  <div key={term} id={term.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')} className="py-7">
                    <dt className="font-brand t-display-m">{term}</dt>
                    <dd className="mt-3 max-w-[60ch] text-body-l">{entry.text}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
        <section className="mt-12 border-t border-stone-300 pt-8" aria-labelledby="sizing-heading">
          <h2 id="sizing-heading" className="font-brand text-2xl">Sizing</h2>
          <p className="mt-4 max-w-3xl text-body-l">
            Brands label sizes differently. Use each brand&apos;s own size guide with your height and inseam.
          </p>
          <ul className="mt-5 flex flex-wrap gap-x-7 gap-y-2">
            {brands.map((brand) => (
              <li key={brand.slug}>
                <a
                  href={brand.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center"
                >
                  {brand.name} size guide
                </a>
              </li>
            ))}
          </ul>
        </section>
      </section>
    </>
  )
}
