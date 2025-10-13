<template>
  <div class="relative inline-block min-w-[200px]" ref="containerRef">
    <label v-if="label" :for="idInterno" class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
      {{ label }}
    </label>

    <!-- Selector compacto -->
    <button
      type="button"
      :id="idInterno"
      @click="abierto = !abierto"
      class="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
      <span class="truncate">
        {{ seleccionados.length ? `${seleccionados.length} seleccionado${seleccionados.length > 1 ? 's' : ''}` : 'Seleccionar...' }}
      </span>
      <svg 
        class="h-4 w-4 transition-transform"
        :class="{ 'rotate-180': abierto }"
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>

    <!-- Dropdown -->
    <div
      v-if="abierto"
      class="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800 shadow-lg"
    >
      <!-- Buscador -->
      <div class="border-b border-slate-200 dark:border-slate-700 p-2">
        <div class="flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-600 px-2 py-1">
          <svg class="h-4 w-4 text-slate-400 dark:text-slate-500" viewBox="0 0 24 24">
            <path
              d="M15.5 14h-.79l-.28-.27a6.471 6.471 0 0 0 1.57-4.23 6.5 6.5 0 1 0-6.5 6.5c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5Zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z"
              fill="currentColor"
            />
          </svg>
          <input
            v-model="termino"
            type="search"
            class="w-full border-0 bg-transparent p-0 text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-0"
            :placeholder="placeholder"
          />
        </div>
      </div>

      <!-- Opciones -->
      <div class="max-h-60 overflow-y-auto">
        <button
          v-for="opcion in opcionesFiltradas"
          :key="String(opcion.valor)"
          type="button"
          class="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-slate-100 dark:hover:bg-slate-700"
          :class="seleccionadosSet.has(String(opcion.valor)) ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'"
          @click="toggle(opcion.valor)"
        >
          <span class="truncate">{{ opcion.etiqueta }}</span>
          <svg v-if="seleccionadosSet.has(String(opcion.valor))" class="h-4 w-4" viewBox="0 0 24 24">
            <path d="M9 16.17 4.83 12l-1.42 1.41L9 19l12-12-1.41-1.41z" fill="currentColor" />
          </svg>
        </button>
        <p v-if="!opcionesFiltradas.length" class="px-3 py-4 text-center text-xs text-slate-400 dark:text-slate-500">
          Sin resultados
        </p>
      </div>

      <!-- Botones de acción -->
      <div v-if="seleccionados.length" class="border-t border-slate-200 dark:border-slate-700 p-2 flex gap-2">
        <button
          type="button"
          @click="limpiar"
          class="flex-1 rounded-md bg-slate-100 dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          Limpiar
        </button>
        <button
          type="button"
          @click="abierto = false"
          class="flex-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Aplicar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import type { PivotFilterOption } from "../../types/pivot";

const props = withDefaults(
  defineProps<{
    label?: string;
    placeholder?: string;
    options: PivotFilterOption[];
    modelValue: Array<string | number>;
    optionLabelGetter?: (valor: string | number) => string;
  }>(),
  {
    placeholder: "Buscar opción",
    optionLabelGetter: undefined
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: Array<string | number>): void;
}>();

const termino = ref("");
const abierto = ref(false);
const containerRef = ref<HTMLElement | null>(null);
const idInterno = `selector-${Math.random().toString(36).slice(2)}`;

const seleccionados = computed(() => props.modelValue);
const seleccionadosSet = computed(() => new Set(seleccionados.value.map((valor) => String(valor))));

const opciones = reactive<{ originales: PivotFilterOption[] }>({ originales: props.options });

watch(
  () => props.options,
  (nuevasOpciones) => {
    opciones.originales = nuevasOpciones;
  }
);

const opcionesFiltradas = computed(() => {
  const texto = termino.value.trim().toLowerCase();
  if (!texto) return opciones.originales;
  return opciones.originales.filter((opcion) =>
    opcion.etiqueta.toLowerCase().includes(texto) || String(opcion.valor).toLowerCase().includes(texto)
  );
});

const toggle = (valor: string | number) => {
  const existe = seleccionadosSet.value.has(String(valor));
  const siguientes = existe
    ? seleccionados.value.filter((item) => String(item) !== String(valor))
    : [...seleccionados.value, valor];
  emit("update:modelValue", siguientes);
};

const limpiar = () => {
  emit("update:modelValue", []);
};

// Cerrar dropdown al hacer clic fuera
const handleClickOutside = (event: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    abierto.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>


