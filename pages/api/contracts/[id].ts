import { NextApiRequest, NextApiResponse } from 'next'
import { ServiceFactory } from '../../../src/infrastructure/config/ServiceFactory'

// Interface para la respuesta
interface ContractWithSupplier {
  Id: number
  StartDate: Date
  EndDate: Date
  Amount: number
  Debt: number
  Description: string | null
  IdSuppliers: number
  Suppliers: {
    Id: number
    Name: string
    Phone: string
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      await handleGet(req, res)
    } else {
      res.setHeader('Allow', ['GET'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
    }
  } catch (error) {
    console.error('Error in contract detail handler:', error)
    handleError(error, res)
  } finally {
    await ServiceFactory.disconnect()
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  // Validar ID
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'ID es requerido' })
  }

  const contractId = Number(id)
  if (isNaN(contractId) || contractId <= 0) {
    return res.status(400).json({ error: 'ID debe ser un número válido' })
  }

  const prisma = ServiceFactory.getPrismaClient()
  const contract = await prisma.contracts.findUnique({
    where: { Id: contractId },
    include: {
      Suppliers: {
        select: {
          Id: true,
          Name: true,
          Phone: true
        }
      }
    }
  })

  if (!contract) {
    return res.status(404).json({ error: 'Contrato no encontrado' })
  }

  res.status(200).json(contract)
}

function handleError(error: unknown, res: NextApiResponse) {
  if (error instanceof Error) {
    if (error.message.includes('es requerido') || error.message.includes('debe ser')) {
      return res.status(400).json({ error: error.message })
    }
  }
  res.status(500).json({ error: 'Error interno del servidor' })
}
