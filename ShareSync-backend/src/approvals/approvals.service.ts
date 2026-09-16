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
  Task,
  TaskDocument,
} from '../tasks/schemas/task.schema';

import {
  CreateApprovalDto,
} from './dto/create-approval.dto';

import {
  UpdateApprovalDto,
} from './dto/update-approval.dto';

import {
  Approval,
  ApprovalDocument,
  ApprovalSourceType,
  ApprovalStatus,
} from './schemas/approval.schema';

@Injectable()
export class ApprovalsService {
  private readonly logger =
    new Logger(
      ApprovalsService.name,
    );

  constructor(
    @InjectModel(Approval.name)
    private readonly approvalModel:
      Model<ApprovalDocument>,

    @InjectModel(Task.name)
    private readonly taskModel:
      Model<TaskDocument>,

    private readonly projectsService:
      ProjectsService,

    private readonly notifications:
      NotificationsService,
  ) {}

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
    const ids =
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
        ids.add(id);
      }
    });

    const members =
      Array.isArray(
        project?.members,
      )
        ? project.members
        : [];

    members.forEach(
      (member: any) => {
        const id =
          this.normalizeProjectUserId(
            member,
          );

        if (id) {
          ids.add(id);
        }
      },
    );

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

  private async assertMoveBelongsToProject(
    projectId: string,
    sourceMoveId?: string | null,
  ) {
    if (!sourceMoveId) {
      return;
    }

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
          _id: sourceMoveId,
          projectId,
        })
        .select({
          _id: 1,
        })
        .lean()
        .exec();

    if (!move) {
      throw new BadRequestException(
        'Linked Move does not belong to this project',
      );
    }
  }

  private cleanText(
    value: any,
  ): string {
    return String(
      value || '',
    ).trim();
  }

  private async notifySafely(
    payload: any,
  ) {
    try {
      await this.notifications
        .notify(payload);
    } catch (error: any) {
      this.logger.warn(
        `Approval notification failed: ${
          error?.message || error
        }`,
      );
    }
  }

  private approvalUrl(
    projectId: string,
    sourceMoveId?: any,
  ) {
    return sourceMoveId
      ? `/projects/${projectId}?tab=move`
      : `/projects/${projectId}`;
  }

  async findByProject(
    projectId: string,
    userId: string,
  ) {
    await this.assertProjectAccess(
      projectId,
      userId,
    );

    return this.approvalModel
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
    dto: CreateApprovalDto,
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

    const request =
      this.cleanText(
        dto?.request,
      );

    if (!title) {
      throw new BadRequestException(
        'Approval title is required',
      );
    }

    if (!request) {
      throw new BadRequestException(
        'Approval request is required',
      );
    }

    const approverId =
      this.assertProjectParticipant(
        project,
        dto?.approverId,
        'Approval approver',
      );

    const sourceMoveId =
      dto?.sourceMoveId
        ? this.cleanText(
            dto.sourceMoveId,
          )
        : null;

    await this.assertMoveBelongsToProject(
      projectId,
      sourceMoveId,
    );

    const item =
      new this.approvalModel({
        projectId:
          new Types.ObjectId(
            projectId,
          ),

        title,
        request,

        requestedBy:
          new Types.ObjectId(
            userId,
          ),

        approverId:
          new Types.ObjectId(
            approverId,
          ),

        status:
          ApprovalStatus.PENDING,

        responseNote: null,
        decidedBy: null,
        decidedAt: null,
        cancelledAt: null,

        sourceType:
          sourceMoveId
            ? ApprovalSourceType.MOVE
            : ApprovalSourceType.PROJECT,

        sourceMoveId:
          sourceMoveId
            ? new Types.ObjectId(
                sourceMoveId,
              )
            : null,
      });

    const saved =
      await item.save();

    if (
      approverId !== userId
    ) {
      await this.notifySafely({
        userId: approverId,
        type:
          NotificationType
            .APPROVAL_REQUESTED,
        title:
          'Approval requested',
        body: title,
        icon: 'check',
        priority:
          NotificationPriority.HIGH,
        triggeredBy: userId,
        data: {
          projectId,
          taskId:
            sourceMoveId ||
            undefined,
          emailFanoutEligible: true,
          projectMemberNotification:
            true,
          extra: {
            approvalId:
              saved._id.toString(),
            sourceMoveId:
              sourceMoveId ||
              undefined,
          },
        },
        actions: [
          {
            label:
              sourceMoveId
                ? 'View Move'
                : 'View Project',
            url: this.approvalUrl(
              projectId,
              sourceMoveId,
            ),
          },
        ],
        groupKey:
          `approval-requested-${approverId}-${saved._id.toString()}`,
      });
    }

    return saved;
  }

  async update(
    projectId: string,
    approvalId: string,
    userId: string,
    dto: UpdateApprovalDto,
  ) {
    await this.assertProjectAccess(
      projectId,
      userId,
    );

    if (
      !Types.ObjectId.isValid(
        approvalId,
      )
    ) {
      throw new BadRequestException(
        'Approval ID is invalid',
      );
    }

    const item =
      await this.approvalModel
        .findOne({
          _id: approvalId,
          projectId,
        })
        .exec();

    if (!item) {
      throw new NotFoundException(
        'Approval not found',
      );
    }

    if (
      item.status !==
      ApprovalStatus.PENDING
    ) {
      throw new BadRequestException(
        'Only pending approvals can be changed',
      );
    }

    if (!dto?.status) {
      throw new BadRequestException(
        'Approval status is required',
      );
    }

    if (
      dto.status ===
      ApprovalStatus.PENDING
    ) {
      throw new BadRequestException(
        'Approval is already pending',
      );
    }

    const requestedBy =
      item.requestedBy.toString();

    const approverId =
      item.approverId.toString();

    const responseNote =
      dto.responseNote !== undefined
        ? this.cleanText(
            dto.responseNote,
          ) || null
        : null;

    const now =
      new Date();

    if (
      dto.status ===
        ApprovalStatus.APPROVED ||
      dto.status ===
        ApprovalStatus.REJECTED
    ) {
      if (
        userId !== approverId
      ) {
        throw new ForbiddenException(
          'Only the selected approver can approve or reject this request',
        );
      }

      item.status =
        dto.status;

      item.responseNote =
        responseNote;

      item.decidedBy =
        new Types.ObjectId(
          userId,
        );

      item.decidedAt =
        now;

      item.cancelledAt =
        null;
    } else if (
      dto.status ===
      ApprovalStatus.CANCELLED
    ) {
      if (
        userId !== requestedBy
      ) {
        throw new ForbiddenException(
          'Only the requester can cancel this approval request',
        );
      }

      item.status =
        ApprovalStatus.CANCELLED;

      item.responseNote =
        responseNote;

      item.cancelledAt =
        now;

      item.decidedBy =
        null;

      item.decidedAt =
        null;
    } else {
      throw new BadRequestException(
        'Approval status is invalid',
      );
    }

    const saved =
      await item.save();

    const sourceMoveId =
      item.sourceMoveId
        ? item.sourceMoveId.toString()
        : null;

    if (
      dto.status ===
        ApprovalStatus.APPROVED &&
      requestedBy !== userId
    ) {
      await this.notifySafely({
        userId: requestedBy,
        type:
          NotificationType
            .APPROVAL_APPROVED,
        title:
          'Approval approved',
        body: item.title,
        icon: 'check',
        priority:
          NotificationPriority.NORMAL,
        triggeredBy: userId,
        data: {
          projectId,
          taskId:
            sourceMoveId ||
            undefined,
          emailFanoutEligible: true,
          projectMemberNotification:
            true,
          extra: {
            approvalId:
              item._id.toString(),
          },
        },
        actions: [
          {
            label:
              sourceMoveId
                ? 'View Move'
                : 'View Project',
            url: this.approvalUrl(
              projectId,
              sourceMoveId,
            ),
          },
        ],
        groupKey:
          `approval-approved-${requestedBy}-${item._id.toString()}`,
      });
    }

    if (
      dto.status ===
        ApprovalStatus.REJECTED &&
      requestedBy !== userId
    ) {
      await this.notifySafely({
        userId: requestedBy,
        type:
          NotificationType
            .APPROVAL_REJECTED,
        title:
          'Approval rejected',
        body: item.title,
        icon: 'x',
        priority:
          NotificationPriority.HIGH,
        triggeredBy: userId,
        data: {
          projectId,
          taskId:
            sourceMoveId ||
            undefined,
          emailFanoutEligible: true,
          projectMemberNotification:
            true,
          extra: {
            approvalId:
              item._id.toString(),
          },
        },
        actions: [
          {
            label:
              sourceMoveId
                ? 'View Move'
                : 'View Project',
            url: this.approvalUrl(
              projectId,
              sourceMoveId,
            ),
          },
        ],
        groupKey:
          `approval-rejected-${requestedBy}-${item._id.toString()}`,
      });
    }

    if (
      dto.status ===
        ApprovalStatus.CANCELLED &&
      approverId !== userId
    ) {
      await this.notifySafely({
        userId: approverId,
        type:
          NotificationType
            .APPROVAL_CANCELLED,
        title:
          'Approval request cancelled',
        body: item.title,
        icon: 'x',
        priority:
          NotificationPriority.NORMAL,
        triggeredBy: userId,
        data: {
          projectId,
          taskId:
            sourceMoveId ||
            undefined,
          emailFanoutEligible: true,
          projectMemberNotification:
            true,
          extra: {
            approvalId:
              item._id.toString(),
          },
        },
        actions: [
          {
            label:
              sourceMoveId
                ? 'View Move'
                : 'View Project',
            url: this.approvalUrl(
              projectId,
              sourceMoveId,
            ),
          },
        ],
        groupKey:
          `approval-cancelled-${approverId}-${item._id.toString()}`,
      });
    }

    return saved;
  }
}
