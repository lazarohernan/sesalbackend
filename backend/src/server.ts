import { app } from "./aplicacion";
import { entorno } from "./configuracion";
import { logger } from "./utilidades/registro.utilidad";
import { pool } from "./base_datos/pool";

const puerto = entorno.puerto;

const servidor = app.listen(puerto, () => {
  logger.info(`Servidor BI SESAL escuchando en puerto ${puerto}`);
});

servidor.on("error", (error) => {
  logger.error("Error al iniciar el servidor", error);
  process.exit(1);
});

process.on("unhandledRejection", (razon) => {
  logger.error("Promesa no manejada", razon);
});

process.on("uncaughtException", (error) => {
  logger.error("Excepción no manejada", error);
  process.exit(1);
});

const shutdown = async (signal: string) => {
  logger.info(`Recibida señal ${signal}. Cerrando servidor...`);
  try {
    await new Promise<void>((resolve) => servidor.close(() => resolve()));
    logger.info("Servidor HTTP cerrado.");
  } catch (e) {
    logger.error("Error al cerrar el servidor", e);
  }
  try {
    await pool.end();
    logger.info("Pool de base de datos cerrado.");
  } catch (e) {
    logger.error("Error al cerrar el pool", e);
  }
  process.exit(0);
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
