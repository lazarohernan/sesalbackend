<template>
  <div class="flex items-center justify-end gap-4 rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 p-3 shadow-sm">
    <button
      @click="abrirModal"
      :disabled="!tieneDatos"
      class="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20 px-6 py-2 text-sm font-medium text-blue-700 dark:text-blue-400 shadow-sm transition hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
      </svg>
      Exportar
    </button>

    <!-- Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="modalAbierto"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          @click.self="cerrarModal"
        >
          <div class="relative w-full max-w-md rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 p-6 shadow-2xl">
            <!-- Header -->
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Exportar Datos
              </h3>
              <button
                @click="cerrarModal"
                class="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <!-- Descripción -->
            <p class="mb-6 text-sm text-slate-600 dark:text-slate-400">
              Selecciona el formato en el que deseas exportar los datos de la tabla dinámica.
            </p>

            <!-- Opciones de exportación -->
            <div class="space-y-3">
              <!-- Opción CSV/Excel -->
              <button
                @click="exportarExcel"
                class="flex w-full items-center gap-4 rounded-lg border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-700 p-4 text-left transition hover:border-blue-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-600">
                  <svg class="h-6 w-6 text-slate-700 dark:text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <div class="flex-1">
                  <div class="font-semibold text-slate-900 dark:text-slate-100">Exportar como CSV</div>
                  <div class="text-xs text-slate-600 dark:text-slate-400">Formato compatible con Excel y hojas de cálculo</div>
                </div>
                <svg class="h-5 w-5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>

              <!-- Opción PDF -->
              <button
                @click="exportarPDF"
                class="flex w-full items-center gap-4 rounded-lg border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-700 p-4 text-left transition hover:border-blue-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-600">
                  <svg class="h-6 w-6 text-slate-700 dark:text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <div class="flex-1">
                  <div class="font-semibold text-slate-900 dark:text-slate-100">Exportar como PDF</div>
                  <div class="text-xs text-slate-600 dark:text-slate-400">Documento listo para imprimir o compartir</div>
                </div>
                <svg class="h-5 w-5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>

            <!-- Footer -->
            <div class="mt-6 flex justify-end">
              <button
                @click="cerrarModal"
                class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed, ref } from 'vue';
import { exportarExcel as exportarExcelUtil, exportarPDF as exportarPDFUtil } from '../../utils/exportar.utils';

interface Props {
  cabeceras: string[];
  cuerpo: unknown[][];
  totales: unknown[];
  meta: {
    generadoEn: string;
    totalRegistros: number;
    anios: number[];
  } | null;
  tablaHtml?: string | null;
  anchoTabla?: number | null;
}

const props = defineProps<Props>();

const modalAbierto = ref(false);
const tieneDatos = computed(() => props.cuerpo.length > 0 || props.totales.length > 0);

const abrirModal = (): void => {
  modalAbierto.value = true;
};

const cerrarModal = (): void => {
  modalAbierto.value = false;
};

const exportarExcel = (): void => {
  if (!tieneDatos.value) return;
  exportarExcelUtil(props.cabeceras, props.cuerpo, props.totales);
  cerrarModal();
};

const exportarPDF = (): void => {
  if (!tieneDatos.value) return;
  exportarPDFUtil(
    props.cabeceras,
    props.cuerpo,
    props.totales,
    props.meta,
    props.tablaHtml ?? undefined,
    props.anchoTabla ?? undefined
  );
  cerrarModal();
};
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
  opacity: 0;
}
</style>
