import prisma from '@/app/lib/prisma'
import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'

// Interfaces para type safety
interface PaymentData {
  PaymentDate: Date | string
  Amount: number
  PaymentMethod: string
  IdContracts: number
}

// Builder para construir PaymentData
class PaymentBuilder {
  private paymentData: Partial<PaymentData> = {}

  setPaymentDate(date: Date | string) {
    this.paymentData.PaymentDate = date
    return this
  }

  setAmount(amount: number) {
    this.paymentData.Amount = amount
    return this
  }

  setPaymentMethod(method: string) {
    this.paymentData.PaymentMethod = method
    return this
  }

  setContractId(contractId: number) {
    this.paymentData.IdContracts = contractId
    return this
  }

  build(): PaymentData {
    if (
      !this.paymentData.PaymentDate ||
      !this.paymentData.Amount ||
      !this.paymentData.PaymentMethod ||
      !this.paymentData.IdContracts
    ) {
      throw new Error('Faltan campos requeridos')
    }

    return {
      PaymentDate: new Date(this.paymentData.PaymentDate),
      Amount: Number(this.paymentData.Amount),
      PaymentMethod: this.paymentData.PaymentMethod,
      IdContracts: Number(this.paymentData.IdContracts)
    }
  }
}

// Servicio de pagos (sin Singleton)
class PaymentService {
  constructor(private prisma: PrismaClient) {}

  async getPayments(contractId?: number, skip = 0, take = 10) {
    const whereClause = contractId ? { IdContracts: contractId } : {}

    const [payments, totalCount] = await Promise.all([
      this.prisma.pay.findMany({
        skip,
        take,
        where: whereClause,
        orderBy: { PaymentDate: 'desc' },
        include: { Contracts: true }
      }),
      this.prisma.pay.count({ where: whereClause })
    ])

    return {
      payments,
      count: totalCount,
      currentPage: Math.floor(skip / take) + 1,
      totalPages: Math.ceil(totalCount / take)
    }
  }

  async createPayment(data: PaymentData) {
    return this.prisma.$transaction(async tx => {
      const payment = await tx.pay.create({
        data,
        include: { Contracts: true }
      })

      await tx.contracts.update({
        where: { Id: data.IdContracts },
        data: { Debt: { decrement: data.Amount } }
      })

      return payment
    })
  }

  async updatePayment(id: number, data: PaymentData) {
    return this.prisma.$transaction(async tx => {
      const oldPayment = await tx.pay.findUnique({ where: { Id: id } })

      const updated = await tx.pay.update({
        where: { Id: id },
        data,
        include: { Contracts: true }
      })

      if (oldPayment) {
        const difference = data.Amount - oldPayment.Amount
        await tx.contracts.update({
          where: { Id: data.IdContracts },
          data: { Debt: { decrement: difference } }
        })
      }

      return updated
    })
  }

  async deletePayment(id: number) {
    return this.prisma.pay.delete({ where: { Id: id } })
  }
}

// Instancia del servicio (sin Singleton)
const paymentService = new PaymentService(prisma)

// Capa de Controlador
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET': {
        const { contractId, skip, take } = req.query
        const result = await paymentService.getPayments(
          contractId ? Number(contractId) : undefined,
          skip ? Number(skip) : 0,
          take ? Number(take) : 10
        )
        return res.status(200).json(result)
      }

      case 'POST': {
        const builder = new PaymentBuilder()
          .setPaymentDate(req.body.PaymentDate)
          .setAmount(req.body.Amount)
          .setPaymentMethod(req.body.PaymentMethod)
          .setContractId(req.body.IdContracts)

        const payment = await paymentService.createPayment(builder.build())
        return res.status(201).json(payment)
      }

      case 'PUT': {
        const { Id } = req.body
        if (!Id) return res.status(400).json({ error: 'ID es requerido' })

        const builder = new PaymentBuilder()
          .setPaymentDate(req.body.PaymentDate)
          .setAmount(req.body.Amount)
          .setPaymentMethod(req.body.PaymentMethod)
          .setContractId(req.body.IdContracts)

        const payment = await paymentService.updatePayment(Number(Id), builder.build())
        return res.status(200).json(payment)
      }

      case 'DELETE': {
        const { Id } = req.query
        const paymentId = Number(Array.isArray(Id) ? Id[0] : Id)
        if (!paymentId) return res.status(400).json({ error: 'ID es requerido' })

        const deleted = await paymentService.deletePayment(paymentId)
        return res.status(200).json(deleted)
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }
  } catch (error) {
    console.error('Error en payment handler:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
