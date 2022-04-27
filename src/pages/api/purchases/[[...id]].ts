/* eslint-disable import/no-anonymous-default-export */
import { Document, ObjectId, OptionalId, WithId } from 'mongodb'
import type { NextApiRequest, NextApiResponse } from 'next'
import { connectToDatabase } from '../../../services/mongodb'
import { Product } from '../../../types/product'
import { Purchase } from '../../../types/purchase'
import { Sale } from '../../sales'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'GET': {
      return getPurchases(req, res)
    }

    case 'POST': {
      return addPurchase(req, res)
    }

    case 'PUT': {
      // feat: updatePurchase(req, res)
      return res.status(405).json({ message: 'PUT: Method Not Allowed' })
    }

    case 'DELETE': {
      // feat: deletePurchase(req, res)
      return res.status(405).json({ message: 'DELETE: Method Not Allowed' })
    }
  }
}

type GetPurchaseResponse = {
  data?: PurchaseDb[]
  message?: string
}

export type PurchaseDb = Purchase & {
  productsPurchase: ProductPurchase[]
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

type ProductPurchase = {
  id: string
  unitPrice: number
  quantity: number
  product?: Product
}

async function getPurchases(req: NextApiRequest, res: NextApiResponse<GetPurchaseResponse>) {
  try {
    const { db } = await connectToDatabase()

    const query = { deletedAt: null }
    const purchasesDb = await db.collection<PurchaseDb>('purchases').find(query).sort({ createdAt: 1 }).toArray()

    const purchases = await Promise.all(
      purchasesDb.map(async purchase => {
        // @ts-ignore
        const productsId: string[] = purchase.productsPurchase.map(productPurchase => new ObjectId(productPurchase.id))

        const products = await db
          .collection<Product>('products')
          .find({ _id: { $in: productsId } })
          .sort({ createdAt: 1 })
          .toArray()

        const productsPurchase = purchase.productsPurchase.map(productPurchase => {
          const product = products.find(product => String(product._id).includes(productPurchase.id))

          return { ...productPurchase, product }
        })

        return { ...purchase, productsPurchase }
      })
    )

    return res.status(200).json({ data: purchases })
  } catch (error) {
    return res.status(400).json({ message: new Error(error).message })
  }
}

async function addPurchase(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { db } = await connectToDatabase()

    const purchase = {
      locale: req.body.locale,
      date: req.body.date,
      totalValue: req.body.totalValue,
    }

    const products: Product[] = req.body.products
    const ts = Math.floor(Date.now() / 1000)

    const productsPurchase = await Promise.all(
      products.map(async product => {
        const mongoId = new ObjectId()
        const data: OptionalId<Document> = { ...product, _id: mongoId, createdAt: ts, updatedAt: ts, deletedAt: null }

        await db.collection('products').insertOne(data)

        return { id: mongoId.toHexString(), unitPrice: product.purchaseValue, quantity: product.quantity }
      })
    )

    const data = { ...purchase, productsPurchase, createdAt: ts, updatedAt: ts, deletedAt: null }

    await db.collection('purchases').insertOne(data)

    return res.status(201).json({ data })
  } catch (error) {
    return res.status(400).json({ message: new Error(error).message })
  }
}

// async function updatePurchase(req: NextApiRequest, res: NextApiResponse) {
//   try {
//     if (!req.query.id) {
//       throw new Error('id not found')
//     }

//     const { db } = await connectToDatabase()

//     const ts = Math.floor(Date.now() / 1000)
//     const id = req.query.id[0]

//     await db.collection('purchases').updateOne(
//       {
//         _id: new ObjectId(id),
//       },
//       { $set: { updatedAt: ts } }
//     )

//     return res.status(200).json({ message: 'Purchase updated successfully' })
//   } catch (error) {
//     return res.status(400).json({ message: new Error(error).message })
//   }
// }

// async function deletePurchase(req: NextApiRequest, res: NextApiResponse) {
//   try {
//     if (!req.query.id) {
//       throw new Error('id not found')
//     }

//     let { db } = await connectToDatabase()

//     const ts = Math.floor(Date.now() / 1000)
//     const id = req.query.id[0]

//     await db.collection('purchases').updateOne(
//       {
//         _id: new ObjectId(id),
//       },
//       { $set: { deletedAt: ts } }
//     )

//     return res.status(200).json({ message: 'Purchase deleted successfully' })
//   } catch (error) {
//     return res.status(400).json({ message: new Error(error).message })
//   }
// }
