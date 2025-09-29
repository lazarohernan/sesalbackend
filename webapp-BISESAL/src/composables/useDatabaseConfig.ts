import { ref, computed } from 'vue'

interface DatabaseConfig {
  host: string
  port: number
  username: string
  password: string
  database: string
  ssl: boolean
}

const dbConfig = ref<DatabaseConfig | null>(null)

export function useDatabaseConfig() {
  const loadConfig = () => {
    const saved = localStorage.getItem('bi-sesal-db-config')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        dbConfig.value = {
          host: parsed.host || '',
          port: parsed.port || 3306,
          username: parsed.username || '',
          password: '', // No cargar contraseña desde localStorage por seguridad
          database: parsed.database || '',
          ssl: parsed.ssl || false
        }
      } catch (error) {
        console.warn('Error loading saved database config:', error)
      }
    }
  }

  const saveConfig = (config: DatabaseConfig) => {
    const configToSave = {
      host: config.host,
      port: config.port,
      username: config.username,
      database: config.database,
      ssl: config.ssl
    }
    localStorage.setItem('bi-sesal-db-config', JSON.stringify(configToSave))
    dbConfig.value = config
  }

  const clearConfig = () => {
    localStorage.removeItem('bi-sesal-db-config')
    dbConfig.value = null
  }

  const hasConfig = computed(() => {
    return dbConfig.value !== null && 
           dbConfig.value.host.trim() !== '' && 
           dbConfig.value.username.trim() !== '' && 
           dbConfig.value.database.trim() !== ''
  })

  const getConfigForAPI = (password: string): DatabaseConfig | null => {
    if (!hasConfig.value) return null
    
    return {
      ...dbConfig.value!,
      password: password
    }
  }

  const getConfigHeaders = (password: string): Record<string, string> => {
    const config = getConfigForAPI(password)
    if (!config) return {}
    
    return {
      'X-DB-Config': JSON.stringify(config)
    }
  }

  // Función para hacer requests con configuración automática
  const fetchWithConfig = async (url: string, options: RequestInit = {}, password: string = '') => {
    const headers = {
      ...options.headers,
      ...getConfigHeaders(password)
    }

    return fetch(url, {
      ...options,
      headers
    })
  }

  // Cargar configuración al inicializar
  loadConfig()

  return {
    dbConfig: computed(() => dbConfig.value),
    hasConfig,
    loadConfig,
    saveConfig,
    clearConfig,
    getConfigForAPI,
    getConfigHeaders,
    fetchWithConfig
  }
}
