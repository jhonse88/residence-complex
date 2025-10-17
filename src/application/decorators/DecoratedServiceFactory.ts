import { ISupplierService, SupplierServiceWrapper } from './SupplierServiceDecorator'
import { ValidationDecorator } from './ValidationDecorator'
import { CachingDecorator } from './CachingDecorator'
import { ErrorHandlingDecorator } from './ErrorHandlingDecorator'
import { SupplierService } from '../services/SupplierService'
import { ServiceFactory } from '../../infrastructure/config/ServiceFactory'

/**
 * Factory para crear el servicio de proveedores decorado siguiendo el patrón Decorator
 * Aplica decoradores específicos para mejorar la funcionalidad del SupplierService
 */
export class DecoratedServiceFactory {
  private static decoratedSupplierService: ISupplierService | null = null

  /**
   * Obtiene el servicio de proveedores decorado
   * Aplica decoradores en el orden: Validation -> ErrorHandling -> Caching
   */
  static getDecoratedSupplierService(): ISupplierService {
    if (!this.decoratedSupplierService) {
      const baseService = ServiceFactory.getSupplierService()
      const wrappedService = new SupplierServiceWrapper(baseService)
      
      // Aplicar decoradores en orden específico
      let decoratedService: ISupplierService = new ValidationDecorator(wrappedService) as any
      decoratedService = new ErrorHandlingDecorator(decoratedService as any, 3, 1000) as any
      decoratedService = new CachingDecorator(decoratedService as any, 5) as any
      
      this.decoratedSupplierService = decoratedService
    }
    
    return this.decoratedSupplierService
  }

  /**
   * Limpia la instancia decorada (útil para testing)
   */
  static clearInstance(): void {
    this.decoratedSupplierService = null
  }

  /**
   * Obtiene estadísticas de caché del servicio de proveedores
   */
  static getCacheStats(): any {
    if (this.decoratedSupplierService) {
      return (this.decoratedSupplierService as any).getCacheStats?.() || 'No cache stats available'
    }
    return 'Service not initialized'
  }

  /**
   * Limpia el caché del servicio de proveedores
   */
  static clearCache(): void {
    if (this.decoratedSupplierService) {
      (this.decoratedSupplierService as any).clearCache?.()
    }
  }
}
