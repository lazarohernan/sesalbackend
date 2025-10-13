"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const configuracion_controlador_1 = require("../controladores/configuracion.controlador");
const router = (0, express_1.Router)();
// Ruta para probar conexión a base de datos
router.post('/test-db-connection', configuracion_controlador_1.testDatabaseConnection);
// Ruta para obtener información de la base de datos
router.post('/db-info', configuracion_controlador_1.getDatabaseInfo);
// Ruta para guardar configuración de base de datos
router.post('/save-db-config', configuracion_controlador_1.saveDatabaseConfig);
// Ruta para obtener configuracción guardada de base de datos
router.get('/get-saved-db-config', configuracion_controlador_1.getSavedDatabaseConfig);
router.post('/get-saved-db-config', configuracion_controlador_1.getSavedDatabaseConfig); // Mantener POST por compatibilidad
// Ruta para eliminar configuracción de base de datos
router.post('/delete-db-config', configuracion_controlador_1.deleteDatabaseConfig);
exports.default = router;
//# sourceMappingURL=configuracion.rutas.js.map