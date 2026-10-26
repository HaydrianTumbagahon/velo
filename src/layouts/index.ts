import { lazy } from 'react'
import type { ComponentType, LazyExoticComponent } from 'react'
import type { BrandLayoutProps } from './types'

export const layouts: Record<string, LazyExoticComponent<ComponentType<BrandLayoutProps>>> = {
  cinema: lazy(() => import('./Cinema')),
  split: lazy(() => import('./Split')),
  blueprint: lazy(() => import('./Blueprint')),
  editorial: lazy(() => import('./Editorial')),
}
