import type { Request, Response, NextFunction } from "express";
export interface AuthUser {
    _id: string;
    username?: string;
    roles?: string[];
    [k: string]: any;
}
export declare function requireAuthOptional(req: Request, _res: Response, next: NextFunction): void;
export declare function requireAuth(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>>;
