<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import maplibregl from 'maplibre-gl'
import type {
  ExpressionSpecification,
  MapLayerMouseEvent,
  MapOptions,
  StyleSpecification
} from 'maplibre-gl'
// eslint-disable-next-line import/no-unresolved
import MapLibreWorker from 'maplibre-gl/dist/maplibre-gl-csp-worker?worker'
import 'maplibre-gl/dist/maplibre-gl.css'

;(maplibregl as typeof maplibregl & { workerClass?: typeof Worker }).workerClass =
  MapLibreWorker as unknown as typeof Worker

const mapaContainer = ref<HTMLDivElement | null>(null)
const cargando = ref<boolean>(true)
const error = ref<string | null>(null)
const datosMunicipales = ref<any[]>([])
const departamentoSeleccionado = ref<any>(null)
const departamentoIdSeleccionado = ref<number | null>(null)
let mapa: maplibregl.Map | null = null
const esModoOscuro = ref<boolean>(false)
let observer: MutationObserver | null = null

const props = defineProps<{ anio: number; apiBase?: string }>()

const emit = defineEmits<{
  'update:anio': [anio: number]
}>()

const aniosDisponibles = computed(() => {
  const anios = []
  for (let anio = 2025; anio >= 2008; anio--) {
    anios.push(anio)
  }
  return anios
})

const seleccionarAnio = (anio: number) => {
  emit('update:anio', anio)
}

const isoToDepartamentoId: Record<string, number> = {
  'HN-AT': 1,
  'HN-CL': 2,
  'HN-CM': 3,
  'HN-CP': 4,
  'HN-CR': 5,
  'HN-CH': 6,
  'HN-EP': 7,
  'HN-FM': 8,
  'HN-GD': 9,
  'HN-IN': 10,
  'HN-IB': 11,
  'HN-LP': 12,
  'HN-LE': 13,
  'HN-OC': 14,
  'HN-OL': 15,
  'HN-SB': 16,
  'HN-VA': 17,
  'HN-YO': 18
}

const colorFondoMapa = computed(() => (esModoOscuro.value ? '#0d1b32' : '#f4f8ff'))


const crearParadasColor = () => {
  if (!datosMunicipales.value.length) {
    return [0, '#dbeafe', 1, '#1d4ed8']
  }

  const maximo = Math.max(
    ...datosMunicipales.value.map((municipio) => municipio.totalConsultas),
    0
  )

  return maximo > 0
    ? [0, '#dbeafe', maximo * 0.5, '#60a5fa', maximo, '#1d4ed8']
    : [0, '#dbeafe', 1, '#1d4ed8']
}

const crearExpresionColor = (): ExpressionSpecification => [
  'case',
  ['==', ['get', 'departamentoId'], departamentoIdSeleccionado.value || -1],
  '#1d4ed8', // Color azul para el departamento seleccionado
  [
    'interpolate',
    ['linear'],
    ['get', 'totalConsultas'],
    ...crearParadasColor()
  ]
]

const actualizarColores = () => {
  if (!mapa) return
  const expresion = crearExpresionColor()
  mapa.setPaintProperty('departamentos-fill', 'fill-color', expresion)
}

const actualizarFondoMapa = () => {
  if (!mapa) return
  mapa.setPaintProperty('background', 'background-color', colorFondoMapa.value)
}

const cargarDatosDepartamento = async (departamentoId: number) => {
  try {
    const baseRaw = props.apiBase && typeof props.apiBase === 'string' ? props.apiBase : ''
    const base = baseRaw.trim() !== '' ? baseRaw.trim() : window.location.origin
    let url: URL
    try {
      url = new URL('/api/reportes/indicadores-municipales', base)
    } catch (err) {
      console.warn('MapaHonduras::URL inválida, usando origen actual', err)
      url = new URL('/api/reportes/indicadores-municipales', window.location.origin)
    }
    url.searchParams.set('anio', String(props.anio))
    url.searchParams.set('departamentoId', String(departamentoId))
    url.searchParams.set('limite', '100')
    const response = await fetch(url.toString())
    
    if (!response.ok) {
      throw new Error('No se pudieron cargar los datos del departamento')
    }
    
    const resultado = await response.json()
    const municipios = resultado.datos || []
    
    // Calcular totales del departamento
    const totales = municipios.reduce((acc: any, municipio: any) => {
      acc.totalConsultas += municipio.totalConsultas
      acc.pediatria += municipio.pediatria
      acc.ginecologia += municipio.ginecologia
      acc.medicinaGeneral += municipio.medicinaGeneral
      acc.medicosEspecialistas += municipio.medicosEspecialistas
      acc.totalUnidades += municipio.totalUnidades
      return acc
    }, {
      totalConsultas: 0,
      pediatria: 0,
      ginecologia: 0,
      medicinaGeneral: 0,
      medicosEspecialistas: 0,
      totalUnidades: 0
    })
    
    datosMunicipales.value = [totales]
  } catch (err) {
    console.error('Error cargando datos del departamento:', err)
    datosMunicipales.value = []
  }
}

const construirMapa = async () => {
  cargando.value = true
  error.value = null

  try {
    await nextTick()

    if (!mapaContainer.value) {
      throw new Error('No se pudo inicializar el contenedor del mapa')
    }

    const geojsonResp = await fetch('/geo/geoBoundaries-HND-ADM1.geojson')

    if (!geojsonResp.ok) {
      throw new Error('No se pudo cargar el GeoJSON de Honduras')
    }

    const geojson = await geojsonResp.json()

    const features = geojson.features.map((feature: any) => {
      const iso: string = feature.properties?.shapeISO ?? ''
      const departamentoId = isoToDepartamentoId[iso]

      return {
        ...feature,
        properties: {
          ...feature.properties,
          departamentoId,
          totalConsultas: 0
        }
      }
    })

    const procesado = {
      ...geojson,
      features
    }

    // Procesar GeoJSON completado

    const estilo: StyleSpecification = {
      version: 8,
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      sources: {
        honduras: {
          type: 'geojson',
          data: procesado
        }
      },
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: {
            'background-color': colorFondoMapa.value
          }
        },
        {
          id: 'departamentos-fill',
          type: 'fill',
          source: 'honduras',
          paint: {
            'fill-color': crearExpresionColor(),
            'fill-opacity': 0.85
          }
        },
        {
          id: 'departamentos-borde',
          type: 'line',
          source: 'honduras',
          paint: {
            'line-color': '#1d4ed8',
            'line-width': 1
          }
        }
      ]
    }

    const opciones: MapOptions = {
      container: mapaContainer.value as HTMLDivElement,
      style: estilo,
      bounds: [
        [-89.4, 12.8],
        [-83.0, 16.6]
      ],
      fitBoundsOptions: {
        padding: 40,
        linear: true
      }
    }

    const mapInstance = new maplibregl.Map(opciones)

    mapInstance.addControl(new maplibregl.NavigationControl({ showCompass: false }))

    mapa = mapInstance

    // Deshabilitar zoom con scroll para no bloquear el scroll del widget embebido
    try {
      mapInstance.scrollZoom?.disable()
    } catch (_) {
      // noop
    }

    mapInstance.on('load', () => {
      actualizarColores()
      actualizarFondoMapa()
    })

    mapInstance.on('click', 'departamentos-fill', async (evento: MapLayerMouseEvent) => {
      const feature = evento.features?.[0]
      if (!feature) {
        departamentoSeleccionado.value = null
        datosMunicipales.value = []
        return
      }

      const propiedades = feature.properties as {
        shapeName?: string
        departamentoId?: number
      }

      const departamentoId = propiedades.departamentoId ?? 0

      if (departamentoId) {
        departamentoIdSeleccionado.value = departamentoId
        departamentoSeleccionado.value = {
          id: departamentoId,
          nombre: propiedades.shapeName ?? 'Sin nombre'
        }
        await cargarDatosDepartamento(departamentoId)
        actualizarColores()
      }
    })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error desconocido al cargar el mapa'
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  esModoOscuro.value = document.documentElement.classList.contains('dark')
  observer = new MutationObserver(() => {
    esModoOscuro.value = document.documentElement.classList.contains('dark')
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  void construirMapa()
})

onBeforeUnmount(() => {
  if (mapa) {
    mapa.remove()
    mapa = null
  }
  observer?.disconnect()
  observer = null
})

watch(datosMunicipales, () => {
  actualizarColores()
})

watch(departamentoIdSeleccionado, () => {
  actualizarColores()
})

watch(esModoOscuro, () => {
  actualizarFondoMapa()
})

watch(() => props.anio, async () => {
  if (departamentoSeleccionado.value) {
    await cargarDatosDepartamento(departamentoSeleccionado.value.id)
  }
})
</script>

<template>
  <div
    class="relative min-h-[420px] overflow-hidden rounded-card border border-border bg-surface shadow-panel transition-colors duration-300 dark:border-border-dark dark:bg-surface-dark"
  >
    <div ref="mapaContainer" class="h-[480px] w-full max-[840px]:h-[360px]"></div>

    <div
      v-if="cargando"
      class="absolute inset-0 flex items-center justify-center bg-overlay-light px-4 text-center text-sm font-semibold text-text-secondary transition-colors duration-300 dark:bg-overlay-dark dark:text-text-inverted"
    >
      Cargando mapa...
    </div>
    <div
      v-else-if="error"
      class="absolute inset-0 flex items-center justify-center bg-red-500/90 px-4 text-center text-sm font-semibold text-white"
    >
      {{ error }}
    </div>

    <aside
      v-if="departamentoSeleccionado && datosMunicipales.length > 0"
      class="mx-4 my-4 space-y-3 rounded-[14px] border border-brand-dark/20 bg-white/90 px-4 py-4 text-sm text-text-secondary shadow-[0_12px_18px_rgba(12,74,110,0.15)] backdrop-blur transition-colors duration-300 dark:border-border-dark/60 dark:bg-surface-dark/95 dark:text-text-muted md:absolute md:bottom-4 md:right-48 md:mx-0 md:my-0 md:w-[280px] md:px-5 md:py-4"
    >
      <div class="space-y-1">
        <h3 class="text-lg font-semibold text-brand-dark transition-colors duration-300 dark:text-brand-light">
          {{ departamentoSeleccionado.nombre }}
        </h3>
        <p class="text-xs text-gray-600 dark:text-gray-400">
          Departamental de {{ departamentoSeleccionado.nombre }}
        </p>
      </div>
      
      <div class="space-y-2">
        <div>
          <span class="text-lg font-bold text-brand-base transition-colors duration-300 dark:text-brand-light">
            {{ datosMunicipales[0].totalConsultas.toLocaleString('es-HN') }}
          </span>
          <span class="text-xs text-gray-600 dark:text-gray-400 ml-1">
            consultas totales ({{ anio }})
          </span>
        </div>

        <div class="space-y-1 text-xs">
          <div>• Pediatría: {{ datosMunicipales[0].pediatria.toLocaleString('es-HN') }}</div>
          <div>• Ginecología: {{ datosMunicipales[0].ginecologia.toLocaleString('es-HN') }}</div>
          <div>• Med. General: {{ datosMunicipales[0].medicinaGeneral.toLocaleString('es-HN') }}</div>
          <div>• Centros salud: {{ datosMunicipales[0].totalUnidades }}</div>
        </div>
      </div>
    </aside>

    <aside
      v-else-if="departamentoSeleccionado"
      class="mx-4 my-4 space-y-2 rounded-[14px] border border-brand-dark/20 bg-white/90 px-4 py-4 text-sm text-text-secondary shadow-[0_12px_18px_rgba(12,74,110,0.15)] backdrop-blur transition-colors duration-300 dark:border-border-dark/60 dark:bg-surface-dark/95 dark:text-text-muted md:absolute md:bottom-4 md:right-48 md:mx-0 md:my-0 md:w-[280px] md:px-5 md:py-4"
    >
      <h3 class="text-lg font-semibold text-brand-dark transition-colors duration-300 dark:text-brand-light">
        {{ departamentoSeleccionado.nombre }}
      </h3>
      <p class="text-xs text-gray-500 italic">
        Cargando datos...
      </p>
    </aside>

    <!-- Chips de años -->
    <div class="absolute top-4 left-4 right-4 flex flex-wrap gap-2 justify-center">
      <button
        v-for="anio in aniosDisponibles"
        :key="anio"
        @click="seleccionarAnio(anio)"
        :class="[
          'px-3 py-1 text-xs font-medium rounded-full transition-all duration-200',
          anio === props.anio
            ? 'bg-brand-base text-white shadow-md'
            : 'bg-white/90 text-gray-700 hover:bg-gray-100 dark:bg-surface-dark/90 dark:text-gray-300 dark:hover:bg-gray-700'
        ]"
      >
        {{ anio }}
      </button>
    </div>
  </div>
</template>
