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

  // GET - Obtener proveedores con paginación y búsqueda
  async getSuppliers(searchTerm: string = '', startIndex: number = 0, endIndex: number = 10) {
    const skip = Number(startIndex)
    const take = Number(endIndex) - Number(startIndex)

    let whereCondition = {}
    if (searchTerm) {
      whereCondition = {
        Name: {
          contains: searchTerm
        }
      }
    }

    const [suppliers, totalCount] = await Promise.all([
      prisma.suppliers.findMany({
        where: whereCondition,
        orderBy: { Name: 'asc' },
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
  const { searchTerm, startIndex = 0, endIndex = 10 } = req.query

  const searchTermString = (Array.isArray(searchTerm) ? searchTerm[0] : searchTerm) || ''
  const skip = Number(startIndex)
  const take = Number(endIndex) - Number(startIndex)

  const result = await supplierService.getSuppliers(searchTermString, skip, take)
  res.status(200).json(result)
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { Name, Phone, Email, State } = req.body

  if (!Name || !Phone || !Email) {
    return res.status(400).json({ error: 'Name, Phone, and Email are required' })
  }

  const supplier = await supplierService.createSupplier({ Name, Phone, Email, State })
  res.status(201).json(supplier)
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { Id, Name, Phone, Email, State } = req.body

  if (!Id) {
    return res.status(400).json({ error: 'Id is required' })
  }

  const supplier = await supplierService.updateSupplier(Id, { Name, Phone, Email, State })
  res.status(200).json(supplier)
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { Id } = req.query
  const supplierId = typeof Id === 'string' ? parseInt(Id) : Array.isArray(Id) ? parseInt(Id[0]) : Number(Id)

  if (!supplierId) {
    return res.status(400).json({ error: 'Id is required' })
  }

  const supplier = await supplierService.deleteSupplier(supplierId)
  res.status(200).json(supplier)
}
