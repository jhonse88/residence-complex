import { WeeklyPaymentReport, ReportData, ReportOptions } from '../../shared/types/Report'

export interface WeeklyReportRequestDto {
  startDate: string
  endDate: string
  format: 'pdf' | 'excel'
  includeCharts?: boolean
  includeSummary?: boolean
  customTitle?: string
}

