import { NextApiRequest, NextApiResponse } from 'next'
import { ServiceFactory } from '../../../src/infrastructure/config/ServiceFactory'
import { CreateContractDto, UpdateContractDto, ContractQueryDto } from '../../../src/application/dto/ContractDto'

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
  } finally {
    await ServiceFactory.disconnect()
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { skip, take, supplierId } = req.query

  const query: ContractQueryDto = {
    skip: skip ? Number(skip) : undefined,
    take: take ? Number(take) : undefined,
    supplierId: supplierId ? Number(supplierId) : undefined
  }

  const contractService = ServiceFactory.getContractService()
  const result = await contractService.getContracts(query)
  res.status(200).json(result)
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { StartDate, EndDate, Amount, Description, IdSuppliers } = req.body

  const dto: CreateContractDto = {
    startDate: StartDate,
    endDate: EndDate,
    amount: Number(Amount),
    description: Description,
    supplierId: Number(IdSuppliers)
  }

  const contractService = ServiceFactory.getContractService()
  const contract = await contractService.createContract(dto)
  res.status(201).json(contract)
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { Id, StartDate, EndDate, Amount, Description, IdSuppliers } = req.body

  if (!Id) {
    return res.status(400).json({ error: 'ID es requerido' })
  }

  const dto: UpdateContractDto = {
    id: Number(Id),
    startDate: StartDate,
    endDate: EndDate,
    amount: Number(Amount),
    description: Description,
    supplierId: Number(IdSuppliers)
  }

  const contractService = ServiceFactory.getContractService()
  const contract = await contractService.updateContract(dto)
  res.status(200).json(contract)
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { Id } = req.body

  if (!Id) {
    return res.status(400).json({ error: 'ID es requerido' })
  }

  const contractService = ServiceFactory.getContractService()
  await contractService.deleteContract(Number(Id))
  res.status(200).json({ message: 'Contrato eliminado' })
}

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