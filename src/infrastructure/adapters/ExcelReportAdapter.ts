import * as XLSX from 'xlsx'
import { ReportAdapter, ReportData, ReportOptions, ReportResult } from '../../shared/types/Report'

export class ExcelReportAdapter implements ReportAdapter {
  async generate(data: ReportData, options: ReportOptions): Promise<ReportResult> {
    try {
      const workbook = XLSX.utils.book_new()
      
      // Crear hoja de resumen
      if (options.includeSummary !== false) {
        const summaryData = [
          ['REPORTE SEMANAL DE PAGOS A PROVEEDORES'],
          [''],
          ['Período:', `${this.formatDate(data.period.startDate)} - ${this.formatDate(data.period.endDate)}`],
          ['Generado el:', this.formatDate(data.generatedAt)],
          [''],
          ['RESUMEN EJECUTIVO'],
          ['Total de pagos:', data.totalPayments],
          ['Monto total:', data.totalAmount],
          [''],
          ['Este reporte contiene las siguientes hojas:'],
          ['• Resumen: Información general del período'],
          ['• Detalle de Pagos: Lista completa de todos los pagos'],
          ['• Estadísticas: Análisis por proveedor y método de pago']
        ]
        
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
        
        // Aplicar estilos básicos a la hoja de resumen
        const summaryRange = XLSX.utils.decode_range(summarySheet['!ref'] || 'A1')
        for (let row = summaryRange.s.r; row <= summaryRange.e.r; row++) {
          for (let col = summaryRange.s.c; col <= summaryRange.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
            if (!summarySheet[cellAddress]) continue
            
            if (row === 0) {
              // Título principal
              summarySheet[cellAddress].s = {
                font: { bold: true, size: 16 },
                alignment: { horizontal: 'center' }
              }
            } else if (row === 5) {
              // Subtítulo "RESUMEN EJECUTIVO"
              summarySheet[cellAddress].s = {
                font: { bold: true, size: 12 },
                fill: { fgColor: { rgb: 'E3F2FD' } }
              }
            } else if (row >= 9) {
              // Información de hojas
              summarySheet[cellAddress].s = {
                font: { size: 10 },
                alignment: { horizontal: 'left' }
              }
            }
          }
        }
        
        // Ajustar ancho de columnas
        summarySheet['!cols'] = [
          { wch: 25 },
          { wch: 35 }
        ]
        
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen')
      }
      
      // Crear hoja de datos detallados
      const headers = [
        'Fecha de Pago',
        'Proveedor',
        'Teléfono',
        'Email',
        'ID Contrato',
        'Descripción Contrato',
        'Fecha Inicio',
        'Fecha Fin',
        'Monto Contrato',
        'Monto Pagado',
        'Método de Pago',
        'Deuda Restante'
      ]
      
      const tableData = data.payments && data.payments.length > 0 
        ? data.payments.map(payment => [
            this.formatDate(payment.paymentDate),
            payment.supplierName,
            payment.supplierPhone,
            payment.supplierEmail,
            payment.contractId,
            payment.contractDescription,
            this.formatDate(payment.contractStartDate),
            this.formatDate(payment.contractEndDate),
            payment.contractAmount, // Número sin formato para Excel
            payment.amount, // Número sin formato para Excel
            payment.paymentMethod,
            payment.remainingDebt // Número sin formato para Excel
          ])
        : [['No hay pagos en el período seleccionado', '', '', '', '', '', '', '', '', '', '', '']]
      
      const dataSheet = XLSX.utils.aoa_to_sheet([headers, ...tableData])
      
      // Aplicar estilos a los headers
      const headerRange = XLSX.utils.decode_range(dataSheet['!ref'] || 'A1')
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
        if (dataSheet[cellAddress]) {
          dataSheet[cellAddress].s = {
            font: { bold: true, size: 11 },
            fill: { fgColor: { rgb: '2980B9' } },
            fgColor: { rgb: 'FFFFFF' },
            alignment: { horizontal: 'center' }
          }
        }
      }
      
      // Aplicar formato de moneda a las columnas numéricas
      const currencyColumns = [8, 9, 11] // Monto Contrato, Monto Pagado, Deuda Restante
      for (let row = 1; row <= tableData.length; row++) {
        currencyColumns.forEach(col => {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
          if (dataSheet[cellAddress]) {
            dataSheet[cellAddress].z = '#,##0' // Formato de número con separadores de miles
          }
        })
      }
      
      // Ajustar ancho de columnas
      dataSheet['!cols'] = [
        { wch: 12 }, // Fecha de Pago
        { wch: 25 }, // Proveedor
        { wch: 15 }, // Teléfono
        { wch: 30 }, // Email
        { wch: 10 }, // ID Contrato
        { wch: 35 }, // Descripción Contrato
        { wch: 12 }, // Fecha Inicio
        { wch: 12 }, // Fecha Fin
        { wch: 15 }, // Monto Contrato
        { wch: 15 }, // Monto Pagado
        { wch: 15 }, // Método de Pago
        { wch: 15 }  // Deuda Restante
      ]
      
      XLSX.utils.book_append_sheet(workbook, dataSheet, 'Detalle de Pagos')
      
      // Crear hoja de estadísticas (siempre, sin gráficos)
      const statsData = this.generateStatisticsData(data)
      const statsSheet = XLSX.utils.aoa_to_sheet(statsData)
      
      // Aplicar estilos a la hoja de estadísticas
      const statsRange = XLSX.utils.decode_range(statsSheet['!ref'] || 'A1')
      for (let row = statsRange.s.r; row <= statsRange.e.r; row++) {
        for (let col = statsRange.s.c; col <= statsRange.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
          if (!statsSheet[cellAddress]) continue
          
          if (row === 0) {
            // Título principal
            statsSheet[cellAddress].s = {
              font: { bold: true, size: 14 },
              alignment: { horizontal: 'center' }
            }
          } else if (row === 2 || row === 7 || row === 12) {
            // Subtítulos de secciones
            statsSheet[cellAddress].s = {
              font: { bold: true, size: 12 },
              fill: { fgColor: { rgb: 'E8F5E8' } }
            }
          } else if (row === 7 || row === 12) {
            // Headers de tablas
            statsSheet[cellAddress].s = {
              font: { bold: true, size: 11 },
              fill: { fgColor: { rgb: 'E3F2FD' } }
            }
          }
        }
      }
      
      // Aplicar formato de moneda a las columnas de montos
      const statsCurrencyColumns = [2] // Columna de montos
      for (let row = 8; row <= statsRange.e.r; row++) {
        statsCurrencyColumns.forEach(col => {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
          if (statsSheet[cellAddress] && typeof statsSheet[cellAddress].v === 'number') {
            statsSheet[cellAddress].z = '#,##0' // Formato de número con separadores de miles
          }
        })
      }
      
      statsSheet['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 20 }]
      XLSX.utils.book_append_sheet(workbook, statsSheet, 'Estadísticas')
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const filename = `reporte_pagos_semanal_${this.formatDateForFilename(data.period.startDate)}_${this.formatDateForFilename(data.period.endDate)}.xlsx`
      
      return {
        success: true,
        data: Buffer.from(excelBuffer),
        filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    } catch (error) {
      return {
        success: false,
        data: undefined,
        filename: '',
        mimeType: '',
        error: error instanceof Error ? error.message : 'Error desconocido generando Excel'
      }
    }
  }
  
  getSupportedFormats(): string[] {
    return ['excel', 'xlsx']
  }
  
  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }
  
  private formatDateForFilename(date: Date): string {
    return date.toISOString().split('T')[0]
  }
  
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }
  
  private generateStatisticsData(data: ReportData): any[][] {
    if (!data.payments || data.payments.length === 0) {
      return [
        ['ESTADÍSTICAS DEL PERÍODO'],
        [''],
        ['No hay datos disponibles para el período seleccionado']
      ]
    }
    
    const statsData = [
      ['ESTADÍSTICAS DEL PERÍODO'],
      [''],
      ['RESUMEN GENERAL'],
      ['Total de pagos:', data.totalPayments],
      ['Monto total:', data.totalAmount],
      [''],
      ['ESTADÍSTICAS POR PROVEEDOR'],
      ['Proveedor', 'Cantidad de Pagos', 'Monto Total']
    ]
    
    // Agrupar por proveedor
    const supplierStats = data.payments.reduce((acc, payment) => {
      if (!acc[payment.supplierName]) {
        acc[payment.supplierName] = { count: 0, total: 0 }
      }
      acc[payment.supplierName].count++
      acc[payment.supplierName].total += payment.amount
      return acc
    }, {} as Record<string, { count: number; total: number }>)
    
    Object.entries(supplierStats).forEach(([supplier, stats]) => {
      statsData.push([
        supplier,
        stats.count,
        stats.total // Número sin formato para Excel
      ])
    })
    
    // Agrupar por método de pago
    const methodStats = data.payments.reduce((acc, payment) => {
      if (!acc[payment.paymentMethod]) {
        acc[payment.paymentMethod] = { count: 0, total: 0 }
      }
      acc[payment.paymentMethod].count++
      acc[payment.paymentMethod].total += payment.amount
      return acc
    }, {} as Record<string, { count: number; total: number }>)
    
    statsData.push([''])
    statsData.push(['ESTADÍSTICAS POR MÉTODO DE PAGO'])
    statsData.push(['Método de Pago', 'Cantidad', 'Monto Total'])
    
    Object.entries(methodStats).forEach(([method, stats]) => {
      statsData.push([
        method,
        stats.count,
        stats.total // Número sin formato para Excel
      ])
    })
    
    return statsData
  }
}
