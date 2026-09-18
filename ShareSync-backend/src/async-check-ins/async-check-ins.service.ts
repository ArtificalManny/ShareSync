import {
  BadRequestException,
  ForbiddenException,
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
  CreateAsyncCheckInDto,
} from './dto/create-async-check-in.dto';

import {
  UpdateAsyncCheckInDto,
} from './dto/update-async-check-in.dto';

import {
  UpsertAsyncCheckInResponseDto,
} from './dto/upsert-async-check-in-response.dto';

import {
  AsyncCheckIn,
  AsyncCheckInDocument,
  AsyncCheckInStatus,
} from './schemas/async-check-in.schema';

import {
  AsyncCheckInResponse,
  AsyncCheckInResponseDocument,
} from './schemas/async-check-in-response.schema';

@Injectable()
export class AsyncCheckInsService {
  constructor(
    @InjectModel(AsyncCheckIn.name)
    private readonly checkInModel:
      Model<AsyncCheckInDocument>,

    @InjectModel(
      AsyncCheckInResponse.name,
    )
    private readonly responseModel:
      Model<AsyncCheckInResponseDocument>,

    private readonly projectsService:
      ProjectsService,

    private readonly notifications:
      NotificationsService,
  ) {}

  // openshare-async-check-in-email-v1
  private async notifyCheckInRecipients(
    args: {
      recipientIds:
        Array<
          string |
          null |
          undefined
        >;
      actorId: string;
      projectId: string;
      checkInId: string;
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
              'clipboard-check',

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

                checkInId:
                  args.checkInId,
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
              `${args.checkInId}-` +
              `${recipientId}`,
          });
      } catch (_error) {
        // Notification delivery must never
        // roll back a successful Check-in mutation.
      }
    }
  }

  private normalizeProjectUserId(
    value: any,
  ): string {
    if (!value) return '';

    if (
      typeof value === 'string' ||
      typeof value === 'number'
    ) {
      return String(value);
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
      !Types.ObjectId.isValid(
        userId,
      )
    ) {
      throw new BadRequestException(
        'User ID is invalid',
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
    const participantIds =
      new Set<string>();

    [
      project?.ownerId,
      project?.owner,
      project?.createdBy,
      project?.createdById,
    ].forEach((candidate) => {
      const id =
        this.normalizeProjectUserId(
          candidate,
        );

      if (id) {
        participantIds.add(id);
      }
    });

    const members =
      Array.isArray(project?.members)
        ? project.members
        : [];

    members.forEach(
      (member: any) => {
        const id =
          this.normalizeProjectUserId(
            member,
          );

        if (id) {
          participantIds.add(id);
        }
      },
    );

    return participantIds;
  }

  private assertCurrentProjectParticipant(
    project: any,
    userId: string,
  ) {
    const participantIds =
      this.getProjectParticipantIds(
        project,
      );

    if (
      !participantIds.has(userId)
    ) {
      throw new ForbiddenException(
        'Async Check-ins are available only to project participants',
      );
    }

    return participantIds;
  }

  private async assertParticipantAccess(
    projectId: string,
    userId: string,
  ) {
    const project =
      await this.assertProjectAccess(
        projectId,
        userId,
      );

    this.assertCurrentProjectParticipant(
      project,
      userId,
    );

    return project;
  }

  private getProjectOwnerIds(
    project: any,
  ): Set<string> {
    const ownerIds =
      new Set<string>();

    [
      project?.ownerId,
      project?.owner,
      project?.createdById,
      project?.createdBy,
    ].forEach((candidate) => {
      const id =
        this.normalizeProjectUserId(
          candidate,
        );

      if (id) {
        ownerIds.add(id);
      }
    });

    return ownerIds;
  }

  private assertCanManageCheckIn(
    project: any,
    checkIn: any,
    userId: string,
  ) {
    const creatorId =
      this.normalizeProjectUserId(
        checkIn?.createdBy,
      );

    const isCreator =
      creatorId === userId;

    const isProjectOwner =
      this.getProjectOwnerIds(
        project,
      ).has(userId);

    if (
      !isCreator &&
      !isProjectOwner
    ) {
      throw new ForbiddenException(
        'Only the Check-in creator or project owner can manage this Check-in',
      );
    }
  }

  private parseDueAt(
    value: string | null | undefined,
  ): Date | null {
    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {
      return null;
    }

    const dueAt =
      new Date(value);

    if (
      Number.isNaN(
        dueAt.getTime(),
      )
    ) {
      throw new BadRequestException(
        'Check-in due date is invalid',
      );
    }

    return dueAt;
  }

  private async findCheckInRecord(
    projectId: string,
    checkInId: string,
  ) {
    if (
      !Types.ObjectId.isValid(
        checkInId,
      )
    ) {
      throw new BadRequestException(
        'Check-in ID is invalid',
      );
    }

    const checkIn =
      await this.checkInModel
        .findOne({
          _id:
            new Types.ObjectId(
              checkInId,
            ),
          projectId:
            new Types.ObjectId(
              projectId,
            ),
        });

    if (!checkIn) {
      throw new NotFoundException(
        'Check-in not found',
      );
    }

    return checkIn;
  }

  private async hydrateCheckIns(
    checkIns: any[],
    userId: string,
  ) {
    if (!checkIns.length) {
      return [];
    }

    const checkInIds =
      checkIns.map(
        (item) =>
          new Types.ObjectId(
            String(item._id),
          ),
      );

    const responses =
      await this.responseModel
        .find({
          checkInId: {
            $in: checkInIds,
          },
        })
        .sort({
          createdAt: 1,
        })
        .lean();

    const byCheckIn =
      new Map<string, any[]>();

    responses.forEach(
      (response: any) => {
        const key =
          String(
            response.checkInId,
          );

        const list =
          byCheckIn.get(key) || [];

        list.push(response);

        byCheckIn.set(
          key,
          list,
        );
      },
    );

    return checkIns.map(
      (checkIn: any) => {
        const key =
          String(
            checkIn._id,
          );

        const itemResponses =
          byCheckIn.get(key) || [];

        const myResponse =
          itemResponses.find(
            (response: any) =>
              String(
                response.userId,
              ) === userId,
          ) || null;

        return {
          ...checkIn,
          participantCount:
            Array.isArray(
              checkIn.participantIds,
            )
              ? checkIn
                  .participantIds
                  .length
              : 0,
          responseCount:
            itemResponses.length,
          responses:
            itemResponses,
          myResponse,
        };
      },
    );
  }

  async findByProject(
    projectId: string,
    userId: string,
  ) {
    await this.assertParticipantAccess(
      projectId,
      userId,
    );

    const checkIns =
      await this.checkInModel
        .find({
          projectId:
            new Types.ObjectId(
              projectId,
            ),
        })
        .sort({
          createdAt: -1,
        })
        .lean();

    return this.hydrateCheckIns(
      checkIns,
      userId,
    );
  }

  async findOne(
    projectId: string,
    checkInId: string,
    userId: string,
  ) {
    await this.assertParticipantAccess(
      projectId,
      userId,
    );

    const checkIn =
      await this.findCheckInRecord(
        projectId,
        checkInId,
      );

    const hydrated =
      await this.hydrateCheckIns(
        [
          checkIn.toObject(),
        ],
        userId,
      );

    return hydrated[0];
  }

  async create(
    projectId: string,
    userId: string,
    dto: CreateAsyncCheckInDto,
  ) {
    const project =
      await this.assertParticipantAccess(
        projectId,
        userId,
      );

    const title =
      String(
        dto?.title || '',
      ).trim();

    const prompt =
      String(
        dto?.prompt || '',
      ).trim();

    if (!title) {
      throw new BadRequestException(
        'Check-in title is required',
      );
    }

    const participantIds =
      Array.from(
        this.getProjectParticipantIds(
          project,
        ),
      ).filter(
        (id) =>
          Types.ObjectId.isValid(id),
      );

    if (!participantIds.length) {
      throw new BadRequestException(
        'Check-in requires at least one project participant',
      );
    }

    const dueAt =
      this.parseDueAt(
        dto?.dueAt,
      );

    const created =
      await this.checkInModel
        .create({
          projectId:
            new Types.ObjectId(
              projectId,
            ),

          title,
          prompt,

          status:
            AsyncCheckInStatus.OPEN,

          dueAt,

          participantIds:
            participantIds.map(
              (id) =>
                new Types.ObjectId(
                  id,
                ),
            ),

          createdBy:
            new Types.ObjectId(
              userId,
            ),

          closedBy: null,
          closedAt: null,
        });

    await this
      .notifyCheckInRecipients({
        recipientIds:
          participantIds,

        actorId:
          userId,

        projectId,

        checkInId:
          String(created._id),

        eventType:
          'async_check_in.created',

        title:
          'Async Check-in created',

        body:
          title,
      });

    return this.findOne(
      projectId,
      String(created._id),
      userId,
    );
  }

  async update(
    projectId: string,
    checkInId: string,
    userId: string,
    dto: UpdateAsyncCheckInDto,
  ) {
    const project =
      await this.assertParticipantAccess(
        projectId,
        userId,
      );

    const checkIn =
      await this.findCheckInRecord(
        projectId,
        checkInId,
      );

    const previousStatus =
      checkIn.status;

    this.assertCanManageCheckIn(
      project,
      checkIn,
      userId,
    );

    if (
      dto.title !== undefined
    ) {
      const title =
        String(
          dto.title || '',
        ).trim();

      if (!title) {
        throw new BadRequestException(
          'Check-in title is required',
        );
      }

      checkIn.title = title;
    }

    if (
      dto.prompt !== undefined
    ) {
      checkIn.prompt =
        String(
          dto.prompt || '',
        ).trim();
    }

    if (
      dto.dueAt !== undefined
    ) {
      checkIn.dueAt =
        this.parseDueAt(
          dto.dueAt,
        );
    }

    if (
      dto.status !== undefined &&
      dto.status !== checkIn.status
    ) {
      if (
        dto.status ===
        AsyncCheckInStatus.CLOSED
      ) {
        checkIn.status =
          AsyncCheckInStatus.CLOSED;

        checkIn.closedAt =
          new Date();

        checkIn.closedBy =
          new Types.ObjectId(
            userId,
          );
      } else {
        checkIn.status =
          AsyncCheckInStatus.OPEN;

        checkIn.closedAt = null;
        checkIn.closedBy = null;
      }
    }

    await checkIn.save();

    if (
      previousStatus !==
      checkIn.status
    ) {
      const isClosed =
        checkIn.status ===
        AsyncCheckInStatus.CLOSED;

      await this
        .notifyCheckInRecipients({
          recipientIds:
            (
              checkIn.participantIds ||
              []
            ).map(
              (id: any) =>
                String(id),
            ),

          actorId:
            userId,

          projectId,

          checkInId,

          eventType:
            isClosed
              ? 'async_check_in.closed'
              : 'async_check_in.reopened',

          title:
            isClosed
              ? 'Async Check-in closed'
              : 'Async Check-in reopened',

          body:
            checkIn.title,
        });
    }

    return this.findOne(
      projectId,
      checkInId,
      userId,
    );
  }

  async upsertMyResponse(
    projectId: string,
    checkInId: string,
    userId: string,
    dto: UpsertAsyncCheckInResponseDto,
  ) {
    await this.assertParticipantAccess(
      projectId,
      userId,
    );

    const checkIn =
      await this.findCheckInRecord(
        projectId,
        checkInId,
      );

    if (
      checkIn.status !==
      AsyncCheckInStatus.OPEN
    ) {
      throw new BadRequestException(
        'Closed Check-ins cannot be updated',
      );
    }

    const expectedParticipants =
      new Set(
        (
          checkIn.participantIds || []
        ).map(
          (id: any) =>
            String(id),
        ),
      );

    if (
      !expectedParticipants.has(
        userId,
      )
    ) {
      throw new ForbiddenException(
        'You were not included in this Check-in',
      );
    }

    const progress =
      String(
        dto?.progress || '',
      ).trim();

    const next =
      String(
        dto?.next || '',
      ).trim();

    const blockers =
      String(
        dto?.blockers || '',
      ).trim();

    if (!progress) {
      throw new BadRequestException(
        'Progress is required',
      );
    }

    if (!next) {
      throw new BadRequestException(
        'Next step is required',
      );
    }

    const existingResponse =
      await this.responseModel
        .findOne({
          checkInId:
            new Types.ObjectId(
              checkInId,
            ),

          userId:
            new Types.ObjectId(
              userId,
            ),
        })
        .select('_id')
        .lean();

    await this.responseModel
      .findOneAndUpdate(
        {
          checkInId:
            new Types.ObjectId(
              checkInId,
            ),
          userId:
            new Types.ObjectId(
              userId,
            ),
        },
        {
          $set: {
            health:
              dto.health,
            progress,
            next,
            blockers,
            submittedAt:
              new Date(),
          },
          $setOnInsert: {
            checkInId:
              new Types.ObjectId(
                checkInId,
              ),
            projectId:
              new Types.ObjectId(
                projectId,
              ),
            userId:
              new Types.ObjectId(
                userId,
              ),
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        },
      );

    await this
      .notifyCheckInRecipients({
        recipientIds: [
          this.normalizeProjectUserId(
            checkIn.createdBy,
          ),
        ],

        actorId:
          userId,

        projectId,

        checkInId,

        eventType:
          existingResponse
            ? 'async_check_in.response_updated'
            : 'async_check_in.response_submitted',

        title:
          existingResponse
            ? 'Check-in response updated'
            : 'Check-in response submitted',

        body:
          checkIn.title,
      });

    return this.findOne(
      projectId,
      checkInId,
      userId,
    );
  }
}
