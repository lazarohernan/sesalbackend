<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import maplibregl from 'maplibre-gl'
import type {
  ExpressionSpecification,
  MapLayerMouseEvent,
  MapOptions,
  StyleSpecification
} from 'maplibre-gl'
import type { FeatureCollection, Feature, Geometry } from 'geojson'
// eslint-disable-next-line import/no-unresolved
import MapLibreWorker from 'maplibre-gl/dist/maplibre-gl-csp-worker?worker'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { DepartamentoMapa } from '../../types/tablero'

;(maplibregl as typeof maplibregl & { workerClass?: typeof Worker }).workerClass =
  MapLibreWorker as unknown as typeof Worker

interface TotalesDepartamento {
  totalConsultas: number;
  pediatria: number;
  ginecologia: number;
  medicinaGeneral: number;
  medicosEspecialistas: number;
  totalUnidades: number;
}

const mapaContainer = ref<HTMLDivElement | null>(null)
const cargando = ref<boolean>(true)
const error = ref<string | null>(null)
const cargandoTotales = ref<boolean>(false)
const datosMunicipales = ref<TotalesDepartamento | null>(null)
const datosDepartamentos = ref<DepartamentoMapa[]>([])
const geojsonBase = ref<FeatureCollection<Geometry, Record<string, unknown>> | null>(null)
type GeoJSONFeature = Feature<Geometry, Record<string, unknown>>
type GeoJSONCollection = FeatureCollection<Geometry, Record<string, unknown>>
const totalesDepartamento = computed<TotalesDepartamento>(() => {
  return datosMunicipales.value ?? {
    totalConsultas: 0,
    pediatria: 0,
    ginecologia: 0,
    medicinaGeneral: 0,
    medicosEspecialistas: 0,
    totalUnidades: 0
  }
})

interface DepartamentoSeleccionado {
  id: number;
  nombre: string;
}

interface FeatureDepartamento {
  properties?: {
    shapeISO?: string;
    shapeName?: string;
    departamentoId?: number;
  };
}

const departamentoSeleccionado = ref<DepartamentoSeleccionado | null>(null)
const departamentoIdSeleccionado = ref<number | null>(null)
let mapa: maplibregl.Map | null = null
const esModoOscuro = ref<boolean>(false)
let observer: MutationObserver | null = null

const totalesDepartamentosMapa = computed(() => {
  const resultado = new Map<number, DepartamentoMapa>()
  datosDepartamentos.value.forEach((departamento) => {
    resultado.set(departamento.departamentoId, departamento)
  })
  return resultado
})

const obtenerTotalDepartamento = (departamentoId: number) => {
  const datos = totalesDepartamentosMapa.value.get(departamentoId)
  if (!datos) return 0
  switch (props.anio) {
    case 2025:
      return datos.total2025 ?? datos.totalHistorico
    case 2024:
      return datos.total2024 ?? datos.totalHistorico
    case 2023:
      return datos.total2023 ?? datos.totalHistorico
    default:
      return datos.totalHistorico
  }
}

const props = defineProps<{ anio: number; apiBase?: string }>()
const apiBaseNormalizado = computed(() => {
  const raw = typeof props.apiBase === 'string' ? props.apiBase.trim() : ''
  if (raw) return raw
  try {
    return window.location.origin
  } catch (_error) {
    return 'http://localhost:4000'
  }
})

const emit = defineEmits<{
  'update:anio': [anio: number]
}>()

const createApiUrl = (path: string) => {
  const base = apiBaseNormalizado.value
  try {
    if (/^https?:\/\//i.test(path)) {
      return new URL(path)
    }
    if (base && /^https?:\/\//i.test(base)) {
      return new URL(path, base)
    }
    const origen = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'
    return new URL(path, origen)
  } catch (_error) {
    const origen = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'
    return new URL(path, origen)
  }
}

const buildApiUrl = (path: string) => createApiUrl(path).toString()

const buildStaticUrl = (path: string) => {
  const normalizado = path.replace(/^\//, '')
  const base = import.meta.env.BASE_URL ?? '/'
  if (/^https?:\/\//i.test(base)) {
    return `${base.replace(/\/$/, '')}/${normalizado}`
  }
  if (typeof window !== 'undefined') {
    const prefijo = base === '/' ? '' : base.replace(/\/$/, '')
    return `${window.location.origin}${prefijo}/${normalizado}`
  }
  return `/${normalizado}`
}

const construirCandidatosApi = (path: string, params?: URLSearchParams) => {
  const candidatos = new Set<string>()
  const appendParams = (url: string) => {
    if (!params || !params.toString()) return url
    const separador = url.includes('?') ? '&' : '?'
    return `${url}${separador}${params.toString()}`
  }

  const principal = buildApiUrl(path)
  candidatos.add(appendParams(principal))

  if (typeof window !== 'undefined') {
    const relativo = new URL(path, window.location.origin).toString()
    candidatos.add(appendParams(relativo))
    const soloPath = appendParams(path.startsWith('/') ? path : `/${path}`)
    candidatos.add(soloPath)
  }

  return Array.from(candidatos.values())
}

const fetchApiConFallback = async (path: string, params?: URLSearchParams) => {
  const candidatos = construirCandidatosApi(path, params)
  let ultimoError: unknown = null
  for (const url of candidatos) {
    try {
      const respuesta = await fetch(url, {
        headers: {
          Accept: 'application/json'
        }
      })
      if (respuesta.ok) {
        return respuesta
      }
      ultimoError = new Error(`Solicitud falló (${respuesta.status})`)
    } catch (error) {
      ultimoError = error
    }
  }
  throw ultimoError ?? new Error('No se pudo completar la solicitud')
}

const aniosDisponibles = computed(() => {
  const anios = []
  for (let anio = 2008; anio <= 2025; anio++) {
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


const crearExpresionColor = (): ExpressionSpecification => [
  'case',
  // Si está seleccionado, azul cielo fuerte
  ['==', ['get', 'departamentoId'], departamentoIdSeleccionado.value || -1],
  '#0ea5e9',
  // Si no, blanco
  '#ffffff'
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

const construirGeojsonConTotales = (): GeoJSONCollection | null => {
  if (!geojsonBase.value) return null
  return {
    ...geojsonBase.value,
    features: geojsonBase.value.features.map((feature) => {
      const propiedades = feature.properties ?? {}
      const departamentoId = Number(propiedades.departamentoId ?? 0)
      return {
        ...feature,
        properties: {
          ...propiedades,
          totalConsultas: obtenerTotalDepartamento(departamentoId)
        }
      } as GeoJSONFeature
    })
  }
}

const actualizarFuenteGeografica = () => {
  if (!mapa || !geojsonBase.value) return
  const dataActualizada = construirGeojsonConTotales()
  if (!dataActualizada) return
  const fuente = mapa.getSource('honduras') as maplibregl.GeoJSONSource | undefined
  if (fuente?.setData) {
    fuente.setData(dataActualizada)
  }
}

const cargarDatosDepartamento = async (departamentoId: number) => {
  try {
    cargandoTotales.value = true
    const params = new URLSearchParams({
      anio: String(props.anio),
      departamentoId: String(departamentoId),
      limite: '100'
    })
    const respuesta = await fetchApiConFallback('/api/reportes/indicadores-municipales', params)
    const resultado = await respuesta.json()
    const totales = (resultado.datos ?? {}) as Partial<TotalesDepartamento>

    datosMunicipales.value = {
      totalConsultas: Number(totales.totalConsultas ?? 0),
      pediatria: Number(totales.pediatria ?? 0),
      ginecologia: Number(totales.ginecologia ?? 0),
      medicinaGeneral: Number(totales.medicinaGeneral ?? 0),
      medicosEspecialistas: Number(totales.medicosEspecialistas ?? 0),
      totalUnidades: Number(totales.totalUnidades ?? 0)
    }
  } catch (err) {
    console.error('Error cargando datos del departamento:', err)
    datosMunicipales.value = null
  } finally {
    cargandoTotales.value = false
  }
}

const cargarResumenDepartamentos = async () => {
  try {
    const respuesta = await fetchApiConFallback('/api/tablero/mapahonduras')
    const cuerpo = await respuesta.json()
    const datos = Array.isArray(cuerpo.datos) ? cuerpo.datos : []
    datosDepartamentos.value = datos.map((item: Partial<DepartamentoMapa>) => ({
      departamentoId: Number(item?.departamentoId ?? 0),
      nombre: item?.nombre ? String(item.nombre) : 'Sin nombre',
      totalHistorico: Number(item?.totalHistorico ?? 0),
      total2025: Number(item?.total2025 ?? 0),
      total2024: Number(item?.total2024 ?? 0),
      total2023: Number(item?.total2023 ?? 0),
      totalUnidades: Number(item?.totalUnidades ?? 0)
    }))
  } catch (error) {
    console.error('Error cargando resumen de departamentos:', error)
    datosDepartamentos.value = []
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

    await cargarResumenDepartamentos()
    
    // Cargar GeoJSON de países vecinos
    const centroamericaUrl = buildStaticUrl('geo/centroamerica.geojson')
    const centroamericaResp = await fetch(centroamericaUrl)
    const centroamerica = centroamericaResp.ok ? await centroamericaResp.json() : null
    
    // Cargar GeoJSON de Honduras
    const geoUrl = buildStaticUrl('geo/geoBoundaries-HND-ADM1.geojson')
    const geojsonResp = await fetch(geoUrl)

    if (!geojsonResp.ok) {
      throw new Error('No se pudo cargar el GeoJSON de Honduras')
    }

    const geojson = await geojsonResp.json()

    const features = geojson.features.map((feature: FeatureDepartamento, index: number) => {
      const iso: string = feature.properties?.shapeISO ?? ''
      const departamentoId = isoToDepartamentoId[iso] ?? 0
      const totalConsultas = obtenerTotalDepartamento(departamentoId)

      return {
        ...feature,
        id: departamentoId || index, // Asignar ID único para feature-state
        properties: {
          ...feature.properties,
          departamentoId,
          totalConsultas
        }
      }
    })

    const procesado = {
      ...geojson,
      features
    }
    geojsonBase.value = procesado as GeoJSONCollection

    // Procesar GeoJSON completado

    const estilo: StyleSpecification = {
      version: 8,
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      sources: {
        ...(centroamerica && {
          centroamerica: {
            type: 'geojson',
            data: centroamerica
          }
        }),
        honduras: {
          type: 'geojson',
          data: construirGeojsonConTotales() ?? procesado
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
        ...(centroamerica ? [
          {
            id: 'centroamerica-fill',
            type: 'fill' as const,
            source: 'centroamerica',
            paint: {
              'fill-color': '#e5e7eb',
              'fill-opacity': 0.4
            }
          },
          {
            id: 'centroamerica-borde',
            type: 'line' as const,
            source: 'centroamerica',
            paint: {
              'line-color': '#d1d5db',
              'line-width': 1
            }
          }
        ] : []),
        {
          id: 'departamentos-fill',
          type: 'fill',
          source: 'honduras',
          paint: {
            'fill-color': crearExpresionColor(),
            'fill-opacity': 0.9
          }
        },
        {
          id: 'departamentos-hover',
          type: 'fill',
          source: 'honduras',
          paint: {
            'fill-color': '#bae6fd',
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              0.85,
              0
            ]
          }
        },
        {
          id: 'departamentos-borde',
          type: 'line',
          source: 'honduras',
          paint: {
            'line-color': '#94a3b8',
            'line-width': 1.5
          }
        }
      ]
    }

    const opciones: MapOptions = {
      container: mapaContainer.value as HTMLDivElement,
      style: estilo,
      bounds: [
        [-89.4, 12.8],  // Honduras centrado
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

    let hoveredStateId: string | number | undefined = undefined

    mapInstance.on('load', () => {
      actualizarColores()
      actualizarFondoMapa()
      actualizarFuenteGeografica()
    })

    // Efecto hover - cambiar cursor
    mapInstance.on('mouseenter', 'departamentos-fill', () => {
      mapInstance.getCanvas().style.cursor = 'pointer'
    })

    mapInstance.on('mouseleave', 'departamentos-fill', () => {
      mapInstance.getCanvas().style.cursor = ''
      if (hoveredStateId !== undefined) {
        mapInstance.setFeatureState(
          { source: 'honduras', id: hoveredStateId },
          { hover: false }
        )
        hoveredStateId = undefined
      }
    })

    // Efecto hover - cambiar color
    mapInstance.on('mousemove', 'departamentos-fill', (evento: MapLayerMouseEvent) => {
      if (evento.features && evento.features.length > 0) {
        const feature = evento.features[0]
        if (!feature) return
        
        if (hoveredStateId !== undefined) {
          mapInstance.setFeatureState(
            { source: 'honduras', id: hoveredStateId },
            { hover: false }
          )
        }
        hoveredStateId = feature.id
        if (hoveredStateId !== undefined) {
          mapInstance.setFeatureState(
            { source: 'honduras', id: hoveredStateId },
            { hover: true }
          )
        }
      }
    })

    mapInstance.on('click', 'departamentos-fill', async (evento: MapLayerMouseEvent) => {
      const feature = evento.features?.[0]
      if (!feature) {
        departamentoSeleccionado.value = null
        datosMunicipales.value = null
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

watch(datosDepartamentos, () => {
  actualizarFuenteGeografica()
  actualizarColores()
})

watch(() => props.anio, async () => {
  if (departamentoSeleccionado.value) {
    datosMunicipales.value = null
    await cargarDatosDepartamento(departamentoSeleccionado.value.id)
  }
  actualizarFuenteGeografica()
  actualizarColores()
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
      v-if="departamentoSeleccionado"
      class="relative mx-4 my-4 space-y-3 rounded-[14px] border border-brand-dark/20 bg-white/90 px-4 py-4 text-sm text-text-secondary shadow-[0_12px_18px_rgba(12,74,110,0.15)] backdrop-blur transition-colors duration-300 dark:border-border-dark/60 dark:bg-surface-dark/95 dark:text-text-muted md:absolute md:bottom-4 md:right-48 md:mx-0 md:my-0 md:w-[280px] md:px-5 md:py-4"
    >
      <!-- Spinner de carga en esquina superior derecha -->
      <div
        v-if="cargandoTotales"
        class="absolute top-2 right-2 z-10"
      >
        <div class="w-4 h-4 border-2 border-brand-base border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div class="space-y-1">
        <h3 class="text-lg font-semibold text-primary transition-colors duration-300 dark:text-text-inverted">
          {{ departamentoSeleccionado.nombre }}
        </h3>
        <p class="text-xs text-gray-600 dark:text-gray-400">
          Departamental de {{ departamentoSeleccionado.nombre }}
        </p>
      </div>

      <!-- Mostrar datos solo cuando están disponibles -->
      <div v-if="datosMunicipales" class="space-y-2">
        <div>
          <span class="text-lg font-bold text-brand-base transition-colors duration-300 dark:text-brand-light">
            {{ totalesDepartamento.totalConsultas.toLocaleString('es-HN') }}
          </span>
          <span class="text-xs text-gray-600 dark:text-gray-400 ml-1">
            consultas totales ({{ props.anio }})
          </span>
        </div>

        <div class="space-y-1 text-xs">
          <div>• Pediatría: {{ totalesDepartamento.pediatria.toLocaleString('es-HN') }}</div>
          <div>• Ginecología: {{ totalesDepartamento.ginecologia.toLocaleString('es-HN') }}</div>
          <div>• Med. General: {{ totalesDepartamento.medicinaGeneral.toLocaleString('es-HN') }}</div>
          <div>• Centros salud: {{ totalesDepartamento.totalUnidades }}</div>
        </div>
      </div>
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
