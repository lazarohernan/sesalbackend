<script setup lang="ts">
import { ref, computed, onMounted, watch, toRef } from 'vue'
import CompactSelect from '../common/CompactSelect.vue'
import GraficoBarras from './GraficoBarras.vue'
import GraficoIconos from './GraficoIconos.vue'
import { usePivotQuery, type PivotFilter } from '../../composables/usePivotQuery'

// Props para el componente
interface Props {
  apiBase: string
}

const props = defineProps<Props>()

// Composable para consultas pivot
const apiBaseRef = toRef(props, 'apiBase')
const { cargando: cargandoConsulta, error: errorConsulta, resultado, progreso: progresoConsulta, ejecutarConsulta } = usePivotQuery(apiBaseRef)

// Estados reactivos para los filtros
const anioInicio = ref<number | null>(null)
const anioFin = ref<number | null>(null)
const regionSeleccionada = ref<string>('')
const conceptosSeleccionados = ref<string[]>([])

// Estado para el tipo de visualización
const tipoVisualizacion = ref<'barras' | 'iconos'>('barras')

// Opciones para los selectores
const aniosDisponibles = ref<(number | null)[]>([])
const regionesDisponibles = ref<{ valor: string; etiqueta: string }[]>([])
const conceptosDisponibles = ref<{ valor: string; etiqueta: string }[]>([])

// Estados de carga
const cargandoAnios = ref(false)
const cargandoRegiones = ref(false)
const cargandoConceptos = ref(false)

// Estado del dropdown de conceptos
const dropdownConceptosAbierto = ref(false)

// Cargar opciones de los selectores
const cargarAnios = async () => {
  cargandoAnios.value = true
  try {
    const respuesta = await fetch(`${props.apiBase}/api/tablero/anios`)
    if (!respuesta.ok) throw new Error(`Error: ${respuesta.status}`)

    const datos = await respuesta.json()
    aniosDisponibles.value = [null, ...datos.datos]
  } catch (error) {
    console.error('Error cargando años:', error)
    // Fallback
    const aniosFallback: (number | null)[] = [null]
    for (let anio = 2025; anio >= 2008; anio--) {
      aniosFallback.push(anio)
    }
    aniosDisponibles.value = aniosFallback
  } finally {
    cargandoAnios.value = false
  }
}


const cargarRegiones = async () => {
  cargandoRegiones.value = true
  try {
    const respuesta = await fetch(`${props.apiBase}/api/pivot/dimensiones/REGION/valores?limite=100`)
    if (!respuesta.ok) throw new Error(`Error: ${respuesta.status}`)

    const datos = await respuesta.json()
    regionesDisponibles.value = datos.valores?.map((region: any) => ({
      valor: String(region.valor),
      etiqueta: region.etiqueta
    })) || []
  } catch (error) {
    console.error('Error cargando regiones:', error)
    regionesDisponibles.value = []
  } finally {
    cargandoRegiones.value = false
  }
}

const cargarConceptos = async () => {
  cargandoConceptos.value = true
  try {
    const respuesta = await fetch(`${props.apiBase}/api/pivot/dimensiones/CONCEPTO_ORDENADO/valores?limite=200`)
    if (!respuesta.ok) throw new Error(`Error: ${respuesta.status}`)

    const datos = await respuesta.json()
    conceptosDisponibles.value = datos.valores?.map((concepto: any) => ({
      valor: String(concepto.valor),
      etiqueta: concepto.etiqueta
    })) || []
  } catch (error) {
    console.error('Error cargando conceptos ordenados:', error)
    conceptosDisponibles.value = []
  } finally {
    cargandoConceptos.value = false
  }
}

// Cargar datos iniciales
onMounted(() => {
  void cargarAnios()
  void cargarRegiones()
  void cargarConceptos()
  
  // Ejecutar consulta inicial con todos los datos por defecto
  void ejecutarConsultaIndicadores()
})

// Computed para las opciones de los selectores
const opcionesAnios = computed(() =>
  aniosDisponibles.value.map(anio => ({
    valor: anio,
    etiqueta: anio === null ? 'Todos los años' : String(anio)
  }))
)

// Opciones para el selector "Hasta" - solo años anteriores al seleccionado en "Desde"
const opcionesAniosFin = computed(() => {
  if (anioInicio.value === null) {
    // Si no hay año de inicio seleccionado, mostrar todos
    return opcionesAnios.value
  }
  
  // Filtrar para mostrar solo años menores que el año de inicio (años anteriores)
  return aniosDisponibles.value
    .filter(anio => anio !== null && anio < anioInicio.value!)
    .map(anio => ({
      valor: anio,
      etiqueta: String(anio)
    }))
})

const opcionesRegiones = computed(() =>
  [{ valor: '', etiqueta: 'Todas las regiones' }, ...regionesDisponibles.value]
)

// Construir filtros activos
const construirFiltros = (): PivotFilter[] => {
  const filtros: PivotFilter[] = []
  
  // Filtro de año: si solo hay Desde, es año único; si hay Desde y Hasta, es rango
  if (anioInicio.value !== null) {
    const aniosRango: number[] = []
    const inicio = anioInicio.value
    const fin = anioFin.value || inicio // Si no hay fin, usar el mismo que inicio
    
    // Determinar el rango correcto (de menor a mayor)
    const minAnio = Math.min(inicio, fin)
    const maxAnio = Math.max(inicio, fin)
    
    // Agregar todos los años en el rango
    for (let anio = minAnio; anio <= maxAnio; anio++) {
      aniosRango.push(anio)
    }
    
    if (aniosRango.length > 0) {
      filtros.push({ field: 'ANIO', values: aniosRango })
    }
  }
  
  if (regionSeleccionada.value) {
    filtros.push({ field: 'REGION', values: [regionSeleccionada.value] })
  }
  
  if (conceptosSeleccionados.value.length > 0) {
    filtros.push({ field: 'CONCEPTO_ORDENADO', values: conceptosSeleccionados.value })
  }
  
  return filtros
}

// Mensaje de carga basado en el progreso real
const mensajeCarga = computed(() => {
  const progreso = progresoConsulta.value
  if (progreso === 0) return 'Iniciando consulta...'
  if (progreso < 30) return 'Enviando solicitud al servidor...'
  if (progreso < 60) return 'Consultando base de datos...'
  if (progreso < 90) return 'Recibiendo datos...'
  if (progreso < 100) return 'Procesando resultados...'
  return 'Datos cargados'
})

// Determinar la dimensión de agrupación según los filtros activos
const determinarDimensionAgrupacion = (): string => {
  const filtros = construirFiltros()
  
  // Obtener las dimensiones que ya están filtradas
  const dimensionesFiltradas = new Set(
    filtros.map(f => f.field)
  )
  
  // Si hay conceptos seleccionados, SIEMPRE agrupar por CONCEPTO_ORDENADO
  // para mostrar solo los conceptos filtrados
  if (conceptosSeleccionados.value.length > 0) {
    return 'CONCEPTO_ORDENADO'
  }
  
  // Prioridad de dimensiones para agrupar (en orden de preferencia)
  const prioridad = ['CONCEPTO_ORDENADO', 'REGION', 'ANIO', 'MES']
  
  // Seleccionar la primera dimensión que NO esté filtrada
  for (const dim of prioridad) {
    if (!dimensionesFiltradas.has(dim)) {
      return dim
    }
  }
  
  // Si todas están filtradas, usar CONCEPTO_ORDENADO por defecto
  return 'CONCEPTO_ORDENADO'
}

// Ejecutar consulta con filtros actuales
const ejecutarConsultaIndicadores = async () => {
  const filtros = construirFiltros()
  const dimensionAgrupacion = determinarDimensionAgrupacion()
  
  // Preparar el payload base
  const payload: any = {
    filters: filtros,
    rows: [dimensionAgrupacion], // Agrupar dinámicamente según filtros
    values: [
      { field: 'TOTAL', aggregation: 'SUM' }
    ],
    limit: 100, // Mostrar hasta 100 resultados para incluir todos los conceptos (57-62)
    includeTotals: true
  }
  
  await ejecutarConsulta(payload)
}

// Preparar datos para el gráfico de barras
const datosGrafico = computed(() => {
  if (!resultado.value || !resultado.value.datos || resultado.value.datos.length === 0) {
    return []
  }
  
  // Determinar qué campo usar como etiqueta basándose en las dimensiones de filas
  const dimensionAgrupacion = resultado.value.metadata?.dimensionesFilas?.[0] || 'CONCEPTO_ORDENADO'
  
  const datos = resultado.value.datos.map(dato => {
    // Obtener la etiqueta según la dimensión de agrupación
    let etiqueta = 'Sin categoría'
    if (dato[dimensionAgrupacion]) {
      etiqueta = String(dato[dimensionAgrupacion])
    } else if (dato.CONCEPTO_ORDENADO || dato['CONCEPTO ORDENADO']) {
      etiqueta = String(dato.CONCEPTO_ORDENADO || dato['CONCEPTO ORDENADO'])
    } else if (dato.CONCEPTO) {
      etiqueta = String(dato.CONCEPTO)
    } else if (dato.REGION) {
      etiqueta = String(dato.REGION)
    } else if (dato.ANIO) {
      etiqueta = String(dato.ANIO)
    } else if (dato.MES) {
      etiqueta = `Mes ${dato.MES}`
    }
    
    return {
      etiqueta,
      valor: Number(dato['Total de Atenciones'] || 0),
      dimension: dimensionAgrupacion // Agregar la dimensión para referencia
    }
  })
  
  // Solo ordenar por valor si NO es CONCEPTO_ORDENADO
  // Para conceptos ordenados, respetar el orden de la base de datos
  if (dimensionAgrupacion !== 'CONCEPTO_ORDENADO') {
    return datos.sort((a, b) => b.valor - a.valor) // Ordenar de mayor a menor
  }
  
  return datos // Mantener orden original de la BD para conceptos ordenados
})

// Generar título dinámico según la dimensión de agrupación
const tituloDinamico = computed(() => {
  if (!resultado.value?.metadata?.dimensionesFilas?.[0]) {
    return 'Indicadores por Total de Atenciones'
  }
  
  const dimension = resultado.value.metadata.dimensionesFilas[0]
  const mapaEtiquetas: Record<string, string> = {
    'CONCEPTO': 'Conceptos',
    'CONCEPTO_ORDENADO': 'Conceptos Ordenados',
    'CONCEPTO ORDENADO': 'Conceptos Ordenados',
    'REGION': 'Regiones',
    'ANIO': 'Años',
    'MES': 'Meses',
    'ESTABLECIMIENTO': 'Establecimientos de Salud',
    'NIVEL_ESTABLECIMIENTO': 'Niveles de Establecimiento de Salud',
    'FORMULARIO': 'Formularios'
  }
  
  const etiquetaDimension = mapaEtiquetas[dimension] || dimension
  return `${etiquetaDimension} por Total de Atenciones`
})

// Crear descripción legible de filtros aplicados
const descripcionFiltros = computed(() => {
  const filtros: string[] = []
  
  // Año o rango
  if (anioInicio.value !== null) {
    const inicio = anioInicio.value
    const fin = anioFin.value || inicio
    
    const minAnio = Math.min(inicio, fin)
    const maxAnio = Math.max(inicio, fin)
    
    if (minAnio === maxAnio) {
      filtros.push(`Año ${minAnio}`)
    } else {
      filtros.push(`${minAnio} - ${maxAnio}`)
    }
  }
  
  // Región
  if (regionSeleccionada.value) {
    const region = regionesDisponibles.value.find(r => r.valor === regionSeleccionada.value)
    filtros.push(`${region?.etiqueta || regionSeleccionada.value}`)
  }
  
  // Conceptos
  if (conceptosSeleccionados.value.length > 0) {
    const etiquetas = conceptosSeleccionados.value.map(valor => {
      const concepto = conceptosDisponibles.value.find(c => c.valor === valor)
      return concepto?.etiqueta || valor
    })
    filtros.push(`${etiquetas.length} concepto(s)`)
  }
  
  return filtros.length > 0 ? filtros.join(' • ') : 'Datos totales'
})

// Watcher para limpiar anioFin si se vuelve inválido
watch(anioInicio, (nuevoInicio) => {
  // Si anioFin está definido y es mayor o igual que anioInicio, limpiarlo
  if (anioFin.value !== null && nuevoInicio !== null && anioFin.value >= nuevoInicio) {
    anioFin.value = null
  }
})

// Watchers para detectar cambios en filtros con debounce
let timeoutId: ReturnType<typeof setTimeout> | null = null

watch([anioInicio, anioFin, regionSeleccionada, conceptosSeleccionados], () => {
  // Limpiar timeout anterior si existe
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
  
  // Esperar 300ms antes de ejecutar la consulta
  timeoutId = setTimeout(() => {
    void ejecutarConsultaIndicadores()
  }, 300)
}, { deep: true })
</script>

<template>
  <section class="mt-8 flex flex-col gap-6 transition-colors duration-300">
    <header
      class="flex flex-col gap-4 rounded-card border border-border bg-surface px-6 py-4 shadow-panel transition-colors duration-300 dark:border-border-dark dark:bg-surface-dark sm:flex-row sm:justify-between"
    >
      <div class="space-y-1">
        <h2 class="text-2xl font-semibold text-primary transition-colors duration-300 dark:text-text-inverted">
          Indicadores
        </h2>
        <p class="text-sm text-text-secondary transition-colors duration-300 dark:text-text-muted">
          Métricas clave del ecosistema SESAL por filtros seleccionados
        </p>
      </div>
    </header>

    <!-- Contenedor unificado: Filtros + Gráficos -->
    <div class="rounded-card border border-border bg-gradient-to-br from-white to-slate-50/50 dark:from-surface-dark dark:to-slate-900/50 shadow-panel transition-all duration-300 dark:border-border-dark overflow-hidden">
      <!-- Panel de filtros integrado -->
      <div class="bg-white/50 dark:bg-slate-800/30 border-b border-border dark:border-border-dark p-6">
        <!-- Filtros en línea compactos -->
        <div class="flex flex-wrap items-center gap-3">
          <!-- Filtro de Año (Desde - Hasta) -->
          <div class="flex items-center gap-2 min-w-0">
            <label class="flex items-center gap-1.5 text-sm font-medium text-text-secondary dark:text-text-muted whitespace-nowrap">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Desde:</span>
            </label>
            <div class="relative min-w-[120px]">
              <CompactSelect
                v-model="anioInicio"
                :options="opcionesAnios"
                :disabled="cargandoAnios"
                :loading="cargandoAnios"
                placeholder="Año"
              />
            </div>
            <span class="text-sm text-text-secondary dark:text-text-muted">hasta</span>
            <div class="relative min-w-[120px]">
              <CompactSelect
                v-model="anioFin"
                :options="opcionesAniosFin"
                :disabled="cargandoAnios || anioInicio === null"
                :loading="cargandoAnios"
                placeholder="Año (opcional)"
              />
            </div>
          </div>

          <!-- Filtro de Región -->
          <div class="flex items-center gap-2 min-w-0">
            <label class="flex items-center gap-1.5 text-sm font-medium text-text-secondary dark:text-text-muted whitespace-nowrap">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Región:</span>
            </label>
            <div class="relative min-w-[240px]">
              <CompactSelect
                v-model="regionSeleccionada"
                :options="opcionesRegiones"
                :disabled="cargandoRegiones"
                :loading="cargandoRegiones"
                placeholder="Todas las regiones"
              />
              <div v-if="cargandoRegiones" class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <div class="w-4 h-4 border-2 border-brand-base/30 border-t-brand-base rounded-full animate-spin"></div>
              </div>
            </div>
          </div>

          <!-- Filtro de Conceptos (Múltiple) -->
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <label class="flex items-center gap-1.5 text-sm font-medium text-text-secondary dark:text-text-muted whitespace-nowrap">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span>Conceptos:</span>
            </label>
            <div class="relative min-w-[280px] flex-1 max-w-md">
              <button
                type="button"
                @click="dropdownConceptosAbierto = !dropdownConceptosAbierto"
                :disabled="cargandoConceptos"
                class="flex w-full items-center justify-between gap-2 rounded-lg border-2 border-slate-200/80 bg-white dark:border-slate-700 dark:bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-sm transition-all duration-200 hover:border-brand-base/50 hover:bg-slate-50 dark:hover:border-brand-light/50 dark:hover:bg-slate-700/50 focus:border-brand-base focus:outline-none focus:ring-2 focus:ring-brand-base/20 dark:focus:border-brand-light dark:focus:ring-brand-light/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="truncate" :class="{ 'text-slate-500 dark:text-slate-400': conceptosSeleccionados.length === 0 }">
                  {{ conceptosSeleccionados.length > 0 ? `${conceptosSeleccionados.length} seleccionado(s)` : 'Todos los conceptos' }}
                </span>
                <svg 
                  class="h-5 w-5 transition-transform duration-200 flex-shrink-0"
                  :class="{ 'rotate-180 text-brand-base dark:text-brand-light': dropdownConceptosAbierto, 'text-slate-400 dark:text-slate-500': !dropdownConceptosAbierto }"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              
              <!-- Dropdown con checkboxes -->
              <div
                v-if="dropdownConceptosAbierto"
                class="absolute z-50 mt-2 w-full min-w-max max-w-md rounded-xl border border-slate-200/80 bg-white dark:border-slate-700 dark:bg-slate-800 shadow-xl max-h-64 overflow-y-auto"
              >
                <div class="py-1">
                  <label
                    v-for="concepto in conceptosDisponibles"
                    :key="concepto.valor"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm font-medium cursor-pointer transition-all duration-150 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <input
                      type="checkbox"
                      :value="concepto.valor"
                      v-model="conceptosSeleccionados"
                      class="w-4 h-4 rounded border-slate-300 text-brand-base focus:ring-brand-base/20 dark:border-slate-600 dark:bg-slate-700"
                    />
                    <span class="text-slate-700 dark:text-slate-300">{{ concepto.etiqueta }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Área para gráficos -->
      <!-- Toggle de visualización -->
      <div class="px-6 pt-6 pb-4 flex items-center justify-between border-b border-border dark:border-border-dark">
        <div>
          <h4 class="text-base font-semibold text-text-primary dark:text-text-light">Visualización de Datos</h4>
          <p class="text-xs text-text-secondary dark:text-text-muted mt-0.5">Cambia entre vista de barras o iconos</p>
        </div>
        <div class="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            type="button"
            @click="tipoVisualizacion = 'barras'"
            class="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
            :class="tipoVisualizacion === 'barras' 
              ? 'bg-white dark:bg-slate-700 text-brand-base dark:text-brand-light shadow-sm' 
              : 'text-text-secondary dark:text-text-muted hover:text-text-primary dark:hover:text-text-light'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Barras</span>
          </button>
          <button
            type="button"
            @click="tipoVisualizacion = 'iconos'"
            class="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
            :class="tipoVisualizacion === 'iconos' 
              ? 'bg-white dark:bg-slate-700 text-brand-base dark:text-brand-light shadow-sm' 
              : 'text-text-secondary dark:text-text-muted hover:text-text-primary dark:hover:text-text-light'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            <span>Iconos</span>
          </button>
        </div>
      </div>

      <!-- Mensaje de error -->
      <div
        v-if="errorConsulta"
        class="m-6"
      >
        <div class="flex items-start gap-4 rounded-xl border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 p-5 shadow-sm">
          <div class="flex-shrink-0 mt-0.5">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
              <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
              </svg>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-bold text-red-800 dark:text-red-300 mb-1">Error al cargar indicadores</h4>
            <p class="text-sm text-red-700 dark:text-red-400">{{ errorConsulta }}</p>
          </div>
          <button
            class="flex-shrink-0 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            type="button"
            @click="ejecutarConsultaIndicadores"
          >
            <span class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reintentar
            </span>
          </button>
        </div>
      </div>

      <!-- Indicador de carga con progreso -->
      <div
        v-else-if="cargandoConsulta"
        class="flex items-center justify-center h-80 p-6"
      >
        <div class="text-center max-w-md w-full">
          <div class="relative inline-flex mb-6">
            <div class="w-16 h-16 border-4 border-brand-base/20 dark:border-brand-light/20 rounded-full"></div>
            <div class="absolute top-0 left-0 w-16 h-16 border-4 border-brand-base dark:border-brand-light border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p class="text-base font-semibold text-text-primary dark:text-text-light">Cargando indicadores</p>
          <p class="text-sm text-text-secondary dark:text-text-muted mt-2">{{ mensajeCarga }}</p>
          
          <!-- Barra de progreso -->
          <div class="mt-6 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div 
              class="bg-brand-base dark:bg-brand-light h-2.5 rounded-full transition-all duration-300 ease-out"
              :style="{ width: `${progresoConsulta}%` }"
            ></div>
          </div>
          <p class="text-xs font-medium text-brand-base dark:text-brand-light mt-2">{{ progresoConsulta }}%</p>
        </div>
      </div>

      <!-- Gráfico de barras o iconos -->
      <div v-else-if="datosGrafico.length > 0" class="p-6">
        <GraficoBarras
          v-if="tipoVisualizacion === 'barras'"
          :datos="datosGrafico"
          :titulo="tituloDinamico"
          :subtitulo="`${descripcionFiltros}`"
          color-barra="#0066cc"
          :altura="1200"
        />
        <GraficoIconos
          v-else
          :datos="datosGrafico"
          :titulo="tituloDinamico"
          :subtitulo="`${descripcionFiltros}`"
          :altura="1400"
        />
      </div>

      <!-- Estado vacío inicial -->
      <div
        v-else
        class="flex flex-col items-center justify-center h-80 p-6 text-center"
      >
        <div class="max-w-md mx-auto">
          <div class="relative mb-6">
            <div class="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-brand-base/10 to-brand-base/5 dark:from-brand-light/10 dark:to-brand-light/5 flex items-center justify-center">
              <svg class="w-12 h-12 text-brand-base/40 dark:text-brand-light/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
          </div>
          <h3 class="text-xl font-bold text-text-primary dark:text-text-light mb-2">No hay datos disponibles</h3>
          <p class="text-sm text-text-secondary dark:text-text-muted mb-6">No se encontraron registros para los filtros seleccionados. Intenta ajustar tus criterios de búsqueda.</p>
          <div class="flex items-center justify-center gap-2 text-xs text-text-secondary dark:text-text-muted">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
            <span>Prueba seleccionando diferentes años, regiones o conceptos</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
