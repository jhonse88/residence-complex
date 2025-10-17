/**
 * Exportaciones del patrón Decorator para SupplierService
 * Siguiendo las mejores prácticas de Refactoring Guru
 */

// Interfaces base
export type { IServiceDecorator } from './IServiceDecorator'
export { BaseServiceDecorator } from './IServiceDecorator'

// Decoradores específicos
export { ValidationDecorator } from './ValidationDecorator'
export { CachingDecorator } from './CachingDecorator'
export { ErrorHandlingDecorator } from './ErrorHandlingDecorator'

// Servicio decorado de proveedores
export type { 
  ISupplierService, 
  SupplierServiceWrapper 
} from './SupplierServiceDecorator'

// Factory principal
export { DecoratedServiceFactory } from './DecoratedServiceFactory'
