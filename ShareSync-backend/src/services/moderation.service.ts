// src/services/moderation.service.ts
// ─────────────────────────────────────────────────────────────────────────────
// Moderation Service (Project listing moderation)
// Endpoints supported by controller/router:
// - listModerationProjects(status)
// - updateModerationProject(id, patch)
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from "mongoose";

// ⚠️ IMPORTANT: Adjust this import to match your actual Project model path/export.
// Common patterns in your repo might be:
//   import Project from "../models/Project.model";
//   import { Project } from "../models/Project.model";
//   import ProjectModel from "../models/project.model";
import Project from "../models/Project.model";

export type ModerationStatus = "draft" | "pending" | "approved" | "rejected";
export type SpectatorMode = "view" | "suggest";

export type ModerationProjectListItem = {
  _id: string;
  name?: string;
  title?: string;
  description?: string;
  visibility?: string;
  isListed?: boolean;
  spectatorMode?: SpectatorMode;
  moderationStatus?: ModerationStatus;
  moderationReason?: string;
  createdAt?: string;
  updatedAt?: string;
  owner?: any;
};

export type ModerationUpdatePatch = {
  moderationStatus?: ModerationStatus;
  reason?: string; // rejection reason or moderation note
  spectatorMode?: SpectatorMode;
};

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

function sanitizeStatus(raw?: string): ModerationStatus | undefined {
  if (!raw) return undefined;
  const s = String(raw).toLowerCase().trim();
  if (s === "draft" || s === "pending" || s === "approved" || s === "rejected") return s;
  return undefined;
}

function sanitizeSpectatorMode(raw?: string): SpectatorMode | undefined {
  if (!raw) return undefined;
  const s = String(raw).toLowerCase().trim();
  if (s === "view" || s === "suggest") return s;
  return undefined;
}

export async function listModerationProjects(status?: string): Promise<ModerationProjectListItem[]> {
  const safeStatus = sanitizeStatus(status);

  const query: any = {};
  if (safeStatus) query.moderationStatus = safeStatus;

  // Keep it minimal + safe: return only what the admin UI needs
  const docs = await (Project as any)
    .find(query)
    .sort({ createdAt: -1 })
    .select([
      "_id",
      "name",
      "title",
      "description",
      "visibility",
      "isListed",
      "spectatorMode",
      "moderationStatus",
      "moderationReason",
      "owner",
      "createdAt",
      "updatedAt",
    ])
    .lean();

  return (docs || []).map((d: any) => ({
    ...d,
    _id: String(d._id),
  }));
}

export async function updateModerationProject(projectId: string, patch: ModerationUpdatePatch) {
  if (!isValidObjectId(projectId)) {
    const err: any = new Error("Invalid project id");
    err.status = 400;
    throw err;
  }

  const nextStatus = patch.moderationStatus ? sanitizeStatus(patch.moderationStatus) : undefined;
  const nextSpectatorMode = patch.spectatorMode ? sanitizeSpectatorMode(patch.spectatorMode) : undefined;

  if (patch.moderationStatus && !nextStatus) {
    const err: any = new Error("Invalid moderationStatus");
    err.status = 400;
    throw err;
  }

  if (patch.spectatorMode && !nextSpectatorMode) {
    const err: any = new Error("Invalid spectatorMode");
    err.status = 400;
    throw err;
  }

  // Build safe update object (only allow intended fields)
  const update: any = {};
  if (nextStatus) update.moderationStatus = nextStatus;
  if (typeof patch.reason === "string") update.moderationReason = patch.reason.trim().slice(0, 500);
  if (nextSpectatorMode) update.spectatorMode = nextSpectatorMode;

  // Optional: if approved, clear reason; if rejected and no reason, keep existing
  if (nextStatus === "approved") {
    update.moderationReason = "";
  }

  const updated = await (Project as any)
    .findByIdAndUpdate(projectId, update, { new: true })
    .select([
      "_id",
      "name",
      "title",
      "description",
      "visibility",
      "isListed",
      "spectatorMode",
      "moderationStatus",
      "moderationReason",
      "owner",
      "createdAt",
      "updatedAt",
    ])
    .lean();

  if (!updated) {
    const err: any = new Error("Project not found");
    err.status = 404;
    throw err;
  }

  return { ...updated, _id: String(updated._id) };
}
