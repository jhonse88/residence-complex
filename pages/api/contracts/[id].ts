import prisma from '@/app/lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'

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

// Capa de Servicio con Singleton
class ContractDetailService {
  private static instance: ContractDetailService

  public static getInstance(): ContractDetailService {
    if (!ContractDetailService.instance) {
      ContractDetailService.instance = new ContractDetailService()
    }
    return ContractDetailService.instance
  }

  // GET - Obtener contrato por ID con información del proveedor
  async getContractById(id: number): Promise<ContractWithSupplier | null> {
    const contract = await prisma.contracts.findUnique({
      where: { Id: id },
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

    return contract as ContractWithSupplier | null
  }

  // Validar ID del contrato
  validateContractId(id: unknown): { isValid: boolean; error?: string } {
    if (id === undefined || id === null) {
      return { isValid: false, error: 'ID es requerido' }
    }

    const idNumber = Number(id)
    if (isNaN(idNumber) || idNumber <= 0) {
      return { isValid: false, error: 'ID debe ser un número válido' }
    }

    return { isValid: true }
  }
}

// Instancia Singleton del servicio
const contractDetailService = ContractDetailService.getInstance()

// Capa de Controlador
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
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// Handler específico para GET
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  // Validar ID
  const validation = contractDetailService.validateContractId(id)
  if (!validation.isValid) {
    return res.status(400).json({ error: validation.error })
  }

  const contractId = Number(id)
  const contract = await contractDetailService.getContractById(contractId)

  if (!contract) {
    return res.status(404).json({ error: 'Contrato no encontrado' })
  }

  res.status(200).json(contract)
}
