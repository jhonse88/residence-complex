import { PrismaClient } from '@prisma/client'
import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository'
import { Payment } from '../../domain/entities/Payment'

export class PrismaPaymentRepository implements IPaymentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: number): Promise<Payment | null> {
    const data = await this.prisma.pay.findUnique({
      where: { Id: id }
    })

    if (!data) return null

    return this.mapToEntity(data)
  }

  async findByContractId(contractId: number): Promise<Payment[]> {
    const data = await this.prisma.pay.findMany({
      where: { IdContracts: contractId },
      orderBy: { PaymentDate: 'desc' }
    })

    return data.map(payment => this.mapToEntity(payment))
  }

  async create(payment: Payment): Promise<Payment> {
    const data = await this.prisma.pay.create({
      data: {
        PaymentDate: payment.paymentDate,
        Amount: payment.amount,
        PaymentMethod: payment.paymentMethod,
        IdContracts: payment.contractId
      }
    })

    return this.mapToEntity(data)
  }

  async update(payment: Payment): Promise<Payment> {
    const data = await this.prisma.pay.update({
      where: { Id: payment.id },
      data: {
        PaymentDate: payment.paymentDate,
        Amount: payment.amount,
        PaymentMethod: payment.paymentMethod,
        IdContracts: payment.contractId
      }
    })

    return this.mapToEntity(data)
  }

  async delete(id: number): Promise<void> {
    await this.prisma.pay.delete({
      where: { Id: id }
    })
  }

  async countByContractId(contractId: number): Promise<number> {
    return this.prisma.pay.count({
      where: { IdContracts: contractId }
    })
  }

  private mapToEntity(data: any): Payment {
    return Payment.fromPersistence({
      Id: data.Id,
      PaymentDate: data.PaymentDate,
      Amount: data.Amount,
      PaymentMethod: data.PaymentMethod,
      IdContracts: data.IdContracts
    })
  }
}
