// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
/* eslint-disable import/no-anonymous-default-export */
import type { NextApiRequest, NextApiResponse } from 'next'
import { DashboardChart } from '../..'
import { connectToDatabase } from '../../../services/mongodb'
import { trimObject } from '../../../utils/misc'
import { PurchaseDb } from '../purchases/[[...id]]'
import { SaleDb } from '../sales/[[...id]]'

type Data = {
  name: string
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'GET': {
      return getDashboardData(req, res)
    }

    default: {
      return res.status(405).json({ message: 'Method Not Allowed' })
    }
  }
}

type getDashboardDataResponse = DashboardChart[] | string

async function getDashboardData(req: NextApiRequest, res: NextApiResponse<getDashboardDataResponse>) {
  try {
    const { db } = await connectToDatabase()

    const date = new Date()
    const mounth = date.getMonth() + 1
    const year = date.getFullYear()
    const [today] = date.toISOString().split('T')
    const firstDayOfMounth = `${year}-${mounth < 10 ? `0${mounth}` : mounth}-01`

    const getTs = (date: string) => {
      const ts = new Date(date)?.valueOf()

      return ts ? Math.floor(ts / 1000) : null
    }

    const initalDate = getTs((req?.query?.initalDate as string) ?? firstDayOfMounth)
    const lastDate = getTs((req.query.lastDate as string) ?? today)

    const query = {
      deletedAt: null,
      createdAt:
        initalDate || lastDate
          ? trimObject({ $gte: initalDate, $lt: lastDate }, [undefined, null, '', NaN])
          : undefined,
    }

    const purchases = await db
      .collection<PurchaseDb>('purchases')
      .find(trimObject(query, [undefined, '']))
      .sort({ createdAt: 1 })
      .toArray()
    const sales = await db
      .collection<SaleDb>('sales')
      .find(trimObject(query, [undefined, '']))
      .sort({ createdAt: 1 })
      .toArray()

    const daysSet = new Set<string>()

    const dayFromTs = (timestamp: number) =>
      new Date(timestamp * 1000).toLocaleDateString('pt-BR').replace(/\/\d{4}/g, '')

    purchases.forEach(purchase => {
      const date = dayFromTs(purchase.createdAt)
      !daysSet.has(date) ? daysSet.add(date) : null
    })

    sales.forEach(sale => {
      const date = dayFromTs(sale.createdAt)
      !daysSet.has(date) ? daysSet.add(date) : null
    })

    const days = Array.from(daysSet)

    const data: DashboardChart[] = days.map(day => {
      const purchasesDay = purchases.filter(purchase => dayFromTs(purchase.createdAt) === day)
      const salesDay = sales.filter(sale => dayFromTs(sale.createdAt) === day)

      const totalPurchases = purchasesDay.reduce((acc, purchase) => acc + Number(purchase.totalValue), 0)
      const totalSales = salesDay.reduce((acc, sale) => acc + Number(sale.totalValue), 0)

      const toFixedNumber = (number: number) => Number(number.toFixed(2))

      return {
        dia: day,
        compras: toFixedNumber(totalPurchases),
        vendas: toFixedNumber(totalSales),
        faturamento: toFixedNumber(totalSales - totalPurchases),
      }
    })

    return res.status(200).json(data)
  } catch (error) {
    const message = new Error(error).message
    return res.status(400).json(message)
  }
}
