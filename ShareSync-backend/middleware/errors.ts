// /ShareSync-backend/middleware/errors.ts
import type { Request, Response, NextFunction } from "express";

export function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: any
) {
  res.status(status).json({ error: { code, message, details } });
}

// Optional: centralized async error catcher
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
