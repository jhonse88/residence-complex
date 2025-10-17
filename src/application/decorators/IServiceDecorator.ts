/**
 * Interface base para servicios que pueden ser decorados
 * Siguiendo el patrón Decorator de Refactoring Guru
 */
export interface IServiceDecorator<T> {
  // Métodos que deben ser implementados por todos los servicios decorables
  execute(...args: any[]): Promise<T>
}

/**
 * Decorador base abstracto que implementa la estructura común
 * del patrón Decorator
 */
export abstract class BaseServiceDecorator<T> implements IServiceDecorator<T> {
  protected wrappedService: IServiceDecorator<T>

  constructor(service: IServiceDecorator<T>) {
    this.wrappedService = service
  }

  abstract execute(...args: any[]): Promise<T>
}
