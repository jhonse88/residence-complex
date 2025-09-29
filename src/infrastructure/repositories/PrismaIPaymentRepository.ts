import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository'
import { Payment } from '../../domain/entities/Payment'
import { PrismaClient } from '@prisma/client'

export class PrismaIPaymentRepository implements IPaymentRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: number): Promise<Payment | null> {
    const payment = await this.prisma.pay.findUnique({
      where: { Id: id }
    })
    return payment ? Payment.fromPersistence(payment) : null
  }

  async findByContractId(contractId: number): Promise<Payment[]> {
    const payments = await this.prisma.pay.findMany({
      where: { IdContracts: contractId },
      orderBy: { PaymentDate: 'desc' }
    })
    return payments.map(payment => Payment.fromPersistence(payment))
  }

  async create(payment: Payment): Promise<Payment> {
    return await this.prisma.$transaction(async prisma => {
      const createdPayment = await prisma.pay.create({
        data: {
          PaymentDate: payment.paymentDate,
          Amount: payment.amount,
          PaymentMethod: payment.paymentMethod,
          IdContracts: payment.contractId
        }
      })

      await prisma.contracts.update({
        where: { Id: payment.contractId },
        data: { Debt: { decrement: payment.amount } }
      })

      return Payment.fromPersistence(createdPayment)
    })
  }

  async update(payment: Payment): Promise<Payment> {
    return await this.prisma.$transaction(async prisma => {
      const oldPayment = await prisma.pay.findUnique({
        where: { Id: payment.id }
      })

      const updatedPayment = await prisma.pay.update({
        where: { Id: payment.id },
        data: {
          PaymentDate: payment.paymentDate,
          Amount: payment.amount,
          PaymentMethod: payment.paymentMethod,
          IdContracts: payment.contractId
        }
      })

      if (oldPayment) {
        const difference = payment.amount - oldPayment.Amount
        await prisma.contracts.update({
          where: { Id: payment.contractId },
          data: { Debt: { decrement: difference } }
        })
      }

      return Payment.fromPersistence(updatedPayment)
    })
  }

  async delete(id: number): Promise<void> {
    await this.prisma.pay.delete({
      where: { Id: id }
    })
  }

  async countByContractId(contractId: number): Promise<number> {
    return await this.prisma.pay.count({
      where: { IdContracts: contractId }
    })
  }
}
