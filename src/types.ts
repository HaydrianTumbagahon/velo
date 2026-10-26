import bikes from './data/bikes.json'
import brands from './data/brands.json'

export type Brand = (typeof brands)[number]
export type Bike = (typeof bikes)[number]
