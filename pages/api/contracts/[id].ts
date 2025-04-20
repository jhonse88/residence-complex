// En tu backend (api/contracts/[id].ts o similar)
import prisma from "@/app/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const contract = await prisma.contracts.findUnique({
        where: { Id: Number(id) },
        include: {
          Suppliers: true,
        },
      });

      if (!contract) {
        return res.status(404).json({ error: "Contrato no encontrado" });
      }

      res.status(200).json(contract);
    } catch (error) {
      console.error("Error fetching contract:", error);
      res.status(500).json({ error: "Error al obtener contrato" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}