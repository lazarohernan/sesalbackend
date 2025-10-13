<template>
  <div class="space-y-4">
    <!-- Estado de carga -->
    <div v-if="cargando" class="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 p-6 text-center shadow-sm">
      <div class="flex flex-col items-center gap-4">
        <div class="relative h-12 w-12">
          <div class="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-900/40"></div>
          <div class="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          <span class="absolute inset-0 flex items-center justify-center text-xs font-semibold text-blue-600 dark:text-blue-300">
            {{ progresoNormalizado }}%
          </span>
        </div>
        <div class="space-y-1">
          <p class="text-sm font-medium text-slate-700 dark:text-slate-200">Generando vista previa...</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">{{ mensajeProgresoVisible }}</p>
        </div>
        <div class="h-2 w-full max-w-xs overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            class="h-full rounded-full bg-blue-500 transition-all duration-300 ease-out"
            :style="{ width: progresoNormalizado + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Estado de error -->
    <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400">
      <div class="flex items-center gap-2">
        <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        {{ error }}
      </div>
    </div>

    <!-- Estado vacío -->
    <div v-else-if="!tieneContenido" class="rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
      <div class="flex flex-col items-center gap-3">
        <svg class="h-8 w-8 text-slate-400 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <span>Selecciona dimensiones y métricas para visualizar la tabla dinámica.</span>
      </div>
    </div>

    <!-- Contenido principal -->
    <div v-else class="space-y-4">
      <!-- Aviso cuando no hay dimensiones en filas -->
      <div
        v-if="mostrarAvisoSinFilas"
        class="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-200"
      >
        <svg class="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p>
          Estás viendo un resumen general porque no se ha seleccionado ninguna dimensión en filas.
          Agrega una dimensión en el panel de filas para desglosar los resultados y evitar totales duplicados.
        </p>
      </div>

      <!-- Botones de Exportación -->
      <ExportarArchivo
        :cabeceras="cabeceras"
        :cuerpo="todasLasFilas"
        :totales="totales"
        :meta="meta"
        :tabla-html="tablaHtml"
        :ancho-tabla="tablaWidth"
      />

      <!-- Tabla de Datos -->
      <div class="overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
        <table
          ref="tablaRef"
          class="min-w-max divide-y divide-slate-200 dark:divide-slate-700 text-sm text-slate-700 dark:text-slate-300 w-full"
        >
          <!-- Cabeceras -->
          <thead class="bg-slate-50 dark:bg-slate-800 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th
                v-for="(cabecera, index) in cabeceras"
                :key="'header-' + index"
                class="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-700 last:border-r-0"
              >
                {{ formatearCabecera(cabecera) }}
              </th>
            </tr>
          </thead>

          <!-- Cuerpo de la tabla -->
          <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
            <tr
              v-for="(fila, filaIndex) in cuerpo"
              :key="'row-' + filaIndex"
              class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td
                v-for="(celda, celdaIndex) in fila"
                :key="'cell-' + filaIndex + '-' + celdaIndex"
                class="whitespace-nowrap px-4 py-3 text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-700 last:border-r-0"
              >
                {{ formatearCelda(celda) }}
              </td>
            </tr>
          </tbody>

          <!-- Totales -->
          <tfoot v-if="totales.length" class="bg-slate-100 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-600">
            <tr>
              <td
                v-for="(total, index) in totales"
                :key="'total-' + index"
                class="whitespace-nowrap px-4 py-3 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-700 last:border-r-0"
              >
                {{ index === 0 ? "Total" : formatearCelda(total) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Controles de Paginación -->
      <div v-if="todasLasFilas.length > 0" class="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 p-4 shadow-sm">
        <!-- Información de registros y selector de filas -->
        <div class="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
          <span class="font-medium text-slate-700 dark:text-slate-300">
            Mostrando {{ rangoFilas.inicio }} - {{ rangoFilas.fin }} de {{ todasLasFilas.length }} registros
          </span>
          <div class="flex items-center gap-2">
            <label class="text-xs font-medium">Filas por página:</label>
            <select
              :value="filasPorPagina"
              @change="cambiarFilasPorPagina(Number(($event.target as HTMLSelectElement).value))"
              class="rounded-lg border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-700 px-2 py-1 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option v-for="opcion in opcionesPaginacion" :key="opcion" :value="opcion">
                {{ opcion }}
              </option>
            </select>
          </div>
        </div>

        <!-- Botones de navegación -->
        <div class="flex items-center gap-1">
          <!-- Primera página -->
          <button
            @click="irAPagina(1)"
            :disabled="paginaActual === 1"
            class="rounded-lg p-2 text-slate-600 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Primera página"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path>
            </svg>
          </button>

          <!-- Página anterior -->
          <button
            @click="paginaAnterior"
            :disabled="paginaActual === 1"
            class="rounded-lg p-2 text-slate-600 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Página anterior"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>

          <!-- Números de página -->
          <div class="flex items-center gap-1">
            <button
              v-for="pagina in paginasVisibles"
              :key="pagina"
              @click="irAPagina(pagina)"
              :class="[
                'min-w-[2.5rem] rounded-lg px-3 py-2 text-sm font-medium transition',
                pagina === paginaActual
                  ? 'bg-blue-500 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              ]"
            >
              {{ pagina }}
            </button>
          </div>

          <!-- Página siguiente -->
          <button
            @click="paginaSiguiente"
            :disabled="paginaActual === totalPaginas"
            class="rounded-lg p-2 text-slate-600 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Página siguiente"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>

          <!-- Última página -->
          <button
            @click="irAPagina(totalPaginas)"
            :disabled="paginaActual === totalPaginas"
            class="rounded-lg p-2 text-slate-600 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Última página"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Footer con metadata -->
    <footer v-if="meta" class="text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-700 pt-4">
      <div class="flex flex-wrap items-center gap-4 text-slate-500 dark:text-slate-400">
        <span class="flex items-center gap-1">
          <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Generado: {{ meta.generadoEn }}
        </span>
        <span class="flex items-center gap-1">
          <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          {{ meta.totalRegistros }} registros
        </span>
        <span class="flex items-center gap-1">
          <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          Años: {{ meta.anios.join(", ") || "N/D" }}
        </span>
        <span v-if="meta.metricas && meta.metricas.length" class="flex items-center gap-1">
          <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
          </svg>
          Métricas: {{ meta.metricas.join(", ") }}
        </span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import type { PivotQueryResult } from "../../types/pivot";
import ExportarArchivo from "./ExportarArchivo.vue";
import { formatearCabecera } from "../../utils/formateo.utils";

interface Props {
  resultado: { resultado: PivotQueryResult; generadoEn: string } | null;
  cargando: boolean;
  error: string;
  progreso?: number;
  mensajeProgreso?: string;
}

const props = defineProps<Props>();

const tablaRef = ref<HTMLTableElement | null>(null);
const tablaHtml = ref<string>("");
const refrescoHtmlTimeout = ref<number | null>(null);
const tablaWidth = ref<number>(0);

const progresoNormalizado = computed(() => {
  const valor = props.progreso ?? 0;
  if (Number.isNaN(Number(valor))) return 0;
  return Math.max(0, Math.min(100, Math.round(Number(valor))));
});

const mensajeProgresoVisible = computed(() => props.mensajeProgreso ?? "Preparando consulta...");

// Paginación
const paginaActual = ref(1);
const filasPorPagina = ref(50); // Valor por defecto
const opcionesPaginacion = [10, 25, 50, 100, 500, 1000] as const;

const datos = computed(() => props.resultado?.resultado?.datos ?? []);
const totalGeneral = computed(() => props.resultado?.resultado?.totalGeneral ?? null);
const metadataPivot = computed(() => props.resultado?.resultado?.metadata ?? null);

const mostrarAvisoSinFilas = computed(() => {
  const filasSeleccionadas = metadataPivot.value?.dimensionesFilas ?? [];
  const columnasSeleccionadas = metadataPivot.value?.dimensionesColumnas ?? [];
  const filtrosSeleccionados = metadataPivot.value?.dimensionesSeleccionadas ?? [];

  const filtrosNoUbicados = filtrosSeleccionados.filter(
    (dimensionId) => !filasSeleccionadas.includes(dimensionId) && !columnasSeleccionadas.includes(dimensionId)
  );

  return filasSeleccionadas.length === 0 && columnasSeleccionadas.length === 0 && filtrosNoUbicados.length > 0;
});

const cabeceras = computed(() => {
  const clavesSet = new Set<string>();

  datos.value.forEach((fila) => {
    Object.keys(fila ?? {}).forEach((clave) => clavesSet.add(clave));
  });

  if (totalGeneral.value) {
    Object.keys(totalGeneral.value).forEach((clave) => clavesSet.add(clave));
  }

  if (!clavesSet.size) return [] as string[];

  const clavesBase = Array.from(clavesSet);
  const clavesOrdenadas: string[] = [];
  const dimensionesFilas = metadataPivot.value?.dimensionesFilas ?? [];

  const normalizar = (texto: string) => texto.toLowerCase();

  dimensionesFilas.forEach((dimension) => {
    const claveEncontrada = clavesBase.find(
      (clave) => normalizar(clave) === normalizar(dimension)
    );
    if (claveEncontrada && !clavesOrdenadas.includes(claveEncontrada)) {
      clavesOrdenadas.push(claveEncontrada);
    }
  });

  clavesBase.forEach((clave) => {
    if (!clavesOrdenadas.includes(clave)) {
      clavesOrdenadas.push(clave);
    }
  });

  return clavesOrdenadas;
});

// Todas las filas sin paginación
const todasLasFilas = computed(() => {
  if (!cabeceras.value.length) return [] as unknown[][];

  const filasMapeadas = datos.value.map((fila) =>
    cabeceras.value.map((cabecera) => fila[cabecera])
  );

  const filasSinTotales: unknown[][] = [];
  const filasTotales: unknown[][] = [];

  filasMapeadas.forEach((fila) => {
    const primeraColumna = fila[0];
    if (
      typeof primeraColumna === "string" &&
      primeraColumna.trim().toLowerCase() === "total"
    ) {
      filasTotales.push(fila);
    } else {
      filasSinTotales.push(fila);
    }
  });

  return [...filasSinTotales, ...filasTotales];
});

// Total de páginas
const totalPaginas = computed(() => {
  return Math.ceil(todasLasFilas.value.length / filasPorPagina.value);
});

// Filas paginadas (solo las de la página actual)
const cuerpo = computed(() => {
  const inicio = (paginaActual.value - 1) * filasPorPagina.value;
  const fin = inicio + filasPorPagina.value;
  return todasLasFilas.value.slice(inicio, fin);
});

// Funciones de navegación
const irAPagina = (pagina: number) => {
  if (pagina >= 1 && pagina <= totalPaginas.value) {
    paginaActual.value = pagina;
  }
};

const paginaAnterior = () => {
  if (paginaActual.value > 1) {
    paginaActual.value--;
  }
};

const paginaSiguiente = () => {
  if (paginaActual.value < totalPaginas.value) {
    paginaActual.value++;
  }
};

const cambiarFilasPorPagina = (valor: number) => {
  filasPorPagina.value = valor;
  paginaActual.value = 1; // Volver a la primera página
};

// Rango de filas visibles
const rangoFilas = computed(() => {
  const inicio = (paginaActual.value - 1) * filasPorPagina.value + 1;
  const fin = Math.min(paginaActual.value * filasPorPagina.value, todasLasFilas.value.length);
  return { inicio, fin };
});

// Páginas visibles (mostrar máximo 7 números de página)
const paginasVisibles = computed(() => {
  const total = totalPaginas.value;
  const actual = paginaActual.value;
  const maxVisible = 7;
  
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  
  const mitad = Math.floor(maxVisible / 2);
  let inicio = Math.max(1, actual - mitad);
  let fin = Math.min(total, inicio + maxVisible - 1);
  
  if (fin - inicio < maxVisible - 1) {
    inicio = Math.max(1, fin - maxVisible + 1);
  }
  
  return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
});

// Resetear paginación cuando cambien los datos
watch(() => datos.value, () => {
  paginaActual.value = 1;
});

const totales = computed(() => {
  if (!cabeceras.value.length || !totalGeneral.value) return [] as unknown[];

  const totalesCalculados = cabeceras.value.map((cabecera) => {
    const valor = totalGeneral.value ? totalGeneral.value[cabecera] : null;
    if (
      typeof cabecera === "string" &&
      cabecera.trim().toLowerCase() === "total"
    ) {
      return "Total";
    }
    return valor;
  });

  const sinDimensionesFila = (metadataPivot.value?.dimensionesFilas?.length ?? 0) === 0;
  if (sinDimensionesFila && cuerpo.value.length === 1) {
    const filaUnica = cuerpo.value[0];
    const sonIdenticos = Array.isArray(filaUnica)
      ? filaUnica.every((valor, index) => valor === totalesCalculados[index])
      : false;
    if (sonIdenticos) {
      return [];
    }
  }

  return totalesCalculados;
});

const tieneContenido = computed(() => datos.value.length > 0 || Boolean(totalGeneral.value));

const meta = computed(() => {
  if (!props.resultado) return null;
  
  // Extraer nombres de métricas desde las columnas de valores
  const metricas: string[] = [];
  const metadata = metadataPivot.value;
  
  if (metadata?.medidasSeleccionadas && Array.isArray(metadata.medidasSeleccionadas)) {
    metadata.medidasSeleccionadas.forEach((medidaId: string) => {
      const nombreMetrica = formatearCabecera(medidaId);
      if (!metricas.includes(nombreMetrica)) {
        metricas.push(nombreMetrica);
      }
    });
  }
  
  return {
    generadoEn: new Intl.DateTimeFormat("es-HN", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(props.resultado.generadoEn)),
    totalRegistros: todasLasFilas.value.length,
    anios: props.resultado.resultado.aniosConsultados ?? [],
    metricas: metricas
  };
});

const formatearCelda = (valor: unknown) => {
  if (typeof valor === "number") {
    return new Intl.NumberFormat("es-HN", { maximumFractionDigits: 2 }).format(valor);
  }
  if (valor === null || valor === undefined || valor === "") {
    return "-";
  }
  return String(valor);
};

const actualizarTablaHtml = () => {
  if (!tablaRef.value) {
    tablaHtml.value = "";
    tablaWidth.value = 0;
    return;
  }
  const tablaClon = tablaRef.value.cloneNode(true) as HTMLTableElement;
  const theadSticky = tablaClon.querySelector("thead");
  if (theadSticky) {
    (theadSticky as HTMLElement).style.position = "";
    (theadSticky as HTMLElement).style.top = "";
  }
  tablaHtml.value = tablaClon.outerHTML;
  tablaWidth.value = tablaRef.value.offsetWidth;
};

const programarActualizacionTabla = () => {
  if (refrescoHtmlTimeout.value) {
    window.clearTimeout(refrescoHtmlTimeout.value);
  }
  refrescoHtmlTimeout.value = window.setTimeout(actualizarTablaHtml, 50);
};

watch([cuerpo, totales, cabeceras], () => {
  programarActualizacionTabla();
});

onMounted(() => {
  programarActualizacionTabla();
});

onUnmounted(() => {
  if (refrescoHtmlTimeout.value) {
    window.clearTimeout(refrescoHtmlTimeout.value);
  }
});

</script>
