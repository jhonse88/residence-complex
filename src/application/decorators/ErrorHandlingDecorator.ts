/**
 * Decorador para manejo de errores
 * Proporciona manejo centralizado de errores y recuperación
 */
import { IServiceDecorator, BaseServiceDecorator } from './IServiceDecorator'

export class ErrorHandlingDecorator<T> extends BaseServiceDecorator<T> {
  private retryAttempts: number
  private retryDelay: number

  constructor(service: IServiceDecorator<T>, retryAttempts: number = 3, retryDelay: number = 1000) {
    super(service)
    this.retryAttempts = retryAttempts
    this.retryDelay = retryDelay
  }

  async execute(...args: any[]): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await this.wrappedService.execute(...args)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        console.warn(`[ERROR HANDLING] Attempt ${attempt}/${this.retryAttempts} failed:`, {
          error: lastError.message,
          args: this.sanitizeArgs(args)
        })

        // Si es el último intento o el error no es recuperable, lanzar el error
        if (attempt === this.retryAttempts || !this.isRetryableError(lastError)) {
          break
        }

        // Esperar antes del siguiente intento
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt) // Backoff exponencial
        }
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    throw this.enhanceError(lastError!, args)
  }

  private isRetryableError(error: Error): boolean {
    // Determinar si el error es recuperable
    const retryablePatterns = [
      'timeout',
      'connection',
      'network',
      'temporary',
      'busy',
      'locked'
    ]

    const errorMessage = error.message.toLowerCase()
    return retryablePatterns.some(pattern => errorMessage.includes(pattern))
  }

  private enhanceError(error: Error, args: any[]): Error {
    // Mejorar el mensaje de error con contexto adicional
    const enhancedMessage = `${error.message} (Args: ${this.sanitizeArgs(args).join(', ')})`
    const enhancedError = new Error(enhancedMessage)
    enhancedError.stack = error.stack
    return enhancedError
  }

  private sanitizeArgs(args: any[]): any[] {
    // Sanitizar argumentos para logging de errores
    return args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        const sanitized = { ...arg }
        delete sanitized.password
        delete sanitized.token
        delete sanitized.secret
        return sanitized
      }
      return arg
    })
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
