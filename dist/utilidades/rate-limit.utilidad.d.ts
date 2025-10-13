import type { NextFunction, Request, Response } from "express";
type Options = {
    windowMs: number;
    max: number;
    keyGenerator?: (req: Request) => string;
};
export declare const simpleRateLimit: (opts: Options) => (req: Request, res: Response, next: NextFunction) => void;
export {};
