// src/middleware/requireAdmin.ts
// ─────────────────────────────────────────────────────────────────────────────
// Admin guard middleware (Express)
// Assumes your auth middleware attaches a user to req.user.
// Supports common shapes:
// - req.user.role === 'admin'
// - req.user.isAdmin === true
// - req.user.roles includes 'admin'
// Adjust as needed (keep it simple + safe).
// ─────────────────────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from "express";

function hasAdminRole(user: any): boolean {
  if (!user) return false;

  // Common patterns:
  if (user.role && String(user.role).toLowerCase() === "admin") return true;
  if (user.isAdmin === true) return true;

  const roles = user.roles;
  if (Array.isArray(roles) && roles.map((r) => String(r).toLowerCase()).includes("admin")) return true;

  return false;
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!hasAdminRole(user)) {
    return res.status(403).json({ message: "Forbidden (admin only)" });
  }

  return next();
}

export default requireAdmin;
