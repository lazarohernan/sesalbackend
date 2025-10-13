"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configuracionBDServicio = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const node_path_1 = __importDefault(require("node:path"));
const entorno_1 = require("../configuracion/entorno");
const configuracion_archivo_utilidad_1 = require("../utilidades/configuracion-archivo.utilidad");
const encryptPassword = (password) => Buffer.from(password, "utf8").toString("base64");
const decryptPassword = (passwordEncrypted) => Buffer.from(passwordEncrypted, "base64").toString("utf8");
const normalizarConfig = (config) => ({
    host: config.host.trim(),
    port: Number.isFinite(config.port) ? config.port : 3306,
    username: config.username.trim(),
    password: config.password ?? "",
    database: config.database.trim(),
    ssl: Boolean(config.ssl)
});
class ConfiguracionBDServicio {
    constructor() {
        this.configuracionPersonalizada = null;
        this.persistenciaCargada = false;
        this.contextoId = node_path_1.default.basename(process.cwd());
    }
    obtenerConfigPorDefecto() {
        return {
            host: entorno_1.entorno.baseDatos.host,
            port: entorno_1.entorno.baseDatos.puerto,
            username: entorno_1.entorno.baseDatos.usuario,
            password: entorno_1.entorno.baseDatos.contrasena,
            database: entorno_1.entorno.baseDatos.nombre,
            ssl: false
        };
    }
    async cargarConfiguracionPersistida() {
        if (this.persistenciaCargada)
            return;
        this.persistenciaCargada = true;
        const guardada = await (0, configuracion_archivo_utilidad_1.leerConfiguracionPersistida)();
        if (guardada) {
            this.configuracionPersonalizada = {
                host: guardada.host,
                port: guardada.port,
                username: guardada.username,
                database: guardada.database,
                ssl: guardada.ssl,
                password: decryptPassword(guardada.passwordEncrypted)
            };
        }
    }
    obtenerConfiguracion() {
        if (this.configuracionPersonalizada) {
            return this.configuracionPersonalizada;
        }
        return this.obtenerConfigPorDefecto();
    }
    async persistirConfiguracion(config) {
        if (!config) {
            await (0, configuracion_archivo_utilidad_1.eliminarConfiguracionPersistida)();
            return;
        }
        const payload = {
            host: config.host,
            port: config.port,
            username: config.username,
            database: config.database,
            ssl: Boolean(config.ssl),
            passwordEncrypted: encryptPassword(config.password),
            updatedAt: new Date().toISOString()
        };
        await (0, configuracion_archivo_utilidad_1.guardarConfiguracionPersistida)(payload);
    }
    setConfiguracionPersonalizada(config) {
        this.configuracionPersonalizada = config ? normalizarConfig(config) : null;
    }
    async actualizarConfiguracion(config) {
        this.setConfiguracionPersonalizada(config);
        await this.persistirConfiguracion(config);
    }
    limpiarConfiguracionPersonalizada() {
        this.configuracionPersonalizada = null;
    }
    async limpiarConfiguracionPersistida() {
        this.limpiarConfiguracionPersonalizada();
        await this.persistirConfiguracion(null);
    }
    estaUsandoConfiguracionPersonalizada() {
        return this.configuracionPersonalizada !== null;
    }
    obtenerInfoConfiguracion() {
        const config = this.obtenerConfiguracion();
        return {
            host: config.host,
            port: config.port,
            database: config.database,
            ssl: config.ssl,
            esPersonalizada: this.estaUsandoConfiguracionPersonalizada(),
            contextoId: this.contextoId,
            timestamp: new Date().toISOString()
        };
    }
    obtenerConfiguracionPersistidaSanitizada() {
        if (!this.configuracionPersonalizada)
            return null;
        const { password, ...resto } = this.configuracionPersonalizada;
        return {
            ...resto,
            ssl: Boolean(resto.ssl),
            tienePassword: Boolean(password)
        };
    }
    crearPool() {
        const config = this.obtenerConfiguracion();
        const normalizado = normalizarConfig(config);
        return promise_1.default.createPool({
            host: normalizado.host,
            port: normalizado.port,
            user: normalizado.username,
            password: normalizado.password,
            database: normalizado.database,
            ssl: normalizado.ssl
                ? {
                    rejectUnauthorized: false
                }
                : undefined,
            waitForConnections: true,
            connectionLimit: entorno_1.entorno.baseDatos.maximoConexiones,
            queueLimit: entorno_1.entorno.baseDatos.limiteCola,
            connectTimeout: entorno_1.entorno.baseDatos.tiempoEsperaConexion,
            charset: entorno_1.entorno.baseDatos.conjuntoCaracteres
        });
    }
    async crearConexion() {
        const config = this.obtenerConfiguracion();
        const normalizado = normalizarConfig(config);
        return promise_1.default.createConnection({
            host: normalizado.host,
            port: normalizado.port,
            user: normalizado.username,
            password: normalizado.password,
            database: normalizado.database,
            ssl: normalizado.ssl
                ? {
                    rejectUnauthorized: false
                }
                : undefined,
            connectTimeout: entorno_1.entorno.baseDatos.tiempoEsperaConexion,
            charset: entorno_1.entorno.baseDatos.conjuntoCaracteres
        });
    }
}
exports.configuracionBDServicio = new ConfiguracionBDServicio();
//# sourceMappingURL=configuracion-bd.servicio.js.map