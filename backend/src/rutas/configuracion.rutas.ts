import { Router } from 'express'
import { testDatabaseConnection, getDatabaseInfo } from '../controladores/configuracion.controlador.js'

const router = Router()

// Ruta para probar conexión a base de datos
router.post('/test-db-connection', testDatabaseConnection)

// Ruta para obtener información de la base de datos
router.post('/db-info', getDatabaseInfo)

export default router
