import prisma from "@/app/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { Id, StartDate, EndDate, Amount, Description, IdSuppliers } = req.body;

  if (req.method === "GET") {
    try {
      const { skip, take, supplierId } = req.query;

      const parsedSkip = skip ? Number(skip) : 0;
      const parsedTake = take ? Number(take) : 10;

      const whereClause = supplierId 
        ? { IdSuppliers: Number(supplierId) } 
        : {};

      const contracts = await prisma.contracts.findMany({
        skip: parsedSkip,
        take: parsedTake,
        where: whereClause,
        orderBy: { StartDate: "desc" },
        include: {
          Suppliers: true,
        },
      });

      const totalCount = await prisma.contracts.count({
        where: whereClause,
      });

      res.status(200).json({
        contracts,
        count: totalCount,
        currentPage: Math.floor(parsedSkip / parsedTake) + 1,
        totalPages: Math.ceil(totalCount / parsedTake),
      });
    } catch (error) {
      console.error("Error fetching contracts:", error);
      res.status(500).json({ error: "Error al obtener contratos" });
    }
  } else if (req.method === "POST") {
    try {
      // Validación básica
      if (!StartDate || !EndDate || !Amount || !IdSuppliers) {
        return res.status(400).json({ error: "Faltan campos requeridos" });
      }

      const newContract = await prisma.contracts.create({
        data: {
          StartDate: new Date(StartDate),
          EndDate: new Date(EndDate),
          Amount: Number(Amount),
          Debt: Number(Amount),
          Description: Description || "",
          IdSuppliers: Number(IdSuppliers),
        },
        include: {
          Suppliers: true,
        },
      });

      res.status(201).json(newContract);
    } catch (error) {
      console.error("Error creating contract:", error);
      res.status(500).json({ error: "Error al crear contrato"});
    }
  } else if (req.method === "PUT") {
    try {
      if (!Id || !StartDate || !EndDate || !Amount || !IdSuppliers) {
        return res.status(400).json({ error: "Faltan campos requeridos" });
      }

      const updatedContract = await prisma.contracts.update({
        where: { Id: Number(Id) },
        data: {
          StartDate: new Date(StartDate),
          EndDate: new Date(EndDate),
          Amount: Number(Amount),
          Description: Description || "",
          IdSuppliers: Number(IdSuppliers),
        },
        include: {
          Suppliers: true,
        },
      });

      res.status(200).json(updatedContract);
    } catch (error) {
      console.error("Error updating contract:", error);
      res.status(500).json({ error: "Error al actualizar contrato" });
    }
  } if (req.method === 'DELETE') {
    try {
      const { Id } = req.body;  // Leer del cuerpo en lugar de query
      
      if (!Id) {
        return res.status(400).json({ error: 'ID no proporcionado' });
      }

      const payments = await prisma.pay.count({
        where: { IdContracts: Id },
      });

      if (payments > 0) {
        return res.status(400).json({
          error: "No se puede eliminar, tiene pagos asociados",
        });
      }
      
      // Lógica para eliminar el contrato...
      await prisma.contracts.delete({ where: { Id: Number(Id) } });
      
      return res.status(200).json({ message: 'Contrato eliminado' });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return res.status(500).json({ error: 'Error al eliminar contrato' });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}