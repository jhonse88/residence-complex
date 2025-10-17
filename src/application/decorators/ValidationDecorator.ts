/**
 * Decorador para validación de datos
 * Valida los datos de entrada antes de procesarlos
 */
import { IServiceDecorator, BaseServiceDecorator } from './IServiceDecorator'

export class ValidationDecorator<T> extends BaseServiceDecorator<T> {
  private validators: Map<string, (data: any) => void> = new Map()

  constructor(service: IServiceDecorator<T>) {
    super(service)
    this.setupValidators()
  }

  async execute(...args: any[]): Promise<T> {
    // Validar argumentos antes de ejecutar
    this.validateArgs(args)
    
    return await this.wrappedService.execute(...args)
  }

  private validateArgs(args: any[]): void {
    args.forEach((arg, index) => {
      if (typeof arg === 'object' && arg !== null) {
        this.validateObject(arg, `arg[${index}]`)
      }
    })
  }

  private validateObject(obj: any, path: string): void {
    // Validaciones específicas para diferentes tipos de objetos
    if (this.isSupplierData(obj)) {
      this.validateSupplierData(obj)
    } else if (this.isContractData(obj)) {
      this.validateContractData(obj)
    } else if (this.isPaymentData(obj)) {
      this.validatePaymentData(obj)
    }
  }

  private isSupplierData(obj: any): boolean {
    return obj && typeof obj.name === 'string' && typeof obj.phone === 'string' && typeof obj.email === 'string'
  }

  private isContractData(obj: any): boolean {
    return obj && obj.startDate && obj.endDate && typeof obj.amount === 'number' && typeof obj.supplierId === 'number'
  }

  private isPaymentData(obj: any): boolean {
    return obj && typeof obj.amount === 'number' && obj.paymentDate && typeof obj.contractId === 'number'
  }

  private validateSupplierData(data: any): void {
    const errors: string[] = []

    if (!data.name || data.name.trim().length === 0) {
      errors.push('El nombre del proveedor es requerido')
    }

    if (!data.phone || data.phone.trim().length === 0) {
      errors.push('El teléfono del proveedor es requerido')
    }

    if (!data.email || data.email.trim().length === 0) {
      errors.push('El email del proveedor es requerido')
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (data.email && !emailRegex.test(data.email)) {
      errors.push('El formato del email es inválido')
    }

    if (errors.length > 0) {
      throw new Error(`Validation Error: ${errors.join(', ')}`)
    }
  }

  private validateContractData(data: any): void {
    const errors: string[] = []

    if (!data.startDate) {
      errors.push('StartDate es requerido')
    }

    if (!data.endDate) {
      errors.push('EndDate es requerido')
    }

    if (!data.amount || data.amount <= 0) {
      errors.push('Amount debe ser mayor a 0')
    }

    if (!data.supplierId) {
      errors.push('SupplierId es requerido')
    }

    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate)
      const end = new Date(data.endDate)
      if (start >= end) {
        errors.push('EndDate debe ser posterior a StartDate')
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation Error: ${errors.join(', ')}`)
    }
  }

  private validatePaymentData(data: any): void {
    const errors: string[] = []

    if (!data.amount || data.amount <= 0) {
      errors.push('Amount debe ser mayor a 0')
    }

    if (!data.paymentDate) {
      errors.push('PaymentDate es requerido')
    }

    if (!data.contractId) {
      errors.push('ContractId es requerido')
    }

    if (!data.paymentMethod) {
      errors.push('PaymentMethod es requerido')
    }

    if (errors.length > 0) {
      throw new Error(`Validation Error: ${errors.join(', ')}`)
    }
  }

  private setupValidators(): void {
    // Configurar validadores adicionales si es necesario
  }
}
