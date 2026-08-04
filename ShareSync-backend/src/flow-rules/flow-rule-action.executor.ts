import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  InjectModel,
} from '@nestjs/mongoose';
import {
  Model,
  Types,
} from 'mongoose';

import {
  NotificationsService,
} from '../notifications/notifications.service';
import {
  NotificationPriority,
  NotificationType,
} from '../notifications/schemas/notification.schema';
import {
  Project,
  ProjectDocument,
} from '../projects/schemas/project.schema';
import {
  FlowRuleEventMeta,
  TaskEvent,
  TaskEventMeta,
} from '../tasks/events/task-events';
import {
  TaskPriority,
  TaskStatus,
} from '../tasks/schemas/task.schema';
import {
  TasksService,
} from '../tasks/tasks.service';

import {
  FlowRuleActionType,
} from './schemas/flow-rule.schema';

@Injectable()
export class FlowRuleActionExecutor {
  private readonly logger = new Logger(
    FlowRuleActionExecutor.name,
  );

  constructor(
    private readonly tasksService: TasksService,
    private readonly notificationsService:
      NotificationsService,

    @InjectModel(Project.name)
    private readonly projectModel:
      Model<ProjectDocument>,
  ) {}

  async execute(
    rule: any,
    event: TaskEvent,
    flowContext: FlowRuleEventMeta,
  ): Promise<string[]> {
    const actions = Array.isArray(rule?.actions)
      ? rule.actions
      : [];

    const executionUserId = this.normalizeId(
      rule?.updatedBy ||
        rule?.createdBy ||
        event?.actorId,
    );

    if (
      !Types.ObjectId.isValid(executionUserId)
    ) {
      throw new Error(
        'Flow Rule execution user is invalid.',
      );
    }

    const results: string[] = [];

    for (const action of actions) {
      const result = await this.executeAction(
        action,
        rule,
        event,
        executionUserId,
        flowContext,
      );

      results.push(result);
    }

    return results;
  }

  private async executeAction(
    action: any,
    rule: any,
    event: TaskEvent,
    executionUserId: string,
    flowContext: FlowRuleEventMeta,
  ): Promise<string> {
    const metadata =
      this.buildMutationMetadata(
        event,
        flowContext,
      );

    switch (action?.type) {
      case FlowRuleActionType.ASSIGN_TASK: {
        const assigneeId =
          String(action?.value || '').trim();

        await this.tasksService.update(
          event.taskId,
          executionUserId,
          {
            assigneeId,
          } as any,
          {
            meta: metadata,
          },
        );

        return `assigned:${assigneeId}`;
      }

      case FlowRuleActionType.SET_PRIORITY: {
        const priority =
          String(action?.value || '') as
            TaskPriority;

        await this.tasksService.update(
          event.taskId,
          executionUserId,
          {
            priority,
          } as any,
          {
            meta: metadata,
          },
        );

        return `priority:${priority}`;
      }

      case FlowRuleActionType.SET_STATUS: {
        const status =
          String(action?.value || '') as
            TaskStatus;

        await this.tasksService.move(
          event.taskId,
          executionUserId,
          {
            status,
          } as any,
          {
            meta: metadata,
          },
        );

        return `status:${status}`;
      }

      case FlowRuleActionType
        .SEND_PROJECT_NOTIFICATION: {
        const notificationCount =
          await this.sendProjectNotification(
            rule,
            event,
            String(action?.message || '').trim(),
            flowContext,
          );

        return `notification:${notificationCount}`;
      }

      default:
        throw new Error(
          `Unsupported Flow Rule action: ` +
            `${String(action?.type || '')}`,
        );
    }
  }

  private buildMutationMetadata(
    event: TaskEvent,
    flowContext: FlowRuleEventMeta,
  ): TaskEventMeta {
    return {
      ...(event?.meta || {}),
      flowRules: flowContext,
    };
  }

  private async sendProjectNotification(
    rule: any,
    event: TaskEvent,
    message: string,
    flowContext: FlowRuleEventMeta,
  ): Promise<number> {
    const projectId = this.normalizeId(
      event?.projectId ||
        event?.snapshot?.projectId,
    );

    if (!Types.ObjectId.isValid(projectId)) {
      throw new Error(
        'Flow Rule project ID is invalid.',
      );
    }

    const project: any =
      await this.projectModel
        .findById(projectId)
        .lean()
        .exec();

    if (!project) {
      throw new NotFoundException(
        `Project ${projectId} was not found.`,
      );
    }

    const rawMembers = Array.isArray(
      project?.members,
    )
      ? project.members
      : Array.isArray(project?.sharedWith)
        ? project.sharedWith
        : Array.isArray(
              project?.participantIds,
            )
          ? project.participantIds
          : [];

    const associatedUsers = [
      project?.ownerId,
      project?.owner,
      project?.createdBy,
      ...rawMembers,
    ];

    const eventActorId =
      this.normalizeId(event?.actorId);

    const recipients = Array.from(
      new Set(
        associatedUsers
          .map((candidate) =>
            this.normalizeId(candidate),
          )
          .filter(Boolean)
          .filter(
            (recipientId) =>
              recipientId !== eventActorId,
          ),
      ),
    );

    const projectName =
      this.cleanText(project?.name) ||
      this.cleanText(project?.title) ||
      'Project';

    const ruleId = this.normalizeId(
      rule?._id || rule?.id,
    );

    let createdCount = 0;

    for (const recipientId of recipients) {
      if (
        !Types.ObjectId.isValid(recipientId)
      ) {
        continue;
      }

      try {
        await this.notificationsService.notify({
          userId: recipientId,
          type: NotificationType.PROJECT_UPDATE,
          title:
            `⚡ Flow Rule: ` +
            `${this.cleanText(rule?.name) || 'Rule'}`,
          body: message,
          icon: '⚡',
          priority: NotificationPriority.NORMAL,
          triggeredBy:
            Types.ObjectId.isValid(eventActorId)
              ? eventActorId
              : undefined,
          data: {
            projectId,
            projectName,
            taskId: event.taskId,
            extra: {
              ruleId,
              correlationId:
                flowContext.correlationId,
            },
            emailFanoutEligible: true,
            projectMemberNotification: true,
          } as any,
          actions: [
            {
              label: 'View Move',
              url:
                `/projects/${projectId}` +
                `?tab=move`,
            },
          ],
          groupKey:
            `flow-rule-${flowContext.correlationId}` +
            `-${ruleId}-${recipientId}`,
        });

        createdCount += 1;
      } catch (error: any) {
        this.logger.error(
          `Flow Rule notification failed for ` +
            `${recipientId}: ` +
            `${error?.message || error}`,
          error?.stack,
        );
      }
    }

    return createdCount;
  }

  private normalizeId(value: any): string {
    if (!value) return '';

    if (
      typeof value === 'string' ||
      typeof value === 'number'
    ) {
      return String(value).trim();
    }

    if (value instanceof Types.ObjectId) {
      return value.toString();
    }

    if (typeof value !== 'object') {
      return '';
    }

    if (
      typeof value?.toHexString ===
      'function'
    ) {
      try {
        return String(
          value.toHexString(),
        ).trim();
      } catch {
        return '';
      }
    }

    const candidate =
      value?.userId ??
      value?.user ??
      value?.memberId ??
      value?.member ??
      value?._id ??
      value?.id;

    if (
      !candidate ||
      candidate === value
    ) {
      return '';
    }

    return this.normalizeId(candidate);
  }

  private cleanText(value: any): string {
    return typeof value === 'string'
      ? value.trim()
      : '';
  }
}
