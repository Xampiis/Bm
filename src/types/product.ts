export type Product = {
  _id?: string
  code: string
  name: string
  color: string
  quantity: number
  size: string
  purchaseValue: number | string
  saleValue: number | string
  createdAt?: number
  updatedAt?: number
  deletedAt?: number
}
