import type { RowDataPacket } from "mysql2";

import { pool } from "../base_datos/pool";

export interface RegionCatalogo {
  id: number;
  nombre: string;
}

export interface ReporteDetalleResultado extends ReporteConsolidadoResultado {}

export interface ReporteResumenMaestroResultado {
  regionId: number | null;
  regionNombre: string | null;
  departamentoId: number | null;
  departamentoNombre: string | null;
  municipioId: number | null;
  municipioNombre: string | null;
  unidadId: number;
  unidadCodigo: number;
  unidadNombre: string;
  totalEnfermeraAux: number;
  totalEnfermeraPro: number;
  totalMedicoGen: number;
  totalMedicoEsp: number;
  totalProfesionales: number;
}

export interface DepartamentoCatalogo {
  id: number;
  nombre: string;
}

export interface MunicipioCatalogo {
  id: number;
  departamentoId: number;
  nombre: string;
}

export interface UnidadCatalogo {
  id: number;
  codigo: number;
  nombre: string;
  regionId: number | null;
  departamentoId: number | null;
  municipioId: number | null;
}

export interface ServicioCatalogo {
  id: number;
  nombre: string;
}

export interface PeriodoDisponible {
  anio: number;
  meses: number[];
}

export interface ReporteConsolidadoResultado {
  regionId: number | null;
  regionNombre: string | null;
  departamentoId: number | null;
  departamentoNombre: string | null;
  municipioId: number | null;
  municipioNombre: string | null;
  unidadId: number;
  unidadCodigo: number;
  unidadNombre: string;
  conceptoCodigo: string;
  conceptoDescripcion: string;
  totalEnfermeraAux: number;
  totalEnfermeraPro: number;
  totalMedicoGen: number;
  totalMedicoEsp: number;
}

export interface ReporteFiltros {
  anio: number;
  mesInicial: number;
  mesFinal: number;
  regionId?: number;
  departamentoId?: number;
  municipioId?: number;
  servicioId?: string;
  unidadId?: number;
  formulario?: string;
  bloque?: string;
}

export interface IndicadorMunicipalResultado {
  departamentoId: number;
  departamentoNombre: string | null;
  municipioId: number;
  municipioNombre: string | null;
  totalConsultas: number;
  pediatria: number;
  ginecologia: number;
  medicinaGeneral: number;
  medicosEspecialistas: number;
  totalUnidades: number;
}

export interface IndicadorMunicipalFiltros {
  anio: number;
  departamentoId?: number;
  municipioId?: number;
  limite?: number;
}

export const obtenerRegiones = async (): Promise<RegionCatalogo[]> => {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT C_REGION AS id, D_REGION AS nombre
     FROM BAS_BDR_REGIONES
     WHERE F_BAJA IS NULL
     ORDER BY nombre`
  );

  return filas.map((fila) => ({
    id: Number(fila.id),
    nombre: String(fila.nombre)
  }));
};

export const obtenerDepartamentos = async (): Promise<DepartamentoCatalogo[]> => {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT C_DEPARTAMENTO AS id, D_DEPARTAMENTO AS nombre
     FROM BAS_BDR_DEPARTAMENTOS
     WHERE F_BAJA IS NULL
     ORDER BY nombre`
  );

  return filas.map((fila) => ({
    id: Number(fila.id),
    nombre: String(fila.nombre)
  }));
};

// Mapeo de regiones sanitarias a sus departamentos correspondientes en Honduras
// Basado en el análisis de la base de datos sesal_historico
const REGIONES_DEPARTAMENTOS: Record<number, number[]> = {
  1: [1],     // Región 1: Departamental de Atlántida → Atlántida
  2: [2],     // Región 2: Departamental de Colón → Colón
  3: [3],     // Región 3: Departamental de Comayagua → Comayagua
  4: [4],     // Región 4: Departamental de Copán → Copán
  5: [5],     // Región 5: Departamental de Cortés → Cortés
  6: [6],     // Región 6: Departamental de Choluteca → Choluteca
  7: [7],     // Región 7: Departamental de El Paraíso → El Paraíso
  8: [8],     // Región 8: Departamental de Francisco Morazán → Francisco Morazán
  9: [9],     // Región 9: Departamental de Gracias a Dios → Gracias a Dios
  10: [10],   // Región 10: Departamental de Intibucá → Intibucá
  11: [11],   // Región 11: Departamental de Islas de la Bahía → Islas de la Bahía
  12: [12],   // Región 12: Departamental de La Paz → La Paz
  13: [13],   // Región 13: Departamental de Lempira → Lempira
  14: [14],   // Región 14: Departamental de Ocotepeque → Ocotepeque
  15: [15],   // Región 15: Departamental de Olancho → Olancho
  16: [16],   // Región 16: Departamental de Santa Bárbara → Santa Bárbara
  17: [17],   // Región 17: Departamental de Valle → Valle
  18: [18],   // Región 18: Departamental de Yoro → Yoro
  19: [8],    // Región 19: Metropolitana del Distrito Central → Francisco Morazán
  20: [5]     // Región 20: Metropolitana de San Pedro Sula → Cortés
};

export const obtenerMunicipios = async (
  departamentoId?: number,
  regionId?: number
): Promise<MunicipioCatalogo[]> => {
  let condicion = "";
  const parametros: number[] = [];

  if (departamentoId) {
    // Filtrar por departamento específico
    condicion = "AND C_DEPARTAMENTO = ?";
    parametros.push(departamentoId);
  } else if (regionId && REGIONES_DEPARTAMENTOS[regionId]) {
    // Filtrar por región sanitaria (departamentos de esa región)
    const departamentosDeRegion = REGIONES_DEPARTAMENTOS[regionId];
    condicion = `AND C_DEPARTAMENTO IN (${departamentosDeRegion.map(() => '?').join(',')})`;
    parametros.push(...departamentosDeRegion);
  }

  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT C_DEPARTAMENTO AS departamentoId,
            C_MUNICIPIO AS id,
            D_MUNICIPIO AS nombre
     FROM BAS_BDR_MUNICIPIOS
     WHERE F_BAJA IS NULL ${condicion}
     ORDER BY nombre`,
    parametros
  );

  return filas.map((fila) => ({
    id: Number(fila.id),
    departamentoId: Number(fila.departamentoId),
    nombre: String(fila.nombre)
  }));
};

export const obtenerUnidades = async (
  filtros: {
    regionId?: number;
    departamentoId?: number;
    municipioId?: number;
  } = {}
): Promise<UnidadCatalogo[]> => {
  const condiciones: string[] = ['B_ACTIVA = "S"'];
  const parametros: Array<number> = [];

  if (filtros.regionId) {
    condiciones.push("C_REGION = ?");
    parametros.push(filtros.regionId);
  }

  if (filtros.departamentoId) {
    condiciones.push("C_DEPARTAMENTO = ?");
    parametros.push(filtros.departamentoId);
  }

  if (filtros.municipioId) {
    condiciones.push("C_MUNICIPIO = ?");
    parametros.push(filtros.municipioId);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";

  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT C_US AS id,
            V_US AS codigo,
            D_US AS nombre,
            C_REGION AS regionId,
            C_DEPARTAMENTO AS departamentoId,
            C_MUNICIPIO AS municipioId
     FROM BAS_BDR_US
     ${where}
     ORDER BY nombre`
      , parametros
  );

  return filas.map((fila) => ({
    id: Number(fila.id),
    codigo: Number(fila.codigo),
    nombre: String(fila.nombre),
    regionId: fila.regionId === null ? null : Number(fila.regionId),
    departamentoId: fila.departamentoId === null ? null : Number(fila.departamentoId),
    municipioId: fila.municipioId === null ? null : Number(fila.municipioId)
  }));
};

export const obtenerServicios = async (): Promise<ServicioCatalogo[]> => {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT DISTINCT D_NIVEL_US_SIGLA AS nombre,
            C_NIVEL_US AS id
     FROM BAS_BDR_NIVELES_US
     WHERE F_BAJA IS NULL
     ORDER BY nombre`
  );

  return filas.map((fila) => ({
    id: Number(fila.id),
    nombre: String(fila.nombre ?? '')
  }));
};

export const obtenerIndicadoresMunicipales = async (
  filtros: IndicadorMunicipalFiltros
): Promise<IndicadorMunicipalResultado[]> => {
  const tablaDetalle = construirNombreTablaDetalle(filtros.anio);

  const condiciones: string[] = ['det.N_ANIO = ?'];
  const parametros: Array<string | number> = [String(filtros.anio)];

  if (filtros.departamentoId) {
    condiciones.push('us.C_DEPARTAMENTO = ?');
    parametros.push(filtros.departamentoId);
  }

  if (filtros.municipioId) {
    condiciones.push('us.C_MUNICIPIO = ?');
    parametros.push(filtros.municipioId);
  }

  const whereClause = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const limite = Number.isFinite(filtros.limite) && filtros.limite! > 0 ? filtros.limite : 50;

  const consulta = `
    SELECT
      us.C_DEPARTAMENTO AS departamentoId,
      deptos.D_DEPARTAMENTO AS departamentoNombre,
      us.C_MUNICIPIO AS municipioId,
      municipios.D_MUNICIPIO AS municipioNombre,
      SUM(COALESCE(det.Q_AT_ENFERMERA_AUX, 0) +
          COALESCE(det.Q_AT_ENFERMERA_PRO, 0) +
          COALESCE(det.Q_AT_MEDICO_GEN, 0) +
          COALESCE(det.Q_AT_MEDICO_ESP, 0)) AS totalConsultas,
      SUM(COALESCE(det.Q_AT_ENFERMERA_AUX, 0)) AS pediatria,
      SUM(COALESCE(det.Q_AT_ENFERMERA_PRO, 0)) AS ginecologia,
      SUM(COALESCE(det.Q_AT_MEDICO_GEN, 0)) AS medicinaGeneral,
      SUM(COALESCE(det.Q_AT_MEDICO_ESP, 0)) AS medicosEspecialistas,
      COUNT(DISTINCT CASE WHEN us.B_ACTIVA = 'S' THEN us.C_US END) AS totalUnidades
    FROM ${tablaDetalle} det
    INNER JOIN BAS_BDR_US us ON us.C_US = det.C_US
    LEFT JOIN BAS_BDR_DEPARTAMENTOS deptos ON deptos.C_DEPARTAMENTO = us.C_DEPARTAMENTO
    LEFT JOIN BAS_BDR_MUNICIPIOS municipios
      ON municipios.C_DEPARTAMENTO = us.C_DEPARTAMENTO
     AND municipios.C_MUNICIPIO = us.C_MUNICIPIO
    ${whereClause}
    GROUP BY departamentoId, departamentoNombre, municipioId, municipioNombre
    ORDER BY totalConsultas DESC
    LIMIT ${limite}
  `;

  const [filas] = await pool.query<RowDataPacket[]>(consulta, parametros);

  return filas.map((fila) => ({
    departamentoId: Number(fila.departamentoId ?? 0),
    departamentoNombre: fila.departamentoNombre ? String(fila.departamentoNombre) : null,
    municipioId: Number(fila.municipioId ?? 0),
    municipioNombre: fila.municipioNombre ? String(fila.municipioNombre) : null,
    totalConsultas: Number(fila.totalConsultas ?? 0),
    pediatria: Number(fila.pediatria ?? 0),
    ginecologia: Number(fila.ginecologia ?? 0),
    medicinaGeneral: Number(fila.medicinaGeneral ?? 0),
    medicosEspecialistas: Number(fila.medicosEspecialistas ?? 0),
    totalUnidades: Number(fila.totalUnidades ?? 0)
  }));
};

export const obtenerPeriodosDisponibles = async (): Promise<PeriodoDisponible[]> => {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT
        SUBSTRING(TABLE_NAME, 22, 4) AS anio,
        MAX(CASE WHEN TABLE_ROWS > 0 THEN 1 ELSE 0 END) AS tieneDatos
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME LIKE 'AT2_BDT_MENSUAL_DETALLE_%'
     GROUP BY anio
     ORDER BY anio DESC`
  );

  const periodos: PeriodoDisponible[] = [];

  for (const fila of filas) {
    const anio = Number(fila.anio);
    if (!Number.isFinite(anio)) continue;

    const [meses] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT EXTRACT(MONTH FROM F_ATENCION) AS mes
       FROM AT2_BDT_MENSUAL_DETALLE_${anio}
       ORDER BY mes`
    );

    periodos.push({
      anio,
      meses: meses.map((m) => Number(m.mes)).filter((mes) => Number.isFinite(mes))
    });
  }

  return periodos;
};

const construirNombreTablaDetalle = (anio: number) => {
  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) {
    throw new Error(`Año ${anio} fuera de rango permitido`);
  }
  return `AT2_BDT_MENSUAL_DETALLE_${anio}`;
};

const normalizarMes = (mes: number) => {
  if (!Number.isFinite(mes)) return 1;
  if (mes < 1) return 1;
  if (mes > 12) return 12;
  return Math.trunc(mes);
};

export const generarReporteConsolidado = async (
  filtros: ReporteFiltros
): Promise<ReporteConsolidadoResultado[]> => {
  const tablaDetalle = construirNombreTablaDetalle(filtros.anio);

  const mesInicial = normalizarMes(filtros.mesInicial);
  const mesFinal = normalizarMes(filtros.mesFinal);
  const rangoMeses = mesFinal < mesInicial ? [mesInicial, mesInicial] : [mesInicial, mesFinal];

  const condiciones: string[] = ['det.N_ANIO = ?', 'CAST(det.N_MES AS UNSIGNED) BETWEEN ? AND ?'];
  const parametros: Array<string | number> = [String(filtros.anio), rangoMeses[0], rangoMeses[1]];

  if (filtros.regionId) {
    condiciones.push('us.C_REGION = ?');
    parametros.push(filtros.regionId);
  }

  if (filtros.departamentoId) {
    condiciones.push('us.C_DEPARTAMENTO = ?');
    parametros.push(filtros.departamentoId);
  }

  if (filtros.municipioId) {
    condiciones.push('us.C_MUNICIPIO = ?');
    parametros.push(filtros.municipioId);
  }

  if (filtros.servicioId) {
    condiciones.push('det.C_SERVICIO = ?');
    parametros.push(filtros.servicioId);
  }

  if (filtros.unidadId) {
    condiciones.push('us.C_US = ?');
    parametros.push(filtros.unidadId);
  }

  if (filtros.formulario) {
    condiciones.push('det.V_FORMULARIO = ?');
    parametros.push(filtros.formulario);
  }

  if (filtros.bloque) {
    condiciones.push('concepto.C_FORM_BLOQUE = ?');
    parametros.push(filtros.bloque);
  }

  const whereClause = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const consulta = `
    SELECT
      us.C_REGION       AS regionId,
      regiones.D_REGION AS regionNombre,
      us.C_DEPARTAMENTO       AS departamentoId,
      deptos.D_DEPARTAMENTO   AS departamentoNombre,
      us.C_MUNICIPIO          AS municipioId,
      municipios.D_MUNICIPIO  AS municipioNombre,
      us.C_US                 AS unidadId,
      us.V_US                 AS unidadCodigo,
      us.D_US                 AS unidadNombre,
      det.C_CONCEPTO          AS conceptoCodigo,
      COALESCE(concepto.D_CONCEPTO_CORTA, concepto.D_CONCEPTO, det.C_CONCEPTO) AS conceptoDescripcion,
      SUM(COALESCE(det.Q_AT_ENFERMERA_AUX, 0)) AS totalEnfermeraAux,
      SUM(COALESCE(det.Q_AT_ENFERMERA_PRO, 0)) AS totalEnfermeraPro,
      SUM(COALESCE(det.Q_AT_MEDICO_GEN, 0))    AS totalMedicoGen,
      SUM(COALESCE(det.Q_AT_MEDICO_ESP, 0))    AS totalMedicoEsp
    FROM ${tablaDetalle} det
    INNER JOIN BAS_BDR_US us
      ON us.C_US = det.C_US
    LEFT JOIN BAS_BDR_REGIONES regiones
      ON regiones.C_REGION = us.C_REGION
    LEFT JOIN BAS_BDR_DEPARTAMENTOS deptos
      ON deptos.C_DEPARTAMENTO = us.C_DEPARTAMENTO
    LEFT JOIN BAS_BDR_MUNICIPIOS municipios
      ON municipios.C_DEPARTAMENTO = us.C_DEPARTAMENTO
     AND municipios.C_MUNICIPIO = us.C_MUNICIPIO
    LEFT JOIN AT2_BDR_CONCEPTOS concepto
      ON concepto.C_CONCEPTO = det.C_CONCEPTO
     AND concepto.V_FORMULARIO = det.V_FORMULARIO
    ${whereClause}
    GROUP BY
      regionId,
      regionNombre,
      departamentoId,
      departamentoNombre,
      municipioId,
      municipioNombre,
      unidadId,
      unidadCodigo,
      unidadNombre,
      conceptoCodigo,
      conceptoDescripcion
    ORDER BY
      regionNombre,
      departamentoNombre,
      municipioNombre,
      unidadNombre,
      conceptoCodigo
    LIMIT 20;
  `;

  const [filas] = await pool.query<RowDataPacket[]>(consulta, parametros);

  return filas.map((fila) => ({
    regionId: fila.regionId === null ? null : Number(fila.regionId),
    regionNombre: fila.regionNombre ? String(fila.regionNombre) : null,
    departamentoId: fila.departamentoId === null ? null : Number(fila.departamentoId),
    departamentoNombre: fila.departamentoNombre ? String(fila.departamentoNombre) : null,
    municipioId: fila.municipioId === null ? null : Number(fila.municipioId),
    municipioNombre: fila.municipioNombre ? String(fila.municipioNombre) : null,
    unidadId: Number(fila.unidadId ?? 0),
    unidadCodigo: Number(fila.unidadCodigo ?? 0),
    unidadNombre: String(fila.unidadNombre ?? ''),
    conceptoCodigo: String(fila.conceptoCodigo ?? ''),
    conceptoDescripcion: String(fila.conceptoDescripcion ?? ''),
    totalEnfermeraAux: Number(fila.totalEnfermeraAux ?? 0),
    totalEnfermeraPro: Number(fila.totalEnfermeraPro ?? 0),
    totalMedicoGen: Number(fila.totalMedicoGen ?? 0),
    totalMedicoEsp: Number(fila.totalMedicoEsp ?? 0)
  }));
};

export const generarReporteDetalle = async (
  filtros: ReporteFiltros
): Promise<ReporteDetalleResultado[]> => {
  return generarReporteConsolidado(filtros);
};

export const generarResumenMaestro = async (
  filtros: ReporteFiltros
): Promise<ReporteResumenMaestroResultado[]> => {
  const tablaDetalle = construirNombreTablaDetalle(filtros.anio);

  const mesInicial = normalizarMes(filtros.mesInicial);
  const mesFinal = normalizarMes(filtros.mesFinal);
  const rangoMeses = mesFinal < mesInicial ? [mesInicial, mesInicial] : [mesInicial, mesFinal];

  const condiciones: string[] = ['det.N_ANIO = ?', 'CAST(det.N_MES AS UNSIGNED) BETWEEN ? AND ?'];
  const parametros: Array<string | number> = [String(filtros.anio), rangoMeses[0], rangoMeses[1]];

  if (filtros.regionId) {
    condiciones.push('us.C_REGION = ?');
    parametros.push(filtros.regionId);
  }

  if (filtros.departamentoId) {
    condiciones.push('us.C_DEPARTAMENTO = ?');
    parametros.push(filtros.departamentoId);
  }

  if (filtros.municipioId) {
    condiciones.push('us.C_MUNICIPIO = ?');
    parametros.push(filtros.municipioId);
  }

  if (filtros.servicioId) {
    condiciones.push('det.C_SERVICIO = ?');
    parametros.push(filtros.servicioId);
  }

  if (filtros.unidadId) {
    condiciones.push('us.C_US = ?');
    parametros.push(filtros.unidadId);
  }

  if (filtros.formulario) {
    condiciones.push('det.V_FORMULARIO = ?');
    parametros.push(filtros.formulario);
  }

  if (filtros.bloque) {
    condiciones.push('concepto.C_FORM_BLOQUE = ?');
    parametros.push(filtros.bloque);
  }

  const whereClause = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const consulta = `
    SELECT
      us.C_REGION       AS regionId,
      regiones.D_REGION AS regionNombre,
      us.C_DEPARTAMENTO       AS departamentoId,
      deptos.D_DEPARTAMENTO   AS departamentoNombre,
      us.C_MUNICIPIO          AS municipioId,
      municipios.D_MUNICIPIO  AS municipioNombre,
      us.C_US                 AS unidadId,
      us.V_US                 AS unidadCodigo,
      us.D_US                 AS unidadNombre,
      SUM(COALESCE(det.Q_AT_ENFERMERA_AUX, 0)) AS totalEnfermeraAux,
      SUM(COALESCE(det.Q_AT_ENFERMERA_PRO, 0)) AS totalEnfermeraPro,
      SUM(COALESCE(det.Q_AT_MEDICO_GEN, 0))    AS totalMedicoGen,
      SUM(COALESCE(det.Q_AT_MEDICO_ESP, 0))    AS totalMedicoEsp
    FROM ${tablaDetalle} det
    INNER JOIN BAS_BDR_US us
      ON us.C_US = det.C_US
    LEFT JOIN BAS_BDR_REGIONES regiones
      ON regiones.C_REGION = us.C_REGION
    LEFT JOIN BAS_BDR_DEPARTAMENTOS deptos
      ON deptos.C_DEPARTAMENTO = us.C_DEPARTAMENTO
    LEFT JOIN BAS_BDR_MUNICIPIOS municipios
      ON municipios.C_DEPARTAMENTO = us.C_DEPARTAMENTO
     AND municipios.C_MUNICIPIO = us.C_MUNICIPIO
    LEFT JOIN AT2_BDR_CONCEPTOS concepto
      ON concepto.C_CONCEPTO = det.C_CONCEPTO
     AND concepto.V_FORMULARIO = det.V_FORMULARIO
    ${whereClause}
    GROUP BY
      regionId,
      regionNombre,
      departamentoId,
      departamentoNombre,
      municipioId,
      municipioNombre,
      unidadId,
      unidadCodigo,
      unidadNombre
    ORDER BY
      regionNombre,
      departamentoNombre,
      municipioNombre,
      unidadNombre
    LIMIT 20;
  `;

  const [filas] = await pool.query<RowDataPacket[]>(consulta, parametros);

  return filas.map((fila) => {
    const totalEnfermeraAux = Number(fila.totalEnfermeraAux ?? 0);
    const totalEnfermeraPro = Number(fila.totalEnfermeraPro ?? 0);
    const totalMedicoGen = Number(fila.totalMedicoGen ?? 0);
    const totalMedicoEsp = Number(fila.totalMedicoEsp ?? 0);

    return {
      regionId: fila.regionId === null ? null : Number(fila.regionId),
      regionNombre: fila.regionNombre ? String(fila.regionNombre) : null,
      departamentoId: fila.departamentoId === null ? null : Number(fila.departamentoId),
      departamentoNombre: fila.departamentoNombre ? String(fila.departamentoNombre) : null,
      municipioId: fila.municipioId === null ? null : Number(fila.municipioId),
      municipioNombre: fila.municipioNombre ? String(fila.municipioNombre) : null,
      unidadId: Number(fila.unidadId ?? 0),
      unidadCodigo: Number(fila.unidadCodigo ?? 0),
      unidadNombre: String(fila.unidadNombre ?? ''),
      totalEnfermeraAux,
      totalEnfermeraPro,
      totalMedicoGen,
      totalMedicoEsp,
      totalProfesionales: totalEnfermeraAux + totalEnfermeraPro + totalMedicoGen + totalMedicoEsp
    };
  });
};
