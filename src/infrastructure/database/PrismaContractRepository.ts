import { PrismaClient } from '@prisma/client'
import { IContractRepository } from '../../domain/repositories/IContractRepository'
import { Contract } from '../../domain/entities/Contract'

export class PrismaContractRepository implements IContractRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: number): Promise<Contract | null> {
    const data = await this.prisma.contracts.findUnique({
      where: { Id: id },
      include: { Suppliers: true }
    })

    if (!data) return null

    return this.mapToEntity(data)
  }

  async findAll(supplierId?: number, skip?: number, take?: number): Promise<{
    contracts: Contract[]
    count: number
    currentPage: number
    totalPages: number
  }> {
    const skipValue = skip || 0
    const takeValue = take || 10
    const whereClause = supplierId ? { IdSuppliers: supplierId } : {}

    const [contracts, totalCount] = await Promise.all([
      this.prisma.contracts.findMany({
        skip: skipValue,
        take: takeValue,
        where: whereClause,
        orderBy: { StartDate: 'desc' },
        include: { Suppliers: true }
      }),
      this.prisma.contracts.count({ where: whereClause })
    ])

    return {
      contracts: contracts.map(contract => this.mapToEntity(contract)),
      count: totalCount,
      currentPage: Math.floor(skipValue / takeValue) + 1,
      totalPages: Math.ceil(totalCount / takeValue)
    }
  }

  async create(contract: Contract): Promise<Contract> {
    const data = await this.prisma.contracts.create({
      data: {
        StartDate: contract.startDate,
        EndDate: contract.endDate,
        Amount: contract.amount,
        Debt: contract.debt,
        Description: contract.description,
        IdSuppliers: contract.supplierId
      },
      include: { Suppliers: true }
    })

    return this.mapToEntity(data)
  }

  async update(contract: Contract): Promise<Contract> {
    const data = await this.prisma.contracts.update({
      where: { Id: contract.id },
      data: {
        StartDate: contract.startDate,
        EndDate: contract.endDate,
        Amount: contract.amount,
        Debt: contract.debt,
        Description: contract.description,
        IdSuppliers: contract.supplierId
      },
      include: { Suppliers: true }
    })

    return this.mapToEntity(data)
  }

  async delete(id: number): Promise<void> {
    await this.prisma.contracts.delete({
      where: { Id: id }
    })
  }

  async count(supplierId?: number): Promise<number> {
    const whereClause = supplierId ? { IdSuppliers: supplierId } : {}
    return this.prisma.contracts.count({ where: whereClause })
  }

  private mapToEntity(data: any): Contract {
    return Contract.fromPersistence({
      Id: data.Id,
      StartDate: data.StartDate,
      EndDate: data.EndDate,
      Amount: data.Amount,
      Debt: data.Debt,
      Description: data.Description,
      IdSuppliers: data.IdSuppliers,
      Suppliers: data.Suppliers
    })
  }
}
