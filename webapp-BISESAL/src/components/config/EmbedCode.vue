<script setup lang="ts">
import { ref, computed } from 'vue'

const isOpen = ref(false)
const selectedSize = ref<'small' | 'medium' | 'large'>('medium')
const copiedMessage = ref('')

const sizes = {
  small: { width: '800px', height: '600px' },
  medium: { width: '1200px', height: '800px' },
  large: { width: '100%', height: '1000px' }
}

const currentSize = computed(() => sizes[selectedSize.value])

const embedUrl = computed(() => {
  return `${window.location.origin}`
})

const iframeCode = computed(() => {
  return `<iframe 
  src="${embedUrl.value}" 
  width="${currentSize.value.width}" 
  height="${currentSize.value.height}" 
  frameborder="0" 
  allowfullscreen
></iframe>`
})


const copyToClipboard = async (text: string, type: string) => {
  try {
    await navigator.clipboard.writeText(text)
    copiedMessage.value = type
    setTimeout(() => {
      copiedMessage.value = ''
    }, 2000)
  } catch (err) {
    console.error('Error al copiar:', err)
    alert('❌ Error al copiar')
  }
}

const openModal = () => {
  isOpen.value = true
}

const closeModal = () => {
  isOpen.value = false
  copiedMessage.value = ''
}
</script>

<template>
  <div>
    <!-- Botón para abrir el modal -->
    <button
      @click="openModal"
      class="flex items-center gap-2 self-start rounded-full border border-border px-5 py-2 text-sm font-medium text-text-primary shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-base dark:border-border-dark dark:bg-surface-dark dark:text-text-inverted"
      type="button"
      aria-label="Compartir Dashboard"
    >
      <span
        aria-hidden="true"
        class="flex size-5 items-center justify-center rounded-full bg-brand-base/20 text-base text-brand-dark transition-colors duration-200 dark:bg-brand-base/40 dark:text-brand-light"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
        </svg>
      </span>
      <span class="hidden sm:inline">Compartir</span>
      <span class="sm:hidden">Compartir</span>
    </button>

    <!-- Modal -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      @click="closeModal"
    >
      <div
        class="w-full max-w-4xl mx-4 bg-surface rounded-2xl shadow-panel border border-border dark:bg-surface-dark dark:border-border-dark transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto"
        @click.stop
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-8 border-b border-border dark:border-border-dark sticky top-0 bg-surface dark:bg-surface-dark z-10">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-gradient-to-br from-brand-base to-brand-dark rounded-xl flex items-center justify-center shadow-lg">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
              </svg>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-text-primary dark:text-text-inverted">
                Compartir Dashboard
              </h2>
              <p class="text-sm text-text-secondary dark:text-text-muted mt-1">
                Comparte el dashboard con otros o intégralo en tu sitio web
              </p>
            </div>
          </div>
          <button
            @click="closeModal"
            class="w-8 h-8 rounded-lg bg-surface hover:bg-gray-50 dark:bg-surface-dark dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
            aria-label="Cerrar"
          >
            <svg class="w-4 h-4 text-text-primary dark:text-text-inverted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-8 space-y-6">
          <!-- Tamaño -->
          <div class="space-y-3">
            <h3 class="text-lg font-semibold text-text-primary dark:text-text-inverted">Tamaño del Dashboard</h3>
            <div class="flex gap-3">
              <button
                v-for="size in (['small', 'medium', 'large'] as const)" :key="size"
                @click="selectedSize = size"
                :class="[
                  'px-4 py-2 rounded-lg font-medium transition-all',
                  selectedSize === size
                    ? 'bg-brand-base text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                ]"
              >
                {{ size === 'small' ? 'Pequeño' : size === 'medium' ? 'Mediano' : 'Grande' }}
                <span class="text-xs opacity-75 ml-1">
                  ({{ sizes[size].width }} x {{ sizes[size].height }})
                </span>
              </button>
            </div>
          </div>

          <!-- Código para Integrar -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-text-primary dark:text-text-inverted flex items-center gap-2">
                <svg class="w-5 h-5 text-brand-base" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                </svg>
                Código para Integrar
              </h3>
              <button
                @click="copyToClipboard(iframeCode, 'iframe')"
                :class="[
                  'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all',
                  copiedMessage === 'iframe'
                    ? 'bg-green-600 text-white'
                    : 'bg-brand-base hover:bg-brand-dark text-white'
                ]"
              >
                <svg v-if="copiedMessage === 'iframe'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
                {{ copiedMessage === 'iframe' ? '¡Copiado!' : 'Copiar' }}
              </button>
            </div>
            <div class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Pega este código en tu sitio web:</p>
              <pre class="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-3 rounded border border-gray-200 dark:border-gray-700 text-xs overflow-x-auto"><code>{{ iframeCode }}</code></pre>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>
