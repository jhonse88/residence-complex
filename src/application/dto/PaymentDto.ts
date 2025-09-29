export interface CreatePaymentDto {
  paymentDate: Date | string
  amount: number
  paymentMethod: string
  contractId: number
}

export interface UpdatePaymentDto {
  id: number
  paymentDate: Date | string
  amount: number
  paymentMethod: string
  contractId: number
}

export interface PaymentResponseDto {
  id: number
  paymentDate: Date | string
  amount: number
  paymentMethod: string
  contractId: number
}
