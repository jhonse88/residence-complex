import jsPDF from 'jspdf'
import { ReportAdapter, ReportData, ReportOptions, ReportResult } from '../../shared/types/Report'

// Función para crear tabla simple sin autoTable
function createSimpleTable(doc: jsPDF, data: string[][], startY: number) {
  const pageWidth = doc.internal.pageSize.width
  const margin = 14
  const tableWidth = pageWidth - (margin * 2)
  const colWidths = [30, 60, 40, 30, 30, 30] // Anchos de columnas
  const rowHeight = 8
  const headerHeight = 10
  
  let currentY = startY
  
  // Dibujar headers
  doc.setFillColor(41, 128, 185)
  doc.rect(margin, currentY, tableWidth, headerHeight, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  
  let currentX = margin
  data[0].forEach((header, index) => {
    doc.text(header, currentX + 2, currentY + 6)
    currentX += colWidths[index]
  })
  
  currentY += headerHeight
  
  // Dibujar filas de datos
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  
  data.slice(1).forEach((row, rowIndex) => {
    // Alternar color de fondo
    if (rowIndex % 2 === 0) {
      doc.setFillColor(245, 245, 245)
      doc.rect(margin, currentY, tableWidth, rowHeight, 'F')
    }
    
    currentX = margin
    row.forEach((cell, colIndex) => {
      doc.text(cell, currentX + 2, currentY + 6)
      currentX += colWidths[colIndex]
    })
    
    currentY += rowHeight
  })
  
  return currentY
}

export class PDFReportAdapter implements ReportAdapter {
  async generate(data: ReportData, options: ReportOptions): Promise<ReportResult> {
    try {
      const doc = new jsPDF()
      
      // Configurar fuente y colores
      doc.setFont('helvetica')
      
      // Título del reporte
      doc.setFontSize(20)
      doc.setTextColor(40, 40, 40)
      doc.text(options.customTitle || data.title, 14, 22)
      
      // Información del período
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      const periodText = `Período: ${this.formatDate(data.period.startDate)} - ${this.formatDate(data.period.endDate)}`
      doc.text(periodText, 14, 35)
      
      // Fecha de generación
      const generatedText = `Generado el: ${this.formatDate(data.generatedAt)}`
      doc.text(generatedText, 14, 45)
      
      // Resumen
      if (options.includeSummary !== false) {
        doc.setFontSize(14)
        doc.setTextColor(40, 40, 40)
        doc.text('Resumen', 14, 60)
        
        doc.setFontSize(10)
        doc.setTextColor(60, 60, 60)
        doc.text(`Total de pagos: ${data.totalPayments}`, 14, 70)
        doc.text(`Monto total: ${this.formatCurrency(data.totalAmount)}`, 14, 80)
      }
      
      // Tabla de pagos
      const tableData = data.payments && data.payments.length > 0 
        ? data.payments.map(payment => [
            this.formatDate(payment.paymentDate),
            payment.supplierName,
            payment.contractDescription,
            this.formatCurrency(payment.amount),
            payment.paymentMethod,
            this.formatCurrency(payment.remainingDebt)
          ])
        : [['No hay pagos en el período seleccionado', '', '', '', '', '']]
      
      // Crear tabla usando función personalizada
      const tableStartY = options.includeSummary !== false ? 100 : 60
      const headers = ['Fecha', 'Proveedor', 'Contrato', 'Monto', 'Método', 'Deuda Restante']
      const fullTableData = [headers, ...tableData]
      
      createSimpleTable(doc, fullTableData, tableStartY)
      
      // Pie de página
      const pageCount = (doc as any).getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(`Página ${i} de ${pageCount}`, 14, doc.internal.pageSize.height - 10)
        doc.text('Sistema de Gestión de Proveedores', doc.internal.pageSize.width - 80, doc.internal.pageSize.height - 10)
      }
      
      const pdfBuffer = doc.output('arraybuffer')
      const filename = `reporte_pagos_semanal_${this.formatDateForFilename(data.period.startDate)}_${this.formatDateForFilename(data.period.endDate)}.pdf`
      
      return {
        success: true,
        data: Buffer.from(pdfBuffer),
        filename,
        mimeType: 'application/pdf'
      }
    } catch (error) {
      return {
        success: false,
        data: undefined,
        filename: '',
        mimeType: '',
        error: error instanceof Error ? error.message : 'Error desconocido generando PDF'
      }
    }
  }
  
  getSupportedFormats(): string[] {
    return ['pdf']
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
}
