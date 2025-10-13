"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tablero_controlador_1 = require("../controladores/tablero.controlador");
const configuracion_bd_middleware_1 = require("../middleware/configuracion-bd.middleware");
const router = (0, express_1.Router)();
// Aplicar middleware de configuración a todas las rutas
router.use(configuracion_bd_middleware_1.establecerConfiguracionBD);
router.use(configuracion_bd_middleware_1.logConfiguracionBD);
router.use(configuracion_bd_middleware_1.requerirConfiguracionBD);
router.use(configuracion_bd_middleware_1.limpiarConfiguracionBD);
router.get("/resumen", tablero_controlador_1.obtenerResumenControlador);
router.get("/mapahonduras", tablero_controlador_1.obtenerMapaHondurasControlador);
router.get("/anios", tablero_controlador_1.obtenerAniosDisponiblesControlador);
exports.default = router;
//# sourceMappingURL=tablero.rutas.js.map