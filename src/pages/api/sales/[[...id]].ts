/* eslint-disable import/no-anonymous-default-export */
import { Document, ObjectId, WithId } from 'mongodb'
import type { NextApiRequest, NextApiResponse } from 'next'
import { connectToDatabase } from '../../../services/mongodb'
import { Product } from '../../../types/product'
import { Sale } from '../../sales'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'GET': {
      return getSales(req, res)
    }

    case 'POST': {
      return addSale(req, res)
    }

    case 'PUT': {
      // feat: updateSale(req, res)
      return res.status(405).json({ message: 'PUT: Method Not Allowed' })
    }

    case 'DELETE': {
      // feat: deleteSale(req, res)
      return res.status(405).json({ message: 'DELETE: Method Not Allowed' })
    }
  }
}

type GetSalesResponse = {
  data?: SaleDb[]
  message?: string
}

export type SaleDb = Sale & {
  productsSale: ProductSale[]
  createdAt: number
  updatedAt: number
  deletedAt: number | null
  // products?: Product[]
}

type ProductSale = {
  id: string
  unitPrice: number
  quantity: number
  product?: Product
}

async function getSales(req: NextApiRequest, res: NextApiResponse<GetSalesResponse>) {
  try {
    const { db } = await connectToDatabase()

    const query = { deletedAt: null }
    const salesDb = await db.collection<SaleDb>('sales').find(query).sort({ createdAt: 1 }).toArray()

    const sales = await Promise.all(
      salesDb.map(async sale => {
        // @ts-ignore
        const productsId: string[] = sale.productsSale.map(productSale => new ObjectId(productSale))

        const products = await db
          .collection<Product>('products')
          .find({ _id: { $in: productsId } })
          .sort({ createdAt: 1 })
          .toArray()

        const productsSale = sale.productsSale.map(productSale => {
          const product = products.find(product => String(product._id).includes(productSale.id))

          return { ...productSale, product }
        })

        return { ...sale, productsSale }
      })
    )

    return res.status(200).json({ data: sales })
  } catch (error) {
    return res.status(400).json({ message: new Error(error).message })
  }
}

async function addSale(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { db } = await connectToDatabase()

    const ts = Math.floor(Date.now() / 1000)
    const data = { ...req.body, createdAt: ts, updatedAt: ts, deletedAt: null }

    await db.collection('sales').insertOne(data)

    return res.status(201).json({ data })
  } catch (error) {
    return res.status(400).json({ message: new Error(error).message })
  }
}

// async function updateSale(req: NextApiRequest, res: NextApiResponse) {
//   try {
//     if (!req.query.id) {
//       throw new Error('id not found')
//     }

//     const { db } = await connectToDatabase()

//     const ts = Math.floor(Date.now() / 1000)
//     const id = req.query.id[0]

//     await db.collection('sales').updateOne(
//       {
//         _id: new ObjectId(id),
//       },
//       { $set: { updatedAt: ts } }
//     )

//     return res.status(200).json({ message: 'Sale updated successfully' })
//   } catch (error) {
//     return res.status(400).json({ message: new Error(error).message })
//   }
// }

// async function deleteSale(req: NextApiRequest, res: NextApiResponse) {
//   try {
//     if (!req.query.id) {
//       throw new Error('id not found')
//     }

//     let { db } = await connectToDatabase()

//     const ts = Math.floor(Date.now() / 1000)
//     const id = req.query.id[0]

//     await db.collection('sales').updateOne(
//       {
//         _id: new ObjectId(id),
//       },
//       { $set: { deletedAt: ts } }
//     )

//     return res.status(200).json({ message: 'Sale deleted successfully' })
//   } catch (error) {
//     return res.status(400).json({ message: new Error(error).message })
//   }
// }
