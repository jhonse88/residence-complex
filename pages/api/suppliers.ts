import prisma from '@/app/lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'
import { Prisma } from '@prisma/client'

// Capa de Servicio - Lógica de negocio de proveedores
class SupplierService {
  // GET - Obtener proveedores con paginación y búsqueda
  async getSuppliers(searchTerm: string = '', skip: number = 0, take: number = 10) {
    if (take <= 0) {
      return { suppliers: [], count: 0, currentPage: 1, totalPages: 0 }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let whereCondition: Prisma.SuppliersWhereInput = {}

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
          orderBy: { Id: 'desc' },
          skip,
          take,
          include: { SupplierEvaluation: true }
        }),
        prisma.suppliers.count({ where: whereCondition })
      ])

      const suppliersWithRating = suppliers.map(supplier => {
        const evaluations = supplier.SupplierEvaluation
        const averageRating =
          evaluations.length > 0
            ? parseFloat(
                (
                  evaluations.reduce((sum, evaluation) => sum + evaluation.Qualification, 0) / evaluations.length
                ).toFixed(1)
              )
            : 0

        return { ...supplier, averageRating }
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
    return prisma.suppliers.create({
      data: { ...data, State: data.State ?? true }
    })
  }

  // PUT - Actualizar proveedor
  async updateSupplier(Id: number, data: { Name: string; Phone: string; Email: string; State: boolean }) {
    return prisma.suppliers.update({
      where: { Id },
      data
    })
  }

  // DELETE - Eliminar lógicamente (State=false)
  async deleteSupplier(Id: number) {
    return prisma.suppliers.update({
      where: { Id },
      data: { State: false }
    })
  }
}

// Instancia normal (no Singleton)
const supplierService = new SupplierService()

// Capa de Controlador - Manejo de requests HTTP
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return handleGet(req, res)
      case 'POST':
        return handlePost(req, res)
      case 'PUT':
        return handlePut(req, res)
      case 'DELETE':
        return handleDelete(req, res)
      default:
        return res.status(405).end()
    }
  } catch (error) {
    console.error('Error in supplier handler:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Handlers específicos
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { searchTerm, startIndex = '0', endIndex = '10' } = req.query

  const searchTermString = (Array.isArray(searchTerm) ? searchTerm[0] : searchTerm) || ''
  const skip = Math.max(0, Number(startIndex))
  const take = Math.max(1, Number(endIndex) - Number(startIndex))

  if (isNaN(skip) || isNaN(take) || skip < 0 || take <= 0) {
    return res.status(400).json({
      error: 'Parámetros de paginación inválidos',
      details: { startIndex, endIndex }
    })
  }

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

  if (!supplierId || isNaN(supplierId)) {
    return res.status(400).json({ error: 'Id válido es requerido' })
  }

  const supplier = await supplierService.deleteSupplier(supplierId)
  res.status(200).json(supplier)
}
