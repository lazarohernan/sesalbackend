<script setup lang="ts">
import { computed, defineAsyncComponent, inject, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import AppShell from './components/layout/AppShell.vue'
import ConfiguracionRequired from './components/config/ConfiguracionRequired.vue'
import { useDatabaseConfig } from './composables/useDatabaseConfig.ts'

// Detectar si está en modo embedded
interface WidgetConfig {
  anio?: number
  departamento?: string
  theme?: 'light' | 'dark'
  isEmbedded?: boolean
  height?: string
  width?: string
  apiUrl?: string
}

const widgetConfig = inject<WidgetConfig | undefined>('widgetConfig', undefined)
const appRoot = ref<HTMLElement | null>(null)

const normalizarBaseUrl = (valor?: string) => {
  if (!valor) return undefined
  const limpio = valor.trim()
  if (!limpio) return undefined
  const tieneEsquema = /^https?:\/\//i.test(limpio)
  const candidato = tieneEsquema ? limpio : `http://${limpio}`
  try {
    const url = new URL(candidato)
    return url.origin
  } catch (err) {
    console.warn('URL de API inválida, usando origen actual', err)
    return undefined
  }
}

const apiBase = computed(() => {
  const desdeWidget = normalizarBaseUrl(widgetConfig?.apiUrl)
  if (desdeWidget) return desdeWidget
  const desdeEnv = normalizarBaseUrl(import.meta.env.VITE_API_URL)
  if (desdeEnv) return desdeEnv
  try {
    return window.location.origin
  } catch (_) {
    return 'http://localhost:4000'
  }
})
import ReportExportPanel, {
  type ExportFormat,
  type ReportExportOption,
  type ReportExportPayload
} from './components/reports/ReportExportPanel.vue'
import type { ResumenTablero } from './types/tablero.ts'

type TarjetaId = 'regiones' | 'municipios' | 'unidades' | 'detalle'


interface TarjetaResumen {
  id: TarjetaId
  titulo: string
  valor: string
  descripcion: string
}

const cargando = ref<boolean>(true)
const error = ref<string | null>(null)

// Configuración de base de datos
const { hasConfig } = useDatabaseConfig()
const tarjetas = ref<TarjetaResumen[]>([
  {
    id: 'regiones',
    titulo: 'Regiones',
    valor: '--',
    descripcion: 'Cobertura territorial macro'
  },
  {
    id: 'municipios',
    titulo: 'Municipios',
    valor: '--',
    descripcion: 'Municipios con datos históricos'
  },
  {
    id: 'unidades',
    titulo: 'Unidades de servicio',
    valor: '--',
    descripcion: 'US registradas en catálogo institucional'
  },
  {
    id: 'detalle',
    titulo: 'Registros detalle 2008-2025',
    valor: '--',
    descripcion: 'Total de filas analíticas acumuladas'
  }
])

const formatearNumero = (valor: number) =>
  new Intl.NumberFormat('es-HN', {
    maximumFractionDigits: 0
  }).format(valor)

const anioMapa = ref<number>(2024)

const opcionesReportes: ReportExportOption[] = [
  { label: 'Consolidado por Región y Nivel', value: 'consolidado-region' },
  { label: 'Resumen maestro', value: 'resumen-maestro' },
  { label: 'Detalle por municipio y US', value: 'detalle-us' }
]

const opcionesFormularios: ReportExportOption[] = [
  { label: '[Todos]', value: 'all' },
  { label: 'AT2-R-2012 (52 casillas)', value: 'AT2-R-2012' }
]

const opcionesBloques: ReportExportOption[] = [
  { label: '[Todos]', value: 'all' },
  { label: 'Atención en Grupo de Edad', value: 'bloque-edad' }
]

const regionesCatalogo = ref<ReportExportOption[]>([])
const municipiosCatalogo = ref<ReportExportOption[]>([{ label: '[Todos]', value: 'all' }])
const serviciosCatalogo = ref<ReportExportOption[]>([])
const unidadesCatalogo = ref<ReportExportOption[]>([{ label: '[Todas]', value: 'all' }])
const aniosDisponibles = ref<number[]>([])
const catalogosCargando = ref<boolean>(false)
const catalogosError = ref<string | null>(null)

const regionSeleccionada = ref<string | number>('all')
const municipioSeleccionado = ref<string | number>('all')

interface ReporteConsolidadoFila {
  regionId: number | null
  regionNombre: string | null
  departamentoId: number | null
  departamentoNombre: string | null
  municipioId: number | null
  municipioNombre: string | null
  unidadId: number
  unidadCodigo: number
  unidadNombre: string
  conceptoCodigo: string
  conceptoDescripcion: string
  totalEnfermeraAux: number
  totalEnfermeraPro: number
  totalMedicoGen: number
  totalMedicoEsp: number
}

interface ReporteDetalleResultado extends ReporteConsolidadoFila {}

interface ReporteResumenMaestroResultado {
  regionId: number | null
  regionNombre: string | null
  departamentoId: number | null
  departamentoNombre: string | null
  municipioId: number | null
  municipioNombre: string | null
  unidadId: number
  unidadCodigo: number
  unidadNombre: string
  totalEnfermeraAux: number
  totalEnfermeraPro: number
  totalMedicoGen: number
  totalMedicoEsp: number
  totalProfesionales: number
}

type ReporteTipo = 'consolidado-region' | 'detalle-us' | 'resumen-maestro'

type ReporteFila = ReporteConsolidadoFila | ReporteDetalleResultado | ReporteResumenMaestroResultado

const reporteDatos = ref<ReporteFila[]>([])
const reporteTipoActual = ref<ReporteTipo | null>(null)
const reporteCargando = ref<boolean>(false)
const reporteError = ref<string | null>(null)
let reporteAbortController: AbortController | null = null
let reporteSolicitudSecuencia = 0

const previewFilas = computed(() => reporteDatos.value.slice(0, 20))
const totalFilasReporte = computed(() => reporteDatos.value.length)
const esResumenMaestro = computed(() => reporteTipoActual.value === 'resumen-maestro')

const esFilaConsolidado = (fila: ReporteFila): fila is ReporteConsolidadoFila =>
  'conceptoCodigo' in fila

const claveFila = (fila: ReporteFila) =>
  esFilaConsolidado(fila) ? `${fila.unidadId}-${fila.conceptoCodigo}` : `resumen-${fila.unidadId}`

const descripcionConcepto = (fila: ReporteFila) =>
  esFilaConsolidado(fila) ? fila.conceptoDescripcion : 'Total profesionales'

const nombreReporte = computed(() => {
  switch (reporteTipoActual.value) {
    case 'detalle-us':
      return 'Detalle por municipio y unidad de salud'
    case 'resumen-maestro':
      return 'Resumen maestro de atenciones'
    case 'consolidado-region':
      return 'Consolidado por región'
    default:
      return 'Reporte generado'
  }
})

const MapaHonduras = defineAsyncComponent(() =>
  import('./components/dashboard/MapaHonduras.vue')
)

const actualizarTarjetas = (datos: ResumenTablero) => {
  tarjetas.value = [
    {
      id: 'regiones',
      titulo: 'Regiones',
      valor: formatearNumero(datos.totalRegiones),
      descripcion: 'Cobertura territorial macro'
    },
    {
      id: 'municipios',
      titulo: 'Municipios',
      valor: formatearNumero(datos.totalMunicipios),
      descripcion: 'Municipios con datos históricos'
    },
    {
      id: 'unidades',
      titulo: 'Unidades de servicio',
      valor: formatearNumero(datos.totalUnidadesServicio),
      descripcion: 'US registradas en catálogo institucional'
    },
    {
      id: 'detalle',
      titulo: 'Registros detalle 2008-2025',
      valor: formatearNumero(datos.totalRegistrosDetalle),
      descripcion: 'Total de filas analíticas acumuladas'
    }
  ]
}

const cargarResumen = async () => {
  cargando.value = true
  error.value = null

  try {
    const base = apiBase.value
    const respuesta = await fetch(`${base}/api/tablero/resumen`)

    if (!respuesta.ok) {
      throw new Error(`Error de API: ${respuesta.status}`)
    }

    const cuerpo = (await respuesta.json()) as {
      datos: ResumenTablero
    }

    actualizarTarjetas(cuerpo.datos)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error desconocido'
  } finally {
    cargando.value = false
  }
}

const fetchDatos = async <T>(ruta: string, transform?: (datos: unknown) => T): Promise<T> => {
  const base = apiBase.value
  const respuesta = await fetch(`${base}${ruta}`)
  if (!respuesta.ok) {
    throw new Error(`Error de API: ${respuesta.status}`)
  }
  const cuerpo = (await respuesta.json()) as { datos: unknown }
  return transform ? transform(cuerpo.datos) : (cuerpo.datos as T)
}

const cargarCatalogos = async () => {
  catalogosCargando.value = true
  catalogosError.value = null

  try {
    const [regiones, servicios, periodos] = await Promise.all([
      fetchDatos<ReportExportOption[]>(
        '/api/reportes/regiones',
        (datos) => [
          { label: '[Todas]', value: 'all' },
          ...((datos as Array<{ id: number; nombre: string }>).map((item) => ({
            label: item.nombre,
            value: item.id
          })))
        ]
      ),
      fetchDatos<ReportExportOption[]>(
        '/api/reportes/servicios',
        (datos) => [
          { label: '[Todos]', value: 'all' },
          ...((datos as Array<{ id: number; nombre: string }>).map((item) => ({
            label: item.nombre || 'Sin nombre',
            value: item.id
          })))
        ]
      ),
      fetchDatos<number[]>(
        '/api/reportes/periodos',
        (datos) =>
          (datos as Array<{ anio: number }>)
            .map((item) => item.anio)
            .filter((anio) => Number.isFinite(anio))
      ),
      fetchDatos<ReportExportOption[]>(
        '/api/reportes/departamentos',
        (datos) => [
          { label: '[Todos]', value: 'all' },
          ...((datos as Array<{ id: number; nombre: string }>).map((item) => ({
            label: item.nombre,
            value: item.id
          })))
        ]
      )
    ])

    regionesCatalogo.value = regiones
    serviciosCatalogo.value = servicios
    aniosDisponibles.value = periodos.length ? periodos : [new Date().getFullYear()]
    municipiosCatalogo.value = [{ label: '[Todos]', value: 'all' }]

    await Promise.all([fetchMunicipios(), fetchUnidades()])
  } catch (err) {
    catalogosError.value = err instanceof Error ? err.message : 'Error al cargar catálogos'
    if (regionesCatalogo.value.length === 0) {
      regionesCatalogo.value = [{ label: '[Todas]', value: 'all' }]
    }
    if (serviciosCatalogo.value.length === 0) {
      serviciosCatalogo.value = [{ label: '[Todos]', value: 'all' }]
    }
    if (municipiosCatalogo.value.length === 0) {
      municipiosCatalogo.value = [{ label: '[Todos]', value: 'all' }]
    }
    if (unidadesCatalogo.value.length === 0) {
      unidadesCatalogo.value = [{ label: '[Todas]', value: 'all' }]
    }
    if (aniosDisponibles.value.length === 0) {
      aniosDisponibles.value = [new Date().getFullYear()]
    }
  } finally {
    catalogosCargando.value = false
  }
}

const valorFiltro = (valor: string | number) =>
  valor === 'all' || valor === '' ? undefined : String(valor)

const fetchMunicipios = async (regionValor?: string | number) => {
  try {
    const parametro = valorFiltro(regionValor ?? regionSeleccionada.value)
    const ruta = parametro ? `/api/reportes/municipios?regionId=${parametro}` : '/api/reportes/municipios'
    const municipios = await fetchDatos<ReportExportOption[]>(ruta, (datos) => [
      { label: '[Todos]', value: 'all' },
      ...((datos as Array<{ id: number; nombre: string }>).map((item) => ({
        label: item.nombre,
        value: item.id
      })))
    ])
    municipiosCatalogo.value = municipios
  } catch (err) {
    catalogosError.value = err instanceof Error ? err.message : 'Error al cargar municipios'
    municipiosCatalogo.value = [{ label: '[Todos]', value: 'all' }]
  }
}

const fetchUnidades = async () => {
  try {
    const params = new URLSearchParams()
    const regionParam = valorFiltro(regionSeleccionada.value)
    const muniParam = valorFiltro(municipioSeleccionado.value)

    if (regionParam) params.append('regionId', regionParam)
    if (muniParam) params.append('municipioId', muniParam)

    const query = params.toString()
    const ruta = query ? `/api/reportes/unidades?${query}` : '/api/reportes/unidades'

    const unidades = await fetchDatos<ReportExportOption[]>(ruta, (datos) => [
      { label: '[Todas]', value: 'all' },
      ...((datos as Array<{ id: number; codigo: number; nombre: string }>).map((item) => ({
        label: `${item.codigo} - ${item.nombre}`,
        value: item.id
      })))
    ])

    unidadesCatalogo.value = unidades
  } catch (err) {
    catalogosError.value = err instanceof Error ? err.message : 'Error al cargar unidades'
    unidadesCatalogo.value = [{ label: '[Todas]', value: 'all' }]
  }
}

onMounted(() => {
  void Promise.all([cargarResumen(), cargarCatalogos()])
})

onBeforeUnmount(() => {
  if (reporteAbortController) {
    reporteAbortController.abort()
  }
})

const opcionesRegiones = computed(() => regionesCatalogo.value)
const opcionesMunicipios = computed(() => municipiosCatalogo.value)
const opcionesServicios = computed(() => serviciosCatalogo.value)
const opcionesUnidades = computed(() => unidadesCatalogo.value)
const listaAnios = computed(() => aniosDisponibles.value)

const toNumberOrUndefined = (valor: string | number | undefined) => {
  if (valor === undefined || valor === null) return undefined
  if (valor === 'all' || valor === '') return undefined
  const numero = Number(valor)
  return Number.isNaN(numero) ? undefined : numero
}

const toMes = (valor: string) => {
  if (valor === '00') return 1
  if (valor === '13') return 12
  const numero = Number.parseInt(valor, 10)
  if (Number.isNaN(numero)) return 1
  return Math.min(Math.max(numero, 1), 12)
}

const normalizeTextFilter = (valor: string | number | undefined) => {
  if (valor === undefined || valor === null) return undefined
  if (valor === 'all' || valor === '') return undefined
  return typeof valor === 'string' ? valor : String(valor)
}

const construirFiltrosConsolidado = (payload: ReportExportPayload) => ({
  anio: payload.year,
  mesInicial: toMes(payload.monthStart),
  mesFinal: toMes(payload.monthEnd),
  regionId: toNumberOrUndefined(payload.region),
  municipioId: toNumberOrUndefined(payload.municipalityId),
  servicioId: payload.serviceType === 'all' ? undefined : String(payload.serviceType),
  unidadId: toNumberOrUndefined(payload.unitId),
  formulario: normalizeTextFilter(payload.form),
  bloque: normalizeTextFilter(payload.block)
})

const obtenerEndpointPorTipo = (tipo: ReporteTipo) => {
  switch (tipo) {
    case 'consolidado-region':
      return '/api/reportes/consolidado'
    case 'detalle-us':
      return '/api/reportes/detalle'
    case 'resumen-maestro':
      return '/api/reportes/resumen-maestro'
    default:
      return null
  }
}

const construirFiltros = (payload: ReportExportPayload) => construirFiltrosConsolidado(payload)

const castearDatos = (tipo: ReporteTipo, datos: unknown): ReporteFila[] => {
  if (!Array.isArray(datos)) return []

  if (tipo === 'resumen-maestro') {
    return datos as ReporteResumenMaestroResultado[]
  }

  return datos as ReporteConsolidadoFila[]
}

const desplazarAReporte = () => {
  const rootEl = appRoot.value ?? document.body
  window.setTimeout(() => {
    const secciones = Array.from(
      rootEl.querySelectorAll('[data-report-section]')
    ) as HTMLElement[]

    const objetivoVisible = secciones.find((el) => el.offsetParent !== null)
    const objetivo = objetivoVisible ?? (secciones.length ? secciones[secciones.length - 1] : null)

    if (objetivo) {
      objetivo.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, 450)
}

const handleReportGenerate = async (payload: ReportExportPayload): Promise<boolean> => {
  const tipo = payload.reportType as ReporteTipo
  const endpoint = obtenerEndpointPorTipo(tipo)

  if (!endpoint) {
    reporteError.value = `El tipo de reporte "${payload.reportType}" no está soportado.`
    return false
  }

  reporteSolicitudSecuencia += 1
  const solicitudActual = reporteSolicitudSecuencia

  if (reporteAbortController) {
    reporteAbortController.abort()
  }

  reporteAbortController = new AbortController()

  reporteCargando.value = true
  reporteError.value = null
  reporteTipoActual.value = tipo

  try {
    const filtros = construirFiltros(payload)
    const base = apiBase.value
    const respuesta = await fetch(`${base}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(filtros),
      signal: reporteAbortController.signal
    })

    if (!respuesta.ok) {
      throw new Error(`Error de API: ${respuesta.status}`)
    }

    const cuerpo = (await respuesta.json()) as { datos: unknown }

    if (solicitudActual !== reporteSolicitudSecuencia) {
      return false
    }

    reporteDatos.value = castearDatos(tipo, cuerpo.datos)

    if (reporteDatos.value.length) {
      await nextTick()
      desplazarAReporte()
    }

    return true
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return false
    }

    reporteError.value = err instanceof Error ? err.message : 'No se pudo generar el reporte'
    reporteDatos.value = []
    reporteTipoActual.value = null
    return false
  } finally {
    if (solicitudActual === reporteSolicitudSecuencia) {
      reporteCargando.value = false
    }
  }
}

const generarCsv = (tipo: ReporteTipo, datos: ReporteFila[]) => {
  if (!datos.length) return ''

  const escape = (valor: unknown) => {
    const texto = valor === null || valor === undefined ? '' : String(valor)
    return `"${texto.replace(/"/g, '""')}"`
  }

  if (tipo === 'resumen-maestro') {
    const encabezados = [
      'regionId',
      'regionNombre',
      'departamentoId',
      'departamentoNombre',
      'municipioId',
      'municipioNombre',
      'unidadId',
      'unidadCodigo',
      'unidadNombre',
      'totalEnfermeraAux',
      'totalEnfermeraPro',
      'totalMedicoGen',
      'totalMedicoEsp',
      'totalProfesionales'
    ]

    const filas = (datos as ReporteResumenMaestroResultado[]).map((fila) =>
      [
        fila.regionId,
        fila.regionNombre,
        fila.departamentoId,
        fila.departamentoNombre,
        fila.municipioId,
        fila.municipioNombre,
        fila.unidadId,
        fila.unidadCodigo,
        fila.unidadNombre,
        fila.totalEnfermeraAux,
        fila.totalEnfermeraPro,
        fila.totalMedicoGen,
        fila.totalMedicoEsp,
        fila.totalProfesionales
      ]
        .map(escape)
        .join(',')
    )

    return `${encabezados.join(',')}
${filas.join('\n')}`
  }

  const encabezados = [
    'regionId',
    'regionNombre',
    'departamentoId',
    'departamentoNombre',
    'municipioId',
    'municipioNombre',
    'unidadId',
    'unidadCodigo',
    'unidadNombre',
    'conceptoCodigo',
    'conceptoDescripcion',
    'totalEnfermeraAux',
    'totalEnfermeraPro',
    'totalMedicoGen',
    'totalMedicoEsp'
  ]

  const filas = (datos as ReporteConsolidadoFila[]).map((fila) =>
    [
      fila.regionId,
      fila.regionNombre,
      fila.departamentoId,
      fila.departamentoNombre,
      fila.municipioId,
      fila.municipioNombre,
      fila.unidadId,
      fila.unidadCodigo,
      fila.unidadNombre,
      fila.conceptoCodigo,
      fila.conceptoDescripcion,
      fila.totalEnfermeraAux,
      fila.totalEnfermeraPro,
      fila.totalMedicoGen,
      fila.totalMedicoEsp
    ]
      .map(escape)
      .join(',')
  )

  return `${encabezados.join(',')}
${filas.join('\n')}`
}

const descargarCsv = (contenido: string, nombre: string) => {
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  enlace.click()
  URL.revokeObjectURL(url)
}

const generarPdf = (tipo: ReporteTipo, datos: ReporteFila[]) => {
  if (!datos.length) return

  const doc = new jsPDF()

  doc.setFontSize(16)
  doc.text(nombreReporte.value, 14, 20)

  const columns = [
    { header: 'Región', dataKey: 'regionNombre' },
    { header: 'Departamento', dataKey: 'departamentoNombre' },
    { header: 'Municipio', dataKey: 'municipioNombre' },
    { header: 'Unidad', dataKey: 'unidadNombre' },
    ...(tipo !== 'resumen-maestro' ? [{ header: 'Concepto', dataKey: 'conceptoDescripcion' }] : []),
    { header: 'Enf. Aux', dataKey: 'totalEnfermeraAux' },
    { header: 'Enf. Pro', dataKey: 'totalEnfermeraPro' },
    { header: 'Méd. Gen', dataKey: 'totalMedicoGen' },
    { header: 'Méd. Esp', dataKey: 'totalMedicoEsp' },
    ...(tipo === 'resumen-maestro' ? [{ header: 'Total Profesionales', dataKey: 'totalProfesionales' }] : [])
  ]

  const filas = datos.map((fila) => ({
    regionNombre: fila.regionNombre ?? 'Sin región',
    departamentoNombre: fila.departamentoNombre ?? 'Sin departamento',
    municipioNombre: fila.municipioNombre ?? 'Sin municipio',
    unidadNombre: `${fila.unidadCodigo} - ${fila.unidadNombre}`,
    ...(tipo !== 'resumen-maestro' ? { conceptoDescripcion: descripcionConcepto(fila) } : {}),
    totalEnfermeraAux: fila.totalEnfermeraAux.toLocaleString('es-HN'),
    totalEnfermeraPro: fila.totalEnfermeraPro.toLocaleString('es-HN'),
    totalMedicoGen: fila.totalMedicoGen.toLocaleString('es-HN'),
    totalMedicoEsp: fila.totalMedicoEsp.toLocaleString('es-HN'),
    ...(tipo === 'resumen-maestro' ? { totalProfesionales: (fila as ReporteResumenMaestroResultado).totalProfesionales.toLocaleString('es-HN') } : {})
  }))

  autoTable(doc, {
    columns,
    body: filas,
    startY: 30,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] }
  })

  doc.save(`reporte-${tipo}-${Date.now()}.pdf`)
}

const handleReportExport = async (format: ExportFormat, payload: ReportExportPayload) => {
  const tipo = payload.reportType as ReporteTipo
  if (!['consolidado-region', 'detalle-us', 'resumen-maestro'].includes(tipo)) {
    reporteError.value = `El tipo de reporte "${payload.reportType}" no está soportado.`
    return
  }

  if (!reporteDatos.value.length || reporteTipoActual.value !== tipo) {
    const generado = await handleReportGenerate(payload)
    if (!generado || !reporteDatos.value.length) {
      return
    }
  }

  if (format === 'csv') {
    const csv = generarCsv(tipo, reporteDatos.value)
    const nombre = `reporte-${tipo}-${Date.now()}.csv`
    descargarCsv(csv, nombre)
    return
  }

  if (format === 'pdf') {
    generarPdf(tipo, reporteDatos.value)
    return
  }

  reporteError.value = `El formato "${format}" no está soportado. Usa CSV o PDF.`
}

const handleSearchUnit = () => {
  console.info('Buscar unidad de salud')
}

const handleRegionChange = async (valor: string | number) => {
  regionSeleccionada.value = valor
  await fetchMunicipios()
  await fetchUnidades()
}


const handleMunicipalityChange = async (valor: string | number) => {
  municipioSeleccionado.value = valor
  await fetchUnidades()
}
</script>

<template>
  <div ref="appRoot">
    <!-- Banner de configuración requerida -->
    <ConfiguracionRequired v-if="!hasConfig" />
    
    <!-- Modo Embedded: Solo componentes principales -->
    <div
      v-if="widgetConfig?.isEmbedded"
      class="bi-sesal-widget"
      :class="`theme-${widgetConfig.theme || 'light'}`"
    >
    <!-- Header con título -->
    <header class="widget-header">
      <h1 class="widget-title">SESAL</h1>
      <p class="widget-subtitle">Indicadores de salud pública en Honduras</p>
    </header>

    <!-- Tarjetas de resumen -->
    <section class="stats-section">
      <div
        v-if="error"
        class="error-message"
        role="alert"
      >
        <strong>No se pudieron cargar las métricas.</strong>
        <span>{{ error }}</span>
        <button type="button" @click="cargarResumen">Reintentar</button>
      </div>

      <div
        class="stats-grid"
        :class="{ 'loading': cargando }"
      >
        <article
          v-for="tarjeta in tarjetas"
          :key="tarjeta.id"
          class="stat-card"
        >
          <header class="stat-header">
            <h3 class="stat-title">{{ tarjeta.titulo }}</h3>
            <span class="stat-badge">Total histórico</span>
          </header>
          <strong class="stat-value">{{ tarjeta.valor }}</strong>
          <p class="stat-description">{{ tarjeta.descripcion }}</p>
        </article>
      </div>
    </section>

    <!-- Mapa de Honduras -->
    <section class="map-section">
      <header class="section-header">
        <h2 class="section-title">Mapa de actividad por departamento</h2>
        <p class="section-subtitle">Volumen histórico de atenciones y unidades de servicio</p>
      </header>

      <Suspense>
        <template #default>
          <MapaHonduras
            v-model:anio="anioMapa"
            :api-base="apiBase"
          />
        </template>
        <template #fallback>
          <div class="map-loading">
            Cargando mapa...
          </div>
        </template>
      </Suspense>
    </section>

    <!-- Panel de exportación -->
    <section class="export-section">
      <ReportExportPanel
        :report-types="opcionesReportes"
        :forms="opcionesFormularios"
        :blocks="opcionesBloques"
        :regions="opcionesRegiones"
        :municipalities="opcionesMunicipios"
        :services="opcionesServicios"
        :units="opcionesUnidades"
        :years="listaAnios"
        :loading="catalogosCargando"
        @generate="handleReportGenerate"
        @export="handleReportExport"
        @search-unit="handleSearchUnit"
        @region-change="handleRegionChange"
        @municipality-change="handleMunicipalityChange"
      />
    </section>

    <!-- Modales y overlays (solo en embedded) -->
    <Transition name="modal" mode="out-in" appear>
      <div
        v-if="reporteCargando"
        key="loading-modal"
        class="loading-overlay"
      >
        <div class="loading-modal">
          <div class="loading-spinner">
            <div class="spinner"></div>
          </div>
          <h3>Generando reporte</h3>
          <p>Procesando datos institucionales...</p>
        </div>
      </div>
    </Transition>

    <div v-if="reporteError" class="error-banner">
      {{ reporteError }}
    </div>

    <Transition name="report" appear>
      <section
        v-if="!reporteCargando && !reporteError && totalFilasReporte > 0"
        key="report-content"
        class="report-preview"
      >
        <header class="report-header">
          <h3>Vista previa · {{ nombreReporte }}</h3>
          <p>Mostrando {{ previewFilas.length }} de {{ totalFilasReporte }} filas</p>
        </header>

        <div class="report-table">
          <table>
            <thead>
              <tr>
                <th>Región</th>
                <th>Departamento</th>
                <th>Municipio</th>
                <th>Unidad</th>
                <th v-if="!esResumenMaestro">Concepto</th>
                <th>Enf. Aux</th>
                <th>Enf. Pro</th>
                <th>Méd. Gen</th>
                <th>Méd. Esp</th>
                <th v-if="esResumenMaestro">Total profesionales</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="fila in previewFilas" :key="claveFila(fila)">
                <td>{{ fila.regionNombre ?? 'Sin región' }}</td>
                <td>{{ fila.departamentoNombre ?? 'Sin departamento' }}</td>
                <td>{{ fila.municipioNombre ?? 'Sin municipio' }}</td>
                <td>{{ fila.unidadCodigo }} - {{ fila.unidadNombre }}</td>
                <td v-if="!esResumenMaestro">{{ descripcionConcepto(fila) }}</td>
                <td>{{ fila.totalEnfermeraAux.toLocaleString('es-HN') }}</td>
                <td>{{ fila.totalEnfermeraPro.toLocaleString('es-HN') }}</td>
                <td>{{ fila.totalMedicoGen.toLocaleString('es-HN') }}</td>
                <td>{{ fila.totalMedicoEsp.toLocaleString('es-HN') }}</td>
                <td v-if="esResumenMaestro">
                  {{ (fila as ReporteResumenMaestroResultado).totalProfesionales.toLocaleString('es-HN') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </Transition>
  </div>

    <!-- Modo Normal: App completa -->
    <AppShell v-else>
      <section class="flex flex-col gap-6 transition-colors duration-300">
      <header
        class="flex flex-col gap-4 rounded-card border border-border bg-surface px-6 py-4 shadow-panel transition-colors duration-300 dark:border-border-dark dark:bg-surface-dark sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="space-y-1">
          <h2 class="text-2xl font-semibold text-brand-dark transition-colors duration-300 dark:text-brand-light">
            Resumen institucional
          </h2>
          <p class="text-sm text-text-secondary transition-colors duration-300 dark:text-text-muted">
            Indicadores claves del ecosistema SESAL
          </p>
        </div>
      </header>

      <div
        v-if="error"
        class="flex items-center gap-3 rounded-[14px] border border-red-600/20 bg-[#fff5f5] px-5 py-4 text-red-700 transition-colors duration-300 dark:border-red-400/40 dark:bg-red-600/20 dark:text-red-200"
        role="alert"
      >
        <strong class="text-sm font-semibold">No se pudieron cargar las métricas.</strong>
        <span class="text-sm">{{ error }}</span>
        <button
          class="ml-auto rounded-full border border-red-600 px-3 py-1 text-sm font-medium transition-colors duration-200 hover:bg-red-600 hover:text-white dark:border-red-400 dark:hover:bg-red-400/50 dark:hover:text-white"
          type="button"
          @click="cargarResumen"
        >
          Reintentar
        </button>
      </div>

      <div
        class="grid gap-6 transition-opacity duration-200 sm:grid-cols-2 xl:grid-cols-4"
        :class="{ 'opacity-60': cargando }"
      >
        <article
          v-for="tarjeta in tarjetas"
          :key="tarjeta.id"
          class="group relative flex flex-col gap-3 overflow-hidden rounded-card border border-border bg-surface p-6 shadow-panel transition-colors duration-300 dark:border-border-dark dark:bg-surface-dark"
        >
          <header class="flex items-center justify-between gap-3">
            <h3 class="text-lg font-semibold text-brand-dark transition-colors duration-300 dark:text-brand-light">
              {{ tarjeta.titulo }}
            </h3>
            <span
              class="rounded-full border border-brand-base/30 bg-brand-base/10 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-widest text-brand-base transition-colors duration-300 dark:border-brand-base/40 dark:bg-brand-base/20 dark:text-brand-light"
            >
              Total histórico
            </span>
          </header>
          <strong class="text-3xl font-bold text-brand-base transition-colors duration-300 dark:text-brand-light">
            {{ tarjeta.valor }}
          </strong>
          <p class="max-w-xs text-sm text-text-secondary transition-colors duration-300 dark:text-text-muted">
            {{ tarjeta.descripcion }}
          </p>
          <div
            class="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-base/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        </article>
      </div>
    </section>

    <section class="flex flex-col gap-6 transition-colors duration-300">
      <header
        class="flex flex-col gap-4 rounded-card border border-border bg-surface px-6 py-4 shadow-panel transition-colors duration-300 dark:border-border-dark dark:bg-surface-dark sm:flex-row sm:justify-between"
      >
        <div class="space-y-1">
          <h2 class="text-2xl font-semibold text-brand-dark transition-colors duration-300 dark:text-brand-light">
            Mapa de actividad por departamento
          </h2>
          <p class="text-sm text-text-secondary transition-colors duration-300 dark:text-text-muted">
            Volumen histórico de atenciones y unidades de servicio (2008-2025)
          </p>
        </div>
      </header>

      <Suspense>
        <template #default>
          <MapaHonduras
            v-model:anio="anioMapa"
            :api-base="apiBase"
          />
        </template>
        <template #fallback>
          <div
            class="flex h-[360px] items-center justify-center rounded-card border border-border bg-surface text-sm font-medium text-text-secondary dark:border-border-dark dark:bg-surface-dark dark:text-text-muted"
          >
            Cargando mapa...
          </div>
        </template>
      </Suspense>
    </section>

    <ReportExportPanel
      class="mt-6"
      :report-types="opcionesReportes"
      :forms="opcionesFormularios"
      :blocks="opcionesBloques"
      :regions="opcionesRegiones"
      :municipalities="opcionesMunicipios"
      :services="opcionesServicios"
      :units="opcionesUnidades"
      :years="listaAnios"
      :loading="catalogosCargando"
      @generate="handleReportGenerate"
      @export="handleReportExport"
      @search-unit="handleSearchUnit"
      @region-change="handleRegionChange"
      @municipality-change="handleMunicipalityChange"
    />

    <p v-if="catalogosError" class="mt-4 text-sm text-red-500">
      No se pudieron cargar todos los catálogos: {{ catalogosError }}
    </p>

    <!-- Modal de carga con Transition de Vue -->
    <Transition
      name="modal"
      mode="out-in"
      appear
    >
      <div
        v-if="reporteCargando"
        key="loading-modal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-brand-base/10 via-surface/95 to-brand-base/15 backdrop-blur-md dark:from-brand-base/5 dark:via-surface-dark/95 dark:to-brand-base/10"
      >
        <div
          data-report-section
          class="relative mx-4 max-w-md rounded-3xl border border-border/50 bg-surface/95 backdrop-blur-xl p-8 text-center shadow-2xl ring-1 ring-white/20 dark:border-border-dark/50 dark:bg-surface-dark/95 dark:ring-white/10"
          style="box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1);"
        >
          <div class="mb-6 flex justify-center">
            <div class="relative">
              <!-- Spinner principal -->
              <div class="h-14 w-14 animate-spin rounded-full border-3 border-brand-base/30 border-t-brand-base border-r-transparent dark:border-brand-base/40 dark:border-t-brand-light"></div>
              <!-- Círculo interior pulsante -->
              <div class="absolute inset-2 animate-pulse rounded-full bg-gradient-to-br from-brand-base/20 to-brand-base/5 dark:from-brand-base/30 dark:to-brand-base/10"></div>
              <!-- Ícono central -->
              <div class="absolute inset-0 flex items-center justify-center">
                <svg class="h-6 w-6 text-brand-base dark:text-brand-light animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <h3 class="text-xl font-bold text-brand-dark dark:text-brand-light bg-gradient-to-r from-brand-dark to-brand-base bg-clip-text text-transparent dark:from-brand-light dark:to-brand-base">
              Generando reporte
            </h3>
            <p class="text-sm text-text-secondary dark:text-text-muted font-medium">
              Procesando datos institucionales...
            </p>
          </div>

          <!-- Barra de progreso elegante -->
          <div class="mt-6">
            <div class="h-1 bg-border/30 rounded-full overflow-hidden dark:bg-border-dark/30">
              <div class="h-full bg-gradient-to-r from-brand-base to-brand-dark rounded-full animate-pulse" style="width: 60%; animation: progress 2s ease-in-out infinite;"></div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <section
      v-if="reporteError"
      data-report-section
      class="mt-6 rounded-card border border-red-500/40 bg-red-500/10 px-6 py-4 text-sm text-red-600 shadow-panel dark:text-red-200"
    >
      {{ reporteError }}
    </section>

    <Transition
      name="report"
      appear
    >
      <section
        v-if="!reporteCargando && !reporteError && totalFilasReporte > 0"
        key="report-content"
        data-report-section
        class="mt-6 rounded-card border border-border bg-surface px-6 py-4 shadow-panel dark:border-border-dark dark:bg-surface-dark"
      >
      <header class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 class="text-lg font-semibold text-brand-dark transition-colors duration-300 dark:text-brand-light">
            Vista previa · {{ nombreReporte }}
          </h3>
          <p class="text-sm text-text-secondary transition-colors duration-300 dark:text-text-muted">
            Mostrando {{ previewFilas.length }} de {{ totalFilasReporte }} filas obtenidas.
          </p>
        </div>
      </header>

      <div class="overflow-auto">
        <table class="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr class="border-b border-border dark:border-border-dark">
              <th class="px-3 py-2">Región</th>
              <th class="px-3 py-2">Departamento</th>
              <th class="px-3 py-2">Municipio</th>
              <th class="px-3 py-2">Unidad</th>
              <th v-if="!esResumenMaestro" class="px-3 py-2">Concepto</th>
              <th class="px-3 py-2 text-right">Enf. Aux</th>
              <th class="px-3 py-2 text-right">Enf. Pro</th>
              <th class="px-3 py-2 text-right">Méd. Gen</th>
              <th class="px-3 py-2 text-right">Méd. Esp</th>
              <th v-if="esResumenMaestro" class="px-3 py-2 text-right">Total profesionales</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="fila in previewFilas"
              :key="claveFila(fila)"
              class="border-b border-border/60 align-top transition-colors duration-300 last:border-0 dark:border-border-dark/60"
            >
              <td class="px-3 py-2">{{ fila.regionNombre ?? 'Sin región' }}</td>
              <td class="px-3 py-2">{{ fila.departamentoNombre ?? 'Sin departamento' }}</td>
              <td class="px-3 py-2">{{ fila.municipioNombre ?? 'Sin municipio' }}</td>
              <td class="px-3 py-2">{{ fila.unidadCodigo }} - {{ fila.unidadNombre }}</td>
              <td v-if="!esResumenMaestro" class="px-3 py-2">{{ descripcionConcepto(fila) }}</td>
              <td class="px-3 py-2 text-right">{{ fila.totalEnfermeraAux.toLocaleString('es-HN') }}</td>
              <td class="px-3 py-2 text-right">{{ fila.totalEnfermeraPro.toLocaleString('es-HN') }}</td>
              <td class="px-3 py-2 text-right">{{ fila.totalMedicoGen.toLocaleString('es-HN') }}</td>
              <td class="px-3 py-2 text-right">{{ fila.totalMedicoEsp.toLocaleString('es-HN') }}</td>
              <td v-if="esResumenMaestro" class="px-3 py-2 text-right">
                {{ (fila as ReporteResumenMaestroResultado).totalProfesionales.toLocaleString('es-HN') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    </Transition>
    </AppShell>
  </div>
</template>
