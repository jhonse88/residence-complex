/* eslint-disable @typescript-eslint/ban-ts-comment */
import prisma from '@/app/lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'

// Interfaces para type safety
interface PaymentData {
  PaymentDate: Date | string
  Amount: number
  PaymentMethod: string
  IdContracts: number
}

interface PaymentQuery {
  contractId?: number
  currentId?: number
  direction?: string
  skip?: number
  take?: number
}

// Builder para transacciones de pago
class PaymentTransactionBuilder {
  private paymentData: Partial<PaymentData> = {}
  private oldPaymentId?: number
  private isUpdate: boolean = false

  constructor() {
    this.reset()
  }

  reset() {
    this.paymentData = {}
    this.oldPaymentId = undefined
    this.isUpdate = false
    return this
  }

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

  setOldPaymentId(id: number) {
    this.oldPaymentId = id
    this.isUpdate = true
    return this
  }

  async execute() {
    if (
      !this.paymentData.PaymentDate ||
      !this.paymentData.Amount ||
      !this.paymentData.PaymentMethod ||
      !this.paymentData.IdContracts
    ) {
      throw new Error('Faltan campos requeridos')
    }

    return await prisma.$transaction(async prisma => {
      if (this.isUpdate && this.oldPaymentId) {
        return this.executeUpdate(prisma)
      } else {
        return this.executeCreate(prisma)
      }
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async executeCreate(prisma: any) {
    const payment = await prisma.pay.create({
      data: {
        PaymentDate: new Date(this.paymentData.PaymentDate!),
        Amount: Number(this.paymentData.Amount),
        PaymentMethod: this.paymentData.PaymentMethod!,
        IdContracts: Number(this.paymentData.IdContracts)
      },
      include: { Contracts: true }
    })

    await prisma.contracts.update({
      where: { Id: Number(this.paymentData.IdContracts) },
      data: { Debt: { decrement: Number(this.paymentData.Amount) } }
    })

    return payment
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async executeUpdate(prisma: any) {
    const oldPayment = await prisma.pay.findUnique({
      where: { Id: this.oldPaymentId }
    })

    const payment = await prisma.pay.update({
      where: { Id: this.oldPaymentId },
      data: {
        PaymentDate: new Date(this.paymentData.PaymentDate!),
        Amount: Number(this.paymentData.Amount),
        PaymentMethod: this.paymentData.PaymentMethod!,
        IdContracts: Number(this.paymentData.IdContracts)
      },
      include: { Contracts: true }
    })

    if (oldPayment) {
      const difference = Number(this.paymentData.Amount) - oldPayment.Amount
      await prisma.contracts.update({
        where: { Id: Number(this.paymentData.IdContracts) },
        data: { Debt: { decrement: difference } }
      })
    }

    return payment
  }
}

// Capa de Servicio con Singleton
class PaymentService {
  private static instance: PaymentService
  private transactionBuilder: PaymentTransactionBuilder

  private constructor() {
    this.transactionBuilder = new PaymentTransactionBuilder()
  }

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService()
    }
    return PaymentService.instance
  }

  // GET - Obtener pagos
  async getPayments(query: PaymentQuery) {
    // Modo modal: navegación individual
    if (query.contractId && (query.currentId || query.direction === 'last')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let whereClause: any = { IdContracts: query.contractId }
      let orderBy = {}
      const take = 1

      if (query.direction === 'next' && query.currentId) {
        orderBy = { Id: 'asc' }
        whereClause = { ...whereClause, Id: { gt: query.currentId } }
      } else if (query.direction === 'prev' && query.currentId) {
        orderBy = { Id: 'desc' }
        whereClause = { ...whereClause, Id: { lt: query.currentId } }
      } else if (query.direction === 'last') {
        orderBy = { Id: 'desc' }
      }

      return await prisma.pay.findFirst({
        where: whereClause,
        orderBy,
        take,
        include: { Contracts: true }
      })
    }

    // Modo tabla: paginación tradicional
    const whereClause = query.contractId ? { IdContracts: query.contractId } : {}
    const skip = query.skip || 0
    const take = query.take || 10

    const [payments, totalCount] = await Promise.all([
      prisma.pay.findMany({
        skip,
        take,
        where: whereClause,
        orderBy: { PaymentDate: 'desc' },
        include: { Contracts: true }
      }),
      prisma.pay.count({ where: whereClause })
    ])

    return {
      payments,
      count: totalCount,
      currentPage: Math.floor(skip / take) + 1,
      totalPages: Math.ceil(totalCount / take)
    }
  }

  // POST - Crear pago usando Builder
  async createPayment(data: PaymentData) {
    return await this.transactionBuilder
      .reset()
      .setPaymentDate(data.PaymentDate)
      .setAmount(data.Amount)
      .setPaymentMethod(data.PaymentMethod)
      .setContractId(data.IdContracts)
      .execute()
  }

  // PUT - Actualizar pago usando Builder
  async updatePayment(id: number, data: PaymentData) {
    return await this.transactionBuilder
      .reset()
      .setOldPaymentId(id)
      .setPaymentDate(data.PaymentDate)
      .setAmount(data.Amount)
      .setPaymentMethod(data.PaymentMethod)
      .setContractId(data.IdContracts)
      .execute()
  }

  // DELETE - Eliminar pago
  async deletePayment(id: number) {
    return await prisma.pay.delete({
      where: { Id: id }
    })
  }
}

// Instancia Singleton del servicio
const paymentService = PaymentService.getInstance()

// Capa de Controlador
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        await handleGet(req, res)
        break
      case 'POST':
        await handlePost(req, res)
        break
      case 'PUT':
        await handlePut(req, res)
        break
      case 'DELETE':
        await handleDelete(req, res)
        break
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
        res.status(405).end(`Method ${req.method} Not Allowed`)
    }
  } catch (error) {
    console.error('Error in payment handler:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// Handlers específicos
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { contractId, currentId, direction, skip, take } = req.query

  const result = await paymentService.getPayments({
    contractId: contractId ? Number(contractId) : undefined,
    currentId: currentId ? Number(currentId) : undefined,
    direction: direction as string,
    skip: skip ? Number(skip) : undefined,
    take: take ? Number(take) : undefined
  })

  res.status(200).json(result)
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { PaymentDate, Amount, PaymentMethod, IdContracts } = req.body

  if (!PaymentDate || !Amount || !PaymentMethod || !IdContracts) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }

  const payment = await paymentService.createPayment({
    PaymentDate,
    Amount: Number(Amount),
    PaymentMethod,
    IdContracts: Number(IdContracts)
  })

  res.status(201).json(payment)
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { Id, PaymentDate, Amount, PaymentMethod, IdContracts } = req.body

  if (!Id) return res.status(400).json({ error: 'ID es requerido' })

  const payment = await paymentService.updatePayment(Number(Id), {
    PaymentDate,
    Amount: Number(Amount),
    PaymentMethod,
    IdContracts: Number(IdContracts)
  })

  res.status(200).json(payment)
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { Id } = req.query
  const paymentId = typeof Id === 'string' ? parseInt(Id) : Array.isArray(Id) ? parseInt(Id[0]) : Number(Id)

  if (!paymentId) return res.status(400).json({ error: 'ID es requerido' })

  const payment = await paymentService.deletePayment(paymentId)
  res.status(200).json(payment)
}
