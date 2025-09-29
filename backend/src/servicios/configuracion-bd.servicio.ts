import mysql from 'mysql2/promise'
import { entorno } from '../configuracion/entorno.js'

interface DatabaseConfig {
  host: string
  port: number
  username: string
  password: string
  database: string
  ssl: boolean
}

class ConfiguracionBDServicio {
  private configuracionPersonalizada: DatabaseConfig | null = null

  /**
   * Establece una configuración personalizada de base de datos
   */
  setConfiguracionPersonalizada(config: DatabaseConfig) {
    this.configuracionPersonalizada = config
  }

  /**
   * Limpia la configuración personalizada (vuelve a usar la configuración por defecto)
   */
  limpiarConfiguracionPersonalizada() {
    this.configuracionPersonalizada = null
  }

  /**
   * Obtiene la configuración actual de base de datos
   */
  obtenerConfiguracion(): DatabaseConfig {
    if (this.configuracionPersonalizada) {
      return this.configuracionPersonalizada
    }

    // MODO MANUAL: No usar configuración por defecto
    throw new Error('No hay configuración de base de datos establecida. Por favor, configura la conexión manualmente.')
  }

  /**
   * Crea un pool de conexiones con la configuración actual
   */
  crearPool() {
    const config = this.obtenerConfiguracion()
    
    return mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database,
      ssl: config.ssl ? {
        rejectUnauthorized: false
      } : false,
      waitForConnections: true,
      connectionLimit: entorno.baseDatos.maximoConexiones,
      queueLimit: entorno.baseDatos.limiteCola,
      connectTimeout: entorno.baseDatos.tiempoEsperaConexion,
      charset: entorno.baseDatos.conjuntoCaracteres
    })
  }

  /**
   * Crea una conexión única con la configuración actual
   */
  async crearConexion() {
    const config = this.obtenerConfiguracion()
    
    return mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database,
      ssl: config.ssl ? {
        rejectUnauthorized: false
      } : false,
      connectTimeout: entorno.baseDatos.tiempoEsperaConexion,
      charset: entorno.baseDatos.conjuntoCaracteres
    })
  }

  /**
   * Verifica si está usando configuración personalizada
   */
  estaUsandoConfiguracionPersonalizada(): boolean {
    return this.configuracionPersonalizada !== null
  }

  /**
   * Obtiene información sobre la configuración actual
   */
  obtenerInfoConfiguracion() {
    const config = this.obtenerConfiguracion()
    return {
      host: config.host,
      port: config.port,
      database: config.database,
      ssl: config.ssl,
      esPersonalizada: this.estaUsandoConfiguracionPersonalizada(),
      timestamp: new Date().toISOString()
    }
  }
}

// Instancia singleton del servicio
export const configuracionBDServicio = new ConfiguracionBDServicio()
