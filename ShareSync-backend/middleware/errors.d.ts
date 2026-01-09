import type { Request, Response, NextFunction } from "express";
export declare function sendError(res: Response, status: number, code: string, message: string, details?: any): void;
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => Promise<any>;
