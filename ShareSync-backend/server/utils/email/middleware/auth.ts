// server/utils/email/middleware/auth.ts
// Optional auth helpers: allows anonymous users to access public endpoints.
// If a valid JWT/session is present, we attach req.user; otherwise we continue as guest.

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/** Minimal shape we care about; used internally only */
export interface AuthUser {
  _id: string;
  username?: string;
  roles?: string[];
  [k: string]: any;
}

/** Extract a bearer token from header or cookie */
function getToken(req: Request): string | null {
  const h = (req.headers?.authorization || req.headers?.Authorization) as string | undefined;
  if (h && typeof h === "string" && h.startsWith("Bearer ")) return h.slice(7).trim();
  const cookies: any = (req as any).cookies || {};
  return cookies["access_token"] || cookies["token"] || cookies["id_token"] || null;
}

/** Decode/verify JWT if present. Returns undefined on any error. */
function tryDecodeJWT(token: string | null): AuthUser | undefined {
  if (!token) return undefined;
  const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET;
  try {
    const payload = secret
      ? (jwt.verify(token, secret) as any)
      : (jwt.decode(token) as any); // fallback decode (not recommended for prod)
    if (!payload) return undefined;

    const id = payload.sub || payload._id || payload.id;
    if (!id) return undefined;

    const user: AuthUser = {
      _id: String(id),
      username: payload.username || payload.preferred_username,
      roles: Array.isArray(payload.roles) ? payload.roles : undefined,
      ...payload,
    };
    return user;
  } catch {
    return undefined;
  }
}

/**
 * Optional auth: attaches req.user if a token/session is present and valid.
 * Otherwise, continues with req.user = undefined (guest).
 *
 * NOTE: We purposely do NOT augment Express.Request here (passport types already do).
 */
export function requireAuthOptional(req: Request, _res: Response, next: NextFunction) {
  try {
    // If something upstream already set req.user, keep it.
    if (typeof (req as any).user !== "undefined") return next();

    const token = getToken(req);
    const user = tryDecodeJWT(token);
    (req as any).user = user; // use undefined for guests, not null
  } catch {
    (req as any).user = undefined;
  }
  next();
}

/** Strict auth: rejects if no valid user. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    if (typeof (req as any).user === "undefined") {
      const token = getToken(req);
      (req as any).user = tryDecodeJWT(token);
    }
    if (!(req as any).user) {
      return res.status(401).json({ error: "unauthorized" });
    }
    next();
  } catch (e: any) {
    return res.status(401).json({ error: "unauthorized", message: String(e?.message || e) });
  }
}
