"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pivot_controlador_1 = require("../controladores/pivot.controlador");
const configuracion_bd_middleware_1 = require("../middleware/configuracion-bd.middleware");
const router = (0, express_1.Router)();
router.use(configuracion_bd_middleware_1.establecerConfiguracionBD);
router.use(configuracion_bd_middleware_1.logConfiguracionBD);
router.use(configuracion_bd_middleware_1.requerirConfiguracionBD);
router.use(configuracion_bd_middleware_1.limpiarConfiguracionBD);
router.get("/catalogo", pivot_controlador_1.catalogoPivotControlador);
router.get("/anios", pivot_controlador_1.aniosDisponiblesPivotControlador);
router.get("/dimensiones/:dimensionId/valores", pivot_controlador_1.valoresDimensionPivotControlador);
router.post("/consulta", pivot_controlador_1.ejecutarPivotControlador);
exports.default = router;
//# sourceMappingURL=pivot.rutas.js.map