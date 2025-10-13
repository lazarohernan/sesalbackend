import type { NextFunction, Request, Response } from "express";
export declare const establecerConfiguracionBD: (req: Request, _res: Response, next: NextFunction) => void;
export declare const requerirConfiguracionBD: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const limpiarConfiguracionBD: (_req: Request, _res: Response, next: NextFunction) => Promise<void>;
export declare const logConfiguracionBD: (_req: Request, _res: Response, next: NextFunction) => void;
