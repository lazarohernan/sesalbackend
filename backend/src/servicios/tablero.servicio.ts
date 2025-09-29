import type { RowDataPacket } from "mysql2";

import { entorno } from "../configuracion";
import { pool } from "../base_datos/pool";

export interface ResumenTablero {
  totalRegiones: number;
  totalMunicipios: number;
  totalUnidadesServicio: number;
  totalRegistrosDetalle: number;
}

export interface DepartamentoDato {
  departamentoId: number;
  nombre: string;
  totalHistorico: number;
  total2025: number;
  total2024: number;
  total2023: number;
  totalUnidades: number;
}

export const obtenerResumenTablero = async (): Promise<ResumenTablero> => {
  const [catalogos] = await pool.query<RowDataPacket[]>(
    `SELECT
        (SELECT COUNT(*) FROM BAS_BDR_REGIONES) AS totalRegiones,
        (SELECT COUNT(*) FROM BAS_BDR_MUNICIPIOS) AS totalMunicipios,
        (SELECT COUNT(*) FROM BAS_BDR_US) AS totalUnidadesServicio`
  );

  const [detalle] = await pool.query<RowDataPacket[]>(
    `SELECT COALESCE(SUM(TABLE_ROWS), 0) AS total
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME LIKE 'AT2_BDT_MENSUAL_DETALLE_%'`,
    [entorno.baseDatos.nombre]
  );

  return {
    totalRegiones: Number(catalogos?.[0]?.totalRegiones ?? 0),
    totalMunicipios: Number(catalogos?.[0]?.totalMunicipios ?? 0),
    totalUnidadesServicio: Number(catalogos?.[0]?.totalUnidadesServicio ?? 0),
    totalRegistrosDetalle: Number(detalle?.[0]?.total ?? 0)
  };
};

export const obtenerDatosMapaHonduras = async (): Promise<DepartamentoDato[]> => {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT
        departamento_id AS departamentoId,
        nombre_departamento AS nombre,
        total_registros_historico AS totalHistorico,
        total_registros_2025 AS total2025,
        total_registros_2024 AS total2024,
        total_registros_2023 AS total2023,
        total_unidades AS totalUnidades
      FROM tablero_departamento_resumen
      ORDER BY departamento_id`
  );

  return filas.map((fila) => ({
    departamentoId: Number(fila.departamentoId),
    nombre: String(fila.nombre),
    totalHistorico: Number(fila.totalHistorico ?? 0),
    total2025: Number(fila.total2025 ?? 0),
    total2024: Number(fila.total2024 ?? 0),
    total2023: Number(fila.total2023 ?? 0),
    totalUnidades: Number(fila.totalUnidades ?? 0)
  }));
};
