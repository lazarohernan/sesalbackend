import { Request, Response } from "express";
export declare const testDatabaseConnection: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getDatabaseInfo: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const saveDatabaseConfig: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSavedDatabaseConfig: (_req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteDatabaseConfig: (_req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
