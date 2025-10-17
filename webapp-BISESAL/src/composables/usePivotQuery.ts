import { ref, type Ref } from 'vue'

export interface PivotFilter {
  field: string
  values?: Array<string | number>
}

export interface PivotValueRequest {
  field: string
  aggregation?: 'SUM' | 'AVG' | 'COUNT' | 'MAX' | 'MIN'
}

export interface PivotQueryPayload {
  year?: number
  filters?: PivotFilter[]
  rows?: string[]
  columns?: string[]
  values: PivotValueRequest[]
  limit?: number
  includeTotals?: boolean
}

export interface PivotQueryResult {
  datos: Array<Record<string, unknown>>
  totalGeneral: Record<string, unknown> | null
  aniosConsultados: number[]
  metadata: {
    dimensionesSeleccionadas: string[]
    dimensionesFilas: string[]
    dimensionesColumnas: string[]
    medidasSeleccionadas: string[]
  }
}

export function usePivotQuery(apiBase: Ref<string>) {
  const cargando = ref(false)
  const error = ref<string | null>(null)
  const resultado = ref<PivotQueryResult | null>(null)
  const progreso = ref(0)

  let intervaloProgreso: ReturnType<typeof setInterval> | null = null

  const ejecutarConsulta = async (payload: PivotQueryPayload): Promise<PivotQueryResult | null> => {
    cargando.value = true
    error.value = null
    resultado.value = null
    progreso.value = 0

    // Limpiar intervalo anterior si existe
    if (intervaloProgreso) {
      clearInterval(intervaloProgreso)
    }

    // Simular progreso gradual mientras esperamos la respuesta del servidor
    let progresoActual = 0
    intervaloProgreso = setInterval(() => {
      if (progresoActual < 90) {
        // Incremento más rápido al inicio, más lento al final
        const incremento = progresoActual < 30 ? 8 : 
                          progresoActual < 60 ? 4 : 
                          progresoActual < 80 ? 2 : 1
        
        progresoActual = Math.min(progresoActual + incremento, 90)
        progreso.value = progresoActual
      }
    }, 200) // Actualizar cada 200ms

    try {
      const respuesta = await fetch(`${apiBase.value}/api/pivot/consulta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      // Detener el progreso simulado
      if (intervaloProgreso) {
        clearInterval(intervaloProgreso)
        intervaloProgreso = null
      }

      // Avanzar a 95% al recibir respuesta
      progreso.value = 95

      if (!respuesta.ok) {
        throw new Error(`Error de API: ${respuesta.status} ${respuesta.statusText}`)
      }

      const datos = await respuesta.json()
      
      // Completar a 100%
      progreso.value = 100
      
      resultado.value = datos.resultado
      return datos.resultado
    } catch (err) {
      // Detener el progreso simulado en caso de error
      if (intervaloProgreso) {
        clearInterval(intervaloProgreso)
        intervaloProgreso = null
      }
      
      const mensajeError = err instanceof Error ? err.message : 'Error desconocido al ejecutar consulta'
      error.value = mensajeError
      console.error('Error ejecutando consulta pivot:', err)
      return null
    } finally {
      cargando.value = false
      
      // Asegurar que el intervalo se limpie
      if (intervaloProgreso) {
        clearInterval(intervaloProgreso)
        intervaloProgreso = null
      }
    }
  }

  const limpiarResultado = () => {
    resultado.value = null
    error.value = null
  }

  return {
    cargando,
    error,
    resultado,
    progreso,
    ejecutarConsulta,
    limpiarResultado
  }
}


