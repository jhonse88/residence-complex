import { PaymentRepository, PaymentQuery } from '../../domain/repositories/PaymentRepository'
import { CreatePaymentDto, UpdatePaymentDto, PaymentResponseDto } from '../../application/dto/PaymentDto'
import { PrismaClient } from '@prisma/client'

export class PrismaPaymentRepository implements PaymentRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(query: PaymentQuery) {
    // Modo modal: navegación individual
    if (query.contractId && (query.currentId || query.direction === 'last')) {
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

      const payment = await this.prisma.pay.findFirst({
        where: whereClause,
        orderBy,
        take,
        include: { Contracts: true }
      })

      return payment ? this.mapToResponseDto(payment) : null
    }

    // Modo tabla: paginación tradicional
    const whereClause = query.contractId ? { IdContracts: query.contractId } : {}
    const skip = query.skip || 0
    const take = query.take || 10

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
      payments: payments.map(payment => this.mapToResponseDto(payment)),
      count: totalCount,
      currentPage: Math.floor(skip / take) + 1,
      totalPages: Math.ceil(totalCount / take)
    }
  }

  async create(dto: CreatePaymentDto): Promise<PaymentResponseDto> {
    return await this.prisma.$transaction(async prisma => {
      const payment = await prisma.pay.create({
        data: {
          PaymentDate: new Date(dto.paymentDate),
          Amount: Number(dto.amount),
          PaymentMethod: dto.paymentMethod,
          IdContracts: Number(dto.contractId)
        },
        include: { Contracts: true }
      })

      await prisma.contracts.update({
        where: { Id: Number(dto.contractId) },
        data: { Debt: { decrement: Number(dto.amount) } }
      })

      return this.mapToResponseDto(payment)
    })
  }

  async update(dto: UpdatePaymentDto): Promise<PaymentResponseDto> {
    return await this.prisma.$transaction(async prisma => {
      const oldPayment = await prisma.pay.findUnique({
        where: { Id: dto.id }
      })

      const payment = await prisma.pay.update({
        where: { Id: dto.id },
        data: {
          PaymentDate: new Date(dto.paymentDate),
          Amount: Number(dto.amount),
          PaymentMethod: dto.paymentMethod,
          IdContracts: Number(dto.contractId)
        },
        include: { Contracts: true }
      })

      if (oldPayment) {
        const difference = Number(dto.amount) - oldPayment.Amount
        await prisma.contracts.update({
          where: { Id: Number(dto.contractId) },
          data: { Debt: { decrement: difference } }
        })
      }

      return this.mapToResponseDto(payment)
    })
  }

  async delete(id: number): Promise<void> {
    await this.prisma.pay.delete({
      where: { Id: id }
    })
  }

  private mapToResponseDto(payment: any): PaymentResponseDto {
    return {
      id: payment.Id,
      paymentDate: payment.PaymentDate,
      amount: payment.Amount,
      paymentMethod: payment.PaymentMethod,
      contractId: payment.IdContracts
    }
  }
}
