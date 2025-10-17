<script setup lang="ts">
import { computed, defineAsyncComponent, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import AppShell from './components/layout/AppShell.vue'
import AppFooter from './components/layout/AppFooter.vue'
import PivotBuilder from './components/reports/PivotBuilder.vue'
import CompactSelect from './components/common/CompactSelect.vue'
import CircularTabs from './components/common/CircularTabs.vue'
import ImageBanner from './components/common/ImageBanner.vue'
import { provideApiBase } from './composables/useApiBase'
import type { ResumenTablero } from './types/tablero.ts'

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

const esModoEmbed = computed(() => Boolean(widgetConfig?.isEmbedded))

const temaInicial = typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'

const aplicarTemaGlobal = (tema?: 'light' | 'dark') => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const temaFinal = tema ?? temaInicial
  if (temaFinal === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

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

  // Usar configuración desde variables de entorno
  const desdeEnv = import.meta.env.VITE_API_URL
  if (desdeEnv) {
    const desdeEnvNormalizado = normalizarBaseUrl(desdeEnv)
    if (desdeEnvNormalizado) return desdeEnvNormalizado
  }

  try {
    return window.location.origin
  } catch (_) {
    return 'http://localhost:4000'
  }
})

provideApiBase(apiBase)

type TarjetaId = 'regiones' | 'municipios' | 'unidades' | 'detalle'


interface TarjetaResumen {
  id: TarjetaId
  titulo: string
  valor: string
  descripcion: string
}

const cargando = ref<boolean>(true)
const error = ref<string | null>(null)

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

const anioMapa = ref<number | null>(2025)
const anioSeleccionado = ref<number | null>(null) // null = todos los años
const aniosDisponibles = ref<(number | null)[]>([null]) // null representa "Todos los años"
const cargandoAnios = ref<boolean>(true)

// Estado de las pestañas
const pestañaActiva = ref<string>('inicio')

const tabs = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'indicadores', label: 'Indicadores' },
  { id: 'reportes', label: 'Tabla Dinámica' }
]

const MapaHonduras = defineAsyncComponent(() =>
  import('./components/dashboard/MapaHonduras.vue')
)

const GraficosDinamicos = defineAsyncComponent(() =>
  import('./components/dashboard/GraficosDinamicos.vue')
)



const actualizarTarjetas = (datos: ResumenTablero) => {
  // Determinar qué año mostrar en la descripción
  const anioMostrar = anioSeleccionado.value || anioMapa.value
  const descripcionDetalle = anioMostrar && anioMostrar !== 2025
    ? `Total de filas analíticas para ${anioMostrar}`
    : 'Total de filas analíticas acumuladas (2008-2025)'
  
  const descripcionUnidades = anioMostrar && anioMostrar !== 2025
    ? `US con registros en ${anioMostrar}`
    : 'US registradas en catálogo institucional'

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
      descripcion: descripcionUnidades
    },
    {
      id: 'detalle',
      titulo: 'Registros detalle',
      valor: formatearNumero(datos.totalRegistrosDetalle),
      descripcion: descripcionDetalle
    }
  ]
}

const cargarAniosDisponibles = async () => {
  cargandoAnios.value = true
  try {
    const base = apiBase.value
    const respuesta = await fetch(`${base}/api/tablero/anios`)

    if (!respuesta.ok) {
      throw new Error(`Error de API: ${respuesta.status}`)
    }

    const cuerpo = (await respuesta.json()) as {
      datos: number[]
    }

    // Agregar "Todos los años" al inicio y luego los años de la base de datos
    aniosDisponibles.value = [null, ...cuerpo.datos]
  } catch (err) {
    console.error('Error cargando años disponibles:', err)
    // Fallback a años hardcodeados si falla la API
    const aniosFallback: (number | null)[] = [null]
    for (let anio = 2025; anio >= 2008; anio--) {
      aniosFallback.push(anio)
    }
    aniosDisponibles.value = aniosFallback
  } finally {
    cargandoAnios.value = false
  }
}

const cargarResumen = async (anio?: number | null) => {
  cargando.value = true
  error.value = null

  try {
    const base = apiBase.value
    const url = anio ? `${base}/api/tablero/resumen?anio=${anio}` : `${base}/api/tablero/resumen`
    const respuesta = await fetch(url)

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



// Watcher para recargar datos cuando cambie el año seleccionado
watch(anioSeleccionado, (nuevoAnio) => {
  void cargarResumen(nuevoAnio)
})

// Watcher para actualizar las métricas cuando cambie el año del mapa
watch(anioMapa, (nuevoAnioMapa) => {
  // Si el año es 2025, podría ser "Total" o el año 2025 específico
  // Por ahora, siempre pasamos el año. Para "Total" necesitaríamos otra señal
  void cargarResumen(nuevoAnioMapa)
})

onMounted(() => {
  void cargarAniosDisponibles()
  void cargarResumen()

  if (esModoEmbed.value) {
    aplicarTemaGlobal(widgetConfig?.theme)
  }
})

watch(
  () => widgetConfig?.theme,
  (nuevoTema) => {
    if (esModoEmbed.value) {
      aplicarTemaGlobal(nuevoTema)
    }
  }
)

onBeforeUnmount(() => {
  if (esModoEmbed.value) {
    aplicarTemaGlobal(temaInicial)
  }
})




</script>

<template>
  <div ref="appRoot">
    <!-- Banner de configuración requerida - DESHABILITADO -->
    <!-- <ConfiguracionRequired v-if="!hasConfig" /> -->
    
    <!-- Modo embedded completo: dashboard + tabla dinámica -->
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
        <button type="button" @click="() => cargarResumen()">Reintentar</button>
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
        <p class="section-subtitle">Volumen histórico de atenciones y unidades de servicio (2008-2025)</p>
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


      <!-- Tabla dinámica en embed -->
      <section class="pivot-builder-embed">
        <PivotBuilder />
      </section>
    </div>

    <!-- Modo Normal: App completa -->
    <div v-else class="min-h-screen bg-background dark:bg-background-dark">
      <!-- Pestañas circulares en la parte superior -->
      <div class="flex justify-center py-6 px-6">
        <CircularTabs
          :tabs="tabs"
          :active-tab="pestañaActiva"
          @update:active-tab="pestañaActiva = $event"
        />
      </div>

      <!-- Contenido sin AppShell para la pestaña Inicio -->
      <div v-if="pestañaActiva === 'inicio'">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          

          <ImageBanner />
          <div class="mt-8 text-center">
            <p class="text-lg text-text-secondary dark:text-text-muted max-w-4xl mx-auto leading-relaxed">
              La Secretaría de Salud (SESAL) de Honduras impulsa este sistema de información para consolidar y analizar la base histórica de datos de salud pública del país. La plataforma integra millones de registros provenientes de los diferentes subsistemas de salud en todo el país, permitiendo generar visualizaciones, reportes y análisis dinámicos que fortalecen la gestión basada en evidencia y la toma de decisiones estratégicas.
            </p>
          </div>

          <!-- Secciones del Dashboard -->
          <div class="mt-16">
            <h2 class="text-3xl font-bold text-center text-primary dark:text-text-inverted mb-12">
              Funcionalidades del Sistema
            </h2>
            <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <!-- Resumen Institucional -->
              <div class="group flex flex-col items-center text-center p-6 rounded-xl border border-border bg-surface hover:bg-surface-hover transition-all duration-300 dark:border-border-dark dark:bg-surface-dark dark:hover:bg-surface-dark-hover">
                <div class="w-16 h-16 bg-accent-light dark:bg-accent-dark/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg class="w-8 h-8 text-accent-base dark:text-accent-base" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <h3 class="text-xl font-semibold text-primary dark:text-text-inverted mb-2">
                  Resumen Institucional
                </h3>
                <p class="text-sm text-text-secondary dark:text-text-muted">
                  Indicadores clave y métricas del ecosistema SESAL
                </p>
              </div>

              <!-- Mapa Interactivo -->
              <div class="group flex flex-col items-center text-center p-6 rounded-xl border border-border bg-surface hover:bg-surface-hover transition-all duration-300 dark:border-border-dark dark:bg-surface-dark dark:hover:bg-surface-dark-hover">
                <div class="w-16 h-16 bg-brand-light dark:bg-brand-dark/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg class="w-8 h-8 text-brand-base dark:text-brand-base" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                  </svg>
                </div>
                <h3 class="text-xl font-semibold text-primary dark:text-text-inverted mb-2">
                  Mapa Interactivo
                </h3>
                <p class="text-sm text-text-secondary dark:text-text-muted">
                  Visualización geográfica por departamento
                </p>
              </div>

              <!-- Gráficos Dinámicos -->
              <div class="group flex flex-col items-center text-center p-6 rounded-xl border border-border bg-surface hover:bg-surface-hover transition-all duration-300 dark:border-border-dark dark:bg-surface-dark dark:hover:bg-surface-dark-hover">
                <div class="w-16 h-16 bg-accent-light dark:bg-accent-dark/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg class="w-8 h-8 text-accent-base dark:text-accent-base" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V8a2 2 0 00-2-2h-1.172a2 2 0 01-1.414-.586l-.828-.828A2 2 0 009.172 4H7a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <h3 class="text-xl font-semibold text-primary dark:text-text-inverted mb-2">
                  Gráficos Dinámicos
                </h3>
                <p class="text-sm text-text-secondary dark:text-text-muted">
                  Visualizaciones interactivas de datos
                </p>
              </div>

              <!-- Tabla Dinámica -->
              <div class="group flex flex-col items-center text-center p-6 rounded-xl border border-border bg-surface hover:bg-surface-hover transition-all duration-300 dark:border-border-dark dark:bg-surface-dark dark:hover:bg-surface-dark-hover">
                <div class="w-16 h-16 bg-brand-light dark:bg-brand-dark/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg class="w-8 h-8 text-brand-base dark:text-brand-base" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <h3 class="text-xl font-semibold text-primary dark:text-text-inverted mb-2">
                  Tabla Dinámica
                </h3>
                <p class="text-sm text-text-secondary dark:text-text-muted">
                  Análisis interactivo y pivot tables
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Dashboard dentro de AppShell -->
      <AppShell v-if="pestañaActiva === 'dashboard'">
        <section class="mt-8 flex flex-col gap-6 transition-colors duration-300 min-w-0">
      <header
        class="flex flex-col gap-4 rounded-card border border-border bg-surface px-6 py-4 shadow-panel transition-colors duration-300 dark:border-border-dark dark:bg-surface-dark"
      >
        <div class="space-y-1">
          <h2 class="text-2xl font-semibold text-primary transition-colors duration-300 dark:text-text-inverted">
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
          @click="() => cargarResumen()"
        >
          Reintentar
        </button>
      </div>

      <div
        class="grid gap-6 transition-opacity duration-200 sm:grid-cols-2 xl:grid-cols-4 min-w-0"
        :class="{ 'opacity-60': cargando }"
      >
        <article
          v-for="tarjeta in tarjetas"
          :key="tarjeta.id"
          class="group relative flex flex-col gap-3 overflow-hidden rounded-card border border-border bg-surface p-6 shadow-panel transition-colors duration-300 dark:border-border-dark dark:bg-surface-dark"
        >
          <header class="flex items-center justify-between gap-3">
            <h3 class="text-lg font-semibold text-primary transition-colors duration-300 dark:text-text-inverted">
              {{ tarjeta.titulo }}
            </h3>
            <span
              class="rounded-full border border-accent-base/30 bg-accent-base/10 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-widest text-primary transition-colors duration-300 dark:border-accent-dark/40 dark:bg-accent-dark/20 dark:text-text-inverted"
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
            class="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent-base/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        </article>
      </div>
    </section>

    <section class="mt-8 flex flex-col gap-6 transition-colors duration-300">
      <header
        class="flex flex-col gap-4 rounded-card border border-border bg-surface px-6 py-4 shadow-panel transition-colors duration-300 dark:border-border-dark dark:bg-surface-dark sm:flex-row sm:justify-between"
      >
        <div class="space-y-1">
          <h2 class="text-2xl font-semibold text-primary transition-colors duration-300 dark:text-inverted">
            Mapa de actividad por departamento
          </h2>
          <p class="text-sm text-secondary transition-colors duration-300 dark:text-muted">
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

      </AppShell>

      <!-- Pestaña de Reportes -->
      <AppShell v-if="pestañaActiva === 'reportes'">
        <section class="mt-8 flex flex-col gap-6 transition-colors duration-300">
          <header class="flex flex-col gap-4 rounded-card border border-border bg-surface px-6 py-4 shadow-panel transition-colors duration-300 dark:border-border-dark dark:bg-surface-dark">
            <div class="space-y-1">
              <h2 class="text-2xl font-semibold text-primary transition-colors duration-300 dark:text-text-inverted">
                Tabla Dinámica y Exportación
              </h2>
              <p class="text-sm text-text-secondary transition-colors duration-300 dark:text-text-muted">
                Análisis interactivo de datos y herramientas de exportación avanzadas
              </p>
            </div>
          </header>

          <section class="flex flex-col gap-4 rounded-card border border-border bg-surface px-6 py-4 shadow-panel transition-colors duration-300 dark:border-border-dark dark:bg-surface-dark overflow-hidden">
            <PivotBuilder />
          </section>
        </section>
      </AppShell>

      <!-- Pestaña de Indicadores -->
      <AppShell v-if="pestañaActiva === 'indicadores'">
        <Suspense>
          <template #default>
            <GraficosDinamicos :api-base="apiBase" />
          </template>
          <template #fallback>
            <div class="flex flex-col gap-6 transition-colors duration-300">
              <div class="h-32 rounded-card border border-border bg-surface animate-pulse dark:border-border-dark dark:bg-surface-dark"></div>
            </div>
          </template>
        </Suspense>
      </AppShell>

      <!-- Footer común para todas las páginas -->
      <AppFooter />
    </div>
  </div>
</template>
