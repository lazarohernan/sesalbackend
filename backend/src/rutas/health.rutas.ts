import { Router, Request, Response } from 'express';
import { pool } from '../base_datos/pool';

const router = Router();

// Endpoint para verificar el estado de la conexión a la base de datos
router.get('/db', async (_req: Request, res: Response) => {
  try {
    if (!pool) {
      return res.status(503).json({
        connected: false,
        error: 'Pool de conexiones no inicializado'
      });
    }

    // Hacer una consulta simple para verificar la conexión
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    return res.json({
      connected: true,
      message: 'Conexión a base de datos exitosa'
    });
  } catch (error) {
    console.error('Error al verificar conexión a BD:', error);
    return res.status(503).json({
      connected: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

export default router;

