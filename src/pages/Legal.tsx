import { useRoute } from 'wouter'
import legal from '../data/legal.json'
import { Seo } from '../components/Seo'
import { NotFound } from './NotFoundView'
import { FitText } from '../components/FitText'

export default function LegalPage() {
  const [, params] = useRoute('/legal/:doc')
  const document = params?.doc === 'privacy' || params?.doc === 'terms' ? legal[params.doc] : undefined
  if (!document) return <NotFound />

  return (
    <>
      <Seo title={`${document.title} — Velo`} description={`${document.title} information for the Velo independent bike showcase.`} />
      <section className="min-h-svh px-6 pb-24 pt-36 text-fg md:px-12">
        <FitText as="h1" className="font-brand t-display-xl">{document.title}</FitText>
        {legal.placeholder && <p className="mt-4 text-sm text-stone-600">Placeholder legal copy. Review before publication.</p>}
        <div className="mx-auto mt-12 max-w-4xl divide-y divide-stone-300 border-y border-stone-300">
          {document.sections.map((section) => (
            <section key={section.heading} className="py-7">
              <h2 className="font-brand text-2xl">{section.heading}</h2>
              <p className="mt-3 max-w-[70ch] text-body-l">{section.text}</p>
            </section>
          ))}
        </div>
      </section>
    </>
  )
}
