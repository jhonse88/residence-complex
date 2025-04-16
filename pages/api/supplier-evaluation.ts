import prisma from '@/app/lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    Id,
    EvaluationDate,
    Qualification,
    Comments,
    IdSuppliers,
    IdServiceRequests
  } = req.body;

  if (req.method === 'GET') {
    try {
      const { supplierId, requestId } = req.query;
      
      const evaluations = await prisma.supplierEvaluation.findMany({
        where: {
          ...(supplierId && { IdSuppliers: Number(supplierId) }),
          ...(requestId && { IdServiceRequests: Number(requestId) })
        },
        include: {
          Suppliers: true,
          ServiceRequests: true
        },
        orderBy: { EvaluationDate: 'desc' }
      });
  
      res.status(200).json(evaluations);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      res.status(500).json({ error: 'Error al obtener evaluaciones' });
    }
  } else if (req.method === 'POST') {
    try {
      // Validar que la calificación esté entre 1 y 5
      if (Qualification < 1 || Qualification > 5) {
        return res.status(400).json({ error: 'La calificación debe ser entre 1 y 5' });
      }

      const newEvaluation = await prisma.supplierEvaluation.create({
        data: {
          EvaluationDate: new Date(EvaluationDate),
          Qualification: Number(Qualification),
          Comments,
          IdSuppliers: Number(IdSuppliers),
          IdServiceRequests: Number(IdServiceRequests)
        },
        include: {
          Suppliers: true,
          ServiceRequests: true
        }
      });
      res.status(201).json(newEvaluation);
    } catch (error) {
      res.status(500).json({ error: `Error al crear evaluación: ${error}` });
    }
  } else if (req.method === 'PUT') {
    try {
      const updatedEvaluation = await prisma.supplierEvaluation.update({
        where: { Id: Number(Id) },
        data: {
          EvaluationDate: new Date(EvaluationDate),
          Qualification: Number(Qualification),
          Comments,
          IdSuppliers: Number(IdSuppliers),
          IdServiceRequests: Number(IdServiceRequests)
        }
      });
      res.status(200).json(updatedEvaluation);
    } catch (error) {
      res.status(500).json({ error: `Error al actualizar evaluación: ${error}` });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { Id } = req.query;
      const evaluationId = typeof Id === 'string' ? parseInt(Id) : Array.isArray(Id) ? parseInt(Id[0]) : Id;

      const deletedEvaluation = await prisma.supplierEvaluation.delete({
        where: { Id: evaluationId }
      });
      
      res.status(200).json(deletedEvaluation);
    } catch (error) {
      res.status(500).json({ error: `Error al eliminar evaluación: ${error}` });
    }
  } else {
    res.status(405).end();
  }
}