import prisma from '@/app/lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    Id,
    ApplicationDate,
    Description,
    IdSuppliers
  } = req.body;

  if (req.method === 'GET') {
    try {
      const { skip = 0, take = 10 } = req.query;
      
      const serviceRequests = await prisma.serviceRequests.findMany({
        skip: Number(skip),
        take: Number(take),
        orderBy: { ApplicationDate: 'desc' },
        include: {
          Suppliers: true,
          SupplierEvaluation: true
        }
      });

      const totalCount = await prisma.serviceRequests.count();

      res.status(200).json({
        serviceRequests,
        count: totalCount,
        currentPage: Math.floor(Number(skip) / Number(take)) + 1,
        totalPages: Math.ceil(totalCount / Number(take))
      });

    } catch (error) {
      console.error('Error fetching service requests:', error);
      res.status(500).json({ error: 'Error al obtener solicitudes de servicio' });
    }
  } else if (req.method === 'POST') {
    try {
      const newRequest = await prisma.serviceRequests.create({
        data: {
          ApplicationDate: new Date(ApplicationDate),
          Description,
          IdSuppliers: Number(IdSuppliers)
        },
        include: {
          Suppliers: true
        }
      });
      res.status(201).json(newRequest);
    } catch (error) {
      res.status(500).json({ error: `Error al crear solicitud de servicio: ${error}` });
    }
  } else if (req.method === 'PUT') {
    try {
      const updatedRequest = await prisma.serviceRequests.update({
        where: { Id: Number(Id) },
        data: {
          ApplicationDate: new Date(ApplicationDate),
          Description,
          IdSuppliers: Number(IdSuppliers)
        }
      });
      res.status(200).json(updatedRequest);
    } catch (error) {
      res.status(500).json({ error: `Error al actualizar solicitud: ${error}` });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { Id } = req.query;
      const requestId = typeof Id === 'string' ? parseInt(Id) : Array.isArray(Id) ? parseInt(Id[0]) : Id;
      
      // Verificar si tiene evaluaciones asociadas
      const evaluations = await prisma.supplierEvaluation.count({
        where: { IdServiceRequests: requestId }
      });

      if (evaluations > 0) {
        return res.status(400).json({ 
          error: 'No se puede eliminar, tiene evaluaciones asociadas' 
        });
      }

      const deletedRequest = await prisma.serviceRequests.delete({
        where: { Id: requestId }
      });
      
      res.status(200).json(deletedRequest);
    } catch (error) {
      res.status(500).json({ error: `Error al eliminar solicitud: ${error}` });
    }
  } else {
    res.status(405).end();
  }
}