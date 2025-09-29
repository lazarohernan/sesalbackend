import type { NextFunction, Request, Response } from "express";

import {
  generarReporteConsolidado,
  generarReporteDetalle,
  generarResumenMaestro,
  obtenerDepartamentos,
  obtenerIndicadoresMunicipales,
  obtenerMunicipios,
  obtenerPeriodosDisponibles,
  obtenerRegiones,
  obtenerServicios,
  obtenerUnidades,
  type ReporteFiltros
} from "../servicios/reportes.servicio";
import { logger } from "../utilidades/registro.utilidad";

type CatalogoQuery = {
  departamentoId?: string;
  regionId?: string;
  municipioId?: string;
};

const construirFiltrosReporte = (body: ReporteConsolidadoBody): ReporteFiltros => {
  const { anio, mesInicial, mesFinal, servicioId, formulario, bloque } = body;

  const anioNumero = normalizarNumero(anio);
  if (!anioNumero) {
    throw new Error('El campo "anio" es obligatorio.');
  }

  return {
    anio: anioNumero,
    mesInicial: normalizarNumero(mesInicial) ?? 1,
    mesFinal: normalizarNumero(mesFinal) ?? 12,
    regionId: normalizarNumero(body.regionId),
    departamentoId: normalizarNumero(body.departamentoId),
    municipioId: normalizarNumero(body.municipioId),
    servicioId: servicioId ?? undefined,
    unidadId: normalizarNumero(body.unidadId),
    formulario: formulario ?? undefined,
    bloque: bloque ?? undefined
  };
};

export const generarReporteDetalleControlador = async (
  req: Request<unknown, unknown, ReporteConsolidadoBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const filtros = construirFiltrosReporte(req.body);
    const datos = await generarReporteDetalle(filtros);
    return res.status(200).json({ datos, generadoEn: new Date().toISOString() });
  } catch (error) {
    if (error instanceof Error && error.message.includes('anio')) {
      return res.status(400).json({ mensaje: error.message });
    }
    logger.error('Error al generar reporte detalle', error);
    return next(error);
  }
};

export const indicadoresMunicipalesControlador = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const anio = normalizarNumero(req.query.anio);
    if (!anio) {
      return res.status(400).json({ mensaje: 'El parámetro anio es obligatorio.' });
    }

    const filtros = {
      anio,
      departamentoId: normalizarNumero(req.query.departamentoId),
      municipioId: normalizarNumero(req.query.municipioId),
      limite: normalizarNumero(req.query.limite)
    };

    const datos = await obtenerIndicadoresMunicipales(filtros);
    return res.status(200).json({ datos, generadoEn: new Date().toISOString() });
  } catch (error) {
    logger.error('Error al obtener indicadores municipales', error);
    return next(error);
  }
};

export const generarResumenMaestroControlador = async (
  req: Request<unknown, unknown, ReporteConsolidadoBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const filtros = construirFiltrosReporte(req.body);
    const datos = await generarResumenMaestro(filtros);
    return res.status(200).json({ datos, generadoEn: new Date().toISOString() });
  } catch (error) {
    if (error instanceof Error && error.message.includes('anio')) {
      return res.status(400).json({ mensaje: error.message });
    }
    logger.error('Error al generar resumen maestro', error);
    return next(error);
  }
};

const toNumber = (valor: string | undefined): number | undefined => {
  if (valor === undefined || valor === "" || valor === "all") {
    return undefined;
  }
  const numero = Number.parseInt(valor, 10);
  return Number.isNaN(numero) ? undefined : numero;
};

export const listarRegionesControlador = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const datos = await obtenerRegiones();
    return res.status(200).json({ datos, generadoEn: new Date().toISOString() });
  } catch (error) {
    logger.error("Error al listar regiones", error);
    return next(error);
  }
};

export const listarDepartamentosControlador = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const datos = await obtenerDepartamentos();
    return res.status(200).json({ datos, generadoEn: new Date().toISOString() });
  } catch (error) {
    logger.error("Error al listar departamentos", error);
    return next(error);
  }
};

export const listarMunicipiosControlador = async (
  req: Request<unknown, unknown, unknown, CatalogoQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const departamentoId = toNumber(req.query.departamentoId);
    const regionId = toNumber(req.query.regionId);
    const datos = await obtenerMunicipios(departamentoId, regionId);
    return res.status(200).json({ datos, generadoEn: new Date().toISOString() });
  } catch (error) {
    logger.error("Error al listar municipios", error);
    return next(error);
  }
};

export const listarUnidadesControlador = async (
  req: Request<unknown, unknown, unknown, CatalogoQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const filtros = {
      regionId: toNumber(req.query.regionId),
      departamentoId: toNumber(req.query.departamentoId),
      municipioId: toNumber(req.query.municipioId)
    };

    const datos = await obtenerUnidades(filtros);
    return res.status(200).json({ datos, generadoEn: new Date().toISOString() });
  } catch (error) {
    logger.error("Error al listar unidades de salud", error);
    return next(error);
  }
};

export const listarServiciosControlador = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const datos = await obtenerServicios();
    return res.status(200).json({ datos, generadoEn: new Date().toISOString() });
  } catch (error) {
    logger.error("Error al listar servicios", error);
    return next(error);
  }
};

export const listarPeriodosDisponiblesControlador = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const datos = await obtenerPeriodosDisponibles();
    return res.status(200).json({ datos, generadoEn: new Date().toISOString() });
  } catch (error) {
    logger.error("Error al listar periodos disponibles", error);
    return next(error);
  }
};

type ReporteConsolidadoBody = {
  anio?: number;
  mesInicial?: number;
  mesFinal?: number;
  regionId?: number;
  departamentoId?: number;
  municipioId?: number;
  servicioId?: string;
  unidadId?: number;
  formulario?: string;
  bloque?: string;
};

const normalizarNumero = (valor: unknown): number | undefined => {
  if (valor === null || valor === undefined || valor === '') return undefined;
  const numero = Number(valor);
  return Number.isNaN(numero) ? undefined : numero;
};

export const generarReporteConsolidadoControlador = async (
  req: Request<unknown, unknown, ReporteConsolidadoBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { anio, mesInicial, mesFinal, servicioId, formulario, bloque } = req.body;

    const anioNumero = normalizarNumero(anio);

    if (!anioNumero) {
      return res.status(400).json({ mensaje: 'El campo "anio" es obligatorio.' });
    }

    const filtros: ReporteFiltros = {
      anio: anioNumero,
      mesInicial: normalizarNumero(mesInicial) ?? 1,
      mesFinal: normalizarNumero(mesFinal) ?? 12,
      regionId: normalizarNumero(req.body.regionId),
      departamentoId: normalizarNumero(req.body.departamentoId),
      municipioId: normalizarNumero(req.body.municipioId),
      servicioId: servicioId ?? undefined,
      unidadId: normalizarNumero(req.body.unidadId),
      formulario: formulario ?? undefined,
      bloque: bloque ?? undefined
    };

    const datos = await generarReporteConsolidado(filtros);

    return res.status(200).json({ datos, generadoEn: new Date().toISOString() });
  } catch (error) {
    logger.error('Error al generar reporte consolidado', error);
    return next(error);
  }
};
