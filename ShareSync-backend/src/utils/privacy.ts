import mongoose from 'mongoose';

type Args = { userId?: string | null; projectId?: string | null };

/**
 * Returns true only if:
 *  - user.publicProfile !== false (or no user found), AND
 *  - project.publicFeedEnabled !== false AND project.isPrivate !== true (or no project found)
 *
 * We purposely DO NOT import specific models to avoid TS path issues; we use
 * mongoose.models[...] if those models are registered.
 */
export async function shouldBePublic({ userId, projectId }: Args): Promise<boolean> {
  try {
    // User gate
    if (userId) {
      const User: any = (mongoose.models as any).User;
      if (User) {
        const u = await User.findById(userId).lean();
        if (u && (u.publicProfile === false || u.public === false || u.profilePublic === false)) {
          return false;
        }
      }
    }

    // Project gate
    if (projectId) {
      const Project: any = (mongoose.models as any).Project;
      if (Project) {
        const p = await Project.findById(projectId).lean();
        if (p && (p.publicFeedEnabled === false || p.isPrivate === true || p.private === true)) {
          return false;
        }
      }
    }
  } catch {
    // If anything looks off, be conservative.
    return false;
  }
  return true;
}

/* ============================================================
 *  🔓 Sanitizers for the public transparency endpoints
 *  (Keep these conservative; server-side enforcement still required)
 * ============================================================ */

type AnyObj = Record<string, any>;

export function sanitizePublicKpis(kpis: AnyObj | undefined | null) {
  if (!kpis || typeof kpis !== 'object') return {};
  const safe: AnyObj = {};
  // keep only KPIs that are explicitly public-safe
  if (typeof kpis.onTime30d === 'number') safe.onTime30d = clamp01(kpis.onTime30d);
  if (Number.isFinite(Number(kpis.throughputPerWeek))) safe.throughputPerWeek = Number(kpis.throughputPerWeek);
  if (Number.isFinite(Number(kpis.activeDays28d))) safe.activeDays28d = Number(kpis.activeDays28d);
  if (Number.isFinite(Number(kpis.cadence14d))) safe.cadence14d = Number(kpis.cadence14d);
  return safe;
}

export function sanitizePublicActivity(items: any[] | undefined | null) {
  const arr = Array.isArray(items) ? items : [];
  return arr
    .filter((it) => {
      // explicit visibility flag wins
      if (it?.visibility && it.visibility !== 'public') return false;
      const t = String(it?.type || '').toLowerCase();
      if (!t) return false;
      if (t.startsWith('update')) return true;
      if (t.startsWith('task.completed') || t.startsWith('task.complete')) return true;
      if (t.includes('system') || t.includes('audit')) return true;
      // Avoid file payloads / private comments etc.
      if (t.startsWith('file.')) return false;
      if (t.startsWith('comment.')) return false;
      return false;
    })
    .map((it) => ({
      type: it?.type || 'update',
      text: it?.text || it?.title || '',
      createdAt: it?.createdAt || it?.ts || new Date().toISOString(),
    }));
}

/* ---------- helpers ---------- */
function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
