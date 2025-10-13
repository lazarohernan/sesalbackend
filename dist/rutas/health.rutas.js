"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pool_1 = require("../base_datos/pool");
const router = (0, express_1.Router)();
// Endpoint para verificar el estado de la conexión a la base de datos
router.get('/db', async (_req, res) => {
    try {
        if (!pool_1.pool) {
            return res.status(503).json({
                connected: false,
                error: 'Pool de conexiones no inicializado'
            });
        }
        // Hacer una consulta simple para verificar la conexión
        const connection = await pool_1.pool.getConnection();
        await connection.ping();
        connection.release();
        return res.json({
            connected: true,
            message: 'Conexión a base de datos exitosa'
        });
    }
    catch (error) {
        console.error('Error al verificar conexión a BD:', error);
        return res.status(503).json({
            connected: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
});
exports.default = router;
//# sourceMappingURL=health.rutas.js.map