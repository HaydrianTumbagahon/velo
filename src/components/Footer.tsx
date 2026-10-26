import site from '../data/site.json'
import { brands } from '../lib/data'
import { scrollToTop } from '../lib/scrollTop'
import { Button } from './Button'
import { FitText } from './FitText'
import { NavLink } from './NavLink'

const siteLinks = [
  { label: 'All bikes', href: '/bikes' },
  { label: 'Compare', href: '/compare' },
  { label: 'Guide', href: '/guide' },
]

const aboutLinks = [
  { label: 'About & sources', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy', href: '/legal/privacy' },
  { label: 'Terms', href: '/legal/terms' },
]

function LinkColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <nav aria-label={title}>
      <h2 className="mb-3 font-brand text-base">{title}</h2>
      <ul className="space-y-1">
        {links.map((link) => (
          <li key={link.href}>
            <NavLink to={link.href} className="inline-flex min-h-11 items-center">{link.label}</NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function Footer() {
  const about = site.footerAbout
  return (
    <footer className="paper border-t border-stone-300 px-6 pb-8 pt-12 text-fg md:px-12">
      <section className="mx-auto max-w-5xl text-center" aria-labelledby="footer-about-title">
        <h2 id="footer-about-title" className="font-brand t-display-m font-semibold">{about.title}</h2>
        <p className="mx-auto mt-4 max-w-[52ch] text-left text-body-l text-stone-600">{about.text}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-1">
          {about.links.map((link) => (
            <NavLink key={link.href} to={link.href} className="inline-flex min-h-11 items-center">{link.label}</NavLink>
          ))}
          <a className="link inline-flex min-h-11 items-center" href={`mailto:${site.company.email}`}>{site.company.email}</a>
        </div>
      </section>
      <div className="mx-auto mt-14 grid max-w-5xl gap-10 text-center sm:grid-cols-3 sm:text-left">
        <LinkColumn title="Brands" links={brands.map(({ name, slug }) => ({ label: name, href: `/brands/${slug}` }))} />
        <LinkColumn title="Explore" links={siteLinks} />
        <LinkColumn title="About" links={aboutLinks} />
      </div>
      <div className="mt-10 flex justify-center">
        <Button variant="round" aria-label="Back to top" onClick={scrollToTop}>↑</Button>
      </div>
      <div className="footer-wordmark mt-8" aria-hidden="true">
        <FitText as="span" className="block select-none text-center font-brand text-[clamp(5rem,20vw,20rem)] font-bold leading-[0.82] tracking-[0.02em] text-stone-100">
          VELO
        </FitText>
      </div>
      <p className="mx-auto mt-8 max-w-4xl text-center text-sm text-stone-600">{site.independence}</p>
    </footer>
  )
}
