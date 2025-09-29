import { ISupplierRepository } from '../../domain/repositories/ISupplierRepository'
import { Supplier } from '../../domain/entities/Supplier'
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierQueryDto,
  SupplierResponseDto,
  SupplierListResponseDto
} from '../dto/SupplierDto'

export class SupplierService {
  constructor(private readonly supplierRepository: ISupplierRepository) {}

  async getSuppliers(query: SupplierQueryDto): Promise<SupplierListResponseDto> {
    const { searchTerm = '', skip = 0, take = 10 } = query

    if (take <= 0) {
      return {
        suppliers: [],
        count: 0,
        currentPage: 1,
        totalPages: 0
      }
    }

    const result = await this.supplierRepository.findAll(searchTerm, skip, take)

    return {
      suppliers: result.suppliers.map(this.mapToResponseDto),
      count: result.count,
      currentPage: result.currentPage,
      totalPages: result.totalPages
    }
  }

  async getSupplierById(id: number): Promise<SupplierResponseDto | null> {
    const supplier = await this.supplierRepository.findById(id)
    return supplier ? this.mapToResponseDto(supplier) : null
  }

  async createSupplier(dto: CreateSupplierDto): Promise<SupplierResponseDto> {
    const supplier = Supplier.create(dto.name, dto.phone, dto.email, dto.state)
    const createdSupplier = await this.supplierRepository.create(supplier)
    return this.mapToResponseDto(createdSupplier)
  }

  async updateSupplier(dto: UpdateSupplierDto): Promise<SupplierResponseDto> {
    const existingSupplier = await this.supplierRepository.findById(dto.id)
    if (!existingSupplier) {
      throw new Error('Supplier not found')
    }

    const updatedSupplier = existingSupplier.updateInfo(dto.name, dto.phone, dto.email)
    const result = await this.supplierRepository.update(updatedSupplier)
    return this.mapToResponseDto(result)
  }

  async deleteSupplier(id: number): Promise<void> {
    const existingSupplier = await this.supplierRepository.findById(id)
    if (!existingSupplier) {
      throw new Error('Supplier not found')
    }

    const deactivatedSupplier = existingSupplier.deactivate()
    await this.supplierRepository.update(deactivatedSupplier)
  }

  private mapToResponseDto(supplier: Supplier): SupplierResponseDto {
    return {
      id: supplier.id,
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email,
      state: supplier.state,
      averageRating: supplier.averageRating
    }
  }
}
