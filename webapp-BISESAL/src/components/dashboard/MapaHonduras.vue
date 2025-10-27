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
  enfermeraAuxiliar: number;
  enfermeraProfesional: number;
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
    enfermeraAuxiliar: 0,
    enfermeraProfesional: 0,
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

// Estado original del mapa capturado cuando se carga por primera vez
let estadoOriginalMapa: { center: [number, number]; zoom: number; pitch: number; bearing: number } | null = null

// Función para volver a la vista general de Honduras
const volverVistaGeneral = () => {
  if (mapa && estadoOriginalMapa) {
    // Usar easeTo para una transición suave y controlada
    // Resetear padding a 0 para volver a la vista original sin desplazamientos
    mapa.easeTo({
      center: estadoOriginalMapa.center,
      zoom: estadoOriginalMapa.zoom,
      pitch: 0, // Siempre resetear a vista plana
      bearing: 0, // Siempre resetear a norte arriba
      padding: { top: 0, bottom: 0, left: 0, right: 0 }, // Sin padding
      duration: 1500, // Animación suave de 1.5 segundos
      essential: true
    })

    // Limpiar selección de departamento
    departamentoSeleccionado.value = null
    departamentoIdSeleccionado.value = null
    datosMunicipales.value = null
    actualizarColores()
    actualizarEtiquetas()
  }
}

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
  // Si anio es null, mostrar total histórico
  if (props.anio === null) {
    return datos.totalHistorico
  }
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

const props = defineProps<{ anio: number | null; apiBase?: string }>()
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
  'update:anio': [anio: number | null]
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

// Estado para rastrear si "Total" está seleccionado
const totalSeleccionado = ref(false)

const aniosDisponibles = computed(() => {
  const anios: Array<{ valor: number | null; etiqueta: string }> = []
  // Agregar todos los años desde 2008 hasta 2025 (de izquierda a derecha)
  for (let anio = 2008; anio <= 2025; anio++) {
    anios.push({ valor: anio, etiqueta: String(anio) })
  }
  // Agregar "Total" al final
  anios.push({ valor: null, etiqueta: 'Total' })
  return anios
})

const seleccionarAnio = (item: { valor: number | null; etiqueta: string }) => {
  if (item.valor === null) {
    // Si es "Total", marcarlo como seleccionado y emitir null
    totalSeleccionado.value = true
    emit('update:anio', null)
  } else {
    // Si es un año específico, desmarcar "Total"
    totalSeleccionado.value = false
    emit('update:anio', item.valor)
  }
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

const actualizarEtiquetas = () => {
  if (!mapa) return
  // Mostrar solo la etiqueta del departamento seleccionado
  const filtro: any = departamentoIdSeleccionado.value !== null
    ? ['==', ['get', 'departamentoId'], departamentoIdSeleccionado.value]
    : ['==', ['get', 'departamentoId'], -1] // -1 para no mostrar ninguna etiqueta
  
  mapa.setFilter('departamentos-etiquetas', filtro)
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

// Función para calcular el centroide geométrico real de un polígono
// Usa el algoritmo basado en el área para obtener el centro verdadero
const calcularCentroide = (coordinates: number[][]): [number, number] => {
  if (!coordinates || coordinates.length < 3) return [-86.25, 14.6]
  
  let area = 0
  let centroidX = 0
  let centroidY = 0
  
  // Algoritmo para calcular el centroide de un polígono
  for (let i = 0; i < coordinates.length - 1; i++) {
    const x0 = coordinates[i]?.[0] ?? 0
    const y0 = coordinates[i]?.[1] ?? 0
    const x1 = coordinates[i + 1]?.[0] ?? 0
    const y1 = coordinates[i + 1]?.[1] ?? 0
    
    const crossProduct = x0 * y1 - x1 * y0
    area += crossProduct
    centroidX += (x0 + x1) * crossProduct
    centroidY += (y0 + y1) * crossProduct
  }
  
  area = area / 2
  
  if (Math.abs(area) < 0.0001) {
    // Si el área es cero, usar promedio simple
    let sumX = 0
    let sumY = 0
    coordinates.forEach(coord => {
      sumX += coord?.[0] ?? 0
      sumY += coord?.[1] ?? 0
    })
    return [sumX / coordinates.length, sumY / coordinates.length]
  }
  
  centroidX = centroidX / (6 * area)
  centroidY = centroidY / (6 * area)
  
  return [centroidX, centroidY]
}

// Crear GeoJSON de puntos centrales para cada departamento
const construirCentroidesDepartamentos = (): GeoJSONCollection | null => {
  if (!geojsonBase.value) return null
  
  const features = geojsonBase.value.features.map((feature) => {
    const propiedades = feature.properties ?? {}
    let centroide: [number, number] = [-86.25, 14.6]
    
    if (feature.geometry) {
      if (feature.geometry.type === 'Polygon') {
        // Para Polygon simple, usar el primer anillo (exterior)
        const coordinates = feature.geometry.coordinates[0] as number[][]
        centroide = calcularCentroide(coordinates)
      } else if (feature.geometry.type === 'MultiPolygon') {
        // Para MultiPolygon (como Islas de la Bahía), calcular centroide del polígono más grande
        const polygons = feature.geometry.coordinates as number[][][][]
        let largestPolygon: number[][] = []
        let maxPoints = 0
        
        polygons.forEach(polygon => {
          const ring = polygon[0] // Primer anillo de cada polígono
          if (ring && ring.length > maxPoints) {
            largestPolygon = ring as number[][]
            maxPoints = ring.length
          }
        })
        
        if (largestPolygon.length > 0) {
          centroide = calcularCentroide(largestPolygon)
        }
      }
    }
    
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: centroide
      },
      properties: propiedades
    }
  })
  
  console.log(`Centroides calculados para ${features.length} departamentos:`, 
    features.map(f => f.properties?.shapeName || 'Sin nombre'))
  
  return {
    type: 'FeatureCollection',
    features
  } as GeoJSONCollection
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
      anio: String(props.anio ?? 2025),
      departamentoId: String(departamentoId),
      limite: '100'
    })
    const respuesta = await fetchApiConFallback('/api/reportes/indicadores-municipales', params)
    const resultado = await respuesta.json()
    const totales = (resultado.datos ?? {}) as Partial<TotalesDepartamento>

    datosMunicipales.value = {
      totalConsultas: Number(totales.totalConsultas ?? 0),
      enfermeraAuxiliar: Number(totales.enfermeraAuxiliar ?? 0),
      enfermeraProfesional: Number(totales.enfermeraProfesional ?? 0),
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
        },
        'departamentos-centroides': {
          type: 'geojson',
          data: construirCentroidesDepartamentos() ?? { type: 'FeatureCollection', features: [] }
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
        },
        {
          id: 'departamentos-puntos',
          type: 'circle',
          source: 'departamentos-centroides',
          paint: {
            'circle-radius': 6,
            'circle-color': '#f97316',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
          }
        },
        {
          id: 'departamentos-etiquetas',
          type: 'symbol',
          source: 'departamentos-centroides',
          filter: ['==', ['get', 'departamentoId'], -1], // Inicialmente no mostrar ninguna etiqueta
          layout: {
            'text-field': ['get', 'shapeName'],
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
            'text-size': 14,
            'text-offset': [0, 1.5],
            'text-anchor': 'top'
          },
          paint: {
            'text-color': '#1f2937',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2
          }
        }
      ]
    }

    const opciones: MapOptions = {
      container: mapaContainer.value as HTMLDivElement,
      style: estilo,
      center: [-86.25, 14.8], // Centro ajustado para incluir Islas de la Bahía
      zoom: 6.2, // Zoom inicial
      pitch: 0, // Vista plana (sin inclinación)
      bearing: 0 // Norte arriba (sin rotación)
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

    // Capturar el estado original cuando el mapa esté completamente estable
    // El evento 'idle' se dispara cuando el mapa termina de renderizar y todas las animaciones finalizan
    mapInstance.once('idle', () => {
      if (!estadoOriginalMapa && mapInstance) {
        estadoOriginalMapa = {
          center: mapInstance.getCenter().toArray() as [number, number],
          zoom: mapInstance.getZoom(),
          pitch: mapInstance.getPitch(),
          bearing: mapInstance.getBearing()
        }
        console.log('Estado original capturado:', estadoOriginalMapa)
      }
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
        departamentoIdSeleccionado.value = departamentoId as number
        departamentoSeleccionado.value = {
          id: departamentoId,
          nombre: propiedades.shapeName ?? 'Sin nombre'
        }

        // Animación de zoom al departamento seleccionado
        if (feature.geometry && feature.geometry.type === 'Polygon') {
          // Calcular el centro del polígono del departamento
          const coordinates = feature.geometry.coordinates[0] as [number, number][]
          let totalLng = 0
          let totalLat = 0

          coordinates.forEach(coord => {
            totalLng += coord[0]
            totalLat += coord[1]
          })

          const centerLng = totalLng / coordinates.length
          const centerLat = totalLat / coordinates.length

          // Animar zoom al centro del departamento usando easeTo
          // Padding ajustado para centrar el departamento en el espacio visible (lado izquierdo)
          // dejando espacio a la derecha para el panel de información
          mapInstance.easeTo({
            center: [centerLng, centerLat],
            zoom: 7.5, // Nivel de zoom para ver el departamento
            pitch: 0, // Mantener vista plana
            bearing: 0, // Mantener norte arriba
            padding: { top: 50, bottom: 50, left: 50, right: 350 }, // Más padding a la derecha para el panel
            duration: 1500, // Duración de la animación en ms
            essential: true // La animación no se puede cancelar
          })
        }

        await cargarDatosDepartamento(departamentoId)
        actualizarColores()
        actualizarEtiquetas()
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
            consultas totales ({{ props.anio ?? 'Total' }})
          </span>
        </div>

        <div class="space-y-1 text-xs">
          <div>• Enfermera Auxiliar: {{ totalesDepartamento.enfermeraAuxiliar.toLocaleString('es-HN') }}</div>
          <div>• Enfermera Profesional: {{ totalesDepartamento.enfermeraProfesional.toLocaleString('es-HN') }}</div>
          <div>• Med. General: {{ totalesDepartamento.medicinaGeneral.toLocaleString('es-HN') }}</div>
          <div>• Centros salud: {{ totalesDepartamento.totalUnidades }}</div>
        </div>
      </div>
    </aside>


    <!-- Chips de años -->
    <div class="absolute top-4 left-4 right-4 flex flex-wrap gap-2 justify-center">
      <button
        v-for="item in aniosDisponibles"
        :key="item.etiqueta"
        @click="seleccionarAnio(item)"
        :class="[
          'px-3 py-1 text-xs font-medium rounded-full transition-all duration-200',
          (item.valor === null && totalSeleccionado) || (item.valor !== null && item.valor === props.anio && !totalSeleccionado)
            ? 'bg-brand-base text-white shadow-md'
            : 'bg-white/90 text-gray-700 hover:bg-gray-100 dark:bg-surface-dark/90 dark:text-gray-300 dark:hover:bg-gray-700'
        ]"
      >
        {{ item.etiqueta }}
      </button>
    </div>

    <!-- Controles inferiores -->
    <div class="absolute bottom-4 left-4 right-4 flex justify-center">
      <button
        @click="volverVistaGeneral"
        :disabled="!departamentoSeleccionado"
        class="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-gray-700 shadow-md transition-all hover:bg-gray-100 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed dark:bg-surface-dark/90 dark:text-gray-300 dark:hover:bg-gray-700"
        title="Volver a vista general de Honduras"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <span class="hidden sm:inline">Vista general</span>
      </button>
    </div>
  </div>
</template>
