import { Seo } from './Seo'
import { FitText } from './FitText'

type PlaceholderProps = {
  title: string
  description?: string
}

export function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <>
      <Seo title={`${title} — Velo`} description={description} />
      <section className="flex min-h-svh items-end px-6 pb-20 pt-32 md:px-12">
        <FitText as="h1" className="font-brand t-display-xl text-fg">{title}</FitText>
      </section>
    </>
  )
}
