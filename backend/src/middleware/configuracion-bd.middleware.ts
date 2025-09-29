import { Request, Response, NextFunction } from 'express'
import { configuracionBDServicio } from '../servicios/configuracion-bd.servicio.js'

interface DatabaseConfig {
  host: string
  port: number
  username: string
  password: string
  database: string
  ssl: boolean
}

/**
 * Middleware para establecer configuración de base de datos desde el frontend
 */
export const establecerConfiguracionBD = (req: Request, res: Response, next: NextFunction) => {
  // Verificar si hay configuración en el header o body
  const configHeader = req.headers['x-db-config'] as string
  const configBody = req.body?.dbConfig as DatabaseConfig

  if (configHeader) {
    try {
      const config = JSON.parse(configHeader)
      configuracionBDServicio.setConfiguracionPersonalizada(config)
      console.log('✅ Configuración de BD establecida desde header')
    } catch (error) {
      console.warn('⚠️ Error al parsear configuración de BD desde header:', error)
    }
  } else if (configBody) {
    configuracionBDServicio.setConfiguracionPersonalizada(configBody)
    console.log('✅ Configuración de BD establecida desde body')
  }

  next()
}

/**
 * Middleware para requerir configuración de BD en rutas protegidas
 */
export const requerirConfiguracionBD = (req: Request, res: Response, next: NextFunction) => {
  // Excluir rutas de configuración y testing
  const rutasExcluidas = ['/api/test-db-connection', '/api/db-info']
  
  if (rutasExcluidas.some(ruta => req.path.includes(ruta))) {
    return next()
  }

  // Verificar si hay configuración establecida
  if (!configuracionBDServicio.estaUsandoConfiguracionPersonalizada()) {
    return res.status(400).json({
      success: false,
      error: 'Configuración de base de datos requerida',
      message: 'Por favor, configura la conexión a la base de datos antes de continuar',
      requiresConfig: true
    })
  }

  next()
}

/**
 * Middleware para limpiar configuración de BD al final de la request
 */
export const limpiarConfiguracionBD = (req: Request, res: Response, next: NextFunction) => {
  // Limpiar la configuración al final de cada request
  res.on('finish', () => {
    if (configuracionBDServicio.estaUsandoConfiguracionPersonalizada()) {
      configuracionBDServicio.limpiarConfiguracionPersonalizada()
      console.log('🧹 Configuración de BD limpiada')
    }
  })

  next()
}

/**
 * Middleware para logging de configuración de BD
 */
export const logConfiguracionBD = (req: Request, res: Response, next: NextFunction) => {
  const info = configuracionBDServicio.obtenerInfoConfiguracion()
  
  // Solo loggear en desarrollo
  if (process.env.NODE_ENV === 'desarrollo' || process.env.NODE_ENV === 'development') {
    console.log(`🗄️ BD Config: ${info.database}@${info.host}:${info.port} ${info.esPersonalizada ? '(Personalizada)' : '(Por defecto)'}`)
  }

  next()
}
