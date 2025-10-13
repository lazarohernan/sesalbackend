"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerEstadisticasCache = exports.obtenerIndicadoresMunicipales = void 0;
const pool_1 = require("../base_datos/pool");
const cacheResultados = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos en milisegundos
const MAX_CACHE_SIZE = 100; // Máximo 100 entradas en cache
const construirNombreTablaDetalle = (anio) => {
    return `AT2_BDT_MENSUAL_DETALLE_${anio}`;
};
// Función para generar clave de cache
const generarClaveCache = (anio, departamentoId) => {
    return `${anio}-${departamentoId}`;
};
// Función para limpiar cache antiguo
const limpiarCacheAntiguo = () => {
    const ahora = Date.now();
    const clavesParaEliminar = [];
    for (const [clave, entry] of cacheResultados.entries()) {
        if (ahora - entry.timestamp > CACHE_TTL) {
            clavesParaEliminar.push(clave);
        }
    }
    clavesParaEliminar.forEach(clave => cacheResultados.delete(clave));
};
// Función para verificar si una tabla existe (cacheada)
const tablasVerificadas = new Set();
const validarTablaExisteCacheada = async (pool, tabla) => {
    if (tablasVerificadas.has(tabla)) {
        return; // Ya verificada anteriormente
    }
    const [filas] = await pool.query(`SELECT COUNT(*) AS total
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
     LIMIT 1`, [tabla]);
    const existe = Number(filas?.[0]?.total ?? 0) > 0;
    if (!existe) {
        throw new Error(`La tabla ${tabla} no existe en la base de datos actual.`);
    }
    tablasVerificadas.add(tabla); // Cachear que la tabla existe
};
const obtenerIndicadoresMunicipales = async (params) => {
    const { anio, departamentoId } = params;
    const claveCache = generarClaveCache(anio, departamentoId);
    // Verificar cache primero
    const entradaCache = cacheResultados.get(claveCache);
    if (entradaCache && Date.now() - entradaCache.timestamp < CACHE_TTL) {
        return entradaCache.data; // Retornar resultado cacheado
    }
    // Limpiar cache antiguo si es necesario
    limpiarCacheAntiguo();
    const pool = (0, pool_1.obtenerPoolActual)();
    const tablaDetalle = construirNombreTablaDetalle(anio);
    await validarTablaExisteCacheada(pool, tablaDetalle);
    const query = `
    SELECT
      SUM(totalConsultas) AS totalConsultas,
      SUM(pediatria) AS pediatria,
      SUM(ginecologia) AS ginecologia,
      SUM(medicinaGeneral) AS medicinaGeneral,
      SUM(medicosEspecialistas) AS medicosEspecialistas,
      COUNT(DISTINCT C_US) AS totalUnidades
    FROM (
      SELECT
        det.C_US,
        COALESCE(CAST(det.Q_AT_ENFERMERA_AUX AS UNSIGNED), 0) + COALESCE(CAST(det.Q_AT_ENFERMERA_PRO AS UNSIGNED), 0) + COALESCE(CAST(det.Q_AT_MEDICO_GEN AS UNSIGNED), 0) + COALESCE(CAST(det.Q_AT_MEDICO_ESP AS UNSIGNED), 0) AS totalConsultas,
        COALESCE(CAST(det.Q_AT_ENFERMERA_AUX AS UNSIGNED), 0) AS pediatria,
        COALESCE(CAST(det.Q_AT_ENFERMERA_PRO AS UNSIGNED), 0) AS ginecologia,
        COALESCE(CAST(det.Q_AT_MEDICO_GEN AS UNSIGNED), 0) AS medicinaGeneral,
        COALESCE(CAST(det.Q_AT_MEDICO_ESP AS UNSIGNED), 0) AS medicosEspecialistas
      FROM ${tablaDetalle} det
      FORCE INDEX (idx_detalle_c_us)
      INNER JOIN BAS_BDR_US us FORCE INDEX (idx_us_departamento)
      ON us.C_US = det.C_US
        AND us.C_DEPARTAMENTO = ?
      WHERE det.N_ANIO = ?
    ) AS subquery`;
    const [filas] = await pool.query(query, [departamentoId, anio]);
    const fila = filas?.[0] ?? {};
    const resultado = {
        totalConsultas: Number(fila.totalConsultas ?? 0),
        pediatria: Number(fila.pediatria ?? 0),
        ginecologia: Number(fila.ginecologia ?? 0),
        medicinaGeneral: Number(fila.medicinaGeneral ?? 0),
        medicosEspecialistas: Number(fila.medicosEspecialistas ?? 0),
        totalUnidades: Number(fila.totalUnidades ?? 0)
    };
    // Guardar en cache
    if (cacheResultados.size >= MAX_CACHE_SIZE) {
        // Eliminar entrada más antigua si el cache está lleno
        const primeraClave = cacheResultados.keys().next().value;
        if (primeraClave) {
            cacheResultados.delete(primeraClave);
        }
    }
    cacheResultados.set(claveCache, {
        data: resultado,
        timestamp: Date.now()
    });
    return resultado;
};
exports.obtenerIndicadoresMunicipales = obtenerIndicadoresMunicipales;
// Función para obtener estadísticas del cache (útil para debugging)
const obtenerEstadisticasCache = () => {
    const ahora = Date.now();
    let entradasValidas = 0;
    let entradasExpiradas = 0;
    for (const entry of cacheResultados.values()) {
        if (ahora - entry.timestamp < CACHE_TTL) {
            entradasValidas++;
        }
        else {
            entradasExpiradas++;
        }
    }
    return {
        totalEntradas: cacheResultados.size,
        entradasValidas,
        entradasExpiradas,
        tablasVerificadas: tablasVerificadas.size,
        cacheTTL: CACHE_TTL,
        maxCacheSize: MAX_CACHE_SIZE
    };
};
exports.obtenerEstadisticasCache = obtenerEstadisticasCache;
//# sourceMappingURL=reportes.servicio.js.map