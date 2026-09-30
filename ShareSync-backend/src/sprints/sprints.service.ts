// src/sprints/sprints.service.ts
// ═══════════════════════════════════════════════════════════════════════════════
// SPRINTS SERVICE
// Backend business logic for project execution cycles.
//
// Safe first-pass purpose:
// - Create a real Sprint document for a project.
// - Return the current/active sprint for the Project Overview card.
// - Keep sprint logic isolated from Tasks/Projects until the basic flow works.
// - Avoid broad backend changes while giving the frontend a real source of truth.
// ═══════════════════════════════════════════════════════════════════════════════

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';

import {
  Sprint,
  SprintDocument,
  SprintModel,
  SprintStatus,
} from './schemas/sprint.schema';
import { CreateSprintDto, UpdateSprintDto } from './dto/create-sprint.dto';
import { ProjectsService } from '../projects/projects.service';

type SprintResponse = SprintDocument | Record<string, any> | null;

function toObjectId(value: string, label: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new BadRequestException(`Invalid ${label}`);
  }

  return new Types.ObjectId(value);
}

function normalizeDate(value: string | Date, label: string): Date {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`Invalid ${label}`);
  }

  return date;
}

function normalizeSprintStatus(status?: SprintStatus): SprintStatus {
  return status || SprintStatus.ACTIVE;
}

function serializeSprint(sprint: SprintResponse): any {
  if (!sprint) return null;

  if (typeof (sprint as any).toObject === 'function') {
    const obj = (sprint as any).toObject({ virtuals: true });
    obj.id = obj._id?.toString?.() || obj.id;
    return obj;
  }

  return sprint;
}

@Injectable()
export class SprintsService {
  constructor(
    @InjectModel(Sprint.name)
    private readonly sprintModel: SprintModel,

    private readonly projectsService:
      ProjectsService,
  ) {}

  // openshare-sprints-project-access-v1
  //
  // Sprint reads preserve durable owner/member access through downgrade.
  // Public project visibility alone never exposes Sprint records.
  //
  // Sprint mutations use the canonical shared-project editor boundary
  // (owner/admin), then separately enforce project writability so the owner
  // cannot mutate an excess project merely because owner membership remains
  // active.
  private normalizeSprintProjectUserId(
    value: any,
  ): string {
    if (!value) {
      return '';
    }

    const resolved =
      value?._id ??
      value?.id ??
      value;

    if (
      typeof resolved ===
      'string'
    ) {
      return resolved;
    }

    if (
      typeof resolved
        ?.toHexString ===
      'function'
    ) {
      return resolved.toHexString();
    }

    if (
      typeof resolved
        ?.toString ===
      'function'
    ) {
      const result =
        resolved.toString();

      return result ===
        '[object Object]'
        ? ''
        : result;
    }

    return '';
  }

  private async assertSprintReadable(
    projectId: string,
    userId: string,
  ): Promise<void> {
    const project =
      await this.projectsService
        .findById(
          projectId,
        );

    const actorId =
      this.normalizeSprintProjectUserId(
        userId,
      );

    const ownerRefs = [
      (project as any)?.ownerId,
      (project as any)?.owner,
      (project as any)?.createdBy,
      (project as any)?.createdById,
      (project as any)?.creatorId,
      (project as any)?.userId,
    ];

    const isOwner =
      ownerRefs.some(
        (value: any) =>
          this.normalizeSprintProjectUserId(
            value,
          ) === actorId,
      );

    const members =
      Array.isArray(
        (project as any)?.members,
      )
        ? (project as any).members
        : [];

    const isMember =
      members.some(
        (member: any) => {
          const memberId =
            this.normalizeSprintProjectUserId(
              member?.userId ??
              member?.user ??
              member?.memberId ??
              member?._id ??
              member?.id ??
              member,
            );

          return (
            memberId ===
            actorId
          );
        },
      );

    if (
      !actorId ||
      (
        !isOwner &&
        !isMember
      )
    ) {
      throw new ForbiddenException(
        'You do not have access to this project sprint',
      );
    }
  }

  private async assertSprintWritable(
    projectId: string,
    userId: string,
  ): Promise<void> {
    /*
     * Canonical ordinary project editor policy:
     * owner or admin.
     *
     * assertProjectEditableByUser() also preserves the existing member
     * billing restriction for accepted collaborators.
     */
    await this.projectsService
      .assertProjectEditableByUser(
        projectId,
        userId,
      );

    /*
     * Member access alone is insufficient because the workspace owner is
     * always member-active. An excess project must still remain read-only.
     */
    await this.projectsService
      .assertProjectWritableForBilling(
        projectId,
      );
  }

  // openshare-sprints-reference-integrity-v1
  //
  // Sprint references must remain inside the Sprint's own project:
  //
  // - every taskId must resolve to a Task belonging to this project;
  // - every teamMember must be the project owner or a durable project member.
  //
  // This helper performs data-integrity validation only. Existing Sprint
  // authorization and downgrade-write enforcement remain separate.
  private async validateSprintReferences(
    projectId: string,
    rawTaskIds?: string[],
    rawTeamMembers?: string[],
  ): Promise<{
    taskIds: Types.ObjectId[];
    teamMembers: Types.ObjectId[];
  }> {
    const projectObjectId =
      toObjectId(
        projectId,
        'projectId',
      );

    const taskIds =
      Array.isArray(
        rawTaskIds,
      )
        ? rawTaskIds.map(
            (taskId) =>
              toObjectId(
                taskId,
                'taskId',
              ),
          )
        : [];

    const teamMembers =
      Array.isArray(
        rawTeamMembers,
      )
        ? rawTeamMembers.map(
            (memberId) =>
              toObjectId(
                memberId,
                'teamMemberId',
              ),
          )
        : [];

    if (taskIds.length > 0) {
      const uniqueTaskIds =
        Array.from(
          new Map(
            taskIds.map(
              (taskId) => [
                taskId.toString(),
                taskId,
              ],
            ),
          ).values(),
        );

      const matchingTaskCount =
        await this.sprintModel.db
          .collection(
            'tasks',
          )
          .countDocuments({
            _id: {
              $in:
                uniqueTaskIds,
            },
            projectId:
              projectObjectId,
          });

      if (
        matchingTaskCount !==
        uniqueTaskIds.length
      ) {
        throw new BadRequestException(
          'One or more sprint tasks do not belong to this project',
        );
      }
    }

    if (teamMembers.length > 0) {
      const project =
        await this.projectsService
          .findById(
            projectId,
          );

      const allowedUserIds =
        new Set<string>();

      const ownerRefs = [
        (project as any)?.ownerId,
        (project as any)?.owner,
        (project as any)?.createdBy,
        (project as any)?.createdById,
        (project as any)?.creatorId,
        (project as any)?.userId,
      ];

      for (
        const ownerRef
        of ownerRefs
      ) {
        const ownerId =
          this.normalizeSprintProjectUserId(
            ownerRef,
          );

        if (ownerId) {
          allowedUserIds.add(
            ownerId,
          );
        }
      }

      const members =
        Array.isArray(
          (project as any)?.members,
        )
          ? (project as any).members
          : [];

      for (
        const member
        of members
      ) {
        const memberId =
          this.normalizeSprintProjectUserId(
            member?.userId ??
            member?.user ??
            member?.memberId ??
            member?._id ??
            member?.id ??
            member,
          );

        if (memberId) {
          allowedUserIds.add(
            memberId,
          );
        }
      }

      const invalidMember =
        teamMembers.find(
          (memberId) =>
            !allowedUserIds.has(
              memberId.toString(),
            ),
        );

      if (invalidMember) {
        throw new BadRequestException(
          'One or more Sprint team members do not belong to this project',
        );
      }
    }

    return {
      taskIds,
      teamMembers,
    };
  }

  async create(dto: CreateSprintDto, userId: string): Promise<any> {
    const projectObjectId = toObjectId(dto.projectId, 'projectId');
    const createdByObjectId = toObjectId(userId, 'userId');

    await this
      .assertSprintWritable(
        dto.projectId,
        userId,
      );


    const startDate = normalizeDate(dto.startDate, 'startDate');
    const endDate = normalizeDate(dto.endDate, 'endDate');

    if (endDate <= startDate) {
      throw new BadRequestException('Sprint endDate must be after startDate');
    }

    const status = normalizeSprintStatus(dto.status);

    if (status === SprintStatus.ACTIVE) {
      const existingActive = await this.sprintModel.findOne({
        projectId: projectObjectId,
        status: SprintStatus.ACTIVE,
      });

      if (existingActive) {
        throw new ConflictException('This project already has an active sprint');
      }
    }

    const sprintNumber =
      typeof this.sprintModel.getNextSprintNumber === 'function'
        ? await this.sprintModel.getNextSprintNumber(projectObjectId)
        : await this.getNextSprintNumberFallback(projectObjectId);

    const fallbackName = `Sprint ${sprintNumber}`;
    const name = (dto.name || dto.title || fallbackName).trim();

    const goalText = dto.goal?.trim();
    const goals =
      Array.isArray(dto.goals) && dto.goals.length > 0
        ? dto.goals.map((goal) => ({
            title: goal.title?.trim() || goalText || name,
            description: goal.description?.trim() || '',
            status: goal.status || 'active',
            progress: Number.isFinite(Number(goal.progress))
              ? Number(goal.progress)
              : 0,
            isAchieved: Number(goal.progress || 0) >= 100,
          }))
        : goalText
          ? [
              {
                title: goalText,
                description:
                  dto.description ||
                  'Default sprint goal created from the Project Overview sprint card.',
                status: 'active',
                progress: 0,
                isAchieved: false,
              },
            ]
          : [];

    const {
      taskIds,
      teamMembers,
    } =
      await this
        .validateSprintReferences(
          dto.projectId,
          dto.taskIds,
          dto.teamMembers,
        );

    const sprint = await this.sprintModel.create({
      name,
      sprintNumber,
      projectId: projectObjectId,
      status,
      startDate,
      endDate,
      actualStartDate: status === SprintStatus.ACTIVE ? new Date() : undefined,
      goals,
      taskIds,
      teamMembers,
      capacityHours: Number.isFinite(Number(dto.capacityHours))
        ? Number(dto.capacityHours)
        : 0,
      metrics: {
        plannedPoints: 0,
        completedPoints: 0,
        plannedTasks: taskIds.length,
        completedTasks: 0,
        addedPoints: 0,
        addedTasks: 0,
        removedPoints: 0,
        velocity: 0,
        capacityUtilization: 0,
        avgTaskCompletionTime: 0,
        blockedTaskCount: 0,
      },
      burndown: [],
      description: dto.description?.trim() || goalText || '',
      createdBy: createdByObjectId,
    });

    return serializeSprint(sprint);
  }

  async findCurrentForProject(
    projectId: string,
    userId: string,
  ): Promise<any> {
    await this
      .assertSprintReadable(
        projectId,
        userId,
      );

    const projectObjectId = toObjectId(projectId, 'projectId');

    const activeSprint = await this.sprintModel
      .findOne({
        projectId: projectObjectId,
        status: SprintStatus.ACTIVE,
      })
      .sort({ startDate: -1 });

    if (activeSprint) {
      return serializeSprint(activeSprint);
    }

    const now = new Date();

    const currentByDate = await this.sprintModel
      .findOne({
        projectId: projectObjectId,
        status: { $in: [SprintStatus.PLANNING, SprintStatus.REVIEW] },
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
      .sort({ startDate: -1 });

    if (currentByDate) {
      return serializeSprint(currentByDate);
    }

    const latestSprint = await this.sprintModel
      .findOne({
        projectId: projectObjectId,
        status: { $ne: SprintStatus.CANCELLED },
      })
      .sort({ startDate: -1, createdAt: -1 });

    return serializeSprint(latestSprint);
  }

  async findActiveForProject(
    projectId: string,
    userId: string,
  ): Promise<any> {
    await this
      .assertSprintReadable(
        projectId,
        userId,
      );

    const projectObjectId = toObjectId(projectId, 'projectId');

    const sprint =
      typeof this.sprintModel.findActiveSprint === 'function'
        ? await this.sprintModel.findActiveSprint(projectObjectId)
        : await this.sprintModel.findOne({
            projectId: projectObjectId,
            status: SprintStatus.ACTIVE,
          });

    return serializeSprint(sprint);
  }

  async findAllForProject(
    projectId: string,
    userId: string,
  ): Promise<any[]> {
    await this
      .assertSprintReadable(
        projectId,
        userId,
      );

    const projectObjectId = toObjectId(projectId, 'projectId');

    const sprints = await this.sprintModel
      .find({ projectId: projectObjectId })
      .sort({ sprintNumber: -1, startDate: -1 });

    return sprints.map((sprint) => serializeSprint(sprint));
  }

  async findById(
    sprintId: string,
    userId: string,
  ): Promise<any> {
    const sprintObjectId = toObjectId(sprintId, 'sprintId');

    const sprint = await this.sprintModel.findById(sprintObjectId);

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    await this
      .assertSprintReadable(
        sprint.projectId.toString(),
        userId,
      );

    return serializeSprint(sprint);
  }

  async update(
    sprintId: string,
    userId: string,
    dto: UpdateSprintDto,
  ): Promise<any> {
    const sprintObjectId = toObjectId(sprintId, 'sprintId');

    const sprint = await this.sprintModel.findById(sprintObjectId);

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    const projectId =
      sprint.projectId.toString();

    await this
      .assertSprintWritable(
        projectId,
        userId,
      );

    if (
      dto.projectId !==
        undefined &&
      String(dto.projectId) !==
        projectId
    ) {
      throw new BadRequestException(
        'Sprint projectId cannot be changed',
      );
    }

    if (dto.startDate) {
      sprint.startDate = normalizeDate(dto.startDate, 'startDate');
    }

    if (dto.endDate) {
      sprint.endDate = normalizeDate(dto.endDate, 'endDate');
    }

    if (sprint.endDate <= sprint.startDate) {
      throw new BadRequestException('Sprint endDate must be after startDate');
    }

    if (dto.name || dto.title) {
      sprint.name = (dto.name || dto.title || sprint.name).trim();
    }

    if (dto.description !== undefined) {
      sprint.description = dto.description?.trim() || '';
    }

    if (dto.status) {
      if (dto.status === SprintStatus.ACTIVE && sprint.status !== SprintStatus.ACTIVE) {
        const existingActive = await this.sprintModel.findOne({
          projectId: sprint.projectId,
          status: SprintStatus.ACTIVE,
          _id: { $ne: sprint._id },
        });

        if (existingActive) {
          throw new ConflictException('This project already has an active sprint');
        }

        sprint.actualStartDate = sprint.actualStartDate || new Date();
      }

      sprint.status = dto.status;
    }

    const validatedReferences =
      (
        Array.isArray(
          dto.taskIds,
        ) ||
        Array.isArray(
          dto.teamMembers,
        )
      )
        ? await this
            .validateSprintReferences(
              projectId,
              Array.isArray(
                dto.taskIds,
              )
                ? dto.taskIds
                : undefined,
              Array.isArray(
                dto.teamMembers,
              )
                ? dto.teamMembers
                : undefined,
            )
        : null;

    if (Array.isArray(dto.goals)) {
      sprint.goals = dto.goals.map((goal) => ({
        title: goal.title?.trim() || '',
        description: goal.description?.trim() || '',
        status: goal.status || 'active',
        progress: Number.isFinite(Number(goal.progress))
          ? Number(goal.progress)
          : 0,
        isAchieved: Number(goal.progress || 0) >= 100,
      })) as any;
    }

    if (
      Array.isArray(
        dto.taskIds,
      )
    ) {
      sprint.taskIds =
        (
          validatedReferences
            ?.taskIds ||
          []
        ) as any;

      sprint.metrics = {
        ...(sprint.metrics as any),
        plannedTasks:
          sprint.taskIds.length,
      } as any;
    }

    if (
      Array.isArray(
        dto.teamMembers,
      )
    ) {
      sprint.teamMembers =
        (
          validatedReferences
            ?.teamMembers ||
          []
        ) as any;
    }

    if (Number.isFinite(Number(dto.capacityHours))) {
      sprint.capacityHours = Number(dto.capacityHours);
    }

    await sprint.save();

    return serializeSprint(sprint);
  }

  async complete(
    sprintId: string,
    userId: string,
  ): Promise<any> {
    const sprintObjectId = toObjectId(sprintId, 'sprintId');

    const sprint = await this.sprintModel.findById(sprintObjectId);

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    await this
      .assertSprintWritable(
        sprint.projectId.toString(),
        userId,
      );

    sprint.status = SprintStatus.COMPLETED;
    sprint.actualEndDate = new Date();

    await sprint.save();

    return serializeSprint(sprint);
  }

  async cancel(
    sprintId: string,
    userId: string,
  ): Promise<any> {
    const sprintObjectId = toObjectId(sprintId, 'sprintId');

    const sprint = await this.sprintModel.findById(sprintObjectId);

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    await this
      .assertSprintWritable(
        sprint.projectId.toString(),
        userId,
      );

    sprint.status = SprintStatus.CANCELLED;
    sprint.actualEndDate = new Date();

    await sprint.save();

    return serializeSprint(sprint);
  }

  private async getNextSprintNumberFallback(
    projectId: Types.ObjectId,
  ): Promise<number> {
    const lastSprint = await this.sprintModel
      .findOne({ projectId })
      .sort({ sprintNumber: -1 });

    return (lastSprint?.sprintNumber || 0) + 1;
  }
}
