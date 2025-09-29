import { CreatePaymentDto, UpdatePaymentDto, PaymentResponseDto } from '../../application/dto/PaymentDto'

export interface PaymentQuery {
  contractId?: number
  currentId?: number
  direction?: string
  skip?: number
  take?: number
}

export interface PaymentRepository {
  findAll(query: PaymentQuery): Promise<{
    payments?: PaymentResponseDto[]
    count?: number
    currentPage?: number
    totalPages?: number
  } | PaymentResponseDto | null>
  create(dto: CreatePaymentDto): Promise<PaymentResponseDto>
  update(dto: UpdatePaymentDto): Promise<PaymentResponseDto>
  delete(id: number): Promise<void>
}
