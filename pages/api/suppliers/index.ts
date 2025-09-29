import { NextApiRequest, NextApiResponse } from 'next'
import { ServiceFactory } from '../../../src/infrastructure/config/ServiceFactory'
import { CreateSupplierDto, UpdateSupplierDto, SupplierQueryDto } from '../../../src/application/dto/SupplierDto'

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
    console.error('Error in supplier handler:', error)
    handleError(error, res)
  } finally {
    await ServiceFactory.disconnect()
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
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

  const query: SupplierQueryDto = {
    searchTerm: searchTermString,
    skip,
    take
  }

  const supplierService = ServiceFactory.getSupplierService()
  const result = await supplierService.getSuppliers(query)
  res.status(200).json(result)
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { Name, Phone, Email, State } = req.body

  if (!Name || !Phone || !Email) {
    return res.status(400).json({ error: 'Name, Phone, and Email are required' })
  }

  const dto: CreateSupplierDto = {
    name: Name,
    phone: Phone,
    email: Email,
    state: State
  }

  const supplierService = ServiceFactory.getSupplierService()
  const supplier = await supplierService.createSupplier(dto)
  res.status(201).json(supplier)
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { Id, Name, Phone, Email, State } = req.body

  if (!Id) {
    return res.status(400).json({ error: 'Id is required' })
  }

  const dto: UpdateSupplierDto = {
    id: Id,
    name: Name,
    phone: Phone,
    email: Email,
    state: State
  }

  const supplierService = ServiceFactory.getSupplierService()
  const supplier = await supplierService.updateSupplier(dto)
  res.status(200).json(supplier)
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { Id } = req.query
  const supplierId = typeof Id === 'string' ? parseInt(Id) : Array.isArray(Id) ? parseInt(Id[0]) : Number(Id)

  if (!supplierId || isNaN(supplierId)) {
    return res.status(400).json({ error: 'Id válido es requerido' })
  }

  const supplierService = ServiceFactory.getSupplierService()
  await supplierService.deleteSupplier(supplierId)
  res.status(200).json({ message: 'Supplier deleted successfully' })
}

function handleError(error: unknown, res: NextApiResponse) {
  if (error instanceof Error) {
    if (error.message.includes('es requerido') || error.message.includes('debe ser')) {
      return res.status(400).json({ error: error.message })
    }
  }
  res.status(500).json({ error: 'Error interno del servidor' })
}
