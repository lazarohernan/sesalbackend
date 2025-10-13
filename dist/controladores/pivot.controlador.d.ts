import type { NextFunction, Request, Response } from "express";
import { type PivotQueryPayload } from "../servicios/pivot.servicio";
export declare const catalogoPivotControlador: (_req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const valoresDimensionPivotControlador: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const aniosDisponiblesPivotControlador: (_req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const ejecutarPivotControlador: (req: Request<unknown, unknown, PivotQueryPayload>, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
