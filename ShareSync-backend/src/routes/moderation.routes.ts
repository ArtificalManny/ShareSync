// src/routes/moderation.routes.ts
// ─────────────────────────────────────────────────────────────────────────────
// Moderation routes (Express)
// Mount suggestion (DO NOT DO IT HERE if you're avoiding backend edits):
//   app.use("/api/moderation", moderationRouter);
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from "express";
import { getModerationProjects, patchModerationProject } from "../controllers/moderation.controller";
import { requireAdmin } from "../middleware/requireAdmin";

// ⚠️ If you already have requireAuth, add it here before requireAdmin:
// import { requireAuth } from "../middleware/requireAuth";
// router.use(requireAuth);

const router = Router();

// GET /api/moderation/projects?status=pending
router.get("/projects", requireAdmin, getModerationProjects);

// PATCH /api/moderation/projects/:id  { moderationStatus, reason, spectatorMode }
router.patch("/projects/:id", requireAdmin, patchModerationProject);

export default router;
