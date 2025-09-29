import mysql from "mysql2/promise";
import { configuracionBDServicio } from "../servicios/configuracion-bd.servicio.js";

// Función para obtener el pool dinámicamente
export const obtenerPool = () => {
  try {
    const config = configuracionBDServicio.obtenerConfiguracion();
    return mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database,
      ssl: config.ssl ? {
        rejectUnauthorized: false
      } : false,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000,
      charset: 'utf8mb4'
    });
  } catch (error) {
    throw new Error(`Error al crear pool de conexiones: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

// Pool dinámico que se crea cuando se necesita
export let pool: mysql.Pool | null = null;

export const inicializarPool = () => {
  try {
    pool = obtenerPool();
    console.log('✅ Pool de conexiones inicializado correctamente');
  } catch (error) {
    console.log('⚠️ Pool no inicializado - se requiere configuración manual');
    pool = null;
  }
};

// Inicializar pool al cargar el módulo
inicializarPool();
