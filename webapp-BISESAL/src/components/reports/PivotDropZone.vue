<template>
  <section
    class="flex flex-col gap-3 rounded-xl p-4 transition-colors"
    :class="estado.hover ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-slate-100 dark:bg-slate-700'"
    @dragenter.prevent="estado.hover = true"
    @dragover.prevent="estado.hover = true"
    @dragleave.prevent="estado.hover = false"
    @drop.prevent="manejarDrop"
  >
    <header class="flex items-start justify-between gap-2">
      <div class="space-y-1">
        <h4 class="text-base font-semibold text-slate-900 dark:text-slate-100">{{ titulo }}</h4>
        <p class="text-sm text-slate-500 dark:text-slate-400">{{ descripcion }}</p>
      </div>
      <slot name="extra" />
    </header>

    <div v-if="items.length" class="pointer-events-none flex flex-wrap gap-2">
      <div
        v-for="(item, index) in items"
        :key="item"
        class="pointer-events-auto inline-flex items-center gap-2 rounded-lg border-2 border-orange-600 bg-orange-600 dark:border-orange-700 dark:bg-orange-700 px-3 py-1.5 text-sm font-semibold text-white shadow-md transition hover:bg-orange-700 hover:border-orange-700 dark:hover:bg-orange-800 dark:hover:border-orange-800 active:scale-95"
        draggable="true"
        @dragstart="handleChipDragStart($event, item, index)"
      >
        <span class="max-w-[10rem] truncate select-none">{{ formatearNombre(item) }}</span>
        <button
          type="button"
          class="flex h-5 w-5 items-center justify-center rounded-md bg-orange-700/80 dark:bg-orange-800/80 text-white transition hover:bg-orange-800 dark:hover:bg-orange-900"
          @click.stop="handleRemove(item)"
          :aria-label="`Eliminar ${formatearNombre(item)}`"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" class="h-3 w-3">
            <path
              d="M6.343 6.343a1 1 0 0 1 1.414 0L12 10.586l4.243-4.243a1 1 0 0 1 1.414 1.414L13.414 12l4.243 4.243a1 1 0 0 1-1.414 1.414L12 13.414l-4.243 4.243a1 1 0 0 1-1.414-1.414L10.586 12 6.343 7.757a1 1 0 0 1 0-1.414Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </div>
    <p v-else class="text-center text-sm text-slate-400 dark:text-slate-500">Arrastra aquí</p>
  </section>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { buildDragData } from "../../utils/drag";
import { formatearNombre } from "../../utils/formateo.utils";

const props = defineProps<{
  titulo: string;
  descripcion: string;
  items: string[];
  zoneId: "filters" | "columns" | "rows" | "values";
}>();

const emit = defineEmits<{
  (event: "drop", dragEvent: DragEvent): void;
  (event: "remove", id: string): void;
}>();

const estado = reactive({ hover: false });

const manejarDrop = (dragEvent: DragEvent) => {
  estado.hover = false;
  emit("drop", dragEvent);
};

const handleChipDragStart = (event: DragEvent, item: string, index: number) => {
  const tipo = props.zoneId === "values" ? "measure" : "dimension";

  event.dataTransfer?.setData(
    "text/plain",
    buildDragData(tipo, item, props.zoneId, index)
  );
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }

  // Crear imagen de arrastre
  const dragImage = document.createElement("div");
  dragImage.textContent = formatearNombre(item);
  dragImage.style.position = "absolute";
  dragImage.style.top = "-1000px";
  dragImage.style.padding = "8px 12px";
  dragImage.style.background = "#f97316";
  dragImage.style.color = "#ffffff";
  dragImage.style.borderRadius = "6px";
  dragImage.style.fontSize = "14px";
  dragImage.style.fontWeight = "500";
  document.body.appendChild(dragImage);

  event.dataTransfer!.setDragImage(dragImage, 0, 0);

  setTimeout(() => {
    document.body.removeChild(dragImage);
  }, 0);

};

const handleRemove = (item: string) => {
  emit("remove", item);
};
defineExpose({ estado, props });
</script>

