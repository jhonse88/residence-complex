// src/pages/api/evaluations.ts
import prisma from '@/app/lib/prisma'
import { NextApiRequest, NextApiResponse } from 'next'
import Joi from 'joi'

// ---------------------------
// Definición de errores tipados
// ---------------------------
class ValidationError extends Error {}
class NotFoundError extends Error {}

// ---------------------------
// Validación con Joi
// ---------------------------
const evaluationSchema = Joi.object({
  EvaluationDate: Joi.date().required().messages({
    'date.base': 'EvaluationDate debe ser una fecha válida',
    'any.required': 'EvaluationDate es requerido'
  }),
  Qualification: Joi.number().min(1).max(5).required().messages({
    'number.base': 'Qualification debe ser un número',
    'number.min': 'La calificación mínima es 1',
    'number.max': 'La calificación máxima es 5',
    'any.required': 'Qualification es requerido'
  }),
  Comments: Joi.string().min(1).required().messages({
    'string.base': 'Comments debe ser texto',
    'any.required': 'Comments es requerido'
  }),
  IdSuppliers: Joi.number().required().messages({
    'number.base': 'IdSuppliers debe ser un número',
    'any.required': 'IdSuppliers es requerido'
  }),
  IdServiceRequests: Joi.number().required().messages({
    'number.base': 'IdServiceRequests debe ser un número',
    'any.required': 'IdServiceRequests es requerido'
  })
})

// Para updates (permite parcial, excepto Id)
const evaluationUpdateSchema = evaluationSchema
  .fork(['EvaluationDate', 'Qualification', 'Comments', 'IdSuppliers', 'IdServiceRequests'], schema =>
    schema.optional()
  )
  .append({
    Id: Joi.number().required().messages({
      'number.base': 'Id debe ser un número',
      'any.required': 'Id es requerido'
    })
  })

// ---------------------------
// Capa de Servicio
// ---------------------------
class EvaluationService {
  // GET - Obtener evaluaciones
  async getEvaluations(supplierId?: number, requestId?: number) {
    return prisma.supplierEvaluation.findMany({
      where: {
        ...(supplierId && { IdSuppliers: supplierId }),
        ...(requestId && { IdServiceRequests: requestId })
      },
      include: { Suppliers: true, ServiceRequests: true },
      orderBy: { EvaluationDate: 'desc' }
    })
  }

  // POST - Crear nueva evaluación
  async createEvaluation(data: unknown) {
    const { error, value } = evaluationSchema.validate(data, { abortEarly: false })
    if (error) {
      throw new ValidationError(error.details.map(d => d.message).join(', '))
    }

    return prisma.supplierEvaluation.create({
      data: value,
      include: { Suppliers: true, ServiceRequests: true }
    })
  }

  // PUT - Actualizar evaluación
  async updateEvaluation(data: unknown) {
    const { error, value } = evaluationUpdateSchema.validate(data, { abortEarly: false })
    if (error) {
      throw new ValidationError(error.details.map(d => d.message).join(', '))
    }

    const { Id, ...updateData } = value
    return prisma.supplierEvaluation.update({
      where: { Id },
      data: updateData
    })
  }

  // DELETE - Eliminar evaluación
  async deleteEvaluation(id: number) {
    if (!id || isNaN(id)) {
      throw new ValidationError('Id válido es requerido')
    }

    return prisma.supplierEvaluation.delete({
      where: { Id: id }
    })
  }
}

// Instancia normal (sin Singleton rígido)
const evaluationService = new EvaluationService()

// ---------------------------
// Capa de Controlador
// ---------------------------
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res)
      case 'POST':
        return await handlePost(req, res)
      case 'PUT':
        return await handlePut(req, res)
      case 'DELETE':
        return await handleDelete(req, res)
      default:
        return res.status(405).end()
    }
  } catch (error) {
    console.error('Error in evaluation handler:', error)
    handleError(error, res)
  }
}

// ---------------------------
// Handlers HTTP
// ---------------------------
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const supplierId = req.query.supplierId ? Number(req.query.supplierId) : undefined
  const requestId = req.query.requestId ? Number(req.query.requestId) : undefined

  const evaluations = await evaluationService.getEvaluations(supplierId, requestId)
  res.status(200).json(evaluations)
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const evaluation = await evaluationService.createEvaluation(req.body)
  res.status(201).json(evaluation)
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const evaluation = await evaluationService.updateEvaluation(req.body)
  res.status(200).json(evaluation)
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { Id } = req.query
  const evaluationId = typeof Id === 'string' ? parseInt(Id) : Array.isArray(Id) ? parseInt(Id[0]) : Number(Id)

  const evaluation = await evaluationService.deleteEvaluation(evaluationId)
  res.status(200).json(evaluation)
}

// ---------------------------
// Manejo centralizado de errores
// ---------------------------
function handleError(error: unknown, res: NextApiResponse) {
  if (error instanceof ValidationError) {
    return res.status(400).json({ error: error.message })
  }
  if (error instanceof NotFoundError) {
    return res.status(404).json({ error: error.message })
  }
  res.status(500).json({ error: 'Error interno del servidor' })
}
