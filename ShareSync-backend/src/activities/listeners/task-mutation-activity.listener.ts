// src/activities/listeners/task-mutation-activity.listener.ts
// ═══════════════════════════════════════════════════════════════════════════════
// TASK MUTATION → ACTIVITY PERSISTENCE LISTENER (3.4)
// Listens to the normalized bus event: "task.mutation"
// Writes one Activity row per mutation.
// ═══════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ActivitiesService } from '../activities.service';
import { TASK_EVENT_BUS, TaskEvent } from '../../tasks/events/task-events';

@Injectable()
export class TaskMutationActivityListener {
  private readonly logger = new Logger(TaskMutationActivityListener.name);

  constructor(private readonly activitiesService: ActivitiesService) {}

  @OnEvent(TASK_EVENT_BUS.TASK_MUTATION, { async: true })
  async handleTaskMutation(event: TaskEvent): Promise<void> {
    try {
      await this.activitiesService.createFromTaskEvent(event);
    } catch (err: any) {
      // Don’t block task ops if activity persistence fails.
      this.logger.error(
        `Failed to persist activity for task mutation: ${event?.type} task=${event?.taskId} project=${event?.projectId}`,
        err?.stack || String(err),
      );
    }
  }
}
