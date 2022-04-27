import { Product } from "./product"

export type Purchase = {
  locale: string
  date: string
  totalValue: string
  products?: Product[]
}
