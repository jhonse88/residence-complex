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

export interface PaymentStatistics {
  totalPayments: number
  totalAmount: number
  paymentsByMethod: Record<string, { count: number; total: number }>
  paymentsBySupplier: Record<string, { count: number; total: number }>
}

export interface WeeklyPaymentReportData {
  title: string
  period: {
    startDate: Date
    endDate: Date
  }
  totalPayments: number
  totalAmount: number
  payments: WeeklyPaymentReport[]
  statistics: PaymentStatistics
  generatedAt: Date
}
