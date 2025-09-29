<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface DatabaseConfig {
  host: string
  port: number
  username: string
  password: string
  database: string
  ssl: boolean
}

const isOpen = ref(false)
const isLoading = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)

const dbConfig = ref<DatabaseConfig>({
  host: 'ls-ca7d5c9e53daa7f886cbe09310c131eba697bc0c.cn0s0keyw5qy.us-east-2.rds.amazonaws.com',
  port: 3306,
  username: 'dbmasteruser',
  password: '',
  database: 'sesal_historico',
  ssl: true
})

const isFormValid = computed(() => {
  return dbConfig.value.host.trim() !== '' &&
         dbConfig.value.username.trim() !== '' &&
         dbConfig.value.password.trim() !== '' &&
         dbConfig.value.database.trim() !== ''
})

const openModal = () => {
  isOpen.value = true
  loadSavedConfig()
}

const closeModal = () => {
  isOpen.value = false
  testResult.value = null
}

const loadSavedConfig = () => {
  const saved = localStorage.getItem('bi-sesal-db-config')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      dbConfig.value = { ...dbConfig.value, ...parsed }
    } catch (error) {
      console.warn('Error loading saved database config:', error)
    }
  }
}

const saveConfig = () => {
  const configToSave = {
    host: dbConfig.value.host,
    port: dbConfig.value.port,
    username: dbConfig.value.username,
    database: dbConfig.value.database,
    ssl: dbConfig.value.ssl
  }
  localStorage.setItem('bi-sesal-db-config', JSON.stringify(configToSave))
  testResult.value = { success: true, message: 'Configuración guardada exitosamente' }
}

const testConnection = async () => {
  if (!isFormValid.value) return
  
  isLoading.value = true
  testResult.value = null
  
  try {
    const apiBase = import.meta.env.VITE_API_URL || window.location.origin
    const response = await fetch(`${apiBase}/api/test-db-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dbConfig.value)
    })
    
    const result = await response.json()
    
    if (response.ok) {
      testResult.value = { success: true, message: result.message }
    } else {
      testResult.value = { success: false, message: result.error || 'Error al conectar con la base de datos' }
    }
  } catch (error) {
    testResult.value = { 
      success: false, 
      message: `Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}` 
    }
  } finally {
    isLoading.value = false
  }
}

const applyConfig = async () => {
  await saveConfig()
  
  // Aquí podrías emitir un evento o usar un store para notificar al resto de la app
  // que la configuración de la base de datos ha cambiado
  closeModal()
}

// Cargar configuración guardada al montar el componente
onMounted(() => {
  loadSavedConfig()
})
</script>

<template>
  <div>
    <!-- Botón para abrir el modal -->
    <button
      @click="openModal"
      class="flex items-center justify-center size-10 self-start rounded-full border border-border bg-surface text-sm font-medium text-text-primary shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-base dark:border-border-dark dark:bg-surface-dark dark:text-text-inverted"
      type="button"
      aria-label="Configuración de Base de Datos"
    >
      <span
        aria-hidden="true"
        class="text-lg text-brand-dark transition-colors duration-200 dark:text-brand-light"
      >
        🗄️
      </span>
    </button>

    <!-- Modal -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      @click="closeModal"
    >
      <div
        class="w-full max-w-2xl mx-4 bg-surface rounded-lg shadow-xl border border-border dark:bg-surface-dark dark:border-border-dark"
        @click.stop
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-border dark:border-border-dark">
          <h2 class="text-xl font-semibold text-text-primary dark:text-text-inverted">
            Configuración de Base de Datos
          </h2>
          <button
            @click="closeModal"
            class="text-text-secondary hover:text-text-primary dark:text-text-muted dark:hover:text-text-inverted"
            aria-label="Cerrar"
          >
            <span class="text-xl">×</span>
          </button>
        </div>

        <!-- Form -->
        <div class="p-6 space-y-6">
          <!-- Host -->
          <div>
            <label class="block text-sm font-medium text-text-primary dark:text-text-inverted mb-2">
              Host del Servidor
            </label>
            <input
              v-model="dbConfig.host"
              type="text"
              class="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-base dark:border-border-dark dark:bg-surface-dark dark:text-text-inverted"
              placeholder="ej: mysql.ejemplo.com"
            />
          </div>

          <!-- Port -->
          <div>
            <label class="block text-sm font-medium text-text-primary dark:text-text-inverted mb-2">
              Puerto
            </label>
            <input
              v-model.number="dbConfig.port"
              type="number"
              class="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-base dark:border-border-dark dark:bg-surface-dark dark:text-text-inverted"
              placeholder="3306"
            />
          </div>

          <!-- Username -->
          <div>
            <label class="block text-sm font-medium text-text-primary dark:text-text-inverted mb-2">
              Usuario
            </label>
            <input
              v-model="dbConfig.username"
              type="text"
              class="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-base dark:border-border-dark dark:bg-surface-dark dark:text-text-inverted"
              placeholder="usuario"
            />
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm font-medium text-text-primary dark:text-text-inverted mb-2">
              Contraseña
            </label>
            <input
              v-model="dbConfig.password"
              type="password"
              class="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-base dark:border-border-dark dark:bg-surface-dark dark:text-text-inverted"
              placeholder="••••••••"
            />
          </div>

          <!-- Database -->
          <div>
            <label class="block text-sm font-medium text-text-primary dark:text-text-inverted mb-2">
              Base de Datos
            </label>
            <input
              v-model="dbConfig.database"
              type="text"
              class="w-full px-3 py-2 border border-border rounded-md bg-surface text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-base dark:border-border-dark dark:bg-surface-dark dark:text-text-inverted"
              placeholder="sesal_historico"
            />
          </div>

          <!-- SSL -->
          <div class="flex items-center">
            <input
              v-model="dbConfig.ssl"
              type="checkbox"
              id="ssl"
              class="h-4 w-4 text-brand-base focus:ring-brand-base border-border rounded dark:border-border-dark"
            />
            <label for="ssl" class="ml-2 text-sm text-text-primary dark:text-text-inverted">
              Usar conexión SSL
            </label>
          </div>

          <!-- Test Result -->
          <div v-if="testResult" class="p-4 rounded-md" :class="testResult.success ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'">
            <p class="text-sm" :class="testResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'">
              {{ testResult.message }}
            </p>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-4">
            <button
              @click="testConnection"
              :disabled="!isFormValid || isLoading"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ isLoading ? 'Probando...' : 'Probar Conexión' }}
            </button>
            
            <button
              @click="applyConfig"
              :disabled="!isFormValid"
              class="flex-1 px-4 py-2 bg-brand-base text-white rounded-md hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Guardar Configuración
            </button>
          </div>

          <!-- Info -->
          <div class="bg-blue-50 border border-blue-200 rounded-md p-4 dark:bg-blue-900/20 dark:border-blue-800">
            <h4 class="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              ℹ️ Modo Manual Activo
            </h4>
            <ul class="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li>• <strong>Configuración requerida:</strong> Debes configurar la BD para usar el sistema</li>
              <li>• La configuración se guarda localmente en tu navegador</li>
              <li>• Usa "Probar Conexión" para verificar que los datos son correctos</li>
              <li>• Sin configuración, el dashboard no funcionará</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
