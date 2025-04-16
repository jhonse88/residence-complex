import prisma from '@/app/lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { 
    Id,
    Name,
    Phone,
    Email,
    State
  } = req.body;

  // Normalizar el término de búsqueda

  if (req.method === 'GET') {
    try {
      const { searchTerm, startIndex = 0, endIndex = 10 } = req.query;
      
      // Normalizar el término de búsqueda
      const searchTermString = (Array.isArray(searchTerm) ? searchTerm[0] : searchTerm ) || '';
      const skip = Number(startIndex);
      const take = Number(endIndex) - Number(startIndex);
  
      let whereCondition = {};
      if (searchTermString) {
        whereCondition = {
          Name: {
            contains: searchTermString,
            // mode: 'insensitive' // Solo si tu DB lo soporta
          }
        };
      }
  
      // Obtener proveedores paginados
      const suppliers = await prisma.suppliers.findMany({
        where: whereCondition,
        orderBy: { Name: 'asc' },
        skip,
        take
      });
  
      // Obtener el conteo total para paginación
      const totalCount = await prisma.suppliers.count({
        where: whereCondition
      });
  
      res.status(200).json({
        suppliers,
        count: totalCount,
        currentPage: Math.floor(skip / take) + 1,
        totalPages: Math.ceil(totalCount / take)
      });
  
    }catch (error) {
      console.error('Error fetching suppliers:', error);
      res.status(500).json({ error: 'Error al obtener proveedores' });
    }
  } else if (req.method === 'POST') {
    try {
      const supplier = await prisma.suppliers.create({
        data: {
          Name,
          Phone,
          Email,
          State: State !== undefined ? State : true // Valor por defecto true si no se especifica
        },
      });
      res.status(201).json(supplier);
    } catch (error) {
      res.status(500).json({ error: `Error al crear el proveedor ${error}`});
    }
  } else if (req.method === 'PUT') {
    try {
      const supplier = await prisma.suppliers.update({
        where: { Id: Id },
        data: {
          Name,
          Phone,
          Email,
          State
        },
      });
      res.status(200).json(supplier);
    } catch (error) {
      res.status(500).json({ error: `Error al actualizar el proveedor ${error}` });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { Id } = req.query;
      const supplierId = typeof Id === 'string' ? parseInt(Id) : Array.isArray(Id) ? parseInt(Id[0]) : Id;
      
      const supplier = await prisma.suppliers.update({
        where: { Id: supplierId },
        data: {
          State: false
        }
      });
      
      res.status(200).json(supplier);
    } catch (error) {
      res.status(500).json({ error: `Error al eliminar el proveedor ${error}` });
    }
  }
  else {
    res.status(405).end();
  }
}