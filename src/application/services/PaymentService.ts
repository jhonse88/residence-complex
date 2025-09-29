import { PaymentRepository } from '../../domain/repositories/PaymentRepository'
import { CreatePaymentDto, UpdatePaymentDto, PaymentResponseDto } from '../dto/PaymentDto'

export class PaymentService {
  constructor(private paymentRepository: PaymentRepository) {}

  async getPayments(query: {
    contractId?: number
    currentId?: number
    direction?: string
    skip?: number
    take?: number
  }) {
    return await this.paymentRepository.findAll(query)
  }

  async createPayment(dto: CreatePaymentDto): Promise<PaymentResponseDto> {
    return await this.paymentRepository.create(dto)
  }

  async updatePayment(dto: UpdatePaymentDto): Promise<PaymentResponseDto> {
    return await this.paymentRepository.update(dto)
  }

  async deletePayment(id: number): Promise<void> {
    await this.paymentRepository.delete(id)
  }
}
