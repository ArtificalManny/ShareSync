// src/tasks/events/task-events.ts
// ═══════════════════════════════════════════════════════════════════════════════
// TASK EVENTS (Canonical / Normalized)
// Goal: Every task mutation emits a predictable payload shape
// ═══════════════════════════════════════════════════════════════════════════════

export enum TaskEventType {
  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_MOVED = 'TASK_MOVED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_DELETED = 'TASK_DELETED',
}

export type TaskEventMeta = {
  xpAwarded?: number;
  bonusXP?: number;
  ceremonyTier?: string;
  isLegendary?: boolean;
  unblockedTaskIds?: string[];
  inFocusMode?: boolean;
  [key: string]: any;
};

export type TaskEventChanges = Record<string, any>;

export type TaskEventSnapshot = {
  _id: string;
  projectId: string;
  title?: string;
  status?: string;
  priority?: string;
  assigneeId?: string | null;
  reporterId?: string | null;
  createdBy?: string | null;
  dueDate?: any;
  order?: number;
  sprintId?: string | null;
  milestoneId?: string | null;
  isBlocking?: boolean;
  blockingCount?: number;
  xpValue?: number;
  bonusXP?: number;
  isLegendary?: boolean;
  ceremonyTier?: string;
  completedAt?: any;
  completedBy?: string | null;
};

export type TaskEvent = {
  type: TaskEventType;

  projectId: string;
  actorId: string;
  taskId: string;

  // Lean snapshot for UI + notifications
  snapshot: TaskEventSnapshot;

  // For update/move: minimal diff
  changes?: TaskEventChanges;

  // Extra optional metadata
  meta?: TaskEventMeta;

  createdAt: string;
};

export const TASK_EVENT_BUS = {
  TASK_MUTATION: 'task.mutation',
};
