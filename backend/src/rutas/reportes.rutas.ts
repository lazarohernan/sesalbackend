import { Router } from "express";

import {
  generarReporteConsolidadoControlador,
  generarReporteDetalleControlador,
  generarResumenMaestroControlador,
  indicadoresMunicipalesControlador,
  listarDepartamentosControlador,
  listarMunicipiosControlador,
  listarPeriodosDisponiblesControlador,
  listarRegionesControlador,
  listarServiciosControlador,
  listarUnidadesControlador
} from "../controladores/reportes.controlador";
import { establecerConfiguracionBD, requerirConfiguracionBD } from "../middleware/configuracion-bd.middleware.js";

const router = Router();

// Aplicar middleware de configuración a todas las rutas
router.use(establecerConfiguracionBD);
router.use(requerirConfiguracionBD);

router.get('/regiones', listarRegionesControlador);
router.get('/departamentos', listarDepartamentosControlador);
router.get('/municipios', listarMunicipiosControlador);
router.get('/unidades', listarUnidadesControlador);
router.get('/servicios', listarServiciosControlador);
router.get('/periodos', listarPeriodosDisponiblesControlador);
router.get('/indicadores-municipales', indicadoresMunicipalesControlador);
router.post('/consolidado', generarReporteConsolidadoControlador);
router.post('/detalle', generarReporteDetalleControlador);
router.post('/resumen-maestro', generarResumenMaestroControlador);

export default router;
