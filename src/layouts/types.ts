import type { ReactNode } from 'react'
import type { Bike, Brand } from '../types'

export type BrandLayoutProps = {
  brand: Brand
  bikes: Bike[]
  groupTabs?: ReactNode
  activeGroupTabId?: string
}
