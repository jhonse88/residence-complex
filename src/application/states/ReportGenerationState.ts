// Patrón State para manejar diferentes estados de generación de reportes
export interface ReportState {
  canGenerate(): boolean
  generateReport(context: ReportGenerationContext): Promise<void>
  getAvailableFormats(): string[]
  getEstimatedTime(): number
  getStateName(): string
}

export class ReportGenerationContext {
  private state: ReportState
  private dataVolume: number
  private userType: string
  private startTime: Date | null = null

  constructor(initialState: ReportState, dataVolume: number, userType: string) {
    this.state = initialState
    this.dataVolume = dataVolume
    this.userType = userType
    console.log(`   📦 Contexto creado:`)
    console.log(`      - Estado inicial: ${initialState.getStateName()}`)
    console.log(`      - Volumen de datos: ${dataVolume}`)
    console.log(`      - Tipo de usuario: ${userType}`)
  }

  setState(state: ReportState): void {
    const previousState = this.state.getStateName()
    const newState = state.getStateName()
    console.log(`\n   🔄 TRANSICIÓN DE ESTADO:`)
    console.log(`      Estado anterior: ${previousState}`)
    console.log(`      Estado nuevo: ${newState}`)
    // Verificar si es ErrorState usando el método getStateName o una propiedad
    if (newState === 'Error' && 'getError' in state && typeof (state as any).getError === 'function') {
      console.log(`      ⚠️  Razón: ${(state as any).getError()}`)
    }
    this.state = state
  }

  getState(): ReportState {
    return this.state
  }

  getDataVolume(): number {
    return this.dataVolume
  }

  getUserType(): string {
    return this.userType
  }

  setStartTime(): void {
    this.startTime = new Date()
  }

  getElapsedTime(): number {
    return this.startTime ? Date.now() - this.startTime.getTime() : 0
  }
}

// Estado para conjuntos de datos pequeños (generación inmediata)
export class SmallDatasetState implements ReportState {
  canGenerate(): boolean {
    return true
  }

  async generateReport(context: ReportGenerationContext): Promise<void> {
    console.log('   📊 [SmallDatasetState] Generando reporte para dataset pequeño...')
    console.log('   ⚡ Modo: Generación inmediata (sin indicador de progreso)')
    console.log('   ⏱️  Tiempo estimado: 2 segundos')
    // Generación inmediata sin progreso
  }

  getAvailableFormats(): string[] {
    return ['pdf', 'excel']
  }

  getEstimatedTime(): number {
    return 2000 // 2 segundos
  }

  getStateName(): string {
    return 'Small Dataset'
  }
}

// Estado para conjuntos de datos medianos (con progreso)
export class MediumDatasetState implements ReportState {
  canGenerate(): boolean {
    return true
  }

  async generateReport(context: ReportGenerationContext): Promise<void> {
    console.log('   📊 [MediumDatasetState] Generando reporte para dataset mediano...')
    console.log('   ⚡ Modo: Generación con indicador de progreso')
    console.log('   ⏱️  Tiempo estimado: 5 segundos')
    // Generación con indicador de progreso
  }

  getAvailableFormats(): string[] {
    return ['pdf', 'excel']
  }

  getEstimatedTime(): number {
    return 5000 // 5 segundos
  }

  getStateName(): string {
    return 'Medium Dataset'
  }
}

// Estado para conjuntos de datos grandes (generación asíncrona)
export class LargeDatasetState implements ReportState {
  canGenerate(): boolean {
    return true
  }

  async generateReport(context: ReportGenerationContext): Promise<void> {
    console.log('   📊 [LargeDatasetState] Generando reporte para dataset grande...')
    console.log('   ⚡ Modo: Generación asíncrona con notificaciones')
    console.log('   ⏱️  Tiempo estimado: 15 segundos')
    // Generación asíncrona con notificaciones
  }

  getAvailableFormats(): string[] {
    return ['pdf', 'excel'] // Podría limitar formatos para datasets grandes
  }

  getEstimatedTime(): number {
    return 15000 // 15 segundos
  }

  getStateName(): string {
    return 'Large Dataset'
  }
}

// Estado de error
export class ErrorState implements ReportState {
  private error: string

  constructor(error: string) {
    this.error = error
  }

  canGenerate(): boolean {
    return false
  }

  async generateReport(context: ReportGenerationContext): Promise<void> {
    console.log(`   ❌ [ErrorState] No se puede generar reporte`)
    console.log(`   ⚠️  Error: ${this.error}`)
    throw new Error(`No se puede generar reporte: ${this.error}`)
  }

  getAvailableFormats(): string[] {
    return []
  }

  getEstimatedTime(): number {
    return 0
  }

  getStateName(): string {
    return 'Error'
  }

  getError(): string {
    return this.error
  }
}

// Factory para crear estados basados en el volumen de datos
export class ReportStateFactory {
  static createState(dataVolume: number, userType: string): ReportState {
    console.log(`   🔍 Analizando volumen de datos: ${dataVolume} registros`)
    console.log(`   👤 Tipo de usuario: ${userType}`)
    
    let state: ReportState
    if (dataVolume < 100) {
      console.log(`   ✅ Volumen < 100 → Creando SmallDatasetState`)
      state = new SmallDatasetState()
    } else if (dataVolume < 1000) {
      console.log(`   ✅ Volumen entre 100-1000 → Creando MediumDatasetState`)
      state = new MediumDatasetState()
    } else {
      console.log(`   ✅ Volumen >= 1000 → Creando LargeDatasetState`)
      state = new LargeDatasetState()
    }
    
    console.log(`   📊 Estado creado: ${state.getStateName()}`)
    return state
  }
}
