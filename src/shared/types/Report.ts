export interface WeeklyPaymentReport {
  id: number
  paymentDate: Date
  amount: number
  paymentMethod: string
  contractId: number
  supplierName: string
  supplierPhone: string
  supplierEmail: string
  contractDescription: string
  contractStartDate: Date
  contractEndDate: Date
  contractAmount: number
  remainingDebt: number
}

export interface ReportData {
  title: string
  period: {
    startDate: Date
    endDate: Date
  }
  totalPayments: number
  totalAmount: number
  payments: WeeklyPaymentReport[]
  generatedAt: Date
}

export interface ReportOptions {
  format: 'pdf' | 'excel'
  includeCharts?: boolean
  includeSummary?: boolean
  customTitle?: string
}

export interface ReportResult {
  success: boolean
  data?: Buffer | string
  filename: string
  mimeType: string
  error?: string
}

export interface ReportAdapter {
  generate(data: ReportData, options: ReportOptions): Promise<ReportResult>
  getSupportedFormats(): string[]
}
