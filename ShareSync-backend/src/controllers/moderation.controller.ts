// src/controllers/moderation.controller.ts
// ─────────────────────────────────────────────────────────────────────────────
// Moderation Controller (Express)
// - GET /api/moderation/projects?status=pending
// - PATCH /api/moderation/projects/:id
// ─────────────────────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from "express";
import { listModerationProjects, updateModerationProject } from "../services/moderation.service";

export async function getModerationProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const status = (req.query.status as string) || undefined;
    const items = await listModerationProjects(status);
    return res.json({ success: true, data: items });
  } catch (err) {
    return next(err);
  }
}

export async function patchModerationProject(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = String(req.params.id || "").trim();

    const { moderationStatus, reason, spectatorMode } = (req.body || {}) as any;

    const updated = await updateModerationProject(projectId, {
      moderationStatus,
      reason,
      spectatorMode,
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    return next(err);
  }
}
