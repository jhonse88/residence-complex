import { NextApiRequest, NextApiResponse } from 'next'
import { ServiceFactory } from '../../../src/infrastructure/config/ServiceFactory'
import { ReportService } from '../../../src/application/services/ReportService'
import { WeeklyReportRequestDto } from '../../../src/application/dto/ReportDto'

/**
 * API Route para generar reportes semanales de pagos
 * Implementa el patrón Adapter para diferentes formatos de reporte
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    const { startDate, endDate, format, includeCharts, includeSummary, customTitle } = req.body as WeeklyReportRequestDto

    // Validar datos requeridos
    if (!startDate || !endDate || !format) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos: startDate, endDate, format' 
      })
    }

    // Validar formato
    const validFormats = ['pdf', 'excel', 'xlsx']
    if (!validFormats.includes(format.toLowerCase())) {
      return res.status(400).json({ 
        error: `Formato no válido. Formatos soportados: ${validFormats.join(', ')}` 
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

    // Generar reporte
    const result = await reportService.generateWeeklyPaymentReport(
      prisma,
      start,
      end,
      {
        format: format.toLowerCase() as 'pdf' | 'excel',
        includeCharts: includeCharts || false,
        includeSummary: includeSummary !== false,
        customTitle: customTitle
      }
    )

    if (!result.success) {
      return res.status(500).json({ 
        error: result.error || 'Error generando reporte' 
      })
    }

    // Configurar headers para descarga
    res.setHeader('Content-Type', result.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
    res.setHeader('Content-Length', result.data?.length || 0)

    // Enviar archivo
    res.status(200).send(result.data)

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

/**
 * Endpoint para obtener estadísticas de pagos (sin generar archivo)
 */
export async function getPaymentStatistics(req: NextApiRequest, res: NextApiResponse) {
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
