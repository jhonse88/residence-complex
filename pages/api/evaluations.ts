/* eslint-disable @typescript-eslint/no-unused-vars */
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
      const { serviceRequestId } = req.query;

      if (serviceRequestId) {
        const evaluation = await prisma.supplierEvaluation.findFirst({
          where: { IdServiceRequests: Number(serviceRequestId) },
          include: {
            Suppliers: true,
            ServiceRequests: true
          }
        });

        return res.status(200).json(evaluation || null);
      }

      const evaluations = await prisma.supplierEvaluation.findMany({
        include: {
          Suppliers: true,
          ServiceRequests: true
        }
      });

      res.status(200).json(evaluations);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      res.status(500).json({ error: 'Error al obtener evaluaciones' });
    }
  } else if (req.method === 'POST' || req.method === 'PATCH') {
    try {
      if (!IdServiceRequests || !Qualification) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
      }

      const serviceRequest = await prisma.serviceRequests.findUnique({
        where: { Id: Number(IdServiceRequests) }
      });

      if (!serviceRequest) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }

      const existingEvaluation = await prisma.supplierEvaluation.findFirst({
        where: { IdServiceRequests: Number(IdServiceRequests) }
      });

      let evaluation;
      const evaluationData = {
        EvaluationDate: new Date(),
        Qualification: Number(Qualification),
        Comments: Comments || '',
        IdSuppliers: serviceRequest.IdSuppliers,
        IdServiceRequests: Number(IdServiceRequests)
      };

      if (existingEvaluation) {
        evaluation = await prisma.supplierEvaluation.update({
          where: { Id: existingEvaluation.Id },
          data: evaluationData,
          include: {
            ServiceRequests: true,
            Suppliers: true
          }
        });
      } else {
        evaluation = await prisma.supplierEvaluation.create({
          data: evaluationData,
          include: {
            ServiceRequests: true,
            Suppliers: true
          }
        });
      }

      res.status(200).json(evaluation);
    } catch (error) {
      console.error('Error saving evaluation:', error);
      res.status(500).json({ error: 'Error al guardar evaluación' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'ID no proporcionado' });
      }

      await prisma.supplierEvaluation.delete({
        where: { Id: Number(id) }
      });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      res.status(500).json({ error: 'Error al eliminar evaluación' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}