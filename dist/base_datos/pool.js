"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerPoolActual = exports.inicializarPool = exports.pool = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const configuracion_bd_servicio_1 = require("../servicios/configuracion-bd.servicio");
exports.pool = null;
const crearNuevoPool = () => {
    const config = configuracion_bd_servicio_1.configuracionBDServicio.obtenerConfiguracion();
    return promise_1.default.createPool({
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        database: config.database,
        ssl: config.ssl
            ? {
                rejectUnauthorized: process.env.NODE_ENV === 'production'
            }
            : undefined,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 10000,
        charset: "utf8mb4"
    });
};
const inicializarPool = async () => {
    try {
        await configuracion_bd_servicio_1.configuracionBDServicio.cargarConfiguracionPersistida();
        if (exports.pool) {
            await exports.pool.end().catch(() => undefined);
            exports.pool = null;
        }
        exports.pool = crearNuevoPool();
        console.log("✅ Pool de conexiones inicializado correctamente");
    }
    catch (error) {
        console.log("⚠️ Pool no inicializado - se requiere configuración manual:", error instanceof Error ? error.message : error);
        exports.pool = null;
    }
};
exports.inicializarPool = inicializarPool;
const obtenerPoolActual = () => {
    if (!exports.pool) {
        void (0, exports.inicializarPool)();
    }
    if (!exports.pool) {
        throw new Error("No se pudo inicializar el pool de conexiones. Verifica la configuración de base de datos.");
    }
    return exports.pool;
};
exports.obtenerPoolActual = obtenerPoolActual;
//# sourceMappingURL=pool.js.map