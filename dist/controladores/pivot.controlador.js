"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ejecutarPivotControlador = exports.aniosDisponiblesPivotControlador = exports.valoresDimensionPivotControlador = exports.catalogoPivotControlador = void 0;
const pivot_servicio_1 = require("../servicios/pivot.servicio");
const registro_utilidad_1 = require("../utilidades/registro.utilidad");
const catalogoPivotControlador = async (_req, res, next) => {
    try {
        const catalogo = await (0, pivot_servicio_1.obtenerCatalogoPivot)();
        return res.status(200).json(catalogo);
    }
    catch (error) {
        registro_utilidad_1.logger.error("Error al obtener catálogo de pivot", error);
        return next(error);
    }
};
exports.catalogoPivotControlador = catalogoPivotControlador;
const valoresDimensionPivotControlador = async (req, res, next) => {
    try {
        const { dimensionId } = req.params;
        const busqueda = typeof req.query.busqueda === "string" ? req.query.busqueda : undefined;
        const limite = req.query.limite ? Number(req.query.limite) : undefined;
        const valores = await (0, pivot_servicio_1.obtenerValoresDimension)(dimensionId, busqueda, limite);
        return res.status(200).json({ valores, generadoEn: new Date().toISOString() });
    }
    catch (error) {
        registro_utilidad_1.logger.error("Error al obtener valores de dimensión pivot", error);
        return next(error);
    }
};
exports.valoresDimensionPivotControlador = valoresDimensionPivotControlador;
const aniosDisponiblesPivotControlador = async (_req, res, next) => {
    try {
        const anios = await (0, pivot_servicio_1.obtenerAniosDisponibles)();
        return res.status(200).json({
            anios,
            generadoEn: new Date().toISOString()
        });
    }
    catch (error) {
        registro_utilidad_1.logger.error("Error al obtener años disponibles", error);
        return next(error);
    }
};
exports.aniosDisponiblesPivotControlador = aniosDisponiblesPivotControlador;
const ejecutarPivotControlador = async (req, res, next) => {
    try {
        const payload = req.body;
        const resultado = await (0, pivot_servicio_1.ejecutarConsultaPivot)(payload);
        return res.status(200).json({
            resultado,
            generadoEn: new Date().toISOString()
        });
    }
    catch (error) {
        registro_utilidad_1.logger.error("Error al ejecutar consulta pivot", error);
        return next(error);
    }
};
exports.ejecutarPivotControlador = ejecutarPivotControlador;
//# sourceMappingURL=pivot.controlador.js.map