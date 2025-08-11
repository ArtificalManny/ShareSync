// src/utils/privacy.ts
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
