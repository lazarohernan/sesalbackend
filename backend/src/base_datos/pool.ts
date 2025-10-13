import mysql from "mysql2/promise";

import { configuracionBDServicio } from "../servicios/configuracion-bd.servicio";

export let pool: mysql.Pool | null = null;

const crearNuevoPool = () => {
  const config = configuracionBDServicio.obtenerConfiguracion();
  return mysql.createPool({
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

export const inicializarPool = async () => {
  try {
    await configuracionBDServicio.cargarConfiguracionPersistida();
    if (pool) {
      await pool.end().catch(() => undefined);
      pool = null;
    }
    pool = crearNuevoPool();
    console.log("✅ Pool de conexiones inicializado correctamente");
  } catch (error) {
    console.log(
      "⚠️ Pool no inicializado - se requiere configuración manual:",
      error instanceof Error ? error.message : error
    );
    pool = null;
  }
};

export const obtenerPoolActual = () => {
  if (!pool) {
    void inicializarPool();
  }
  if (!pool) {
    throw new Error("No se pudo inicializar el pool de conexiones. Verifica la configuración de base de datos.");
  }
  return pool;
};
