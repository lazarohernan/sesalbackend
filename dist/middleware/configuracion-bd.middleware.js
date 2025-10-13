"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logConfiguracionBD = exports.limpiarConfiguracionBD = exports.requerirConfiguracionBD = exports.establecerConfiguracionBD = void 0;
const configuracion_bd_servicio_1 = require("../servicios/configuracion-bd.servicio");
const parseConfig = (valor) => {
    if (!valor || typeof valor !== "object")
        return null;
    const config = valor;
    if (!config.host || !config.username || !config.database)
        return null;
    return {
        host: String(config.host),
        username: String(config.username),
        database: String(config.database),
        password: typeof config.password === "string" ? config.password : "",
        port: Number.isFinite(config.port) ? Number(config.port) : 3306,
        ssl: Boolean(config.ssl)
    };
};
const establecerConfiguracionBD = (req, _res, next) => {
    const configHeader = typeof req.headers["x-db-config"] === "string" ? req.headers["x-db-config"] : undefined;
    const bodyConfig = parseConfig(req.body?.dbConfig);
    if (configHeader) {
        try {
            const parsed = JSON.parse(configHeader);
            const config = parseConfig(parsed);
            if (config) {
                configuracion_bd_servicio_1.configuracionBDServicio.setConfiguracionPersonalizada(config);
            }
        }
        catch (error) {
            console.warn("⚠️ Error al parsear configuración de BD desde header:", error);
        }
    }
    else if (bodyConfig) {
        configuracion_bd_servicio_1.configuracionBDServicio.setConfiguracionPersonalizada(bodyConfig);
    }
    next();
};
exports.establecerConfiguracionBD = establecerConfiguracionBD;
const requerirConfiguracionBD = async (req, res, next) => {
    const rutasExcluidas = ["/api/test-db-connection", "/api/db-info", "/api/get-saved-db-config"];
    if (rutasExcluidas.some((ruta) => req.path.includes(ruta))) {
        return next();
    }
    try {
        await configuracion_bd_servicio_1.configuracionBDServicio.cargarConfiguracionPersistida();
        const config = configuracion_bd_servicio_1.configuracionBDServicio.obtenerConfiguracion();
        if (!config?.host) {
            return res.status(400).json({
                success: false,
                error: "Configuración de base de datos requerida",
                message: "Configura la conexión a la base de datos antes de continuar",
                requiresConfig: true
            });
        }
        return next();
    }
    catch (error) {
        console.error("Error validando configuración de BD:", error);
        return res.status(500).json({
            success: false,
            error: "No se pudo validar la configuración de base de datos",
            requiresConfig: true
        });
    }
};
exports.requerirConfiguracionBD = requerirConfiguracionBD;
const limpiarConfiguracionBD = async (_req, _res, next) => {
    await configuracion_bd_servicio_1.configuracionBDServicio.cargarConfiguracionPersistida();
    next();
};
exports.limpiarConfiguracionBD = limpiarConfiguracionBD;
const logConfiguracionBD = (_req, _res, next) => {
    try {
        const info = configuracion_bd_servicio_1.configuracionBDServicio.obtenerInfoConfiguracion();
        if (process.env.NODE_ENV === "desarrollo" || process.env.NODE_ENV === "development") {
            console.log(`🗄️ BD Config: ${info.database}@${info.host}:${info.port} ${info.esPersonalizada ? "(Personalizada)" : "(Entorno)"}`);
        }
    }
    catch (error) {
        console.warn("⚠️ No se pudo obtener información de configuración de BD:", error);
    }
    next();
};
exports.logConfiguracionBD = logConfiguracionBD;
//# sourceMappingURL=configuracion-bd.middleware.js.map