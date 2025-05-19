/* eslint-disable @typescript-eslint/ban-ts-comment */
import prisma from "@/app/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { Id, PaymentDate, Amount, PaymentMethod, IdContracts } = req.body;

  if (req.method === "GET") {
    try {
      const { contractId, currentId, direction, skip, take } = req.query;

      // Modo modal: navegación individual
      if (contractId && (currentId || direction === "last")) {
        let whereClause = { IdContracts: Number(contractId) };
        let orderBy = {};
        const take = 1;

        if (direction === "next" && currentId) {
          orderBy = { Id: "asc" };
          // @ts-ignore
          whereClause = { ...whereClause, Id: { gt: Number(currentId) } };
        } else if (direction === "prev" && currentId) {
          orderBy = { Id: "desc" };
          // @ts-ignore
          whereClause = { ...whereClause, Id: { lt: Number(currentId) } };
        } else if (direction === "last") {
          orderBy = { Id: "desc" };
        }

        const payment = await prisma.pay.findFirst({
          where: whereClause,
          orderBy,
          take,
          include: {
            Contracts: true,
          },
        });

        return res.status(200).json(payment || null);
      }

      // Modo tabla: paginación tradicional
      const parsedSkip = skip ? Number(skip) : 0;
      const parsedTake = take ? Number(take) : 10;

      const whereClause = IdContracts
        ? { IdContracts: Number(IdContracts) }
        : {};

      const payments = await prisma.pay.findMany({
        skip: parsedSkip,
        take: parsedTake,
        where: whereClause,
        orderBy: { PaymentDate: "desc" },
        include: {
          Contracts: true,
        },
      });

      const totalCount = await prisma.pay.count({
        where: whereClause,
      });

      res.status(200).json({
        payments,
        count: totalCount,
        currentPage: Math.floor(parsedSkip / parsedTake) + 1,
        totalPages: Math.ceil(totalCount / parsedTake),
      });
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ error: "Error al obtener pagos" });
    }
  } else if (req.method === "POST") {
    try {
      // Validación básica
      if (!PaymentDate || !Amount || !PaymentMethod || !IdContracts) {
        return res.status(400).json({ error: "Faltan campos requeridos" });
      }

      const newPayment = await prisma.$transaction(async (prisma) => {
        // Crear el pago
        const payment = await prisma.pay.create({
          data: {
            PaymentDate: new Date(PaymentDate),
            Amount: Number(Amount),
            PaymentMethod,
            IdContracts: Number(IdContracts),
          },
          include: {
            Contracts: true,
          },
        });

        // Actualizar la deuda del contrato
        await prisma.contracts.update({
          where: { Id: Number(IdContracts) },
          data: {
            Debt: {
              decrement: Number(Amount),
            },
          },
        });

        return payment;
      });

      res.status(201).json(newPayment);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ error: "Error al crear pago" });
    }
  } else if (req.method === "PUT") {
    try {
      if (!Id || !PaymentDate || !Amount || !PaymentMethod || !IdContracts) {
        return res.status(400).json({ error: "Faltan campos requeridos" });
      }

      // En el método PUT (actualización de pago):
      const updatedPayment = await prisma.$transaction(async (prisma) => {
        // Obtener el pago anterior para saber cuánto se debe ajustar
        const oldPayment = await prisma.pay.findUnique({
          where: { Id: Number(Id) },
        });

        // Actualizar el pago
        const payment = await prisma.pay.update({
          where: { Id: Number(Id) },
          data: {
            PaymentDate: new Date(PaymentDate),
            Amount: Number(Amount),
            PaymentMethod,
            IdContracts: Number(IdContracts),
          },
          include: {
            Contracts: true,
          },
        });

        // Calcular la diferencia y ajustar la deuda
        if (oldPayment) {
          const difference = Number(Amount) - oldPayment.Amount;
          await prisma.contracts.update({
            where: { Id: Number(IdContracts) },
            data: {
              Debt: {
                decrement: difference,
              },
            },
          });
        }

        return payment;
      });

      res.status(200).json(updatedPayment);
    } catch (error) {
      console.error("Error updating payment:", error);
      res.status(500).json({ error: "Error al actualizar pago" });
    }
  } else if (req.method === "DELETE") {
    try {
      const { Id } = req.query;
      if (!Id) {
        return res.status(400).json({ error: "ID no proporcionado" });
      }

      const paymentId =
        typeof Id === "string"
          ? parseInt(Id)
          : Array.isArray(Id)
          ? parseInt(Id[0])
          : Id;

      const deletedPayment = await prisma.pay.delete({
        where: { Id: paymentId },
      });

      res.status(200).json(deletedPayment);
    } catch (error) {
      console.error("Error deleting payment:", error);
      res.status(500).json({ error: "Error al eliminar pago" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
