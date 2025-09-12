import prisma from '@/app/lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'

// Capa de Servicio - Lógica de negocio de proveedores
class SupplierService {
  private static instance: SupplierService

  public static getInstance(): SupplierService {
    if (!SupplierService.instance) {
      SupplierService.instance = new SupplierService()
    }
    return SupplierService.instance
  }

  // GET - Obtener proveedores con paginación y búsqueda (CORREGIDO)
  async getSuppliers(searchTerm: string = '', skip: number = 0, take: number = 10) {
    // Validar que take sea positivo
    if (take <= 0) {
      return {
        suppliers: [],
        count: 0,
        currentPage: 1,
        totalPages: 0
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let whereCondition: any = {}

    // Filtro de búsqueda
    if (searchTerm) {
      whereCondition = {
        OR: [
          {
            Name: {
              contains: searchTerm,
              mode: 'insensitive' as const
            }
          },
          {
            Email: {
              contains: searchTerm,
              mode: 'insensitive' as const
            }
          },
          {
            Phone: {
              contains: searchTerm,
              mode: 'insensitive' as const
            }
          }
        ]
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

  // POST - Crear nuevo proveedor
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

  // PUT - Actualizar proveedor
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

  // DELETE - Eliminar lógicamente el proveedor (cambiar State a false)
  async deleteSupplier(Id: number) {
    return await prisma.suppliers.update({
      where: { Id },
      data: {
        State: false
      }
    })
  }
}

// Instancia Singleton del servicio
const supplierService = SupplierService.getInstance()

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

    // Validar y convertir parámetros
    const searchTermString = (Array.isArray(searchTerm) ? searchTerm[0] : searchTerm) || ''
    const skip = Math.max(0, Number(startIndex))
    const take = Math.max(1, Number(endIndex) - Number(startIndex))

    // Validar que los parámetros sean números válidos
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
    res.status(500).json({ error: 'Error al crear proveedor' })
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
    res.status(500).json({ error: 'Error al actualizar proveedor' })
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
