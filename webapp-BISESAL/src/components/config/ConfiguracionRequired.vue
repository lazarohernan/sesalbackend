<script setup lang="ts">
import { ref } from 'vue'
import DatabaseConfig from './DatabaseConfig.vue'

const showConfigModal = ref(false)

const openConfig = () => {
  showConfigModal.value = true
}
</script>

<template>
  <div class="fixed top-0 left-0 right-0 z-40 bg-yellow-50 border-b border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
    <div class="max-w-7xl mx-auto px-4 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="flex-shrink-0">
            <span class="text-xl">⚠️</span>
          </div>
          <div>
            <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Configuración de Base de Datos Requerida
            </h3>
            <p class="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              El sistema requiere que configures la conexión a la base de datos antes de continuar.
            </p>
          </div>
        </div>
        <div class="flex-shrink-0">
          <button
            @click="openConfig"
            class="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:bg-yellow-800 dark:text-yellow-200 dark:hover:bg-yellow-700"
          >
            <span class="mr-1">🗄️</span>
            Configurar BD
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal de configuración -->
  <DatabaseConfig v-if="showConfigModal" @close="showConfigModal = false" />
</template>
