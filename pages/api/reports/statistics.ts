import { NextApiRequest, NextApiResponse } from 'next'
import { ServiceFactory } from '../../../src/infrastructure/config/ServiceFactory'
import { ReportService } from '../../../src/application/services/ReportService'

/**
 * API Route para obtener estadísticas de pagos
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    const { startDate, endDate } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Faltan parámetros requeridos: startDate, endDate' 
      })
    }

    const start = new Date(startDate as string)
    const end = new Date(endDate as string)
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Fechas inválidas' })
    }

    if (start > end) {
      return res.status(400).json({ error: 'La fecha de inicio debe ser anterior a la fecha de fin' })
    }

    const reportService = ReportService.getInstance()
    const prisma = ServiceFactory.getPrismaClient()

    const statistics = await reportService.getPaymentStatistics(prisma, start, end)

    res.status(200).json(statistics)

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error)
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    })
  } finally {
    await ServiceFactory.disconnect()
  }
}
