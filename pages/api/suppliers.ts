/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '@/app/lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'

// Interface base para el servicio de proveedores
interface ISupplierService {
  getSuppliers(searchTerm: string, skip: number, take: number): Promise<any>
  createSupplier(data: { Name: string; Phone: string; Email: string; State?: boolean }): Promise<any>
  updateSupplier(Id: number, data: { Name: string; Phone: string; Email: string; State: boolean }): Promise<any>
  deleteSupplier(Id: number): Promise<any>
}

// Implementación base del servicio
class SupplierService implements ISupplierService {
  async getSuppliers(searchTerm: string = '', skip: number = 0, take: number = 10) {
    if (take <= 0) {
      return {
        suppliers: [],
        count: 0,
        currentPage: 1,
        totalPages: 0
      }
    }

    let whereCondition: any = {}

    if (searchTerm) {
      whereCondition = {
        Name: {
          contains: searchTerm
        }
      }
    }

    try {
      const [suppliers, totalCount] = await Promise.all([
        prisma.suppliers.findMany({
          where: whereCondition,
          orderBy: {
            Id: 'desc'
          },
          skip,
          take,
          include: {
            SupplierEvaluation: true
          }
        }),
        prisma.suppliers.count({
          where: whereCondition
        })
      ])

      const suppliersWithRating = suppliers.map(supplier => {
        const evaluations = supplier.SupplierEvaluation
        let averageRating = 0

        if (evaluations.length > 0) {
          const total = evaluations.reduce((sum, evaluation) => sum + evaluation.Qualification, 0)
          averageRating = parseFloat((total / evaluations.length).toFixed(1))
        }

        return {
          ...supplier,
          averageRating: averageRating || 0
        }
      })

      return {
        suppliers: suppliersWithRating,
        count: totalCount,
        currentPage: Math.floor(skip / take) + 1,
        totalPages: Math.ceil(totalCount / take)
      }
    } catch (error) {
      console.error('Error in getSuppliers:', error)
      throw new Error('Error al obtener proveedores')
    }
  }

  async createSupplier(data: { Name: string; Phone: string; Email: string; State?: boolean }) {
    return await prisma.suppliers.create({
      data: {
        Name: data.Name,
        Phone: data.Phone,
        Email: data.Email,
        State: data.State !== undefined ? data.State : true
      }
    })
  }

  async updateSupplier(Id: number, data: { Name: string; Phone: string; Email: string; State: boolean }) {
    return await prisma.suppliers.update({
      where: { Id },
      data: {
        Name: data.Name,
        Phone: data.Phone,
        Email: data.Email,
        State: data.State
      }
    })
  }

  async deleteSupplier(Id: number) {
    return await prisma.suppliers.update({
      where: { Id },
      data: {
        State: false
      }
    })
  }
}

// Decorator base abstracto
abstract class SupplierServiceDecorator implements ISupplierService {
  protected wrappedService: ISupplierService

  constructor(service: ISupplierService) {
    this.wrappedService = service
  }

  async getSuppliers(searchTerm: string, skip: number, take: number) {
    return this.wrappedService.getSuppliers(searchTerm, skip, take)
  }

  async createSupplier(data: { Name: string; Phone: string; Email: string; State?: boolean }) {
    return this.wrappedService.createSupplier(data)
  }

  async updateSupplier(Id: number, data: { Name: string; Phone: string; Email: string; State: boolean }) {
    return this.wrappedService.updateSupplier(Id, data)
  }

  async deleteSupplier(Id: number) {
    return this.wrappedService.deleteSupplier(Id)
  }
}

// Decorator para logging
class LoggingSupplierServiceDecorator extends SupplierServiceDecorator {
  async getSuppliers(searchTerm: string, skip: number, take: number) {
    console.log(`[SUPPLIER SERVICE] Getting suppliers - search: "${searchTerm}", skip: ${skip}, take: ${take}`)
    const startTime = Date.now()

    try {
      const result = await super.getSuppliers(searchTerm, skip, take)
      const duration = Date.now() - startTime
      console.log(`[SUPPLIER SERVICE] Get suppliers completed in ${duration}ms - found ${result.count} items`)
      return result
    } catch (error) {
      console.error(`[SUPPLIER SERVICE] Error getting suppliers: ${error}`)
      throw error
    }
  }

  async createSupplier(data: { Name: string; Phone: string; Email: string; State?: boolean }) {
    console.log(`[SUPPLIER SERVICE] Creating supplier: ${data.Name}`)
    const startTime = Date.now()

    try {
      const result = await super.createSupplier(data)
      const duration = Date.now() - startTime
      console.log(`[SUPPLIER SERVICE] Supplier created in ${duration}ms - ID: ${result.Id}`)
      return result
    } catch (error) {
      console.error(`[SUPPLIER SERVICE] Error creating supplier: ${error}`)
      throw error
    }
  }

  async updateSupplier(Id: number, data: { Name: string; Phone: string; Email: string; State: boolean }) {
    console.log(`[SUPPLIER SERVICE] Updating supplier ID: ${Id}`)
    const startTime = Date.now()

    try {
      const result = await super.updateSupplier(Id, data)
      const duration = Date.now() - startTime
      console.log(`[SUPPLIER SERVICE] Supplier updated in ${duration}ms`)
      return result
    } catch (error) {
      console.error(`[SUPPLIER SERVICE] Error updating supplier: ${error}`)
      throw error
    }
  }

  async deleteSupplier(Id: number) {
    console.log(`[SUPPLIER SERVICE] Deleting supplier ID: ${Id}`)
    const startTime = Date.now()

    try {
      const result = await super.deleteSupplier(Id)
      const duration = Date.now() - startTime
      console.log(`[SUPPLIER SERVICE] Supplier deleted in ${duration}ms`)
      return result
    } catch (error) {
      console.error(`[SUPPLIER SERVICE] Error deleting supplier: ${error}`)
      throw error
    }
  }
}

// Decorator para validación
class ValidationSupplierServiceDecorator extends SupplierServiceDecorator {
  async createSupplier(data: { Name: string; Phone: string; Email: string; State?: boolean }) {
    this.validateSupplierData(data)
    return super.createSupplier(data)
  }

  async updateSupplier(Id: number, data: { Name: string; Phone: string; Email: string; State: boolean }) {
    this.validateSupplierData(data)
    if (!Id || Id <= 0) {
      throw new Error('ID de proveedor inválido')
    }
    return super.updateSupplier(Id, data)
  }

  private validateSupplierData(data: { Name: string; Phone: string; Email: string }) {
    if (!data.Name || data.Name.trim().length === 0) {
      throw new Error('El nombre del proveedor es requerido')
    }

    if (!data.Phone || data.Phone.trim().length === 0) {
      throw new Error('El teléfono del proveedor es requerido')
    }

    if (!data.Email || data.Email.trim().length === 0) {
      throw new Error('El email del proveedor es requerido')
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.Email)) {
      throw new Error('El formato del email es inválido')
    }
  }
}

// Decorator para caching (ejemplo básico)
class CachingSupplierServiceDecorator extends SupplierServiceDecorator {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

  async getSuppliers(searchTerm: string, skip: number, take: number) {
    const cacheKey = `suppliers_${searchTerm}_${skip}_${take}`
    const cached = this.cache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`[CACHE] Returning cached suppliers for key: ${cacheKey}`)
      return cached.data
    }

    const result = await super.getSuppliers(searchTerm, skip, take)

    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    })

    return result
  }

  async createSupplier(data: { Name: string; Phone: string; Email: string; State?: boolean }) {
    this.clearCache()
    return super.createSupplier(data)
  }

  async updateSupplier(Id: number, data: { Name: string; Phone: string; Email: string; State: boolean }) {
    this.clearCache()
    return super.updateSupplier(Id, data)
  }

  async deleteSupplier(Id: number) {
    this.clearCache()
    return super.deleteSupplier(Id)
  }

  private clearCache() {
    this.cache.clear()
    console.log('[CACHE] Cache cleared due to data modification')
  }
}

// Factory para crear el servicio con los decoradores deseados
class SupplierServiceFactory {
  static createService(): ISupplierService {
    const baseService = new SupplierService()

    // Aplicar decoradores en el orden deseado
    let service: ISupplierService = new ValidationSupplierServiceDecorator(baseService)
    service = new LoggingSupplierServiceDecorator(service)
    service = new CachingSupplierServiceDecorator(service)

    return service
  }
}

// Instancia del servicio decorado
const supplierService = SupplierServiceFactory.createService()

// Capa de Controlador - Manejo de requests HTTP
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
        res.status(405).end()
    }
  } catch (error) {
    console.error('Error in supplier handler:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Handlers específicos para cada método HTTP
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { searchTerm, startIndex = '0', endIndex = '10' } = req.query

    const searchTermString = (Array.isArray(searchTerm) ? searchTerm[0] : searchTerm) || ''
    const skip = Math.max(0, Number(startIndex))
    const take = Math.max(1, Number(endIndex) - Number(startIndex))

    if (isNaN(skip) || isNaN(take) || skip < 0 || take <= 0) {
      return res.status(400).json({
        error: 'Parámetros de paginación inválidos',
        details: `startIndex: ${startIndex}, endIndex: ${endIndex}`
      })
    }

    const result = await supplierService.getSuppliers(searchTermString, skip, take)
    res.status(200).json(result)
  } catch (error) {
    console.error('Error in handleGet:', error)
    res.status(500).json({ error: 'Error al obtener proveedores' })
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { Name, Phone, Email, State } = req.body

    if (!Name || !Phone || !Email) {
      return res.status(400).json({ error: 'Name, Phone, and Email are required' })
    }

    const supplier = await supplierService.createSupplier({ Name, Phone, Email, State })
    res.status(201).json(supplier)
  } catch (error) {
    console.error('Error in handlePost:', error)
    res.status(400).json({ error: error instanceof Error ? error.message : 'Error al crear proveedor' })
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { Id, Name, Phone, Email, State } = req.body

    if (!Id) {
      return res.status(400).json({ error: 'Id is required' })
    }

    const supplier = await supplierService.updateSupplier(Id, { Name, Phone, Email, State })
    res.status(200).json(supplier)
  } catch (error) {
    console.error('Error in handlePut:', error)
    res.status(400).json({ error: error instanceof Error ? error.message : 'Error al actualizar proveedor' })
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { Id } = req.query
    const supplierId = typeof Id === 'string' ? parseInt(Id) : Array.isArray(Id) ? parseInt(Id[0]) : Number(Id)

    if (!supplierId || isNaN(supplierId)) {
      return res.status(400).json({ error: 'Id válido es requerido' })
    }

    const supplier = await supplierService.deleteSupplier(supplierId)
    res.status(200).json(supplier)
  } catch (error) {
    console.error('Error in handleDelete:', error)
    res.status(500).json({ error: 'Error al eliminar proveedor' })
  }
}
