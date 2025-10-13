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

  const ejecutarConsulta = async (payload: PivotQueryPayload): Promise<PivotQueryResult | null> => {
    cargando.value = true
    error.value = null
    resultado.value = null

    try {
      const respuesta = await fetch(`${apiBase.value}/api/pivot/consulta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!respuesta.ok) {
        throw new Error(`Error de API: ${respuesta.status} ${respuesta.statusText}`)
      }

      const datos = await respuesta.json()
      resultado.value = datos.resultado
      return datos.resultado
    } catch (err) {
      const mensajeError = err instanceof Error ? err.message : 'Error desconocido al ejecutar consulta'
      error.value = mensajeError
      console.error('Error ejecutando consulta pivot:', err)
      return null
    } finally {
      cargando.value = false
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
    ejecutarConsulta,
    limpiarResultado
  }
}


