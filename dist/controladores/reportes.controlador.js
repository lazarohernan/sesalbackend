"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerEstadisticasCacheControlador = exports.obtenerIndicadoresMunicipalesControlador = void 0;
const reportes_servicio_1 = require("../servicios/reportes.servicio");
const registro_utilidad_1 = require("../utilidades/registro.utilidad");
const obtenerIndicadoresMunicipalesControlador = async (req, res, next) => {
    try {
        const { anio, departamentoId, limite } = req.query;
        const anioNumero = Number(anio);
        const departamentoNumero = Number(departamentoId);
        const limiteNumero = Number(limite ?? 100);
        if (!Number.isFinite(anioNumero) || anioNumero < 2008 || anioNumero > 2030) {
            return res.status(400).json({
                codigo: "PARAMETRO_INVALIDO",
                mensaje: "El parámetro 'anio' es obligatorio y debe ser un número válido",
                campos: { anio }
            });
        }
        if (!Number.isFinite(departamentoNumero) || departamentoNumero <= 0) {
            return res.status(400).json({
                codigo: "PARAMETRO_INVALIDO",
                mensaje: "El parámetro 'departamentoId' es obligatorio y debe ser un número válido",
                campos: { departamentoId }
            });
        }
        const limiteSeguro = Number.isFinite(limiteNumero) && limiteNumero > 0 ? limiteNumero : 0;
        const datos = await (0, reportes_servicio_1.obtenerIndicadoresMunicipales)({
            anio: anioNumero,
            departamentoId: departamentoNumero,
            limite: limiteSeguro
        });
        return res.status(200).json({
            datos,
            generadoEn: new Date().toISOString()
        });
    }
    catch (error) {
        registro_utilidad_1.logger.error("Error al obtener indicadores municipales", error);
        return next(error);
    }
};
exports.obtenerIndicadoresMunicipalesControlador = obtenerIndicadoresMunicipalesControlador;
const obtenerEstadisticasCacheControlador = async (req, res, next) => {
    try {
        const estadisticas = (0, reportes_servicio_1.obtenerEstadisticasCache)();
        return res.status(200).json({
            estadisticas,
            generadoEn: new Date().toISOString()
        });
    }
    catch (error) {
        registro_utilidad_1.logger.error("Error al obtener estadísticas del cache", error);
        return next(error);
    }
};
exports.obtenerEstadisticasCacheControlador = obtenerEstadisticasCacheControlador;
//# sourceMappingURL=reportes.controlador.js.map