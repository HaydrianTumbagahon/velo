import { useState, type FormEvent } from 'react'
import site from '../data/site.json'
import { publishedBikes, brands } from '../lib/data'
import { Seo } from '../components/Seo'
import { FitText } from '../components/FitText'
import copy from '../data/copy.json'
import { Button } from '../components/Button'

const subjects = ['Correction', 'Brand partnership', 'Press', 'Other'] as const

function initialBike(): string {
  const params = new URLSearchParams(window.location.search)
  const requested = params.get('bike')
  return requested && publishedBikes.some((bike) => `${bike.brand}/${bike.slug}` === requested) ? requested : ''
}

export default function ContactPage() {
  const [status, setStatus] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    if (!form.reportValidity()) return
    const data = new FormData(form)
    if (String(data.get('website') ?? '').trim()) {
      setStatus(copy.contact.success)
      form.reset()
      return
    }

    const payload = Object.fromEntries(data.entries())
    const endpoint = import.meta.env.VITE_FORM_ENDPOINT
    if (!endpoint) {
      const mailSubject = encodeURIComponent(String(data.get('subject') ?? 'Message for Velo'))
      const body = encodeURIComponent(
        [
          `Name: ${String(data.get('name') ?? '')}`,
          `Email: ${String(data.get('email') ?? '')}`,
          `Bike: ${String(data.get('bike') ?? 'Not selected')}`,
          '',
          String(data.get('message') ?? ''),
        ].join('\n'),
      )
      window.location.href = `mailto:${site.company.email}?subject=${mailSubject}&body=${body}`
      setStatus('Your email app should open with the message ready to send.')
      return
    }

    setSending(true)
    setStatus('')
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error(`Form endpoint returned ${response.status}`)
      setStatus(copy.contact.success)
      form.reset()
    } catch (error) {
      console.error('Contact form submission failed', error)
      setStatus('The message could not be sent. Please try again or email Velo directly.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Seo title={`${copy.contact.title} — Velo`} description={copy.meta.contact} />
      <section className="min-h-svh px-6 pb-24 pt-36 text-fg md:px-12">
        <FitText as="h1" className="max-w-5xl font-brand t-display-xl">{copy.contact.title}</FitText>
        <form onSubmit={submit} className="mt-12 grid max-w-3xl gap-6">
          <div className="grid gap-2">
            <label htmlFor="contact-name">Name</label>
            <input id="contact-name" name="name" autoComplete="name" required className="min-h-12 border-b border-stone-300 bg-transparent px-2" />
          </div>
          <div className="grid gap-2">
            <label htmlFor="contact-email">Email</label>
            <input id="contact-email" name="email" type="email" autoComplete="email" required className="min-h-12 border-b border-stone-300 bg-transparent px-2" />
          </div>
          <div className="grid gap-2">
            <label htmlFor="contact-subject">Subject</label>
            <select id="contact-subject" name="subject" required defaultValue={subjects[0]} className="min-h-12 border-b border-stone-300 bg-transparent px-2">
              {subjects.map((subject) => <option key={subject}>{subject}</option>)}
            </select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="contact-bike">Bike <span className="text-sm text-stone-600">(optional)</span></label>
            <select id="contact-bike" name="bike" defaultValue={initialBike()} className="min-h-12 border-b border-stone-300 bg-transparent px-2">
              <option value="">No bike selected</option>
              {publishedBikes.map((bike) => {
                const brandName = brands.find((brand) => brand.slug === bike.brand)?.name ?? bike.brand
                return <option key={`${bike.brand}/${bike.slug}`} value={`${bike.brand}/${bike.slug}`}>{brandName} — {bike.name}</option>
              })}
            </select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="contact-message">Message</label>
            <textarea id="contact-message" name="message" rows={6} required className="resize-y border-b border-stone-300 bg-transparent p-2" />
          </div>
          <div className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
            <label htmlFor="contact-website">Leave this field empty</label>
            <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
          <Button type="submit" variant="solid" disabled={sending} className="w-fit">
            {sending ? 'Sending…' : copy.contact.submit}
          </Button>
          <p role="status" aria-live="polite" className="min-h-6 text-sm text-stone-600">{status}</p>
        </form>
      </section>
    </>
  )
}
