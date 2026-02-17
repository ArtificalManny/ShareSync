// src/tasks/events/task-event.utils.ts
// ═══════════════════════════════════════════════════════════════════════════════
// TASK EVENT UTILS
// - buildTaskSnapshot: produces a lean, stable snapshot
// - emitTaskEvent: emits via a single "task.mutation" channel
// ═══════════════════════════════════════════════════════════════════════════════

import { Types } from 'mongoose';
import { TaskDocument } from '../schemas/task.schema';
import { TaskEvent, TaskEventMeta, TaskEventType, TASK_EVENT_BUS } from './task-events';

const toId = (v: any): string | null => {
  if (!v) return null;
  if (typeof v === 'string') return v;
  if (v instanceof Types.ObjectId) return v.toString();
  if (typeof v?.toString === 'function') return v.toString();
  return null;
};

export function buildTaskSnapshot(task: TaskDocument): TaskEvent['snapshot'] {
  return {
    _id: toId(task._id) || '',
    projectId: toId((task as any).projectId) || '',
    title: (task as any).title,
    status: (task as any).status,
    priority: (task as any).priority,
    assigneeId: toId((task as any).assigneeId),
    reporterId: toId((task as any).reporterId),
    createdBy: toId((task as any).createdBy),
    dueDate: (task as any).dueDate,
    order: (task as any).order,
    sprintId: toId((task as any).sprintId),
    milestoneId: toId((task as any).milestoneId),
    isBlocking: (task as any).isBlocking,
    blockingCount: (task as any).blockingCount,
    xpValue: (task as any).xpValue,
    bonusXP: (task as any).bonusXP,
    isLegendary: (task as any).isLegendary,
    ceremonyTier: (task as any).ceremonyTier,
    completedAt: (task as any).completedAt,
    completedBy: toId((task as any).completedBy),
  };
}

export function emitTaskEvent(args: {
  eventEmitter: { emit: (eventName: string, payload: any) => boolean };
  type: TaskEventType;
  projectId: string;
  actorId: string;
  taskId: string;
  snapshot: TaskEvent['snapshot'];
  changes?: TaskEvent['changes'];
  meta?: TaskEventMeta;
}): void {
  const payload: TaskEvent = {
    type: args.type,
    projectId: args.projectId,
    actorId: args.actorId,
    taskId: args.taskId,
    snapshot: args.snapshot,
    changes: args.changes,
    meta: args.meta,
    createdAt: new Date().toISOString(),
  };

  args.eventEmitter.emit(TASK_EVENT_BUS.TASK_MUTATION, payload);
}
