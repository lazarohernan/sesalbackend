<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useApiBase } from '../../composables/useApiBase'

const apiBase = useApiBase()
const isConnected = ref<boolean | null>(null)
const isChecking = ref(false)
let intervalId: number | null = null

const checkConnection = async () => {
  if (isChecking.value) return
  
  isChecking.value = true
  try {
    const base = apiBase.value || window.location.origin
    const response = await fetch(new URL('/api/health/db', base).toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    
    const result = await response.json()
    isConnected.value = response.ok && result.connected === true
  } catch (error) {
    console.warn('Error checking database connection:', error)
    isConnected.value = false
  } finally {
    isChecking.value = false
  }
}

onMounted(() => {
  checkConnection()
  // Verificar cada 30 segundos
  intervalId = window.setInterval(checkConnection, 30000)
})

onBeforeUnmount(() => {
  if (intervalId !== null) {
    clearInterval(intervalId)
  }
})

const statusText = () => {
  if (isConnected.value === null) return 'Verificando...'
  return isConnected.value ? 'DB conectada' : 'DB desconectada'
}

const statusColor = () => {
  if (isConnected.value === null) return 'bg-gray-400'
  return isConnected.value ? 'bg-green-500' : 'bg-red-500'
}

const statusTextColor = () => {
  if (isConnected.value === null) return 'text-gray-600 dark:text-gray-400'
  return isConnected.value ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
}
</script>

<template>
  <div 
    class="flex items-center gap-2 px-4 py-2 rounded-full border border-border dark:border-border-dark bg-surface dark:bg-surface-dark transition-all duration-300"
    :title="statusText()"
  >
    <div class="relative flex-shrink-0">
      <!-- Círculo indicador -->
      <div 
        class="w-3 h-3 rounded-full transition-colors duration-300"
        :class="statusColor()"
      />
      <!-- Efecto de pulso cuando está conectado -->
      <div 
        v-if="isConnected === true"
        class="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-75"
      />
    </div>
    <span 
      class="text-xs font-medium transition-colors duration-300"
      :class="statusTextColor()"
    >
      {{ statusText() }}
    </span>
  </div>
</template>

