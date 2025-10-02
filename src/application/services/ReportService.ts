import { ReportAdapter, ReportData, ReportOptions, WeeklyPaymentReport } from '../../shared/types/Report'
import { PDFReportAdapter } from '../../infrastructure/adapters/PDFReportAdapter'
import { ExcelReportAdapter } from '../../infrastructure/adapters/ExcelReportAdapter'
import { PrismaClient } from '@prisma/client'

export class ReportService {
  private static instance: ReportService
  private adapters: Map<string, ReportAdapter>

  private constructor() {
    this.adapters = new Map()
    this.initializeAdapters()
  }

  public static getInstance(): ReportService {
    if (!ReportService.instance) {
      ReportService.instance = new ReportService()
    }
    return ReportService.instance
  }

  private initializeAdapters(): void {
    // Registrar adaptadores disponibles
    this.adapters.set('pdf', new PDFReportAdapter())
    this.adapters.set('excel', new ExcelReportAdapter())
    this.adapters.set('xlsx', new ExcelReportAdapter()) // Alias para Excel
  }

  /**
   * Genera un reporte semanal de pagos a proveedores
   */
  async generateWeeklyPaymentReport(
    prisma: PrismaClient,
    startDate: Date,
    endDate: Date,
    options: ReportOptions
  ): Promise<{ success: boolean; data?: Buffer; filename: string; mimeType: string; error?: string }> {
    try {
      // Obtener datos de pagos del período especificado
      const payments = await this.getWeeklyPayments(prisma, startDate, endDate)
      
      // Transformar datos a formato de reporte
      const reportData = this.transformToReportData(payments, startDate, endDate)
      
      // Obtener el adaptador apropiado
      const adapter = this.getAdapter(options.format)
      if (!adapter) {
        return {
          success: false,
          filename: '',
          mimeType: '',
          error: `Formato de reporte no soportado: ${options.format}`
        }
      }

      // Generar el reporte usando el adaptador
      const result = await adapter.generate(reportData, options)
      
      return {
        success: result.success,
        data: result.data as Buffer,
        filename: result.filename,
        mimeType: result.mimeType,
        error: result.error
      }
    } catch (error) {
      return {
        success: false,
        filename: '',
        mimeType: '',
        error: error instanceof Error ? error.message : 'Error desconocido generando reporte'
      }
    }
  }

  /**
   * Obtiene los pagos del período especificado con información de proveedores y contratos
   */
  private async getWeeklyPayments(prisma: PrismaClient, startDate: Date, endDate: Date): Promise<WeeklyPaymentReport[]> {
    try {
      const totalPayments = await prisma.pay.count()
      
      if (totalPayments === 0) {
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
      
      if (payments.length === 0) {
        return []
      }
      
      return payments.map(payment => ({
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
    } catch (error) {
      console.error('❌ Error en getWeeklyPayments:', error)
      throw error
    }
  }

  /**
   * Transforma los datos de pagos al formato requerido por los adaptadores
   */
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
      payments: payments || [], // Asegurar que siempre sea un array
      generatedAt: new Date()
    }
  }

  /**
   * Obtiene el adaptador apropiado para el formato especificado
   */
  private getAdapter(format: string): ReportAdapter | undefined {
    return this.adapters.get(format.toLowerCase())
  }

  /**
   * Obtiene los formatos de reporte disponibles
   */
  getAvailableFormats(): string[] {
    return Array.from(this.adapters.keys())
  }

  /**
   * Registra un nuevo adaptador de reporte
   */
  registerAdapter(format: string, adapter: ReportAdapter): void {
    this.adapters.set(format.toLowerCase(), adapter)
  }

  /**
   * Obtiene estadísticas de pagos para un período
   */
  async getPaymentStatistics(
    prisma: PrismaClient,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalPayments: number
    totalAmount: number
    paymentsByMethod: Record<string, { count: number; total: number }>
    paymentsBySupplier: Record<string, { count: number; total: number }>
  }> {
    try {
      const payments = await this.getWeeklyPayments(prisma, startDate, endDate)
      
      const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)
      
      const paymentsByMethod = payments.reduce((acc, payment) => {
        if (!acc[payment.paymentMethod]) {
          acc[payment.paymentMethod] = { count: 0, total: 0 }
        }
        acc[payment.paymentMethod].count++
        acc[payment.paymentMethod].total += payment.amount
        return acc
      }, {} as Record<string, { count: number; total: number }>)
      
      const paymentsBySupplier = payments.reduce((acc, payment) => {
        if (!acc[payment.supplierName]) {
          acc[payment.supplierName] = { count: 0, total: 0 }
        }
        acc[payment.supplierName].count++
        acc[payment.supplierName].total += payment.amount
        return acc
      }, {} as Record<string, { count: number; total: number }>)
      
      return {
        totalPayments: payments.length,
        totalAmount,
        paymentsByMethod,
        paymentsBySupplier
      }
      
    } catch (error) {
      console.error('❌ Error en getPaymentStatistics:', error)
      throw error
    }
  }
}
