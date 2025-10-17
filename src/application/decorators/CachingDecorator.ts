/**
 * Decorador para caché de servicios
 * Implementa un sistema de caché simple en memoria
 */
import { IServiceDecorator, BaseServiceDecorator } from './IServiceDecorator'

export class CachingDecorator<T> extends BaseServiceDecorator<T> {
  private cache = new Map<string, { data: T; timestamp: number }>()
  private readonly CACHE_DURATION: number

  constructor(service: IServiceDecorator<T>, cacheDurationMinutes: number = 5) {
    super(service)
    this.CACHE_DURATION = cacheDurationMinutes * 60 * 1000 // Convertir a milisegundos
  }

  async execute(...args: any[]): Promise<T> {
    const cacheKey = this.generateCacheKey(args)
    const cached = this.cache.get(cacheKey)

    if (cached && this.isCacheValid(cached.timestamp)) {
      console.log(`[CACHE] Cache hit for key: ${cacheKey}`)
      return cached.data
    }

    console.log(`[CACHE] Cache miss for key: ${cacheKey}`)
    const result = await this.wrappedService.execute(...args)

    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    })

    return result
  }

  private generateCacheKey(args: any[]): string {
    // Generar una clave única basada en los argumentos
    const keyParts = args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        // Para objetos, usar propiedades específicas para la clave
        if (this.isSupplierData(arg)) {
          return `supplier_${arg.name}_${arg.phone}`
        } else if (this.isContractData(arg)) {
          return `contract_${arg.supplierId}_${arg.startDate}_${arg.endDate}`
        } else if (this.isPaymentData(arg)) {
          return `payment_${arg.contractId}_${arg.paymentDate}`
        } else if (typeof arg.id === 'number') {
          return `id_${arg.id}`
        }
        return JSON.stringify(arg)
      }
      return String(arg)
    })

    return keyParts.join('_')
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION
  }

  private isSupplierData(obj: any): boolean {
    return obj && typeof obj.name === 'string' && typeof obj.phone === 'string'
  }

  private isContractData(obj: any): boolean {
    return obj && obj.startDate && obj.endDate && typeof obj.supplierId === 'number'
  }

  private isPaymentData(obj: any): boolean {
    return obj && typeof obj.amount === 'number' && obj.paymentDate && typeof obj.contractId === 'number'
  }

  /**
   * Limpiar el caché manualmente
   */
  public clearCache(): void {
    this.cache.clear()
    console.log('[CACHE] Cache cleared manually')
  }

  /**
   * Obtener estadísticas del caché
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}
