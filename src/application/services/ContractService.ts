import { IContractRepository } from '../../domain/repositories/IContractRepository'
import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository'
import { Contract } from '../../domain/entities/Contract'
import {
  CreateContractDto,
  UpdateContractDto,
  ContractQueryDto,
  ContractResponseDto,
  ContractListResponseDto
} from '../dto/ContractDto'

export class ContractService {
  constructor(
    private readonly contractRepository: IContractRepository,
    private readonly paymentRepository: IPaymentRepository
  ) {}

  async getContracts(query: ContractQueryDto): Promise<ContractListResponseDto> {
    const { supplierId, skip = 0, take = 10 } = query

    const result = await this.contractRepository.findAll(supplierId, skip, take)

    return {
      contracts: result.contracts.map(this.mapToResponseDto),
      count: result.count,
      currentPage: result.currentPage,
      totalPages: result.totalPages
    }
  }

  async getContractById(id: number): Promise<ContractResponseDto | null> {
    const contract = await this.contractRepository.findById(id)
    return contract ? this.mapToResponseDto(contract) : null
  }

  async createContract(dto: CreateContractDto): Promise<ContractResponseDto> {
    this.validateContractData(dto)

    const contract = Contract.create(
      new Date(dto.startDate),
      new Date(dto.endDate),
      dto.amount,
      dto.description || '',
      dto.supplierId
    )

    const createdContract = await this.contractRepository.create(contract)
    return this.mapToResponseDto(createdContract)
  }

  async updateContract(dto: UpdateContractDto): Promise<ContractResponseDto> {
    this.validateContractData(dto)

    const existingContract = await this.contractRepository.findById(dto.id)
    if (!existingContract) {
      throw new Error('Contract not found')
    }

    const updatedContract = new Contract(
      dto.id,
      new Date(dto.startDate),
      new Date(dto.endDate),
      dto.amount,
      existingContract.debt, // Keep existing debt
      dto.description || '',
      dto.supplierId,
      existingContract.supplier
    )

    const result = await this.contractRepository.update(updatedContract)
    return this.mapToResponseDto(result)
  }

  async deleteContract(id: number): Promise<void> {
    // Check if contract has payments
    const paymentCount = await this.paymentRepository.countByContractId(id)
    if (paymentCount > 0) {
      throw new Error('No se puede eliminar, tiene pagos asociados')
    }

    await this.contractRepository.delete(id)
  }

  private validateContractData(data: CreateContractDto | UpdateContractDto): void {
    const errors: string[] = []

    if (!data.startDate) errors.push('StartDate es requerido')
    if (!data.endDate) errors.push('EndDate es requerido')
    if (!data.amount) errors.push('Amount es requerido')
    if (!data.supplierId) errors.push('SupplierId es requerido')

    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate)
      const end = new Date(data.endDate)
      if (start >= end) {
        errors.push('EndDate debe ser posterior a StartDate')
      }
    }

    if (data.amount && data.amount <= 0) {
      errors.push('Amount debe ser mayor a 0')
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '))
    }
  }

  private mapToResponseDto(contract: Contract): ContractResponseDto {
    return {
      id: contract.id,
      startDate: contract.startDate,
      endDate: contract.endDate,
      amount: contract.amount,
      debt: contract.debt,
      description: contract.description,
      supplierId: contract.supplierId,
      supplier: contract.supplier
    }
  }
}
