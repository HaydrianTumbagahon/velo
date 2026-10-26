import { lazy } from 'react'
import { Home } from './pages/Home'

export const routeChunks = {
  home: () => Promise.resolve({ default: Home }),
  brand: () => import('./pages/Brand'),
  model: () => import('./pages/Model'),
  bikes: () => import('./pages/Bikes'),
  compare: () => import('./pages/Compare'),
  guide: () => import('./pages/Guide'),
  about: () => import('./pages/About'),
  contact: () => import('./pages/Contact'),
  legal: () => import('./pages/Legal'),
  notFound: () => import('./pages/NotFound'),
}

export const routePages = {
  home: Home,
  brand: lazy(routeChunks.brand),
  model: lazy(routeChunks.model),
  bikes: lazy(routeChunks.bikes),
  compare: lazy(routeChunks.compare),
  guide: lazy(routeChunks.guide),
  about: lazy(routeChunks.about),
  contact: lazy(routeChunks.contact),
  legal: lazy(routeChunks.legal),
  notFound: lazy(routeChunks.notFound),
}

export const routes = [
  { path: '/', page: routePages.home, load: routeChunks.home },
  { path: '/brands/:brand/:slug', page: routePages.model, load: routeChunks.model },
  { path: '/brands/:brand', page: routePages.brand, load: routeChunks.brand },
  { path: '/bikes', page: routePages.bikes, load: routeChunks.bikes },
  { path: '/compare', page: routePages.compare, load: routeChunks.compare },
  { path: '/guide', page: routePages.guide, load: routeChunks.guide },
  { path: '/about', page: routePages.about, load: routeChunks.about },
  { path: '/contact', page: routePages.contact, load: routeChunks.contact },
  { path: '/legal/:doc', page: routePages.legal, load: routeChunks.legal },
] as const
