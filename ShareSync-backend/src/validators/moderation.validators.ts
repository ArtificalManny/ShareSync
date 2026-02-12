// src/validators/moderation.validators.ts
// ─────────────────────────────────────────────────────────────────────────────
// Minimal, dependency-free validators for moderation endpoints.
// Works in Nest controllers/services OR any express-like handler.
// ─────────────────────────────────────────────────────────────────────────────

export type ModerationStatus = "draft" | "pending" | "approved" | "rejected";
export type SpectatorMode = "view" | "suggest";

export type ModerationListQuery = {
  status?: ModerationStatus;
};

export type ModerationPatchBody = {
  moderationStatus?: ModerationStatus;
  reason?: string;
  spectatorMode?: SpectatorMode;
};

export function parseModerationStatus(raw: any): ModerationStatus | undefined {
  if (raw == null) return undefined;
  const s = String(raw).toLowerCase().trim();
  if (s === "draft" || s === "pending" || s === "approved" || s === "rejected") return s;
  return undefined;
}

export function parseSpectatorMode(raw: any): SpectatorMode | undefined {
  if (raw == null) return undefined;
  const s = String(raw).toLowerCase().trim();
  if (s === "view" || s === "suggest") return s;
  return undefined;
}

export function validateModerationListQuery(query: any):
  | { ok: true; value: ModerationListQuery }
  | { ok: false; message: string } {
  const status = parseModerationStatus(query?.status);
  if (query?.status != null && !status) return { ok: false, message: "Invalid status" };
  return { ok: true, value: { status } };
}

export function validateModerationPatchBody(body: any):
  | { ok: true; value: ModerationPatchBody }
  | { ok: false; message: string } {
  const moderationStatus = parseModerationStatus(body?.moderationStatus);
  const spectatorMode = parseSpectatorMode(body?.spectatorMode);

  if (body?.moderationStatus != null && !moderationStatus) return { ok: false, message: "Invalid moderationStatus" };
  if (body?.spectatorMode != null && !spectatorMode) return { ok: false, message: "Invalid spectatorMode" };

  let reason: string | undefined;
  if (body?.reason != null) {
    reason = String(body.reason).trim();
    if (reason.length > 500) reason = reason.slice(0, 500);
  }

  return {
    ok: true,
    value: {
      moderationStatus,
      spectatorMode,
      reason,
    },
  };
}
