import { IServiceDecorator } from './IServiceDecorator'
import { SupplierQueryDto, SupplierListResponseDto, CreateSupplierDto, UpdateSupplierDto, SupplierResponseDto } from '../dto/SupplierDto'

/**
 * Interface específica para el servicio de proveedores
 */
export interface ISupplierService extends IServiceDecorator<any> {
  getSuppliers(query: SupplierQueryDto): Promise<SupplierListResponseDto>
  getSupplierById(id: number): Promise<SupplierResponseDto | null>
  createSupplier(dto: CreateSupplierDto): Promise<SupplierResponseDto>
  updateSupplier(dto: UpdateSupplierDto): Promise<SupplierResponseDto>
  deleteSupplier(id: number): Promise<void>
}

/**
 * Wrapper para adaptar SupplierService al patrón Decorator
 */
export class SupplierServiceWrapper implements ISupplierService {
  constructor(private supplierService: any) {}

  async execute(...args: any[]): Promise<any> {
    // Determinar qué método llamar basado en los argumentos
    if (args.length === 1 && typeof args[0] === 'object' && 'searchTerm' in args[0]) {
      return this.getSuppliers(args[0])
    } else if (args.length === 1 && typeof args[0] === 'number') {
      return this.getSupplierById(args[0])
    } else if (args.length === 1 && typeof args[0] === 'object' && 'name' in args[0] && !('id' in args[0])) {
      return this.createSupplier(args[0])
    } else if (args.length === 1 && typeof args[0] === 'object' && 'id' in args[0]) {
      return this.updateSupplier(args[0])
    } else if (args.length === 1 && typeof args[0] === 'number') {
      return this.deleteSupplier(args[0])
    }
    
    throw new Error('Invalid arguments for SupplierService')
  }

  async getSuppliers(query: SupplierQueryDto): Promise<SupplierListResponseDto> {
    return this.supplierService.getSuppliers(query)
  }

  async getSupplierById(id: number): Promise<SupplierResponseDto | null> {
    return this.supplierService.getSupplierById(id)
  }

  async createSupplier(dto: CreateSupplierDto): Promise<SupplierResponseDto> {
    return this.supplierService.createSupplier(dto)
  }

  async updateSupplier(dto: UpdateSupplierDto): Promise<SupplierResponseDto> {
    return this.supplierService.updateSupplier(dto)
  }

  async deleteSupplier(id: number): Promise<void> {
    return this.supplierService.deleteSupplier(id)
  }
}
