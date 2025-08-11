// /Users/artificalmanny/Portfolio/ShareSync/ShareSync-backend/src/utils/logActivity.ts
import { ActivityEvent } from '../models/activityEvent.model'
import { StreakFeedItem } from '../models/streakFeedItem.model'

/**
 * Shape the rest of the backend expects when logging an activity.
 * Keep this narrow and stable so routes can rely on it.
 */
export type ActivityEventInput = {
  type: string
  public?: boolean              // ⬅️ optional now; defaults to false
  projectId?: string
  taskId?: string
  postId?: string
  userId?: string
  username?: string
  name?: string                 // fallback display name if you don’t have username
  meta?: any                    // small, serializable blob (no huge payloads)
}

/**
 * Persist an activity event. If public, also mirror a lightweight record
 * into the streak/public feed for fast retrieval.
 */
export async function logActivity(input: ActivityEventInput) {
  const isPublic = !!input.public   // default to false if omitted

  // 1) Persist to the canonical activity log
  const evt = await ActivityEvent.create({
    type: input.type,
    public: isPublic,
    projectId: input.projectId,
    taskId: input.taskId,
    postId: input.postId,
    userId: input.userId,
    username: input.username ?? input.name,
    meta: input.meta ?? {},
  } as any)

  // 2) If this is public, mirror to the streak feed
  if (isPublic) {
    await StreakFeedItem.create({
      type: input.type,
      projectId: input.projectId,
      taskId: input.taskId,
      postId: input.postId,
      userId: input.userId,
      username: input.username ?? input.name,
      meta: input.meta ?? {},
      activityId: (evt as any)._id, // handy for trace-back if needed
    } as any)
  }

  return evt
}