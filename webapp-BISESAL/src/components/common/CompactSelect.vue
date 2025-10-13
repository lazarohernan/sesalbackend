<template>
  <div class="relative inline-block min-w-[150px]" ref="containerRef">
    <!-- Selector compacto -->
    <button
      type="button"
      :id="idInterno"
      @click="abierto = !abierto"
      :disabled="disabled"
      class="flex w-full items-center justify-between gap-2 rounded-lg border-2 border-slate-200/80 bg-white dark:border-slate-700 dark:bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-sm transition-all duration-200 hover:border-brand-base/50 hover:bg-slate-50 dark:hover:border-brand-light/50 dark:hover:bg-slate-700/50 focus:border-brand-base focus:outline-none focus:ring-2 focus:ring-brand-base/20 dark:focus:border-brand-light dark:focus:ring-brand-light/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-200 dark:disabled:hover:border-slate-700"
      :class="{ 'border-brand-base dark:border-brand-light ring-2 ring-brand-base/20 dark:ring-brand-light/20': abierto }"
    >
      <span class="truncate" :class="{ 'text-slate-500 dark:text-slate-400': !valorSeleccionado }">
        {{ valorSeleccionado ? valorSeleccionado.etiqueta : placeholder }}
      </span>
      <svg 
        class="h-5 w-5 transition-transform duration-200 flex-shrink-0"
        :class="{ 'rotate-180 text-brand-base dark:text-brand-light': abierto, 'text-slate-400 dark:text-slate-500': !abierto }"
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>

    <!-- Dropdown -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="abierto"
        class="absolute z-50 mt-2 w-full rounded-xl border border-slate-200/80 bg-white dark:border-slate-700 dark:bg-slate-800 shadow-xl max-h-64 overflow-y-auto backdrop-blur-sm"
      >
        <div class="py-1">
          <button
            v-for="opcion in options"
            :key="String(opcion.valor)"
            type="button"
            class="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium transition-all duration-150"
            :class="modelValue === opcion.valor 
              ? 'bg-brand-base/10 dark:bg-brand-light/10 text-brand-base dark:text-brand-light' 
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'"
            @click="seleccionar(opcion.valor)"
          >
            <span class="truncate">{{ opcion.etiqueta }}</span>
            <svg 
              v-if="modelValue === opcion.valor" 
              class="h-5 w-5 flex-shrink-0 ml-2" 
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

interface SelectOption {
  valor: string | number | null;
  etiqueta: string;
}

const props = withDefaults(
  defineProps<{
    label?: string;
    placeholder?: string;
    options: SelectOption[];
    modelValue: string | number | null;
    disabled?: boolean;
  }>(),
  {
    placeholder: "Seleccionar...",
    disabled: false
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string | number | null): void;
}>();

const abierto = ref(false);
const containerRef = ref<HTMLElement | null>(null);
const idInterno = `compact-select-${Math.random().toString(36).slice(2)}`;

const valorSeleccionado = computed(() => {
  if (!props.modelValue) return null;
  return props.options.find(opcion => opcion.valor === props.modelValue) || null;
});

const seleccionar = (valor: string | number | null) => {
  emit("update:modelValue", valor);
  abierto.value = false;
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
