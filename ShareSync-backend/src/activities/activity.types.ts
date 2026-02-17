// src/activities/activity.types.ts
// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY TYPES (Canonical)
// 3.4 Activity Layer (DB persistence)
// - Canonical shape for auditable timeline rows
// - Designed to map from TaskEvent (task.mutation bus)
// ═══════════════════════════════════════════════════════════════════════════════

export type ActivityEntityType = 'task';

export type ActivityType =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_MOVED'
  | 'TASK_COMPLETED'
  | 'TASK_DELETED';

export type CreateActivityFromTaskEventArgs = {
  projectId: string;
  type: ActivityType;
  actorId: string;
  entityType: ActivityEntityType;
  entityId: string;

  message?: string;
  payload?: Record<string, any>;
  createdAt?: string; // ISO
};

// Legacy feed mapping (optional): your existing schema uses `action` strings
export function toLegacyAction(type: ActivityType): string {
  switch (type) {
    case 'TASK_CREATED':
      return 'task_created';
    case 'TASK_UPDATED':
      return 'task_updated';
    case 'TASK_MOVED':
      return 'task_moved';
    case 'TASK_COMPLETED':
      return 'task_completed';
    case 'TASK_DELETED':
      return 'task_deleted';
    default:
      return 'unknown';
  }
}
