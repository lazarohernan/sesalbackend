import type { NextFunction, Request, Response } from "express";

import {
  ejecutarConsultaPivot,
  obtenerAniosDisponibles,
  obtenerCatalogoPivot,
  obtenerValoresDimension,
  type PivotQueryPayload
} from "../servicios/pivot.servicio";
import { logger } from "../utilidades/registro.utilidad";

export const catalogoPivotControlador = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const catalogo = await obtenerCatalogoPivot();
    return res.status(200).json(catalogo);
  } catch (error) {
    logger.error("Error al obtener catálogo de pivot", error);
    return next(error);
  }
};

export const valoresDimensionPivotControlador = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { dimensionId } = req.params as { dimensionId: string };
    const busqueda = typeof req.query.busqueda === "string" ? req.query.busqueda : undefined;
    const limite = req.query.limite ? Number(req.query.limite) : undefined;

    const valores = await obtenerValoresDimension(dimensionId, busqueda, limite);
    return res.status(200).json({ valores, generadoEn: new Date().toISOString() });
  } catch (error) {
    logger.error("Error al obtener valores de dimensión pivot", error);
    return next(error);
  }
};

export const aniosDisponiblesPivotControlador = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const anios = await obtenerAniosDisponibles();
    return res.status(200).json({ 
      anios, 
      generadoEn: new Date().toISOString() 
    });
  } catch (error) {
    logger.error("Error al obtener años disponibles", error);
    return next(error);
  }
};

export const ejecutarPivotControlador = async (
  req: Request<unknown, unknown, PivotQueryPayload>,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload = req.body;
    const resultado = await ejecutarConsultaPivot(payload);
    return res.status(200).json({
      resultado,
      generadoEn: new Date().toISOString()
    });
  } catch (error) {
    logger.error("Error al ejecutar consulta pivot", error);
    return next(error);
  }
};






