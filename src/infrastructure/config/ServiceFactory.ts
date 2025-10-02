import { PrismaClient } from '@prisma/client'
import { PrismaSupplierRepository } from '../database/PrismaSupplierRepository'
import { PrismaContractRepository } from '../database/PrismaContractRepository'
import { PrismaPaymentRepository } from '../repositories/PrismaPaymentRepository'
import { PrismaIPaymentRepository } from '../repositories/PrismaIPaymentRepository'
import { SupplierService } from '../../application/services/SupplierService'
import { ContractService } from '../../application/services/ContractService'
import { PaymentService } from '../../application/services/PaymentService'
import { PaymentBuilderService } from '../../application/services/PaymentBuilderService'
import { ReportService } from '../../application/services/ReportService'

export class ServiceFactory {
  private static prisma: PrismaClient
  private static supplierService: SupplierService
  private static contractService: ContractService
  private static paymentService: PaymentService
  private static paymentBuilderService: PaymentBuilderService
  private static reportService: ReportService

  static getPrismaClient(): PrismaClient {
    if (!this.prisma) {
      this.prisma = new PrismaClient()
    }
    return this.prisma
  }

  static getSupplierService(): SupplierService {
    if (!this.supplierService) {
      const prisma = this.getPrismaClient()
      const supplierRepository = new PrismaSupplierRepository(prisma)
      this.supplierService = new SupplierService(supplierRepository)
    }
    return this.supplierService
  }

  static getContractService(): ContractService {
    if (!this.contractService) {
      const prisma = this.getPrismaClient()
      const contractRepository = new PrismaContractRepository(prisma)
      const paymentRepository = new PrismaIPaymentRepository(prisma)
      this.contractService = new ContractService(contractRepository, paymentRepository)
    }
    return this.contractService
  }

  static getPaymentService(): PaymentService {
    if (!this.paymentService) {
      const prisma = this.getPrismaClient()
      const paymentRepository = new PrismaPaymentRepository(prisma)
      this.paymentService = new PaymentService(paymentRepository)
    }
    return this.paymentService
  }

  static getPaymentBuilderService(): PaymentBuilderService {
    if (!this.paymentBuilderService) {
      const prisma = this.getPrismaClient()
      const paymentRepository = new PrismaPaymentRepository(prisma)
      this.paymentBuilderService = PaymentBuilderService.getInstance(paymentRepository)
    }
    return this.paymentBuilderService
  }

  static getReportService(): ReportService {
    if (!this.reportService) {
      this.reportService = ReportService.getInstance()
    }
    return this.reportService
  }

  static async disconnect(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect()
    }
  }
}
