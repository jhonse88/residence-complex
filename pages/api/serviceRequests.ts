/* eslint-disable @typescript-eslint/no-unused-vars */
import prisma from "@/app/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    Id,
    ApplicationDate,
    Description,
    IdSuppliers,
    EvaluationDate,
    Qualification,
    Comments,
    IdServiceRequests,
  } = req.body;

  if (req.method === "GET") {
    try {
      const {
        supplierId,
        currentId,
        direction,
        includeEvaluation,
        skip,
        take,
      } = req.query;

      // Modo modal: navegación individual
      if (supplierId && (currentId || direction === "last")) {
        let whereClause = { IdSuppliers: Number(supplierId) };
        let orderBy = {};
        const take = 1;

        if (direction === "next" && currentId) {
          orderBy = { Id: "asc" };
          whereClause = { ...whereClause, Id: { gt: Number(currentId) } };
        } else if (direction === "prev" && currentId) {
          orderBy = { Id: "desc" };
          whereClause = { ...whereClause, Id: { lt: Number(currentId) } };
        } else if (direction === "last") {
          orderBy = { Id: "desc" };
        }

        const request = await prisma.serviceRequests.findFirst({
          where: whereClause,
          orderBy,
          take,
          include: {
            Suppliers: true,
            SupplierEvaluation: includeEvaluation === "true",
          },
        });

        return res.status(200).json(request || null);
      }

      // Modo tabla: paginación tradicional
      const parsedSkip = skip ? Number(skip) : 0;
      const parsedTake = take ? Number(take) : 10;

      const whereClause = IdSuppliers
        ? { IdSuppliers: Number(IdSuppliers) }
        : {};

      const serviceRequests = await prisma.serviceRequests.findMany({
        skip: parsedSkip,
        take: parsedTake,
        where: whereClause,
        orderBy: { ApplicationDate: "desc" },
        include: {
          Suppliers: true,
          SupplierEvaluation: includeEvaluation === "true",
        },
      });

      const totalCount = await prisma.serviceRequests.count({
        where: whereClause,
      });

      res.status(200).json({
        serviceRequests,
        count: totalCount,
        currentPage: Math.floor(parsedSkip / parsedTake) + 1,
        totalPages: Math.ceil(totalCount / parsedTake),
      });
    } catch (error) {
      console.error("Error fetching service requests:", error);
      res
        .status(500)
        .json({ error: "Error al obtener solicitudes de servicio" });
    }
  } else if (req.method === "POST") {
    try {
      // Validación básica
      if (!ApplicationDate || !Description || !IdSuppliers) {
        return res.status(400).json({ error: "Faltan campos requeridos" });
      }

      const newRequest = await prisma.serviceRequests.create({
        data: {
          ApplicationDate: new Date(ApplicationDate),
          Description,
          IdSuppliers: Number(IdSuppliers),
        },
        include: {
          Suppliers: true,
          SupplierEvaluation: true,
        },
      });

      res.status(201).json(newRequest);
    } catch (error) {
      console.error("Error creating service request:", error);
      res.status(500).json({ error: "Error al crear solicitud de servicio" });
    }
  } else if (req.method === "PUT") {
    try {
      if (!Id || !ApplicationDate || !Description || !IdSuppliers) {
        return res.status(400).json({ error: "Faltan campos requeridos" });
      }

      const updatedRequest = await prisma.serviceRequests.update({
        where: { Id: Number(Id) },
        data: {
          ApplicationDate: new Date(ApplicationDate),
          Description,
          IdSuppliers: Number(IdSuppliers),
        },
        include: {
          Suppliers: true,
          SupplierEvaluation: true,
        },
      });

      res.status(200).json(updatedRequest);
    } catch (error) {
      console.error("Error updating service request:", error);
      res.status(500).json({ error: "Error al actualizar solicitud" });
    }
  } else if (req.method === "DELETE") {
    try {
      const { Id } = req.query;
      if (!Id) {
        return res.status(400).json({ error: "ID no proporcionado" });
      }

      const requestId =
        typeof Id === "string"
          ? parseInt(Id)
          : Array.isArray(Id)
          ? parseInt(Id[0])
          : Id;

      // Verificar si tiene evaluaciones asociadas
      const evaluations = await prisma.supplierEvaluation.count({
        where: { IdServiceRequests: requestId },
      });

      if (evaluations > 0) {
        return res.status(400).json({
          error: "No se puede eliminar, tiene evaluaciones asociadas",
        });
      }

      const deletedRequest = await prisma.serviceRequests.delete({
        where: { Id: requestId },
      });

      res.status(200).json(deletedRequest);
    } catch (error) {
      console.error("Error deleting service request:", error);
      res.status(500).json({ error: "Error al eliminar solicitud" });
    }
  } else if (req.method === "PATCH") {
    try {
      // Validación para evaluación
      if (!Id || !Qualification) {
        return res.status(400).json({ error: "Faltan campos requeridos" });
      }

      const serviceRequest = await prisma.serviceRequests.findUnique({
        where: { Id: Number(Id) },
      });

      if (!serviceRequest) {
        return res.status(404).json({ error: "Solicitud no encontrada" });
      }

      // Buscar evaluación existente
      const existingEvaluation = await prisma.supplierEvaluation.findFirst({
        where: { IdServiceRequests: Number(Id) },
      });

      let evaluation;
      if (existingEvaluation) {
        // Actualizar evaluación existente
        evaluation = await prisma.supplierEvaluation.update({
          where: { Id: existingEvaluation.Id },
          data: {
            EvaluationDate: new Date(),
            Qualification: Number(Qualification),
            Comments: Comments || "",
            IdSuppliers: serviceRequest.IdSuppliers,
          },
          include: {
            ServiceRequests: true,
          },
        });
      } else {
        // Crear nueva evaluación
        evaluation = await prisma.supplierEvaluation.create({
          data: {
            EvaluationDate: new Date(),
            Qualification: Number(Qualification),
            Comments: Comments || "",
            IdSuppliers: serviceRequest.IdSuppliers,
            IdServiceRequests: Number(Id),
          },
          include: {
            ServiceRequests: true,
          },
        });
      }

      res.status(200).json({
        ...evaluation,
        ServiceRequest: evaluation.ServiceRequests,
      });
    } catch (error) {
      console.error("Error saving evaluation:", error);
      res.status(500).json({ error: "Error al guardar evaluación" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE", "PATCH"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
