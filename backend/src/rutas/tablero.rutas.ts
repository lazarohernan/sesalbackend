import { Router } from "express";

import {
  obtenerMapaHondurasControlador,
  obtenerResumenControlador
} from "../controladores/tablero.controlador";
import { establecerConfiguracionBD, requerirConfiguracionBD } from "../middleware/configuracion-bd.middleware.js";

const router = Router();

// Aplicar middleware de configuración a todas las rutas
router.use(establecerConfiguracionBD);
router.use(requerirConfiguracionBD);

router.get("/resumen", obtenerResumenControlador);
router.get("/mapahonduras", obtenerMapaHondurasControlador);

export default router;
