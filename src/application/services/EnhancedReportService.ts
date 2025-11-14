import { ReportAdapter, ReportData, ReportOptions, WeeklyPaymentReport } from '../../shared/types/Report'
import { PDFReportAdapter } from '../../infrastructure/adapters/PDFReportAdapter'
import { ExcelReportAdapter } from '../../infrastructure/adapters/ExcelReportAdapter'
import { PrismaClient } from '@prisma/client'
import { 
  ReportGenerationContext, 
  ReportState, 
  ReportStateFactory,
  SmallDatasetState,
  MediumDatasetState,
  LargeDatasetState,
  ErrorState
} from '../states/ReportGenerationState'

export class EnhancedReportService {
  private static instance: EnhancedReportService
  private adapters: Map<string, ReportAdapter>
  private currentContext: ReportGenerationContext | null = null

  private constructor() {
    this.adapters = new Map()
    this.initializeAdapters()
  }

  public static getInstance(): EnhancedReportService {
    if (!EnhancedReportService.instance) {
      EnhancedReportService.instance = new EnhancedReportService()
    }
    return EnhancedReportService.instance
  }

  private initializeAdapters(): void {
    this.adapters.set('pdf', new PDFReportAdapter())
    this.adapters.set('excel', new ExcelReportAdapter())
    this.adapters.set('xlsx', new ExcelReportAdapter())
  }

  /**
   * Genera un reporte con manejo de estados inteligente
   */
  async generateWeeklyPaymentReportWithState(
    prisma: PrismaClient,
    startDate: Date,
    endDate: Date,
    options: ReportOptions,
    userType: string = 'basic_user'
  ): Promise<{ 
    success: boolean; 
    data?: Buffer; 
    filename: string; 
    mimeType: string; 
    error?: string;
    state?: string;
    estimatedTime?: number;
  }> {
    console.log('\n' + '='.repeat(20))
    console.log('🚀 INICIANDO GENERACIÓN DE REPORTE')
    console.log('='.repeat(20))
    console.log(`📅 Período: ${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`)
    console.log(`📄 Formato solicitado: ${options.format.toUpperCase()}`)
    console.log(`👤 Tipo de usuario: ${userType}`)
    console.log('─'.repeat(20))

    try {
      // 1. Obtener datos y determinar volumen
      console.log('\n📊 PASO 1: Obteniendo datos de la base de datos...')
      const payments = await this.getWeeklyPayments(prisma, startDate, endDate)
      const dataVolume = payments.length
      console.log(`✅ Datos obtenidos: ${dataVolume} registros encontrados`)

      // 2. Crear contexto con estado apropiado
      console.log('\n🏭 PASO 2: Determinando estado inicial según volumen de datos...')
      const initialState = ReportStateFactory.createState(dataVolume, userType)
      this.currentContext = new ReportGenerationContext(initialState, dataVolume, userType)
      console.log(`✅ Estado inicial creado: ${this.currentContext.getState().getStateName()}`)
      console.log(`⏱️  Tiempo estimado: ${this.currentContext.getState().getEstimatedTime()}ms`)
      console.log(`📋 Formatos disponibles: ${this.currentContext.getState().getAvailableFormats().join(', ')}`)

      // 3. Verificar si se puede generar
      console.log('\n✅ PASO 3: Verificando capacidad de generación...')
      const canGenerate = this.currentContext.getState().canGenerate()
      console.log(`   Estado actual: ${this.currentContext.getState().getStateName()}`)
      console.log(`   ¿Puede generar? ${canGenerate ? '✅ SÍ' : '❌ NO'}`)
      
      if (!canGenerate) {
        console.log('❌ ERROR: El estado actual no permite generación')
        this.currentContext.setState(new ErrorState('Estado actual no permite generación'))
        return {
          success: false,
          filename: '',
          mimeType: '',
          error: 'No se puede generar reporte en el estado actual',
          state: this.currentContext.getState().getStateName()
        }
      }

      // 4. Generar reporte según el estado
      console.log('\n⚙️  PASO 4: Ejecutando generación según el estado...')
      this.currentContext.setStartTime()
      const startTime = Date.now()
      console.log(`   ⏱️  Cronómetro iniciado a las ${new Date().toISOString()}`)
      console.log(`   🔄 Ejecutando lógica del estado: ${this.currentContext.getState().getStateName()}`)
      
      await this.currentContext.getState().generateReport(this.currentContext)
      
      const generationTime = Date.now() - startTime
      console.log(`   ✅ Generación del estado completada en ${generationTime}ms`)

      // 5. Transformar datos
      console.log('\n🔄 PASO 5: Transformando datos al formato del reporte...')
      const reportData = this.transformToReportData(payments, startDate, endDate)
      console.log(`   ✅ Datos transformados:`)
      console.log(`      - Total de pagos: ${reportData.totalPayments}`)
      console.log(`      - Monto total: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(reportData.totalAmount)}`)

      // 6. Obtener adaptador apropiado según el estado
      console.log('\n🔌 PASO 6: Verificando formato y seleccionando adaptador...')
      const availableFormats = this.currentContext.getState().getAvailableFormats()
      console.log(`   📋 Formatos disponibles en estado actual: ${availableFormats.join(', ')}`)
      console.log(`   📄 Formato solicitado: ${options.format}`)
      
      if (!availableFormats.includes(options.format)) {
        console.log(`   ❌ ERROR: Formato ${options.format} no está disponible en el estado actual`)
        this.currentContext.setState(new ErrorState(`Formato ${options.format} no disponible en estado actual`))
        return {
          success: false,
          filename: '',
          mimeType: '',
          error: `Formato ${options.format} no disponible para datasets de este tamaño`,
          state: this.currentContext.getState().getStateName()
        }
      }
      console.log(`   ✅ Formato ${options.format} está disponible`)

      const adapter = this.getAdapter(options.format)
      if (!adapter) {
        console.log(`   ❌ ERROR: Adaptador no encontrado para formato ${options.format}`)
        this.currentContext.setState(new ErrorState(`Adaptador no encontrado para formato ${options.format}`))
        return {
          success: false,
          filename: '',
          mimeType: '',
          error: `Formato de reporte no soportado: ${options.format}`,
          state: this.currentContext.getState().getStateName()
        }
      }
      console.log(`   ✅ Adaptador seleccionado: ${adapter.constructor.name}`)

      // 7. Generar reporte usando el adaptador
      console.log('\n🖨️  PASO 7: Generando archivo con el adaptador...')
      const adapterStartTime = Date.now()
      console.log(`   🔄 Iniciando generación de ${options.format.toUpperCase()}...`)
      
      const result = await adapter.generate(reportData, options)
      
      const adapterTime = Date.now() - adapterStartTime
      if (result.success) {
        console.log(`   ✅ Archivo generado exitosamente en ${adapterTime}ms`)
        console.log(`   📁 Nombre del archivo: ${result.filename}`)
        console.log(`   📦 Tamaño: ${(result.data as Buffer)?.length || 0} bytes`)
      } else {
        console.log(`   ❌ Error al generar archivo: ${result.error}`)
      }

      // 8. Cambiar a estado completado
      console.log('\n✅ PASO 8: Finalizando proceso...')
      const previousState = this.currentContext.getState().getStateName()
      this.currentContext.setState(new CompletedState())
      console.log(`   🔄 Cambio de estado: ${previousState} → ${this.currentContext.getState().getStateName()}`)

      const elapsedTime = this.currentContext.getElapsedTime()
      console.log(`\n${'='.repeat(20)}`)
      console.log('✅ REPORTE GENERADO EXITOSAMENTE')
      console.log('='.repeat(20))
      console.log(`📊 Estado final: ${this.currentContext.getState().getStateName()}`)
      console.log(`⏱️  Tiempo total transcurrido: ${elapsedTime}ms`)
      console.log(`⏱️  Tiempo estimado inicial: ${this.currentContext.getState().getEstimatedTime()}ms`)
      console.log(`📁 Archivo: ${result.filename}`)
      console.log(`📦 Tamaño: ${(result.data as Buffer)?.length || 0} bytes`)
      console.log('='.repeat(20) + '\n')

      return {
        success: result.success,
        data: result.data as Buffer,
        filename: result.filename,
        mimeType: result.mimeType,
        error: result.error,
        state: this.currentContext.getState().getStateName(),
        estimatedTime: this.currentContext.getState().getEstimatedTime()
      }

    } catch (error) {
      console.log('\n' + '='.repeat(20))
      console.log('❌ ERROR EN LA GENERACIÓN DEL REPORTE')
      console.log('='.repeat(20))
      console.error(`   Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      
      if (this.currentContext) {
        const previousState = this.currentContext.getState().getStateName()
        this.currentContext.setState(new ErrorState(error instanceof Error ? error.message : 'Error desconocido'))
        console.log(`   🔄 Cambio de estado: ${previousState} → ${this.currentContext.getState().getStateName()}`)
      }
      
      console.log('='.repeat(20) + '\n')
      
      return {
        success: false,
        filename: '',
        mimeType: '',
        error: error instanceof Error ? error.message : 'Error desconocido generando reporte',
        state: this.currentContext?.getState().getStateName() || 'Error'
      }
    }
  }

  /**
   * Obtiene el estado actual del proceso de generación
   */
  getCurrentState(): string | null {
    return this.currentContext?.getState().getStateName() || null
  }

  /**
   * Obtiene el tiempo estimado para la generación actual
   */
  getEstimatedTime(): number {
    return this.currentContext?.getState().getEstimatedTime() || 0
  }

  /**
   * Obtiene los formatos disponibles según el estado actual
   */
  getAvailableFormatsForCurrentState(): string[] {
    return this.currentContext?.getState().getAvailableFormats() || []
  }

  // Métodos existentes del ReportService original
  private async getWeeklyPayments(prisma: PrismaClient, startDate: Date, endDate: Date): Promise<WeeklyPaymentReport[]> {
    try {
      console.log(`   🔍 Consultando base de datos...`)
      console.log(`      Fecha inicio: ${startDate.toISOString().split('T')[0]}`)
      console.log(`      Fecha fin: ${endDate.toISOString().split('T')[0]}`)
      
      const totalPayments = await prisma.pay.count()
      console.log(`   📊 Total de pagos en BD: ${totalPayments}`)
      
      if (totalPayments === 0) {
        console.log(`   ⚠️  No hay pagos en la base de datos`)
        return []
      }
      
      const payments = await prisma.pay.findMany({
        where: {
          PaymentDate: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          Contracts: {
            include: {
              Suppliers: true
            }
          }
        },
        orderBy: {
          PaymentDate: 'desc'
        }
      })
      
      console.log(`   ✅ Pagos encontrados en el período: ${payments.length}`)
      
      if (payments.length === 0) {
        console.log(`   ⚠️  No hay pagos en el período seleccionado`)
        return []
      }
      
      const mappedPayments = payments.map(payment => ({
        id: payment.Id,
        paymentDate: new Date(payment.PaymentDate),
        amount: payment.Amount,
        paymentMethod: payment.PaymentMethod,
        contractId: payment.IdContracts,
        supplierName: payment.Contracts.Suppliers.Name,
        supplierPhone: payment.Contracts.Suppliers.Phone,
        supplierEmail: payment.Contracts.Suppliers.Email,
        contractDescription: payment.Contracts.Description,
        contractStartDate: new Date(payment.Contracts.StartDate),
        contractEndDate: new Date(payment.Contracts.EndDate),
        contractAmount: payment.Contracts.Amount,
        remainingDebt: payment.Contracts.Debt
      }))
      
      console.log(`   ✅ Datos mapeados correctamente`)
      return mappedPayments
    } catch (error) {
      console.error('   ❌ ERROR en getWeeklyPayments:', error)
      throw error
    }
  }

  private transformToReportData(
    payments: WeeklyPaymentReport[],
    startDate: Date,
    endDate: Date
  ): ReportData {
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)
    
    return {
      title: 'Reporte Semanal de Pagos a Proveedores',
      period: {
        startDate,
        endDate
      },
      totalPayments: payments.length,
      totalAmount,
      payments: payments || [],
      generatedAt: new Date()
    }
  }

  private getAdapter(format: string): ReportAdapter | undefined {
    return this.adapters.get(format.toLowerCase())
  }

  getAvailableFormats(): string[] {
    return Array.from(this.adapters.keys())
  }

  registerAdapter(format: string, adapter: ReportAdapter): void {
    this.adapters.set(format.toLowerCase(), adapter)
  }
}

// Estado completado
class CompletedState implements ReportState {
  canGenerate(): boolean {
    return false // Ya está completado
  }

  async generateReport(context: ReportGenerationContext): Promise<void> {
    console.log('   ✅ [CompletedState] Reporte ya completado, no se requiere acción adicional')
    // No hacer nada, ya está completado
  }

  getAvailableFormats(): string[] {
    return ['pdf', 'excel']
  }

  getEstimatedTime(): number {
    return 0
  }

  getStateName(): string {
    return 'Completed'
  }
}
