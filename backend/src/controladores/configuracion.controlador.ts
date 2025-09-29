import { Request, Response } from 'express'
import { configuracionBDServicio } from '../servicios/configuracion-bd.servicio.js'

interface DatabaseConfig {
  host: string
  port: number
  username: string
  password: string
  database: string
  ssl: boolean
}

export const testDatabaseConnection = async (req: Request, res: Response) => {
  try {
    const config: DatabaseConfig = req.body

    // Validar que todos los campos requeridos estén presentes
    if (!config.host || !config.username || !config.password || !config.database) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos: host, username, password, database'
      })
    }

    // Establecer la configuración temporalmente para la prueba
    configuracionBDServicio.setConfiguracionPersonalizada(config)

    try {
      // Crear conexión usando el servicio
      const connection = await configuracionBDServicio.crearConexion()

      // Probar una consulta simple
      const [rows] = await connection.execute('SELECT 1 as test, NOW() as current_time, DATABASE() as current_database')

      // Cerrar la conexión
      await connection.end()

      res.json({
        success: true,
        message: `Conexión exitosa a la base de datos "${config.database}" en ${config.host}:${config.port}`,
        details: {
          host: config.host,
          port: config.port,
          database: config.database,
          testResult: rows
        }
      })

    } finally {
      // Limpiar la configuración temporal
      configuracionBDServicio.limpiarConfiguracionPersonalizada()
    }

  } catch (error) {
    console.error('Error testing database connection:', error)
    
    let errorMessage = 'Error desconocido al conectar con la base de datos'
    
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'No se puede conectar al servidor. Verifica la dirección y puerto.'
      } else if (error.message.includes('ER_ACCESS_DENIED_ERROR')) {
        errorMessage = 'Credenciales incorrectas. Verifica el usuario y contraseña.'
      } else if (error.message.includes('ER_BAD_DB_ERROR')) {
        errorMessage = `La base de datos "${req.body.database}" no existe.`
      } else if (error.message.includes('ETIMEDOUT')) {
        errorMessage = 'Timeout de conexión. El servidor no responde.'
      } else {
        errorMessage = error.message
      }
    }

    res.status(400).json({
      success: false,
      error: errorMessage
    })
  }
}

export const getDatabaseInfo = async (req: Request, res: Response) => {
  try {
    const config: DatabaseConfig = req.body

    if (!config.host || !config.username || !config.password || !config.database) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos'
      })
    }

    const connectionConfig: mysql.ConnectionOptions = {
      host: config.host,
      port: config.port || 3306,
      user: config.username,
      password: config.password,
      database: config.database,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      connectTimeout: 10000
    }

    const connection = await mysql.createConnection(connectionConfig)

    // Obtener información de la base de datos
    const [tables] = await connection.execute(`
      SELECT 
        table_name,
        table_rows,
        ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
      FROM information_schema.tables 
      WHERE table_schema = ? 
      ORDER BY table_name
    `, [config.database])

    const [version] = await connection.execute('SELECT VERSION() as version')

    await connection.end()

    res.json({
      success: true,
      database: {
        name: config.database,
        version: (version as any)[0]?.version,
        tables: tables,
        tableCount: (tables as any[]).length
      }
    })

  } catch (error) {
    console.error('Error getting database info:', error)
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener información de la base de datos'
    })
  }
}
