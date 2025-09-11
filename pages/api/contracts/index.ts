import prisma from '@/app/lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'

// Interfaces
interface ContractData {
  StartDate: Date | string
  EndDate: Date | string
  Amount: number
  Description?: string
  IdSuppliers: number
}

interface ContractQuery {
  skip?: number
  take?: number
  supplierId?: number
}

// Strategy Pattern para validaciones de eliminación
interface DeleteValidationStrategy {
  validate(contractId: number): Promise<{ isValid: boolean; message?: string }>
}

class DefaultDeleteValidation implements DeleteValidationStrategy {
  async validate(contractId: number): Promise<{ isValid: boolean; message?: string }> {
    const payments = await prisma.pay.count({
      where: { IdContracts: contractId }
    })

    if (payments > 0) {
      return {
        isValid: false,
        message: 'No se puede eliminar, tiene pagos asociados'
      }
    }

    return { isValid: true }
  }
}

// Capa de Servicio con Singleton
class ContractService {
  private static instance: ContractService
  private deleteValidator: DeleteValidationStrategy

  private constructor() {
    this.deleteValidator = new DefaultDeleteValidation()
  }

  public static getInstance(): ContractService {
    if (!ContractService.instance) {
      ContractService.instance = new ContractService()
    }
    return ContractService.instance
  }

  // GET - Obtener contratos
  async getContracts(query: ContractQuery) {
    const skip = query.skip || 0
    const take = query.take || 10
    const whereClause = query.supplierId ? { IdSuppliers: query.supplierId } : {}

    const [contracts, totalCount] = await Promise.all([
      prisma.contracts.findMany({
        skip,
        take,
        where: whereClause,
        orderBy: { StartDate: 'desc' },
        include: { Suppliers: true }
      }),
      prisma.contracts.count({ where: whereClause })
    ])

    return {
      contracts,
      count: totalCount,
      currentPage: Math.floor(skip / take) + 1,
      totalPages: Math.ceil(totalCount / take)
    }
  }

  // POST - Crear contrato
  async createContract(data: ContractData) {
    return await prisma.contracts.create({
      data: {
        StartDate: new Date(data.StartDate),
        EndDate: new Date(data.EndDate),
        Amount: Number(data.Amount),
        Debt: Number(data.Amount), // Inicializar deuda igual al monto
        Description: data.Description || '',
        IdSuppliers: Number(data.IdSuppliers)
      },
      include: { Suppliers: true }
    })
  }

  // PUT - Actualizar contrato
  async updateContract(id: number, data: ContractData) {
    return await prisma.contracts.update({
      where: { Id: id },
      data: {
        StartDate: new Date(data.StartDate),
        EndDate: new Date(data.EndDate),
        Amount: Number(data.Amount),
        Description: data.Description || '',
        IdSuppliers: Number(data.IdSuppliers)
      },
      include: { Suppliers: true }
    })
  }

  // DELETE - Eliminar contrato con validación
  async deleteContract(id: number) {
    const validation = await this.deleteValidator.validate(id)

    if (!validation.isValid) {
      throw new Error(validation.message || 'No se puede eliminar el contrato')
    }

    await prisma.contracts.delete({
      where: { Id: id }
    })

    return { message: 'Contrato eliminado' }
  }

  // Método para cambiar la estrategia de validación (útil para testing)
  setDeleteValidator(validator: DeleteValidationStrategy) {
    this.deleteValidator = validator
  }

  // Validación de datos
  validateContractData(data: Partial<ContractData>): string[] {
    const errors: string[] = []

    if (!data.StartDate) errors.push('StartDate es requerido')
    if (!data.EndDate) errors.push('EndDate es requerido')
    if (!data.Amount) errors.push('Amount es requerido')
    if (!data.IdSuppliers) errors.push('IdSuppliers es requerido')

    if (data.StartDate && data.EndDate) {
      const start = new Date(data.StartDate)
      const end = new Date(data.EndDate)
      if (start >= end) {
        errors.push('EndDate debe ser posterior a StartDate')
      }
    }

    if (data.Amount && data.Amount <= 0) {
      errors.push('Amount debe ser mayor a 0')
    }

    return errors
  }
}

// Instancia Singleton del servicio
const contractService = ContractService.getInstance()

// Capa de Controlador
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        await handleGet(req, res)
        break
      case 'POST':
        await handlePost(req, res)
        break
      case 'PUT':
        await handlePut(req, res)
        break
      case 'DELETE':
        await handleDelete(req, res)
        break
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
        res.status(405).end(`Method ${req.method} Not Allowed`)
    }
  } catch (error) {
    console.error('Error in contract handler:', error)
    handleError(error, res)
  }
}

// Handlers específicos
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { skip, take, supplierId } = req.query

  const result = await contractService.getContracts({
    skip: skip ? Number(skip) : undefined,
    take: take ? Number(take) : undefined,
    supplierId: supplierId ? Number(supplierId) : undefined
  })

  res.status(200).json(result)
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { StartDate, EndDate, Amount, Description, IdSuppliers } = req.body

  const validationErrors = contractService.validateContractData(req.body)
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: validationErrors.join(', ') })
  }

  const contract = await contractService.createContract({
    StartDate,
    EndDate,
    Amount: Number(Amount),
    Description,
    IdSuppliers: Number(IdSuppliers)
  })

  res.status(201).json(contract)
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { Id, StartDate, EndDate, Amount, Description, IdSuppliers } = req.body

  if (!Id) {
    return res.status(400).json({ error: 'ID es requerido' })
  }

  const validationErrors = contractService.validateContractData(req.body)
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: validationErrors.join(', ') })
  }

  const contract = await contractService.updateContract(Number(Id), {
    StartDate,
    EndDate,
    Amount: Number(Amount),
    Description,
    IdSuppliers: Number(IdSuppliers)
  })

  res.status(200).json(contract)
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { Id } = req.body

  if (!Id) {
    return res.status(400).json({ error: 'ID es requerido' })
  }

  const result = await contractService.deleteContract(Number(Id))
  res.status(200).json(result)
}

// Manejo centralizado de errores
function handleError(error: unknown, res: NextApiResponse) {
  if (error instanceof Error) {
    if (error.message.includes('No se puede eliminar')) {
      return res.status(400).json({ error: error.message })
    }
    if (error.message.includes('es requerido') || error.message.includes('debe ser')) {
      return res.status(400).json({ error: error.message })
    }
  }
  res.status(500).json({ error: 'Error interno del servidor' })
}
