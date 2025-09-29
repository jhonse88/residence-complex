import { PaymentRepository } from '../../domain/repositories/PaymentRepository'
import { CreatePaymentDto, UpdatePaymentDto, PaymentResponseDto } from '../dto/PaymentDto'

// Interface Builder para pagos
interface PaymentBuilder {
  reset(): PaymentBuilder
  setPaymentDate(date: Date | string): PaymentBuilder
  setAmount(amount: number): PaymentBuilder
  setPaymentMethod(method: string): PaymentBuilder
  setContractId(contractId: number): PaymentBuilder
  setOldPaymentId(id: number): PaymentBuilder
  execute(): Promise<PaymentResponseDto>
}

// Builder para transacciones de pago
class PaymentTransactionBuilder implements PaymentBuilder {
  protected paymentData: Partial<CreatePaymentDto> = {}
  protected oldPaymentId?: number
  protected isUpdate: boolean = false
  protected paymentRepository: PaymentRepository

  constructor(paymentRepository: PaymentRepository) {
    this.paymentRepository = paymentRepository
    this.reset()
  }

  reset(): PaymentTransactionBuilder {
    this.paymentData = {}
    this.oldPaymentId = undefined
    this.isUpdate = false
    return this
  }

  setPaymentDate(date: Date | string): PaymentTransactionBuilder {
    this.paymentData.paymentDate = date
    return this
  }

  setAmount(amount: number): PaymentTransactionBuilder {
    this.paymentData.amount = amount
    return this
  }

  setPaymentMethod(method: string): PaymentTransactionBuilder {
    this.paymentData.paymentMethod = method
    return this
  }

  setContractId(contractId: number): PaymentTransactionBuilder {
    this.paymentData.contractId = contractId
    return this
  }

  setOldPaymentId(id: number): PaymentTransactionBuilder {
    this.oldPaymentId = id
    this.isUpdate = true
    return this
  }

  async execute(): Promise<PaymentResponseDto> {
    if (
      !this.paymentData.paymentDate ||
      !this.paymentData.amount ||
      !this.paymentData.paymentMethod ||
      !this.paymentData.contractId
    ) {
      throw new Error('Faltan campos requeridos')
    }

    if (this.isUpdate && this.oldPaymentId) {
      const updateDto: UpdatePaymentDto = {
        id: this.oldPaymentId,
        paymentDate: this.paymentData.paymentDate,
        amount: this.paymentData.amount,
        paymentMethod: this.paymentData.paymentMethod,
        contractId: this.paymentData.contractId
      }
      return await this.paymentRepository.update(updateDto)
    } else {
      const createDto: CreatePaymentDto = {
        paymentDate: this.paymentData.paymentDate,
        amount: this.paymentData.amount,
        paymentMethod: this.paymentData.paymentMethod,
        contractId: this.paymentData.contractId
      }
      return await this.paymentRepository.create(createDto)
    }
  }
}

// Director para orquestar la construcción de pagos
class PaymentDirector {
  private builder: PaymentBuilder

  constructor(builder: PaymentBuilder) {
    this.builder = builder
  }

  public changeBuilder(builder: PaymentBuilder): void {
    this.builder = builder
  }

  // Construye un nuevo pago
  public makePayment(data: CreatePaymentDto): Promise<PaymentResponseDto> {
    return this.builder
      .reset()
      .setPaymentDate(data.paymentDate)
      .setAmount(data.amount)
      .setPaymentMethod(data.paymentMethod)
      .setContractId(data.contractId)
      .execute()
  }

  // Construye una actualización de pago
  public updatePayment(id: number, data: CreatePaymentDto): Promise<PaymentResponseDto> {
    return this.builder
      .reset()
      .setOldPaymentId(id)
      .setPaymentDate(data.paymentDate)
      .setAmount(data.amount)
      .setPaymentMethod(data.paymentMethod)
      .setContractId(data.contractId)
      .execute()
  }
}

// Servicio con patrón Singleton que usa Builder y Director
export class PaymentBuilderService {
  private static instance: PaymentBuilderService
  private transactionBuilder: PaymentBuilder
  private paymentDirector: PaymentDirector

  private constructor(paymentRepository: PaymentRepository) {
    this.transactionBuilder = new PaymentTransactionBuilder(paymentRepository)
    this.paymentDirector = new PaymentDirector(this.transactionBuilder)
  }

  public static getInstance(paymentRepository: PaymentRepository): PaymentBuilderService {
    if (!PaymentBuilderService.instance) {
      PaymentBuilderService.instance = new PaymentBuilderService(paymentRepository)
    }
    return PaymentBuilderService.instance
  }

  // POST - Crear pago usando Director
  async createPayment(data: CreatePaymentDto): Promise<PaymentResponseDto> {
    return await this.paymentDirector.makePayment(data)
  }

  // PUT - Actualizar pago usando Director
  async updatePayment(id: number, data: CreatePaymentDto): Promise<PaymentResponseDto> {
    return await this.paymentDirector.updatePayment(id, data)
  }

  // Método para obtener el builder directamente si se necesita más control
  getBuilder(): PaymentBuilder {
    return this.transactionBuilder
  }

  // Método para obtener el director directamente
  getDirector(): PaymentDirector {
    return this.paymentDirector
  }
}
