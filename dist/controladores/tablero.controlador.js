"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerAniosDisponiblesControlador = exports.obtenerMapaHondurasControlador = exports.obtenerResumenControlador = void 0;
const tablero_servicio_1 = require("../servicios/tablero.servicio");
const pool_1 = require("../base_datos/pool");
const registro_utilidad_1 = require("../utilidades/registro.utilidad");
const obtenerResumenControlador = async (req, res, next) => {
    try {
        const { anio } = req.query;
        const anioNumero = anio ? Number(anio) : undefined;
        if (anio && (!Number.isFinite(anioNumero) || anioNumero < 2008 || anioNumero > 2030)) {
            return res.status(400).json({
                codigo: "PARAMETRO_INVALIDO",
                mensaje: "El parámetro 'anio' debe ser un número válido entre 2008 y 2030",
                campos: { anio }
            });
        }
        const resumen = await (0, tablero_servicio_1.obtenerResumenTablero)(anioNumero);
        return res.status(200).json({
            datos: resumen,
            generadoEn: new Date().toISOString()
        });
    }
    catch (error) {
        registro_utilidad_1.logger.error("Error al obtener resumen del tablero", error);
        return next(error);
    }
};
exports.obtenerResumenControlador = obtenerResumenControlador;
const obtenerMapaHondurasControlador = async (_req, res, next) => {
    try {
        const datos = await (0, tablero_servicio_1.obtenerDatosMapaHonduras)();
        return res.status(200).json({
            datos,
            generadoEn: new Date().toISOString()
        });
    }
    catch (error) {
        registro_utilidad_1.logger.error("Error al obtener datos del mapa Honduras", error);
        return next(error);
    }
};
exports.obtenerMapaHondurasControlador = obtenerMapaHondurasControlador;
const obtenerAniosDisponiblesControlador = async (_req, res, next) => {
    try {
        const pool = (0, pool_1.obtenerPoolActual)();
        const [tablas] = await pool.query(`SELECT TABLE_NAME
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ?
         AND TABLE_NAME LIKE 'AT2_BDT_MENSUAL_DETALLE_%'
       ORDER BY TABLE_NAME DESC`, [process.env.MYSQL_DATABASE || 'sesal_historico']);
        const anios = tablas
            .map(tabla => {
            const match = tabla.TABLE_NAME?.toString().match(/AT2_BDT_MENSUAL_DETALLE_(\d{4})/);
            return match ? Number(match[1]) : null;
        })
            .filter((anio) => anio !== null)
            .sort((a, b) => b - a); // Ordenar de mayor a menor (2025, 2024, ...)
        return res.status(200).json({
            datos: anios,
            generadoEn: new Date().toISOString()
        });
    }
    catch (error) {
        registro_utilidad_1.logger.error("Error al obtener años disponibles", error);
        return next(error);
    }
};
exports.obtenerAniosDisponiblesControlador = obtenerAniosDisponiblesControlador;
//# sourceMappingURL=tablero.controlador.js.map