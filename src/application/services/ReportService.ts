import { WeeklyPaymentReport, WeeklyPaymentReportData, PaymentStatistics } from '../../shared/types/Report'
import { PrismaClient } from '@prisma/client'

export class ReportService {
  private static instance: ReportService

  private constructor() {}

  public static getInstance(): ReportService {
    if (!ReportService.instance) {
      ReportService.instance = new ReportService()
    }
    return ReportService.instance
  }

  /**
   * Genera un reporte semanal de pagos a proveedores en formato JSON
   */
  async generateWeeklyPaymentReport(
    prisma: PrismaClient,
    startDate: Date,
    endDate: Date
  ): Promise<{ success: boolean; data?: WeeklyPaymentReportData; error?: string }> {
    try {
      // Obtener datos de pagos del período especificado
      const payments = await this.getWeeklyPayments(prisma, startDate, endDate)
      
      // Generar estadísticas
      const statistics = await this.getPaymentStatistics(prisma, startDate, endDate)
      
      // Crear el objeto de reporte completo
      const reportData: WeeklyPaymentReportData = {
        title: 'Reporte Semanal de Pagos a Proveedores',
        period: {
          startDate,
          endDate
        },
        totalPayments: payments.length,
        totalAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
        payments: payments,
        statistics: statistics,
        generatedAt: new Date()
      }
      
      return {
        success: true,
        data: reportData
      }
    } catch (error) {
      return {
        success: false,
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
   * Obtiene estadísticas de pagos para un período
   */
  async getPaymentStatistics(
    prisma: PrismaClient,
    startDate: Date,
    endDate: Date
  ): Promise<PaymentStatistics> {
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
