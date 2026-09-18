import {
  BadRequestException,
  Injectable,
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
  Task,
  TaskDocument,
} from '../tasks/schemas/task.schema';

import {
  CreateDecisionDto,
} from './dto/create-decision.dto';

import {
  UpdateDecisionDto,
} from './dto/update-decision.dto';

import {
  Decision,
  DecisionDocument,
  DecisionSourceType,
  DecisionStatus,
} from './schemas/decision.schema';

@Injectable()
export class DecisionsService {
  constructor(
    @InjectModel(Decision.name)
    private readonly decisionModel:
      Model<DecisionDocument>,

    @InjectModel(Task.name)
    private readonly taskModel:
      Model<TaskDocument>,

    private readonly projectsService:
      ProjectsService,

    private readonly notifications:
      NotificationsService,
  ) {}

  // openshare-decision-email-v1
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

    return this.normalizeProjectUserId(
      value?.userId ||
        value?.user ||
        value?.memberId ||
        value?.member ||
        value?._id ||
        value?.id,
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

  private async notifyDecisionRecipients(
    args: {
      recipientIds:
        Array<
          string |
          null |
          undefined
        >;
      actorId: string;
      projectId: string;
      decisionId: string;
      eventType: string;
      title: string;
      body: string;
    },
  ): Promise<void> {
    const recipients =
      Array.from(
        new Set(
          (
            args.recipientIds ||
            []
          )
            .map(
              (value) =>
                String(
                  value || '',
                ).trim(),
            )
            .filter(
              (value) =>
                value &&
                value !==
                  args.actorId &&
                Types.ObjectId
                  .isValid(value),
            ),
        ),
      );

    for (
      const recipientId
      of recipients
    ) {
      try {
        await this.notifications
          .notify({
            userId:
              recipientId,

            type:
              NotificationType
                .PROJECT_UPDATE,

            title:
              args.title,

            body:
              args.body,

            icon:
              'file-text',

            priority:
              NotificationPriority
                .NORMAL,

            triggeredBy:
              args.actorId,

            data: {
              projectId:
                args.projectId,

              emailFanoutEligible:
                true,

              projectMemberNotification:
                true,

              extra: {
                eventType:
                  args.eventType,

                decisionId:
                  args.decisionId,
              },
            },

            actions: [
              {
                label:
                  'View Project',

                url:
                  `/projects/${args.projectId}`,
              },
            ],

            groupKey:
              `${args.eventType}-` +
              `${args.decisionId}-` +
              `${recipientId}`,
          });
      } catch (_error) {
        // Notification delivery must never
        // roll back a successful Decision mutation.
      }
    }
  }

  private async assertProjectAccess(
    projectId: string,
    userId: string,
  ) {
    if (
      !Types.ObjectId.isValid(projectId)
    ) {
      throw new BadRequestException(
        'Project ID is invalid',
      );
    }

    return this.projectsService
      .findByIdWithAccess(
        projectId,
        userId,
      );
  }

  private async assertMoveBelongsToProject(
    projectId: string,
    sourceMoveId?: string | null,
  ) {
    if (!sourceMoveId) return;

    if (
      !Types.ObjectId.isValid(
        sourceMoveId,
      )
    ) {
      throw new BadRequestException(
        'Linked Move ID is invalid',
      );
    }

    const move =
      await this.taskModel
        .findOne({
          _id:
            new Types.ObjectId(
              sourceMoveId,
            ),
          projectId:
            new Types.ObjectId(
              projectId,
            ),
        })
        .select('_id')
        .lean();

    if (!move) {
      throw new BadRequestException(
        'Linked Move must belong to this project',
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

    return this.decisionModel
      .find({
        projectId:
          new Types.ObjectId(projectId),
      })
      .sort({
        decidedAt: -1,
        createdAt: -1,
      })
      .lean();
  }

  async create(
    projectId: string,
    userId: string,
    dto: CreateDecisionDto,
  ) {
    const project =
      await this.assertProjectAccess(
        projectId,
        userId,
      );

    if (
      !Types.ObjectId.isValid(userId)
    ) {
      throw new BadRequestException(
        'User ID is invalid',
      );
    }

    const title =
      String(dto?.title || '').trim();

    const decision =
      String(
        dto?.decision || '',
      ).trim();

    const rationale =
      String(
        dto?.rationale || '',
      ).trim();

    if (!title) {
      throw new BadRequestException(
        'Decision title is required',
      );
    }

    if (!decision) {
      throw new BadRequestException(
        'Decision outcome is required',
      );
    }

    const sourceMoveId =
      dto?.sourceMoveId
        ? String(
            dto.sourceMoveId,
          ).trim()
        : null;

    const sourceType =
      dto?.sourceType ||
      (
        sourceMoveId
          ? DecisionSourceType.MOVE
          : DecisionSourceType.PROJECT
      );

    if (
      sourceType ===
        DecisionSourceType.MOVE &&
      !sourceMoveId
    ) {
      throw new BadRequestException(
        'A Move source requires a linked Move',
      );
    }

    if (
      sourceType !==
        DecisionSourceType.MOVE &&
      sourceMoveId
    ) {
      throw new BadRequestException(
        'A linked Move requires source type "move"',
      );
    }

    if (
      sourceType ===
      DecisionSourceType.DISCUSSION
    ) {
      throw new BadRequestException(
        'Discussion decision capture is not enabled yet',
      );
    }

    await this
      .assertMoveBelongsToProject(
        projectId,
        sourceMoveId,
      );

    const created =
      await this.decisionModel.create({
        projectId:
          new Types.ObjectId(projectId),

        title,
        decision,
        rationale,

        decidedBy:
          new Types.ObjectId(userId),

        decidedAt: new Date(),

        sourceType,

        sourceMoveId:
          sourceMoveId
            ? new Types.ObjectId(
                sourceMoveId,
              )
            : null,
      });

    await this
      .notifyDecisionRecipients({
        recipientIds:
          Array.from(
            this.getProjectParticipantIds(
              project,
            ),
          ),

        actorId:
          userId,

        projectId,

        decisionId:
          created._id.toString(),

        eventType:
          'decision.recorded',

        title:
          'Decision recorded',

        body:
          created.title,
      });

    return created;
  }

  async update(
    projectId: string,
    decisionId: string,
    userId: string,
    dto: UpdateDecisionDto,
  ) {
    const project =
      await this.assertProjectAccess(
        projectId,
        userId,
      );

    if (
      !Types.ObjectId.isValid(
        decisionId,
      )
    ) {
      throw new BadRequestException(
        'Decision ID is invalid',
      );
    }

    const item =
      await this.decisionModel
        .findOne({
          _id:
            new Types.ObjectId(
              decisionId,
            ),
          projectId:
            new Types.ObjectId(
              projectId,
            ),
        });

    if (!item) {
      throw new NotFoundException(
        'Decision not found',
      );
    }

    const previousTitle =
      String(
        item.title || '',
      );

    const previousDecision =
      String(
        item.decision || '',
      );

    const previousRationale =
      String(
        item.rationale || '',
      );

    const previousStatus =
      item.status;

    if (
      dto.title !== undefined
    ) {
      const title =
        String(dto.title).trim();

      if (!title) {
        throw new BadRequestException(
          'Decision title is required',
        );
      }

      item.title = title;
    }

    if (
      dto.decision !== undefined
    ) {
      const decision =
        String(
          dto.decision,
        ).trim();

      if (!decision) {
        throw new BadRequestException(
          'Decision outcome is required',
        );
      }

      item.decision = decision;
    }

    if (
      dto.rationale !== undefined
    ) {
      item.rationale =
        String(
          dto.rationale,
        ).trim();
    }

    if (
      dto.status !== undefined
    ) {
      item.status = dto.status;
    }

    const saved =
      await item.save();

    const statusChanged =
      previousStatus !==
      saved.status;

    const contentChanged =
      previousTitle !==
        String(
          saved.title || '',
        ) ||
      previousDecision !==
        String(
          saved.decision || '',
        ) ||
      previousRationale !==
        String(
          saved.rationale || '',
        );

    if (
      statusChanged ||
      contentChanged
    ) {
      let eventType =
        'decision.updated';

      let notificationTitle =
        'Decision updated';

      if (
        statusChanged &&
        saved.status ===
          DecisionStatus.SUPERSEDED
      ) {
        eventType =
          'decision.superseded';

        notificationTitle =
          'Decision superseded';
      }

      if (
        statusChanged &&
        saved.status ===
          DecisionStatus.ACTIVE &&
        previousStatus ===
          DecisionStatus.SUPERSEDED
      ) {
        eventType =
          'decision.reactivated';

        notificationTitle =
          'Decision reactivated';
      }

      await this
        .notifyDecisionRecipients({
          recipientIds:
            Array.from(
              this.getProjectParticipantIds(
                project,
              ),
            ),

          actorId:
            userId,

          projectId,

          decisionId:
            saved._id.toString(),

          eventType,

          title:
            notificationTitle,

          body:
            saved.title,
        });
    }

    return saved;
  }
}
