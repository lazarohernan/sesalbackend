import type { Request, Response, NextFunction } from "express";

import {
  obtenerDatosMapaHonduras,
  obtenerResumenTablero
} from "../servicios/tablero.servicio";
import { logger } from "../utilidades/registro.utilidad";

export const obtenerResumenControlador = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const resumen = await obtenerResumenTablero();

    return res.status(200).json({
      datos: resumen,
      generadoEn: new Date().toISOString()
    });
  } catch (error) {
    logger.error("Error al obtener resumen del tablero", error);
    return next(error);
  }
};

export const obtenerMapaHondurasControlador = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const datos = await obtenerDatosMapaHonduras();

    return res.status(200).json({
      datos,
      generadoEn: new Date().toISOString()
    });
  } catch (error) {
    logger.error("Error al obtener datos del mapa Honduras", error);
    return next(error);
  }
};
