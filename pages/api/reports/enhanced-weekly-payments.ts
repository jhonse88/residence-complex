import { NextApiRequest, NextApiResponse } from 'next'
import { ServiceFactory } from '../../../src/infrastructure/config/ServiceFactory'
import { EnhancedReportService } from '../../../src/application/services/EnhancedReportService'
import { WeeklyReportRequestDto } from '../../../src/application/dto/ReportDto'

/**
 * API Route mejorada que combina los patrones State y Adapter
 * para generar reportes con manejo inteligente de estados
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Log inmediato al inicio para verificar que el endpoint se está ejecutando
  console.log('\n🔵 ==========================================')
  console.log('🔵 ENDPOINT LLAMADO: enhanced-weekly-payments')
  console.log('🔵 Método:', req.method)
  console.log('🔵 URL:', req.url)
  console.log('🔵 Timestamp:', new Date().toISOString())
  console.log('🔵 ==========================================\n')

  if (req.method !== 'POST') {
    console.log('❌ Método no permitido:', req.method)
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    console.log('📥 Body recibido:', JSON.stringify(req.body, null, 2))
    const { 
      startDate, 
      endDate, 
      format, 
      includeCharts, 
      includeSummary, 
      customTitle,
      userType = 'basic_user' // Nuevo parámetro para el estado del usuario
    } = req.body as WeeklyReportRequestDto & { userType?: string }

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

    // Validar tipo de usuario
    const validUserTypes = ['basic_user', 'premium_user', 'admin_user']
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json({ 
        error: `Tipo de usuario no válido. Tipos soportados: ${validUserTypes.join(', ')}` 
      })
    }

    // Obtener servicio mejorado de reportes
    console.log('\n' + '='.repeat(20))
    console.log('📡 API ENDPOINT: Recibida solicitud de reporte')
    console.log('='.repeat(20))
    
    console.log('🔍 Obteniendo EnhancedReportService...')
    const reportService = EnhancedReportService.getInstance()
    console.log('✅ EnhancedReportService obtenido')
    
    console.log('🔍 Obteniendo PrismaClient...')
    const prisma = ServiceFactory.getPrismaClient()
    console.log('✅ PrismaClient obtenido')

    // Generar reporte con manejo de estados
    const result = await reportService.generateWeeklyPaymentReportWithState(
      prisma,
      start,
      end,
      {
        format: format as 'pdf' | 'excel',
        includeCharts: includeCharts || false,
        includeSummary: includeSummary !== false,
        customTitle: customTitle || undefined
      },
      userType
    )

    console.log('\n' + '='.repeat(20))
    console.log('📡 API ENDPOINT: Preparando respuesta')
    console.log('='.repeat(20))
    console.log(`📊 Estado final del reporte: ${result.state}`)
    console.log(`⏱️  Tiempo estimado: ${result.estimatedTime}ms`)
    console.log(`✅ Éxito: ${result.success ? 'SÍ' : 'NO'}`)

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        state: result.state,
        estimatedTime: result.estimatedTime
      })
    }

    // Configurar headers para descarga del archivo
    res.setHeader('Content-Type', result.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
    res.setHeader('Content-Length', result.data?.length || 0)
    res.setHeader('X-Report-State', result.state || 'Completed')
    res.setHeader('X-Report-Estimated-Time', String(result.estimatedTime || 0))

    console.log('📤 Enviando archivo al cliente')
    console.log(`   📁 Archivo: ${result.filename}`)
    console.log(`   📦 Tamaño: ${result.data?.length || 0} bytes`)
    console.log(`   📄 Tipo: ${result.mimeType}`)

    // Enviar el archivo directamente como blob
    if (result.data) {
      res.status(200).send(result.data)
    } else {
      res.status(500).json({
        success: false,
        error: 'No se pudo generar el archivo',
        state: result.state
      })
    }

  } catch (error) {
    console.error('❌ Error en API de reportes mejorada:', error)
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor',
      state: 'Error'
    })
  }
}
