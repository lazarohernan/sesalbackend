<template>
  <div class="grid gap-6 text-slate-900 dark:text-slate-100 min-w-0">
    <!-- Selector de Año -->
    <section class="flex items-center gap-4 rounded-xl border border-border bg-surface dark:border-border-dark dark:bg-surface-dark p-4 shadow-panel mb-6">
      <div class="flex items-center gap-4">
        <label class="text-sm font-medium text-secondary dark:text-text-muted">
          Año de consulta:
        </label>
        <CompactSelect
          label=""
          placeholder="Seleccionar año"
          :options="opcionesAnios"
          :model-value="anioSeleccionado"
          @update:model-value="onAnioSelectChange"
          :disabled="cargandoAnios"
        />
        <span v-if="anioSeleccionado" class="text-xs text-slate-500 dark:text-slate-400">
          Datos del año {{ anioSeleccionado }}
        </span>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-2">
      <div class="flex flex-col gap-3 rounded-xl border border-border bg-surface dark:border-border-dark dark:bg-surface-dark p-4 shadow">
        <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">Dimensiones</h3>
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div
            v-for="dimension in dimensionesFiltradas"
            :key="dimension.id"
            class="flex items-center justify-between gap-3 rounded-md border border-orange-200 bg-white dark:border-orange-700 dark:bg-slate-800 px-3 py-2 text-sm text-primary dark:text-text-inverted shadow-sm transition hover:border-orange-400 hover:shadow-md cursor-move"
            draggable="true"
            @dragstart="handleDragStart($event, 'dimension', dimension.id)"
            tabindex="0"
            role="button"
            :aria-label="`Arrastrar dimensión ${dimension.etiqueta}`"
          >
            <div class="flex flex-col">
              <span class="font-semibold text-slate-900 dark:text-slate-100">{{ dimension.etiqueta }}</span>
            </div>
            <span
              class="inline-flex items-center rounded-md bg-orange-500 dark:bg-orange-600 px-2.5 py-1 text-xs font-semibold capitalize text-white shadow-sm"
            >
              {{ dimension.tipo === 'number' ? 'Numérica' : 'Texto' }}
            </span>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-3 rounded-xl border border-border bg-surface dark:border-border-dark dark:bg-surface-dark p-4 shadow">
        <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">Métricas</h3>
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div
            v-for="medida in medidasFiltradas"
            :key="medida.id"
            class="flex items-center justify-between gap-3 rounded-md border border-orange-200 bg-white dark:border-orange-700 dark:bg-slate-800 px-3 py-2 text-sm text-primary dark:text-text-inverted shadow-sm transition hover:border-orange-400 hover:shadow-md cursor-move"
            draggable="true"
            @dragstart="handleDragStart($event, 'measure', medida.id)"
            tabindex="0"
            role="button"
            :aria-label="`Arrastrar métrica ${medida.etiqueta}`"
          >
            <div class="flex flex-col">
              <span class="font-semibold text-slate-900 dark:text-slate-100">{{ medida.etiqueta }}</span>
            </div>
            <span
              class="inline-flex items-center rounded-md bg-orange-500 dark:bg-orange-600 px-2.5 py-1 text-xs font-semibold capitalize text-white shadow-sm"
            >
              {{ formatearAgregacion(medida.agregacionPorDefecto) }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <PivotDropZone
        titulo="Filtros"
        descripcion=""
        :items="filtros"
        :zone-id="'filters'"
        @remove="removerFiltro"
        @drop="handleDropFiltros"
      />
      <PivotDropZone
        titulo="Columnas"
        descripcion=""
        :items="columnas"
        :zone-id="'columns'"
        @remove="removerColumna"
        @drop="handleDropColumnas"
      />
      <PivotDropZone
        titulo="Filas"
        descripcion=""
        :items="filas"
        :zone-id="'rows'"
        @remove="removerFila"
        @drop="handleDropFilas"
      />
      <PivotDropZone
        titulo="Valores"
        descripcion=""
        :items="valores"
        :zone-id="'values'"
        @remove="removerValor"
        @drop="handleDropValores"
      />
    </section>

    <section
      v-if="visibleFilters.length"
      class="rounded-xl border border-border bg-surface dark:border-border-dark dark:bg-surface-dark p-4 shadow mb-6"
    >
      <div class="flex flex-wrap gap-4">
        <MultiSelect
          v-for="filtro in visibleFilters"
          :key="filtro.field"
          :label="filtro.label"
          :options="filtro.options"
          :model-value="filtro.seleccionados"
          @update:model-value="(valores) => handleFilterChange(filtro.field, valores)"
        />
      </div>
    </section>

    <section class="rounded-xl border border-border bg-surface dark:border-border-dark dark:bg-surface-dark p-4 shadow overflow-hidden">
      <PivotPreview
        :resultado="resultado"
        :cargando="estado.cargando"
        :error="estado.error"
        :progreso="estado.progreso"
        :mensaje-progreso="estado.mensajeProgreso"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import type { PivotCatalogo, PivotQueryPayload, PivotQueryResult } from "../../types/pivot";
import { consultarPivotApi, obtenerCatalogoPivotApi, obtenerValoresDimensionApi } from "../../services/pivot";
import { buildDragData, parseDragData } from "../../utils/drag";
import type { DragData } from "../../utils/drag";
import type { PivotFilterState } from "../../types/pivot";
import PivotDropZone from "./PivotDropZone.vue";
import PivotPreview from "./PivotPreview.vue";
import MultiSelect from "../common/MultiSelect.vue";
import CompactSelect from "../common/CompactSelect.vue";
import { useApiBase } from "../../composables/useApiBase";

const catalogo = reactive<PivotCatalogo>({ dimensiones: [], medidas: [], actualizadoEn: "" });
const apiBase = useApiBase();

const filtros = ref<string[]>([]);
const columnas = ref<string[]>([]);
const filas = ref<string[]>([]);
const valores = ref<string[]>(["TOTAL"]);
const busqueda = ref("");

// Variables para el selector de año
const aniosDisponibles = ref<number[]>([]);
const anioSeleccionado = ref<number>(2025);
const cargandoAnios = ref(false);

const estado = reactive({
  cargando: false,
  error: "",
  progreso: 0,
  mensajeProgreso: "Preparando consulta..."
});

let progresoResetTimeout: number | null = null;
const esperar = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
const resultado = ref<{ resultado: PivotQueryResult; generadoEn: string } | null>(null);
const filtrosInteractivos = reactive<Record<string, PivotFilterState>>({});

const formatearAgregacion = (agregacion: string) => {
  switch (agregacion) {
    case "SUM":
      return "Suma";
    case "COUNT":
      return "Conteo";
    case "AVG":
      return "Promedio";
    case "MAX":
      return "Máximo";
    case "MIN":
      return "Mínimo";
    default:
      return agregacion;
  }
};


const payloadConsulta = computed<PivotQueryPayload>(() => {
  const filtrosSeleccionados = filtros.value.map((dimensionId) => ({
    field: dimensionId,
    values: filtrosInteractivos[dimensionId]?.seleccionados
  }));

  const filasSeleccionadas = [...filas.value];
  const columnasSeleccionadas = [...columnas.value];

  const filtrosParaDesglosar = filtros.value.filter((dimensionId) => {
    if (filasSeleccionadas.includes(dimensionId) || columnasSeleccionadas.includes(dimensionId)) {
      return false;
    }
    const configuracion = filtrosInteractivos[dimensionId];
    if (!configuracion) return false;
    const seleccionados = configuracion.seleccionados ?? [];
    const totalOpciones = configuracion.options?.length ?? 0;
    return seleccionados.length > 1 && (totalOpciones === 0 || seleccionados.length < totalOpciones);
  });

  filtrosParaDesglosar.forEach((dimensionId) => {
    if (columnasSeleccionadas.length <= filasSeleccionadas.length) {
      columnasSeleccionadas.push(dimensionId);
    } else {
      filasSeleccionadas.push(dimensionId);
    }
  });

  return {
    year: anioSeleccionado.value,
    filters: filtrosSeleccionados,
    rows: filasSeleccionadas,
    columns: columnasSeleccionadas,
    values: valores.value.map((valorId) => ({ field: valorId })),
    includeTotals: true
  };
});

const dimensionesFiltradas = computed(() => {
  const texto = busqueda.value.trim().toLowerCase();
  if (!texto) return catalogo.dimensiones;
  return catalogo.dimensiones.filter(
    (dimension: any) =>
      dimension.etiqueta.toLowerCase().includes(texto) || dimension.id.toLowerCase().includes(texto)
  );
});

const medidasFiltradas = computed(() => {
  const texto = busqueda.value.trim().toLowerCase();
  if (!texto) return catalogo.medidas;
  return catalogo.medidas.filter(
    (medida: any) =>
      medida.etiqueta.toLowerCase().includes(texto) || medida.id.toLowerCase().includes(texto)
  );
});

const visibleFilters = computed(() => Object.values(filtrosInteractivos));

const cargarOpcionesFiltro = async (field: string) => {
  const dimension = catalogo.dimensiones.find((dim) => dim.id === field);
  if (!dimension) return;

  const filtroActual = filtrosInteractivos[field];
  if (dimension.valores) {
    filtrosInteractivos[field] = {
      field,
      label: dimension.etiqueta,
      options: dimension.valores.map((valor) => ({ valor: valor.valor, etiqueta: valor.etiqueta })),
      seleccionados: filtroActual?.seleccionados ?? []
    };
    return;
  }

  if (dimension.endpointValores) {
    const respuesta = await obtenerValoresDimensionApi(field, undefined, 200, apiBase.value);
    filtrosInteractivos[field] = {
      field,
      label: dimension.etiqueta,
      options: respuesta.valores,
      seleccionados: filtroActual?.seleccionados ?? []
    };
  }
};

watch(
  filtros,
  async (nuevosFiltros, anteriores) => {
    for (const field of nuevosFiltros) {
      if (!filtrosInteractivos[field]) {
        await cargarOpcionesFiltro(field);
      }
    }

    const activos = new Set(nuevosFiltros);
    Object.keys(filtrosInteractivos).forEach((field) => {
      if (!activos.has(field)) {
        delete filtrosInteractivos[field];
      }
    });

    const removidos = anteriores.filter((field) => !activos.has(field));
    if (nuevosFiltros.length || removidos.length) {
      void consultarPivot();
    }
  },
  { deep: true }
);

const handleFilterChange = (field: string, valores: Array<string | number>) => {
  const dimension = catalogo.dimensiones.find((dim) => dim.id === field);
  if (!dimension) return;

  const normalizados = dimension.tipo === "number"
    ? valores.map((valor) => Number(valor)).filter((numero) => Number.isFinite(numero))
    : valores;

  if (!filtrosInteractivos[field]) {
    filtrosInteractivos[field] = {
      field,
      label: dimension.etiqueta,
      options: [],
      seleccionados: normalizados
    };
  } else {
    filtrosInteractivos[field].seleccionados = normalizados;
  }

  void consultarPivot();
};

const cargarCatalogo = async () => {
  try {
    estado.error = "";
    const respuesta = await obtenerCatalogoPivotApi(apiBase.value);
    catalogo.dimensiones = respuesta.dimensiones;
    catalogo.medidas = respuesta.medidas;
    catalogo.actualizadoEn = respuesta.actualizadoEn;
  } catch (error) {
    estado.error = error instanceof Error ? error.message : "No se pudo cargar el catálogo";
  }
};

const cargarAniosDisponibles = async () => {
  try {
    cargandoAnios.value = true;
    const response = await fetch(new URL("/api/pivot/anios", apiBase.value).toString());
    const data = await response.json();
    aniosDisponibles.value = data.anios || [];
    
    // Si no hay años disponibles, usar 2025 por defecto
    if (aniosDisponibles.value.length === 0) {
      aniosDisponibles.value = [2025];
    }
    
    // Si el año seleccionado no está en la lista, usar el primero disponible
    if (!aniosDisponibles.value.includes(anioSeleccionado.value)) {
      anioSeleccionado.value = aniosDisponibles.value[0] ?? 2025;
    }
  } catch (error) {
    console.error('Error cargando años disponibles:', error);
    aniosDisponibles.value = [2025];
  } finally {
    cargandoAnios.value = false;
  }
};

const onAnioChange = () => {
  // Ejecutar consulta automáticamente cuando cambie el año
  if (filas.value.length > 0 || columnas.value.length > 0 || valores.value.length > 0) {
    consultarPivot();
  }
};

const actualizarProgreso = (valor: number, mensaje: string) => {
  estado.progreso = Math.max(0, Math.min(100, Math.round(valor)));
  estado.mensajeProgreso = mensaje;
};

const consultarPivot = async () => {
  try {
    estado.cargando = true;
    estado.error = "";
    if (progresoResetTimeout) {
      window.clearTimeout(progresoResetTimeout);
      progresoResetTimeout = null;
    }

    actualizarProgreso(0, "Preparando consulta...");
    await esperar(80);

    actualizarProgreso(15, "Validando filtros seleccionados...");
    await esperar(120);

    actualizarProgreso(30, "Consultando servicio de reportes...");

    const respuesta = await consultarPivotApi(payloadConsulta.value, apiBase.value);

    actualizarProgreso(70, "Procesando datos obtenidos...");
    await esperar(120);

    resultado.value = respuesta;
    actualizarProgreso(90, "Aplicando formato...");
    await esperar(100);

    actualizarProgreso(100, "Reporte generado correctamente.");
  } catch (error) {
    estado.error = error instanceof Error ? error.message : "No se pudo ejecutar la consulta";
    actualizarProgreso(0, "No se pudo generar el reporte.");
  } finally {
    estado.cargando = false;
    progresoResetTimeout = window.setTimeout(() => {
      actualizarProgreso(0, "Preparando consulta...");
      progresoResetTimeout = null;
    }, 400);
  }
};

const handleDragStart = (event: DragEvent, tipo: "dimension" | "measure", id: string) => {
  if (!event.dataTransfer) return;
  
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", buildDragData(tipo, id));
  
  // Crear una imagen de arrastre personalizada
  const dragImage = document.createElement("div");
  dragImage.textContent = id;
  dragImage.style.position = "absolute";
  dragImage.style.top = "-1000px";
  dragImage.style.padding = "8px 12px";
  dragImage.style.background = "#f97316";
  dragImage.style.color = "#ffffff";
  dragImage.style.borderRadius = "6px";
  dragImage.style.fontSize = "14px";
  dragImage.style.fontWeight = "500";
  document.body.appendChild(dragImage);
  
  event.dataTransfer.setDragImage(dragImage, 0, 0);
  
  // Limpiar la imagen temporal después del drag
  setTimeout(() => {
    document.body.removeChild(dragImage);
  }, 0);
};

const handleDropFiltros = (event: DragEvent) => {
  const data = parseDragData(event.dataTransfer?.getData("text/plain"));
  if (!data) return;

  handleMoveToZone({ data, targetZone: "filters" });
};

const handleDropColumnas = (event: DragEvent) => {
  const data = parseDragData(event.dataTransfer?.getData("text/plain"));
  if (!data) return;

  handleMoveToZone({ data, targetZone: "columns" });
};

const handleDropFilas = (event: DragEvent) => {
  const data = parseDragData(event.dataTransfer?.getData("text/plain"));
  if (!data) return;

  handleMoveToZone({ data, targetZone: "rows" });
};

const handleDropValores = (event: DragEvent) => {
  const data = parseDragData(event.dataTransfer?.getData("text/plain"));
  if (!data) return;

  handleMoveToZone({ data, targetZone: "values" });
};

type ZoneId = "filters" | "columns" | "rows" | "values";

const obtenerZonaRef = (zone: ZoneId): typeof filtros => {
  switch (zone) {
    case "filters":
      return filtros;
    case "columns":
      return columnas;
    case "rows":
      return filas;
    case "values":
      return valores;
    default:
      return filtros;
  }
};

const handleMoveToZone = ({ data, targetZone }: { data: DragData; targetZone: ZoneId }) => {
  const targetRef = obtenerZonaRef(targetZone);
  const sourceZone = data.fromZone ? (data.fromZone as ZoneId) : undefined;
  const sourceRef = sourceZone ? obtenerZonaRef(sourceZone) : undefined;

  const isValidMove =
    (targetZone === "values" && data.tipo === "measure") ||
    (targetZone !== "values" && data.tipo === "dimension");

  if (!isValidMove) {
    return;
  }

  if (sourceRef) {
    const sourceIndex =
      data.fromIndex ?? sourceRef.value.findIndex((dimensionId: string) => dimensionId === data.id);
    if (sourceIndex !== -1) {
      sourceRef.value.splice(sourceIndex, 1);
    }
  }

  const targetAlreadyHas = targetRef.value.includes(data.id);
  if (!targetAlreadyHas) {
    targetRef.value = [...targetRef.value, data.id];
  }

  void consultarPivot();
};

const removerFiltro = (id: string) => {
  const index = filtros.value.indexOf(id);
  if (index > -1) {
    filtros.value.splice(index, 1);
    void consultarPivot();
  }
};

const removerFila = (id: string) => {
  const index = filas.value.indexOf(id);
  if (index > -1) {
    filas.value.splice(index, 1);
    void consultarPivot();
  }
};

const removerColumna = (id: string) => {
  const index = columnas.value.indexOf(id);
  if (index > -1) {
    columnas.value.splice(index, 1);
    void consultarPivot();
  }
};

const removerValor = (id: string) => {
  const index = valores.value.indexOf(id);
  if (index > -1) {
    valores.value.splice(index, 1);
    void consultarPivot();
  }
};

// Opciones para el selector compacto de años
const opcionesAnios = computed(() => {
  return aniosDisponibles.value.map(anio => ({
    valor: anio,
    etiqueta: anio.toString()
  }));
});

// Manejar cambio de año desde el selector compacto
const onAnioSelectChange = (valor: string | number | null) => {
  const nuevoAnio = valor ? Number(valor) : 2025;
  if (nuevoAnio !== anioSeleccionado.value) {
    anioSeleccionado.value = nuevoAnio;
    onAnioChange();
  }
};

onMounted(async () => {
  await Promise.all([
    cargarCatalogo(),
    cargarAniosDisponibles()
  ]);
  await consultarPivot();
});

onBeforeUnmount(() => {
  if (progresoResetTimeout) {
    window.clearTimeout(progresoResetTimeout);
  }
});
</script>
