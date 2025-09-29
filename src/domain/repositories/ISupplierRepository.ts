import { Supplier } from '../entities/Supplier'

export interface ISupplierRepository {
  findById(id: number): Promise<Supplier | null>
  findAll(searchTerm?: string, skip?: number, take?: number): Promise<{
    suppliers: Supplier[]
    count: number
    currentPage: number
    totalPages: number
  }>
  create(supplier: Supplier): Promise<Supplier>
  update(supplier: Supplier): Promise<Supplier>
  delete(id: number): Promise<void>
  count(): Promise<number>
}
