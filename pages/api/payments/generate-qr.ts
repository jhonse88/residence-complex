import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/app/lib/prisma";
import QRCode from "qrcode";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { contractId, amount } = req.body;

  try {
    // Obtener el contrato con la información del proveedor
    const contract = await prisma.contracts.findUnique({
      where: { Id: Number(contractId) },
      include: {
        Suppliers: {
          select: {
            Phone: true,
            Name: true,
          },
        },
      },
    });

    if (!contract || !contract.Suppliers?.Phone) {
      return res
        .status(404)
        .json({ error: "Contrato o teléfono no encontrado" });
    }

    // Limpiar y formatear el número de teléfono
    const rawPhone = contract.Suppliers.Phone;
    const cleanedPhone = rawPhone.replace(/\D/g, ""); // Elimina todo excepto dígitos
    const phoneNumber = cleanedPhone.startsWith("57")
      ? cleanedPhone
      : `57${cleanedPhone}`;

    const formattedAmount = Number(amount).toFixed(2);
    const reference = `Pago contrato ${contractId}`;

    // Crear el enlace de pago Nequi (formato oficial)
    // Puedes agregar esta URL alternativa para usuarios en navegadores
    const nequiLink = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=Pago%20de%20$${formattedAmount}%20por%20contrato%20${contractId}`;


    // Generar el QR code
    const qrCode = await QRCode.toDataURL(nequiLink, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: "#FFFFFF",
      },
    });

    res.status(200).json({
      qrCode,
      phoneNumber: `+${phoneNumber}`,
      amount: formattedAmount,
      nequiLink,
      reference,
      supplierName: contract.Suppliers.Name,
    });
  } catch (error) {
    console.error("Error generando QR:", error);
    res.status(500).json({
      error: "Error al generar código QR",
      details: error instanceof Error ? error.message : "Error desconocido",
    });
  }
}
