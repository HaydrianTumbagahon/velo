import { useEffect } from 'react'
import { loadBrandFont } from '../lib/brandFonts'
import type { Brand } from '../types'

const defaults = {
  '--bg': '#F6F5F2',
  '--ink': '#0E0E0E',
  '--accent': '#B8975A',
  '--font-display': "'Bodoni Moda Variable', serif",
}

export function useBrandTheme(brand: Brand | null): void {
  useEffect(() => {
    const root = document.documentElement
    const properties = Object.keys(defaults)
    const previous = new Map(properties.map((property) => [property, root.style.getPropertyValue(property)]))
    const previousLayout = root.getAttribute('data-layout')
    const previousBrand = root.getAttribute('data-brand')
    let active = true

    const restore = () => {
      previous.forEach((value, property) => {
        if (value) root.style.setProperty(property, value)
        else root.style.removeProperty(property)
      })
      if (previousLayout) root.setAttribute('data-layout', previousLayout)
      else root.removeAttribute('data-layout')
      if (previousBrand) root.setAttribute('data-brand', previousBrand)
      else root.removeAttribute('data-brand')
    }

    if (!brand) {
      Object.entries(defaults).forEach(([property, value]) => root.style.setProperty(property, value))
      root.removeAttribute('data-layout')
      return restore
    }

    root.style.setProperty('--bg', brand.theme.bg)
    root.style.setProperty('--ink', brand.theme.ink)
    root.style.setProperty('--accent', brand.theme.accent)
    root.dataset.layout = brand.layout
    root.dataset.brand = brand.slug
    void loadBrandFont(brand.theme.font).then((family) => {
      if (active) root.style.setProperty('--font-display', `'${family}', sans-serif`)
    })

    return () => {
      active = false
      restore()
    }
  }, [brand])
}
