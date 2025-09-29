import { NextApiRequest, NextApiResponse } from 'next'
import { ServiceFactory } from '../../../src/infrastructure/config/ServiceFactory'
import { CreatePaymentDto, UpdatePaymentDto } from '../../../src/application/dto/PaymentDto'

/**
 * API Route para manejo de pagos
 * Implementa los siguientes patrones de diseño:
 * - Singleton: PaymentBuilderService se instancia una sola vez
 * - Builder: Construcción paso a paso de objetos Payment complejos
 * - Director: Orquesta la construcción usando el Builder
 * - Repository: Abstracción de acceso a datos
 * - Service Factory: Inyección de dependencias
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        await handleGet(req, res)
        break
      case 'POST':
        await handlePost(req, res)
        break
      case 'PUT':
        await handlePut(req, res)
        break
      case 'DELETE':
        await handleDelete(req, res)
        break
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
        res.status(405).end(`Method ${req.method} Not Allowed`)
    }
  } catch (error) {
    console.error('Error in payment handler:', error)
    handleError(error, res)
  } finally {
    await ServiceFactory.disconnect()
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { contractId, currentId, direction, skip, take } = req.query

  const paymentService = ServiceFactory.getPaymentService()
  const result = await paymentService.getPayments({
    contractId: contractId ? Number(contractId) : undefined,
    currentId: currentId ? Number(currentId) : undefined,
    direction: direction as string,
    skip: skip ? Number(skip) : undefined,
    take: take ? Number(take) : undefined
  })

  res.status(200).json(result)
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { PaymentDate, Amount, PaymentMethod, IdContracts } = req.body

  if (!PaymentDate || !Amount || !PaymentMethod || !IdContracts) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }

  const dto: CreatePaymentDto = {
    paymentDate: PaymentDate,
    amount: Number(Amount),
    paymentMethod: PaymentMethod,
    contractId: Number(IdContracts)
  }

  // Usar PaymentBuilderService con patrón Builder y Singleton
  const paymentBuilderService = ServiceFactory.getPaymentBuilderService()
  
  // Ejemplo de uso directo del Builder para casos complejos
  const builder = paymentBuilderService.getBuilder()
  const payment = await builder
    .reset()
    .setPaymentDate(dto.paymentDate)
    .setAmount(dto.amount)
    .setPaymentMethod(dto.paymentMethod)
    .setContractId(dto.contractId)
    .execute()
  
  res.status(201).json(payment)
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { Id, PaymentDate, Amount, PaymentMethod, IdContracts } = req.body

  if (!Id) return res.status(400).json({ error: 'ID es requerido' })

  const dto: CreatePaymentDto = {
    paymentDate: PaymentDate,
    amount: Number(Amount),
    paymentMethod: PaymentMethod,
    contractId: Number(IdContracts)
  }

  // Usar PaymentBuilderService con patrón Builder y Singleton
  const paymentBuilderService = ServiceFactory.getPaymentBuilderService()
  const payment = await paymentBuilderService.updatePayment(Number(Id), dto)
  res.status(200).json(payment)
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { Id } = req.query
  const paymentId = typeof Id === 'string' ? parseInt(Id) : Array.isArray(Id) ? parseInt(Id[0]) : Number(Id)

  if (!paymentId) return res.status(400).json({ error: 'ID es requerido' })

  const paymentService = ServiceFactory.getPaymentService()
  await paymentService.deletePayment(paymentId)
  res.status(200).json({ message: 'Pago eliminado' })
}

function handleError(error: unknown, res: NextApiResponse) {
  if (error instanceof Error) {
    if (error.message.includes('es requerido') || error.message.includes('debe ser')) {
      return res.status(400).json({ error: error.message })
    }
  }
  res.status(500).json({ error: 'Error interno del servidor' })
}
