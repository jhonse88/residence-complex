import { NextApiRequest, NextApiResponse } from 'next'
import { ServiceFactory } from '../../../src/infrastructure/config/ServiceFactory'
import { ReportService } from '../../../src/application/services/ReportService'
import { WeeklyReportRequestDto } from '../../../src/application/dto/ReportDto'

/**
 * API Route para generar reportes semanales de pagos en formato JSON
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    const { startDate, endDate } = req.body as WeeklyReportRequestDto

    // Validar datos requeridos
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos: startDate, endDate' 
      })
    }

    // Validar fechas
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Fechas inválidas' })
    }

    if (start > end) {
      return res.status(400).json({ error: 'La fecha de inicio debe ser anterior a la fecha de fin' })
    }

    // Obtener servicio de reportes
    const reportService = ReportService.getInstance()
    const prisma = ServiceFactory.getPrismaClient()

    // Generar reporte JSON
    const result = await reportService.generateWeeklyPaymentReport(prisma, start, end)

    if (!result.success) {
      return res.status(500).json({ 
        error: result.error || 'Error generando reporte' 
      })
    }

    // Retornar JSON
    res.status(200).json(result)

  } catch (error) {
    console.error('Error en generación de reporte:', error)
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    })
  } finally {
    await ServiceFactory.disconnect()
  }
}

