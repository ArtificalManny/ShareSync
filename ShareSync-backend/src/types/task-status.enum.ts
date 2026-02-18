// src/tasks/types/task-status.enum.ts
// ═══════════════════════════════════════════════════════════════════════════════
// TASK STATUS ENUM (Optional helper)
// NOTE: Your current backend already exports TaskStatus from task.schema.
// This file is safe to add for shared consistency, but do not swap imports
// unless you intentionally want to standardize.
// ═══════════════════════════════════════════════════════════════════════════════

export enum TaskStatusEnum {
  BACKLOG = 'backlog',
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
}

export const TASK_STATUS_ORDER: TaskStatusEnum[] = [
  TaskStatusEnum.BACKLOG,
  TaskStatusEnum.TODO,
  TaskStatusEnum.IN_PROGRESS,
  TaskStatusEnum.REVIEW,
  TaskStatusEnum.DONE,
];
