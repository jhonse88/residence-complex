import { PrismaClient } from '@prisma/client'
import { ISupplierRepository } from '../../domain/repositories/ISupplierRepository'
import { Supplier } from '../../domain/entities/Supplier'

export class PrismaSupplierRepository implements ISupplierRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: number): Promise<Supplier | null> {
    const data = await this.prisma.suppliers.findUnique({
      where: { Id: id },
      include: { SupplierEvaluation: true }
    })

    if (!data) return null

    return this.mapToEntity(data)
  }

  async findAll(searchTerm?: string, skip?: number, take?: number): Promise<{
    suppliers: Supplier[]
    count: number
    currentPage: number
    totalPages: number
  }> {
    const skipValue = skip || 0
    const takeValue = take || 10

    let whereCondition: any = {}

    if (searchTerm) {
      whereCondition = {
        Name: {
          contains: searchTerm
        }
      }
    }

    const [suppliers, totalCount] = await Promise.all([
      this.prisma.suppliers.findMany({
        where: whereCondition,
        orderBy: { Id: 'desc' },
        skip: skipValue,
        take: takeValue,
        include: { SupplierEvaluation: true }
      }),
      this.prisma.suppliers.count({ where: whereCondition })
    ])

    const suppliersWithRating = suppliers.map(supplier => this.mapToEntity(supplier))

    return {
      suppliers: suppliersWithRating,
      count: totalCount,
      currentPage: Math.floor(skipValue / takeValue) + 1,
      totalPages: Math.ceil(totalCount / takeValue)
    }
  }

  async create(supplier: Supplier): Promise<Supplier> {
    const data = await this.prisma.suppliers.create({
      data: {
        Name: supplier.name,
        Phone: supplier.phone,
        Email: supplier.email,
        State: supplier.state
      },
      include: { SupplierEvaluation: true }
    })

    return this.mapToEntity(data)
  }

  async update(supplier: Supplier): Promise<Supplier> {
    const data = await this.prisma.suppliers.update({
      where: { Id: supplier.id },
      data: {
        Name: supplier.name,
        Phone: supplier.phone,
        Email: supplier.email,
        State: supplier.state
      },
      include: { SupplierEvaluation: true }
    })

    return this.mapToEntity(data)
  }

  async delete(id: number): Promise<void> {
    await this.prisma.suppliers.update({
      where: { Id: id },
      data: { State: false }
    })
  }

  async count(): Promise<number> {
    return this.prisma.suppliers.count()
  }

  private mapToEntity(data: any): Supplier {
    const evaluations = data.SupplierEvaluation || []
    let averageRating = 0

    if (evaluations.length > 0) {
      const total = evaluations.reduce((sum: number, evaluation: any) => sum + evaluation.Qualification, 0)
      averageRating = parseFloat((total / evaluations.length).toFixed(1))
    }

    return Supplier.fromPersistence({
      Id: data.Id,
      Name: data.Name,
      Phone: data.Phone,
      Email: data.Email,
      State: data.State,
      averageRating
    })
  }
}
