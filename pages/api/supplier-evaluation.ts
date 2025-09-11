import prisma from '@/app/lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'

// Interface para los datos de evaluación
interface EvaluationData {
  EvaluationDate: Date | string
  Qualification: number
  Comments: string
  IdSuppliers: number
  IdServiceRequests: number
}

// Capa de Servicio - Lógica de negocio de evaluaciones
class EvaluationService {
  private static instance: EvaluationService

  public static getInstance(): EvaluationService {
    if (!EvaluationService.instance) {
      EvaluationService.instance = new EvaluationService()
    }
    return EvaluationService.instance
  }

  // GET - Obtener evaluaciones con filtros
  async getEvaluations(supplierId?: number, requestId?: number) {
    return await prisma.supplierEvaluation.findMany({
      where: {
        ...(supplierId && { IdSuppliers: supplierId }),
        ...(requestId && { IdServiceRequests: requestId })
      },
      include: {
        Suppliers: true,
        ServiceRequests: true
      },
      orderBy: { EvaluationDate: 'desc' }
    })
  }

  // POST - Crear nueva evaluación
  async createEvaluation(data: EvaluationData) {
    // Validar calificación
    if (data.Qualification < 1 || data.Qualification > 5) {
      throw new Error('La calificación debe ser entre 1 y 5')
    }

    return await prisma.supplierEvaluation.create({
      data: {
        EvaluationDate: new Date(data.EvaluationDate),
        Qualification: Number(data.Qualification),
        Comments: data.Comments,
        IdSuppliers: Number(data.IdSuppliers),
        IdServiceRequests: Number(data.IdServiceRequests)
      },
      include: {
        Suppliers: true,
        ServiceRequests: true
      }
    })
  }

  // PUT - Actualizar evaluación
  async updateEvaluation(id: number, data: EvaluationData) {
    // Validar calificación
    if (data.Qualification < 1 || data.Qualification > 5) {
      throw new Error('La calificación debe ser entre 1 y 5')
    }

    return await prisma.supplierEvaluation.update({
      where: { Id: id },
      data: {
        EvaluationDate: new Date(data.EvaluationDate),
        Qualification: Number(data.Qualification),
        Comments: data.Comments,
        IdSuppliers: Number(data.IdSuppliers),
        IdServiceRequests: Number(data.IdServiceRequests)
      }
    })
  }

  // DELETE - Eliminar evaluación
  async deleteEvaluation(id: number) {
    return await prisma.supplierEvaluation.delete({
      where: { Id: id }
    })
  }

  // Validar datos de evaluación
  validateEvaluationData(data: Partial<EvaluationData>): string[] {
    const errors: string[] = []

    if (data.Qualification !== undefined && (data.Qualification < 1 || data.Qualification > 5)) {
      errors.push('La calificación debe ser entre 1 y 5')
    }
    if (!data.IdSuppliers) errors.push('IdSuppliers es requerido')
    if (!data.IdServiceRequests) errors.push('IdServiceRequests es requerido')
    if (!data.EvaluationDate) errors.push('EvaluationDate es requerido')

    return errors
  }
}

// Instancia Singleton del servicio
const evaluationService = EvaluationService.getInstance()

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
    console.error('Error in evaluation handler:', error)
    handleError(error, res)
  }
}

// Handlers específicos para cada método HTTP
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { supplierId, requestId } = req.query

  const supplierIdNum = supplierId ? Number(supplierId) : undefined
  const requestIdNum = requestId ? Number(requestId) : undefined

  const evaluations = await evaluationService.getEvaluations(supplierIdNum, requestIdNum)
  res.status(200).json(evaluations)
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { EvaluationDate, Qualification, Comments, IdSuppliers, IdServiceRequests } = req.body

  // Validar datos requeridos
  const validationErrors = evaluationService.validateEvaluationData(req.body)
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: validationErrors.join(', ') })
  }

  const evaluation = await evaluationService.createEvaluation({
    EvaluationDate,
    Qualification,
    Comments,
    IdSuppliers,
    IdServiceRequests
  })

  res.status(201).json(evaluation)
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { Id, EvaluationDate, Qualification, Comments, IdSuppliers, IdServiceRequests } = req.body

  if (!Id) {
    return res.status(400).json({ error: 'Id es requerido' })
  }

  // Validar datos requeridos
  const validationErrors = evaluationService.validateEvaluationData(req.body)
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: validationErrors.join(', ') })
  }

  const evaluation = await evaluationService.updateEvaluation(Number(Id), {
    EvaluationDate,
    Qualification,
    Comments,
    IdSuppliers,
    IdServiceRequests
  })

  res.status(200).json(evaluation)
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { Id } = req.query
  const evaluationId = typeof Id === 'string' ? parseInt(Id) : Array.isArray(Id) ? parseInt(Id[0]) : Number(Id)

  if (!evaluationId) {
    return res.status(400).json({ error: 'Id es requerido' })
  }

  const evaluation = await evaluationService.deleteEvaluation(evaluationId)
  res.status(200).json(evaluation)
}

// Manejo centralizado de errores
function handleError(error: unknown, res: NextApiResponse) {
  if (error instanceof Error) {
    if (error.message.includes('calificación')) {
      return res.status(400).json({ error: error.message })
    }
    if (error.message.includes('requerido')) {
      return res.status(400).json({ error: error.message })
    }
  }
  res.status(500).json({ error: 'Error interno del servidor' })
}
