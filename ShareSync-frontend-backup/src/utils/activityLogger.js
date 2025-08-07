// src/utils/activityLogger.js
import { logActivity } from '../api/activity';

export const logUserActivity = async (userId, type, action, projectId, metadata = {}) => {
  if (!userId || !type || !action) return;

  try {
    await logActivity({
      user: userId,
      type,
      action,
      project: projectId,
      metadata,
    });
  } catch (err) {
    console.error(`[ActivityLog] Failed: ${type} / ${action}`, err);
  }
};