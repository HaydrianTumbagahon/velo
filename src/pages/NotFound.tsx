import { NavLink } from '../components/NavLink'
import { Seo } from '../components/Seo'
import { FitText } from '../components/FitText'
import copy from '../data/copy.json'

export default function NotFound() {
  return (
    <>
      <Seo title={`${copy.notFound.title} — Velo`} description={copy.meta.notFound} />
      <section className="flex min-h-svh flex-col items-start justify-end gap-8 px-6 pb-20 pt-32 md:px-12">
        <FitText as="h1" className="font-brand t-display-xl text-fg">{copy.notFound.title}</FitText>
        <NavLink to="/" className="min-h-11">
          {copy.notFound.back}
        </NavLink>
      </section>
    </>
  )
}
