import { Contract } from '../entities/Contract'

export interface IContractRepository {
  findById(id: number): Promise<Contract | null>
  findAll(supplierId?: number, skip?: number, take?: number): Promise<{
    contracts: Contract[]
    count: number
    currentPage: number
    totalPages: number
  }>
  create(contract: Contract): Promise<Contract>
  update(contract: Contract): Promise<Contract>
  delete(id: number): Promise<void>
  count(supplierId?: number): Promise<number>
}
