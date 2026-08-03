import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OnEvent } from '@nestjs/event-emitter';
import { Model, Types } from 'mongoose';

import {
  Project,
  ProjectDocument,
} from '../../projects/schemas/project.schema';
import {
  TaskEvent,
  TaskEventType,
  TASK_EVENT_BUS,
} from '../../tasks/events/task-events';
import { NotificationsService } from '../notifications.service';
import {
  NotificationPriority,
  NotificationType,
} from '../schemas/notification.schema';

@Injectable()
export class TaskCreatedNotificationListener {
  private readonly logger = new Logger(
    TaskCreatedNotificationListener.name,
  );

  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  @OnEvent(TASK_EVENT_BUS.TASK_MUTATION)
  async handleTaskMutation(
    payload: TaskEvent,
  ): Promise<void> {
    if (payload?.type !== TaskEventType.TASK_CREATED) {
      return;
    }

    const taskSnapshot = payload.snapshot;

    const projectId = this.normalizeId(
      payload.projectId || taskSnapshot?.projectId,
    );

    const taskId = this.normalizeId(
      payload.taskId || taskSnapshot?._id,
    );

    const actorId = this.normalizeId(
      payload.actorId,
    );

    if (
      !Types.ObjectId.isValid(projectId) ||
      !Types.ObjectId.isValid(taskId)
    ) {
      this.logger.warn(
        `Skipping task-created fan-out because the event identifiers ` +
          `are invalid. projectId=${projectId || '(missing)'} ` +
          `taskId=${taskId || '(missing)'}`,
      );
      return;
    }

    const project: any = await this.projectModel
      .findById(projectId)
      .lean()
      .exec();

    if (!project) {
      this.logger.warn(
        `Skipping task-created fan-out because project ${projectId} ` +
          `was not found.`,
      );
      return;
    }

    const rawMembers = Array.isArray(project?.members)
      ? project.members
      : Array.isArray(project?.sharedWith)
        ? project.sharedWith
        : Array.isArray(project?.participantIds)
          ? project.participantIds
          : [];

    const associatedUsers = [
      project?.ownerId,
      project?.owner,
      ...rawMembers,
    ];

    const recipients = Array.from(
      new Set(
        associatedUsers
          .map((candidate) => this.normalizeId(candidate))
          .filter(Boolean)
          .filter((recipientId) => recipientId !== actorId),
      ),
    );

    const projectName =
      this.cleanText(project?.name) ||
      this.cleanText(project?.title) ||
      'Project';

    const taskTitle =
      this.cleanText(taskSnapshot?.title) ||
      'New Task';

    let createdCount = 0;

    for (const recipientId of recipients) {
      try {
        await this.notificationsService.notify({
          userId: recipientId,
          type: NotificationType.TASK_CREATED,
          title: `📝 New Task in ${projectName}`,
          body: taskTitle,
          icon: '📝',
          priority: NotificationPriority.HIGH,
          triggeredBy: actorId || undefined,
          data: {
            projectId,
            projectName,
            taskId,
            extra: { taskId },
            emailFanoutEligible: true,
            projectMemberNotification: true,
          },
          actions: [
            {
              label: 'View Move',
              url: `/projects/${projectId}?tab=move`,
            },
          ],
          groupKey:
            `project-task-${recipientId}-${projectId}-${taskId}`,
        });

        createdCount += 1;
      } catch (error: any) {
        this.logger.error(
          `Failed to notify project member ${recipientId} ` +
            `for newly created task ${taskId}: ` +
            `${error?.message || error}`,
          error?.stack,
        );
      }
    }

    this.logger.log(
      `Task ${taskId} created notification fan-out completed: ` +
        `${createdCount}/${recipients.length} recipient(s).`,
    );
  }

  private normalizeId(value: any): string {
    if (!value) return '';

    if (
      typeof value === 'string' ||
      typeof value === 'number'
    ) {
      return String(value).trim();
    }

    if (typeof value !== 'object') return '';

    return this.normalizeId(
      value?.userId ||
        value?.user ||
        value?.member ||
        value?._id ||
        value?.id,
    );
  }

  private cleanText(value: any): string {
    return typeof value === 'string'
      ? value.trim()
      : '';
  }
}
