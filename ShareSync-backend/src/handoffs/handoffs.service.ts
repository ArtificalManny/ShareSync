import {
  BadRequestException,
  ForbiddenException,
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
  ProjectsService,
} from '../projects/projects.service';

import {
  TasksService,
} from '../tasks/tasks.service';

import {
  CreateHandoffDto,
} from './dto/create-handoff.dto';

import {
  UpdateHandoffDto,
} from './dto/update-handoff.dto';

import {
  Handoff,
  HandoffDocument,
  HandoffSourceType,
  HandoffStatus,
} from './schemas/handoff.schema';

@Injectable()
export class HandoffsService {
  private readonly logger =
    new Logger(
      HandoffsService.name,
    );

  constructor(
    @InjectModel(Handoff.name)
    private readonly handoffModel:
      Model<HandoffDocument>,

    private readonly projectsService:
      ProjectsService,

    private readonly tasksService:
      TasksService,

    private readonly notifications:
      NotificationsService,
  ) {}

  private cleanText(
    value: any,
  ): string {
    return String(
      value ?? '',
    ).trim();
  }

  private normalizeProjectUserId(
    value: any,
  ): string {
    if (!value) return '';

    if (
      typeof value === 'string' ||
      typeof value === 'number'
    ) {
      return String(value).trim();
    }

    if (
      value instanceof
      Types.ObjectId
    ) {
      return value.toString();
    }

    if (
      typeof value?.toHexString ===
      'function'
    ) {
      try {
        return String(
          value.toHexString(),
        ).trim();
      } catch {}
    }

    return this.normalizeProjectUserId(
      value?.userId ||
        value?.user ||
        value?.memberId ||
        value?.member ||
        value?._id ||
        value?.id,
    );
  }

  private async assertProjectAccess(
    projectId: string,
    userId: string,
  ) {
    if (
      !Types.ObjectId.isValid(
        projectId,
      )
    ) {
      throw new BadRequestException(
        'Project ID is invalid',
      );
    }

    if (
      !userId ||
      !Types.ObjectId.isValid(
        userId,
      )
    ) {
      throw new ForbiddenException(
        'Authenticated user is invalid',
      );
    }

    return this.projectsService
      .findByIdWithAccess(
        projectId,
        userId,
      );
  }

  private getProjectParticipantIds(
    project: any,
  ): Set<string> {
    const ids =
      new Set<string>();

    const add = (
      value: any,
    ) => {
      const id =
        this.normalizeProjectUserId(
          value,
        );

      if (
        id &&
        Types.ObjectId.isValid(id)
      ) {
        ids.add(id);
      }
    };

    add(project?.ownerId);
    add(project?.owner);
    add(project?.createdBy);
    add(project?.createdById);

    const collections = [
      project?.members,
      project?.teamMembers,
      project?.participants,
      project?.collaborators,
    ];

    for (
      const collection
      of collections
    ) {
      if (
        !Array.isArray(
          collection,
        )
      ) {
        continue;
      }

      collection.forEach(
        (member: any) => {
          add(member);
        },
      );
    }

    return ids;
  }

  private assertProjectParticipant(
    project: any,
    candidate: any,
    label: string,
  ): string {
    const id =
      this.normalizeProjectUserId(
        candidate,
      );

    if (
      !id ||
      !Types.ObjectId.isValid(id)
    ) {
      throw new BadRequestException(
        `${label} must be a member of this project`,
      );
    }

    const participantIds =
      this.getProjectParticipantIds(
        project,
      );

    if (
      !participantIds.has(id)
    ) {
      throw new BadRequestException(
        `${label} must be a member of this project`,
      );
    }

    return id;
  }

  private getTaskAssigneeId(
    task: any,
  ): string {
    return this.normalizeProjectUserId(
      task?.assigneeId ||
        task?.assignee ||
        task?.assignedToId ||
        task?.assignedTo,
    );
  }

  private async getMove(
    projectId: string,
    sourceMoveId: string,
    userId: string,
  ) {
    if (
      !Types.ObjectId.isValid(
        sourceMoveId,
      )
    ) {
      throw new BadRequestException(
        'Move ID is invalid',
      );
    }

    const task =
      await this.tasksService
        .findByIdWithAccess(
          sourceMoveId,
          userId,
        );

    if (
      task.projectId.toString() !==
      projectId
    ) {
      throw new BadRequestException(
        'Move does not belong to this project',
      );
    }

    return task;
  }

  private handoffUrl(
    projectId: string,
    sourceMoveId?: any,
  ) {
    return sourceMoveId
      ? `/projects/${projectId}?tab=move`
      : `/projects/${projectId}`;
  }

  private async notifySafely(
    payload: any,
  ) {
    try {
      await (
        this.notifications as any
      ).notify(payload);
    } catch (
      error: any
    ) {
      this.logger.warn(
        `Handoff notification failed: ${
          error?.message || error
        }`,
      );
    }
  }

  async findByProject(
    projectId: string,
    userId: string,
  ) {
    await this.assertProjectAccess(
      projectId,
      userId,
    );

    return this.handoffModel
      .find({
        projectId:
          new Types.ObjectId(
            projectId,
          ),
      })
      .sort({
        createdAt: -1,
      })
      .lean()
      .exec();
  }

  async create(
    projectId: string,
    userId: string,
    dto: CreateHandoffDto,
  ) {
    const project =
      await this.assertProjectAccess(
        projectId,
        userId,
      );

    const title =
      this.cleanText(
        dto?.title,
      );

    const context =
      this.cleanText(
        dto?.context,
      );

    const acceptanceCriteria =
      dto?.acceptanceCriteria !==
      undefined
        ? this.cleanText(
            dto.acceptanceCriteria,
          ) || null
        : null;

    if (!title) {
      throw new BadRequestException(
        'Handoff title is required',
      );
    }

    if (!context) {
      throw new BadRequestException(
        'Handoff context is required',
      );
    }

    const recipientId =
      this.assertProjectParticipant(
        project,
        dto?.recipientId,
        'Handoff recipient',
      );

    if (
      recipientId === userId
    ) {
      throw new BadRequestException(
        'A Handoff must be sent to another project member',
      );
    }

    const sourceMoveId =
      dto?.sourceMoveId
        ? this.cleanText(
            dto.sourceMoveId,
          )
        : null;

    if (sourceMoveId) {
      const task =
        await this.getMove(
          projectId,
          sourceMoveId,
          userId,
        );

      const currentAssigneeId =
        this.getTaskAssigneeId(
          task,
        );

      if (
        currentAssigneeId !==
        userId
      ) {
        throw new ForbiddenException(
          'Only the current Move assignee can hand off this Move',
        );
      }
    }

    const item =
      new this.handoffModel({
        projectId:
          new Types.ObjectId(
            projectId,
          ),

        title,
        context,
        acceptanceCriteria,

        requestedBy:
          new Types.ObjectId(
            userId,
          ),

        recipientId:
          new Types.ObjectId(
            recipientId,
          ),

        status:
          HandoffStatus.PENDING,

        responseNote: null,
        respondedBy: null,
        acceptedAt: null,
        declinedAt: null,
        cancelledAt: null,

        sourceType:
          sourceMoveId
            ? HandoffSourceType.MOVE
            : HandoffSourceType.PROJECT,

        sourceMoveId:
          sourceMoveId
            ? new Types.ObjectId(
                sourceMoveId,
              )
            : null,
      });

    const saved =
      await item.save();

    await this.notifySafely({
      userId: recipientId,

      type:
        NotificationType
          .HANDOFF_REQUESTED,

      title:
        'Handoff requested',

      body: title,

      icon: 'arrow-right',

      priority:
        NotificationPriority.HIGH,

      triggeredBy: userId,

      data: {
        emailFanoutEligible: true,
        projectMemberNotification:
          true,
        projectId,
        taskId:
          sourceMoveId || undefined,
        handoffId:
          saved._id.toString(),
      },

      actions: [
        {
          label:
            sourceMoveId
              ? 'View Move'
              : 'View Project',

          url: this.handoffUrl(
            projectId,
            sourceMoveId,
          ),
        },
      ],

      groupKey:
        `handoff-requested-${recipientId}-${saved._id.toString()}`,
    });

    return saved;
  }

  async update(
    projectId: string,
    handoffId: string,
    userId: string,
    dto: UpdateHandoffDto,
  ) {
    await this.assertProjectAccess(
      projectId,
      userId,
    );

    if (
      !Types.ObjectId.isValid(
        handoffId,
      )
    ) {
      throw new BadRequestException(
        'Handoff ID is invalid',
      );
    }

    const item =
      await this.handoffModel
        .findOne({
          _id:
            new Types.ObjectId(
              handoffId,
            ),

          projectId:
            new Types.ObjectId(
              projectId,
            ),
        })
        .exec();

    if (!item) {
      throw new NotFoundException(
        'Handoff not found',
      );
    }

    if (
      item.status !==
      HandoffStatus.PENDING
    ) {
      throw new BadRequestException(
        'Only pending Handoffs can be changed',
      );
    }

    if (!dto?.status) {
      throw new BadRequestException(
        'Handoff status is required',
      );
    }

    if (
      dto.status ===
      HandoffStatus.PENDING
    ) {
      throw new BadRequestException(
        'Handoff is already pending',
      );
    }

    const requestedBy =
      item.requestedBy.toString();

    const recipientId =
      item.recipientId.toString();

    const responseNote =
      dto.responseNote !== undefined
        ? this.cleanText(
            dto.responseNote,
          ) || null
        : null;

    const sourceMoveId =
      item.sourceMoveId
        ? item.sourceMoveId.toString()
        : null;

    const now =
      new Date();

    if (
      dto.status ===
        HandoffStatus.ACCEPTED ||
      dto.status ===
        HandoffStatus.DECLINED
    ) {
      if (
        userId !== recipientId
      ) {
        throw new ForbiddenException(
          'Only the selected recipient can accept or decline this Handoff',
        );
      }

      if (
        dto.status ===
          HandoffStatus.ACCEPTED &&
        sourceMoveId
      ) {
        const task =
          await this.getMove(
            projectId,
            sourceMoveId,
            userId,
          );

        const currentAssigneeId =
          this.getTaskAssigneeId(
            task,
          );

        if (
          currentAssigneeId !==
          requestedBy
        ) {
          throw new BadRequestException(
            'This Move changed ownership while the Handoff was pending',
          );
        }

        await this.tasksService
          .update(
            sourceMoveId,
            userId,
            {
              assigneeId:
                recipientId,
            },
          );
      }

      item.status =
        dto.status;

      item.responseNote =
        responseNote;

      item.respondedBy =
        new Types.ObjectId(
          userId,
        );

      item.cancelledAt =
        null;

      if (
        dto.status ===
        HandoffStatus.ACCEPTED
      ) {
        item.acceptedAt =
          now;

        item.declinedAt =
          null;
      } else {
        item.acceptedAt =
          null;

        item.declinedAt =
          now;
      }
    } else if (
      dto.status ===
      HandoffStatus.CANCELLED
    ) {
      if (
        userId !== requestedBy
      ) {
        throw new ForbiddenException(
          'Only the requester can cancel this Handoff',
        );
      }

      item.status =
        HandoffStatus.CANCELLED;

      item.responseNote =
        responseNote;

      item.respondedBy =
        null;

      item.acceptedAt =
        null;

      item.declinedAt =
        null;

      item.cancelledAt =
        now;
    } else {
      throw new BadRequestException(
        'Handoff status is invalid',
      );
    }

    const saved =
      await item.save();

    if (
      dto.status ===
        HandoffStatus.ACCEPTED &&
      requestedBy !== userId
    ) {
      await this.notifySafely({
        userId: requestedBy,

        type:
          NotificationType
            .HANDOFF_ACCEPTED,

        title:
          'Handoff accepted',

        body: item.title,

        icon: 'check',

        priority:
          NotificationPriority.NORMAL,

        triggeredBy: userId,

        data: {
        emailFanoutEligible: true,
        projectMemberNotification:
          true,
          projectId,
          taskId:
            sourceMoveId || undefined,
          handoffId:
            item._id.toString(),
        },

        actions: [
          {
            label:
              sourceMoveId
                ? 'View Move'
                : 'View Project',

            url: this.handoffUrl(
              projectId,
              sourceMoveId,
            ),
          },
        ],

        groupKey:
          `handoff-accepted-${requestedBy}-${item._id.toString()}`,
      });
    }

    if (
      dto.status ===
        HandoffStatus.DECLINED &&
      requestedBy !== userId
    ) {
      await this.notifySafely({
        userId: requestedBy,

        type:
          NotificationType
            .HANDOFF_DECLINED,

        title:
          'Handoff declined',

        body: item.title,

        icon: 'x',

        priority:
          NotificationPriority.NORMAL,

        triggeredBy: userId,

        data: {
        emailFanoutEligible: true,
        projectMemberNotification:
          true,
          projectId,
          taskId:
            sourceMoveId || undefined,
          handoffId:
            item._id.toString(),
        },

        actions: [
          {
            label:
              sourceMoveId
                ? 'View Move'
                : 'View Project',

            url: this.handoffUrl(
              projectId,
              sourceMoveId,
            ),
          },
        ],

        groupKey:
          `handoff-declined-${requestedBy}-${item._id.toString()}`,
      });
    }

    if (
      dto.status ===
        HandoffStatus.CANCELLED &&
      recipientId !== userId
    ) {
      await this.notifySafely({
        userId: recipientId,

        type:
          NotificationType
            .HANDOFF_CANCELLED,

        title:
          'Handoff cancelled',

        body: item.title,

        icon: 'x',

        priority:
          NotificationPriority.NORMAL,

        triggeredBy: userId,

        data: {
        emailFanoutEligible: true,
        projectMemberNotification:
          true,
          projectId,
          taskId:
            sourceMoveId || undefined,
          handoffId:
            item._id.toString(),
        },

        actions: [
          {
            label:
              sourceMoveId
                ? 'View Move'
                : 'View Project',

            url: this.handoffUrl(
              projectId,
              sourceMoveId,
            ),
          },
        ],

        groupKey:
          `handoff-cancelled-${recipientId}-${item._id.toString()}`,
      });
    }

    return saved;
  }
}
