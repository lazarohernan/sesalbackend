"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportes_controlador_1 = require("../controladores/reportes.controlador");
const configuracion_bd_middleware_1 = require("../middleware/configuracion-bd.middleware");
const router = (0, express_1.Router)();
router.use(configuracion_bd_middleware_1.establecerConfiguracionBD);
router.use(configuracion_bd_middleware_1.logConfiguracionBD);
router.use(configuracion_bd_middleware_1.requerirConfiguracionBD);
router.use(configuracion_bd_middleware_1.limpiarConfiguracionBD);
router.get("/indicadores-municipales", reportes_controlador_1.obtenerIndicadoresMunicipalesControlador);
router.get("/cache-estadisticas", reportes_controlador_1.obtenerEstadisticasCacheControlador);
exports.default = router;
//# sourceMappingURL=reportes.rutas.js.map