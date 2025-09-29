import { Payment } from '../entities/Payment'

export interface IPaymentRepository {
  findById(id: number): Promise<Payment | null>
  findByContractId(contractId: number): Promise<Payment[]>
  create(payment: Payment): Promise<Payment>
  update(payment: Payment): Promise<Payment>
  delete(id: number): Promise<void>
  countByContractId(contractId: number): Promise<number>
}
