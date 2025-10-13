"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aplicacion_1 = require("./aplicacion");
const configuracion_1 = require("./configuracion");
const registro_utilidad_1 = require("./utilidades/registro.utilidad");
const pool_1 = require("./base_datos/pool");
const configuracion_bd_servicio_1 = require("./servicios/configuracion-bd.servicio");
const puerto = configuracion_1.entorno.puerto;
const prepararConfiguracion = async () => {
    try {
        await configuracion_bd_servicio_1.configuracionBDServicio.cargarConfiguracionPersistida();
        await (0, pool_1.inicializarPool)();
        registro_utilidad_1.logger.info("✅ Configuración de BD lista");
    }
    catch (error) {
        registro_utilidad_1.logger.warn("⚠️ No se pudo inicializar el pool automáticamente:", error instanceof Error ? error.message : "Error desconocido");
    }
};
prepararConfiguracion().finally(() => {
    const servidor = aplicacion_1.app.listen(puerto, () => {
        registro_utilidad_1.logger.info(`Servidor BI SESAL escuchando en puerto ${puerto}`);
    });
    servidor.on("error", (error) => {
        registro_utilidad_1.logger.error("Error al iniciar el servidor", error);
        process.exit(1);
    });
    const shutdown = async (signal) => {
        registro_utilidad_1.logger.info(`Recibida señal ${signal}. Cerrando servidor...`);
        try {
            await new Promise((resolve) => servidor.close(() => resolve()));
            registro_utilidad_1.logger.info("Servidor HTTP cerrado.");
        }
        catch (e) {
            registro_utilidad_1.logger.error("Error al cerrar el servidor", e);
        }
        try {
            if (pool_1.pool) {
                await pool_1.pool.end();
                registro_utilidad_1.logger.info("Pool de base de datos cerrado.");
            }
        }
        catch (e) {
            registro_utilidad_1.logger.error("Error al cerrar el pool", e);
        }
        process.exit(0);
    };
    process.on("SIGINT", () => void shutdown("SIGINT"));
    process.on("SIGTERM", () => void shutdown("SIGTERM"));
});
process.on("unhandledRejection", (razon) => {
    registro_utilidad_1.logger.error("Promesa no manejada", razon);
});
process.on("uncaughtException", (error) => {
    registro_utilidad_1.logger.error("Excepción no manejada", error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map