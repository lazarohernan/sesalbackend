"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDatabaseConfig = exports.getSavedDatabaseConfig = exports.saveDatabaseConfig = exports.getDatabaseInfo = exports.testDatabaseConnection = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const configuracion_bd_servicio_1 = require("../servicios/configuracion-bd.servicio");
const pool_1 = require("../base_datos/pool");
const sanitizarConfig = (entrada) => ({
    host: entrada.host?.trim() ?? "",
    port: Number.isFinite(entrada.port) ? Number(entrada.port) : 3306,
    username: entrada.username?.trim() ?? "",
    password: entrada.password ?? "",
    database: entrada.database?.trim() ?? "",
    ssl: Boolean(entrada.ssl)
});
const validarConfig = (config) => Boolean(config.host && config.username && config.password !== undefined && config.database);
const construirConnectionConfig = (config) => ({
    host: config.host,
    port: config.port || 3306,
    user: config.username,
    password: config.password,
    database: config.database,
    ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
    connectTimeout: 10000
});
const traducirErrorConexion = (error, database) => {
    if (!(error instanceof Error))
        return "Error desconocido al conectar con la base de datos";
    if (error.message.includes("ECONNREFUSED")) {
        return "No se pudo establecer conexión con el servidor MySQL. Verifica host/puerto.";
    }
    if (error.message.includes("ER_ACCESS_DENIED_ERROR")) {
        return "Credenciales incorrectas. Revisa usuario y contraseña.";
    }
    if (error.message.includes("ER_BAD_DB_ERROR")) {
        return `La base de datos "${database ?? ""}" no existe o no es accesible.`;
    }
    if (error.message.includes("ETIMEDOUT")) {
        return "Timeout de conexión. El servidor no respondió a tiempo.";
    }
    return error.message;
};
const testDatabaseConnection = async (req, res) => {
    const config = sanitizarConfig(req.body ?? {});
    if (!validarConfig(config)) {
        return res.status(400).json({
            success: false,
            error: "Faltan campos requeridos: host, username, password, database"
        });
    }
    try {
        const connection = await promise_1.default.createConnection(construirConnectionConfig(config));
        const [rows] = await connection.execute("SELECT 1 as test");
        await connection.end();
        return res.json({
            success: true,
            message: `Conexión exitosa a "${config.database}" en ${config.host}:${config.port}`,
            details: rows
        });
    }
    catch (error) {
        console.error("Error testing database connection:", error);
        return res.status(400).json({
            success: false,
            error: traducirErrorConexion(error, config.database)
        });
    }
};
exports.testDatabaseConnection = testDatabaseConnection;
const getDatabaseInfo = async (req, res) => {
    const config = sanitizarConfig(req.body ?? {});
    if (!validarConfig(config)) {
        return res.status(400).json({
            success: false,
            error: "Faltan campos requeridos"
        });
    }
    try {
        const connection = await promise_1.default.createConnection(construirConnectionConfig(config));
        const [tablas] = await connection.execute(`
      SELECT 
        table_name,
        table_rows,
        ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
      FROM information_schema.tables 
      WHERE table_schema = ?
      ORDER BY table_name
    `, [config.database]);
        const [version] = await connection.execute("SELECT VERSION() as version");
        await connection.end();
        return res.json({
            success: true,
            database: {
                name: config.database,
                version: version[0]?.version,
                tables: tablas,
                tableCount: tablas.length
            }
        });
    }
    catch (error) {
        console.error("Error getting database info:", error);
        return res.status(400).json({
            success: false,
            error: traducirErrorConexion(error, config.database)
        });
    }
};
exports.getDatabaseInfo = getDatabaseInfo;
const saveDatabaseConfig = async (req, res) => {
    const config = sanitizarConfig(req.body ?? {});
    if (!validarConfig(config)) {
        return res.status(400).json({
            success: false,
            error: "Faltan campos requeridos: host, username, password, database"
        });
    }
    try {
        const connection = await promise_1.default.createConnection(construirConnectionConfig(config));
        await connection.execute("SELECT 1");
        await connection.end();
        await configuracion_bd_servicio_1.configuracionBDServicio.actualizarConfiguracion(config);
        await (0, pool_1.inicializarPool)();
        return res.json({
            success: true,
            message: "Configuración guardada exitosamente",
            config: {
                host: config.host,
                port: config.port,
                database: config.database,
                username: config.username
            }
        });
    }
    catch (error) {
        console.error("Error saving database config:", error);
        return res.status(400).json({
            success: false,
            error: traducirErrorConexion(error, config.database)
        });
    }
};
exports.saveDatabaseConfig = saveDatabaseConfig;
const getSavedDatabaseConfig = async (_req, res) => {
    try {
        await configuracion_bd_servicio_1.configuracionBDServicio.cargarConfiguracionPersistida();
        const config = configuracion_bd_servicio_1.configuracionBDServicio.obtenerConfiguracionPersistidaSanitizada();
        return res.json({
            success: true,
            config
        });
    }
    catch (error) {
        console.error("Error getting saved database config:", error);
        return res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : "Error al obtener la configuración guardada"
        });
    }
};
exports.getSavedDatabaseConfig = getSavedDatabaseConfig;
const deleteDatabaseConfig = async (_req, res) => {
    try {
        await configuracion_bd_servicio_1.configuracionBDServicio.limpiarConfiguracionPersistida();
        if (pool_1.pool) {
            await pool_1.pool.end().catch(() => undefined);
        }
        await (0, pool_1.inicializarPool)();
        return res.json({
            success: true,
            message: "Configuración eliminada exitosamente"
        });
    }
    catch (error) {
        console.error("Error deleting database config:", error);
        return res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : "Error al eliminar la configuración"
        });
    }
};
exports.deleteDatabaseConfig = deleteDatabaseConfig;
//# sourceMappingURL=configuracion.controlador.js.map