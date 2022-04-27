/* eslint-disable import/no-anonymous-default-export */
import { Document, ObjectId, WithId } from 'mongodb'
import type { NextApiRequest, NextApiResponse } from 'next'
import { connectToDatabase } from '../../../services/mongodb'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'GET': {
      return getProducts(req, res)
    }

    case 'POST': {
      return addProduct(req, res)
    }

    case 'PUT': {
      return updateProduct(req, res)
    }

    case 'DELETE': {
      return deleteProduct(req, res)
    }
  }
}

type GetProductsResponse = {
  data?: WithId<Document>[]
  message?: string
}

async function getProducts(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { db } = await connectToDatabase()

    const query = { deletedAt: null }
    const products = await db.collection('products').find(query).sort({ createdAt: 1 }).toArray()

    return res.status(200).json(products)
  } catch (error) {
    return res.status(400).json({ message: new Error(error).message })
  }
}

async function addProduct(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { db } = await connectToDatabase()

    const ts = Math.floor(Date.now() / 1000)
    const data = { ...req.body, createdAt: ts, updatedAt: ts, deletedAt: null }

    await db.collection('products').insertOne(data)

    return res.status(201).json({ data })
  } catch (error) {
    return res.status(400).json({ message: new Error(error).message })
  }
}

async function updateProduct(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!req.query.id) {
      throw new Error('id not found')
    }

    const { db } = await connectToDatabase()

    const ts = Math.floor(Date.now() / 1000)
    const id = req.query.id[0]

    await db.collection('products').updateOne(
      {
        _id: new ObjectId(id),
      },
      { $set: { updatedAt: ts } }
    )

    return res.status(200).json({ message: 'Product updated successfully' })
  } catch (error) {
    return res.status(400).json({ message: new Error(error).message })
  }
}

async function deleteProduct(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!req.query.id) {
      throw new Error('id not found')
    }

    let { db } = await connectToDatabase()

    const ts = Math.floor(Date.now() / 1000)
    const id = req.query.id[0]

    await db.collection('products').updateOne(
      {
        _id: new ObjectId(id),
      },
      { $set: { deletedAt: ts } }
    )

    return res.status(200).json({ message: 'Product deleted successfully' })
  } catch (error) {
    return res.status(400).json({ message: new Error(error).message })
  }
}
