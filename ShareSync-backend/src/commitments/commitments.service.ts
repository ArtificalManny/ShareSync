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
  ProjectsService,
} from '../projects/projects.service';

import {
  Task,
  TaskDocument,
} from '../tasks/schemas/task.schema';

import {
  CreateCommitmentDto,
} from './dto/create-commitment.dto';

import {
  UpdateCommitmentDto,
} from './dto/update-commitment.dto';

import {
  Commitment,
  CommitmentDocument,
  CommitmentSourceType,
  CommitmentStatus,
} from './schemas/commitment.schema';

@Injectable()
export class CommitmentsService {
  constructor(
    @InjectModel(Commitment.name)
    private readonly commitmentModel:
      Model<CommitmentDocument>,

    @InjectModel(Task.name)
    private readonly taskModel:
      Model<TaskDocument>,

    private readonly projectsService:
      ProjectsService,
  ) {}

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

  private assertProjectParticipant(
    project: any,
    candidate: any,
    label: string,
  ) {
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

    return this.commitmentModel
      .find({
        projectId:
          new Types.ObjectId(
            projectId,
          ),
      })
      .sort({
        status: 1,
        dueAt: 1,
        createdAt: -1,
      })
      .lean();
  }

  async create(
    projectId: string,
    userId: string,
    dto: CreateCommitmentDto,
  ) {
    const project =
      await this.assertProjectAccess(
        projectId,
        userId,
      );

    if (
      !Types.ObjectId.isValid(
        userId,
      )
    ) {
      throw new BadRequestException(
        'User ID is invalid',
      );
    }

    const title =
      String(
        dto?.title || '',
      ).trim();

    const commitment =
      String(
        dto?.commitment || '',
      ).trim();

    if (!title) {
      throw new BadRequestException(
        'Commitment title is required',
      );
    }

    if (!commitment) {
      throw new BadRequestException(
        'Commitment text is required',
      );
    }

    const ownerId =
      this.assertProjectParticipant(
        project,
        dto?.ownerId,
        'Commitment owner',
      );

    const dueAt =
      new Date(dto.dueAt);

    if (
      Number.isNaN(
        dueAt.getTime(),
      )
    ) {
      throw new BadRequestException(
        'Commitment due date is invalid',
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
          ? CommitmentSourceType.MOVE
          : CommitmentSourceType.PROJECT
      );

    if (
      sourceType ===
        CommitmentSourceType.MOVE &&
      !sourceMoveId
    ) {
      throw new BadRequestException(
        'A Move source requires a linked Move',
      );
    }

    if (
      sourceType !==
        CommitmentSourceType.MOVE &&
      sourceMoveId
    ) {
      throw new BadRequestException(
        'A linked Move requires source type "move"',
      );
    }

    await this
      .assertMoveBelongsToProject(
        projectId,
        sourceMoveId,
      );

    return this.commitmentModel
      .create({
        projectId:
          new Types.ObjectId(
            projectId,
          ),

        title,
        commitment,

        ownerId:
          new Types.ObjectId(
            ownerId,
          ),

        dueAt,

        status:
          CommitmentStatus.ACTIVE,

        fulfilledAt: null,
        cancelledAt: null,

        createdBy:
          new Types.ObjectId(
            userId,
          ),

        sourceType,

        sourceMoveId:
          sourceMoveId
            ? new Types.ObjectId(
                sourceMoveId,
              )
            : null,
      });
  }

  async update(
    projectId: string,
    commitmentId: string,
    userId: string,
    dto: UpdateCommitmentDto,
  ) {
    const project =
      await this.assertProjectAccess(
        projectId,
        userId,
      );

    if (
      !Types.ObjectId.isValid(
        commitmentId,
      )
    ) {
      throw new BadRequestException(
        'Commitment ID is invalid',
      );
    }

    const item =
      await this.commitmentModel
        .findOne({
          _id:
            new Types.ObjectId(
              commitmentId,
            ),
          projectId:
            new Types.ObjectId(
              projectId,
            ),
        });

    if (!item) {
      throw new NotFoundException(
        'Commitment not found',
      );
    }

    if (
      dto.title !== undefined
    ) {
      const title =
        String(
          dto.title,
        ).trim();

      if (!title) {
        throw new BadRequestException(
          'Commitment title is required',
        );
      }

      item.title = title;
    }

    if (
      dto.commitment !==
      undefined
    ) {
      const commitment =
        String(
          dto.commitment,
        ).trim();

      if (!commitment) {
        throw new BadRequestException(
          'Commitment text is required',
        );
      }

      item.commitment =
        commitment;
    }

    if (
      dto.ownerId !== undefined
    ) {
      const ownerId =
        this.assertProjectParticipant(
          project,
          dto.ownerId,
          'Commitment owner',
        );

      item.ownerId =
        new Types.ObjectId(
          ownerId,
        );
    }

    if (
      dto.dueAt !== undefined
    ) {
      const dueAt =
        new Date(dto.dueAt);

      if (
        Number.isNaN(
          dueAt.getTime(),
        )
      ) {
        throw new BadRequestException(
          'Commitment due date is invalid',
        );
      }

      item.dueAt = dueAt;
    }

    if (
      dto.status !== undefined &&
      dto.status !== item.status
    ) {
      if (
        dto.status ===
        CommitmentStatus.ACTIVE
      ) {
        item.status =
          CommitmentStatus.ACTIVE;

        item.fulfilledAt = null;
        item.cancelledAt = null;
      }

      if (
        dto.status ===
        CommitmentStatus.FULFILLED
      ) {
        item.status =
          CommitmentStatus.FULFILLED;

        item.fulfilledAt =
          new Date();

        item.cancelledAt = null;
      }

      if (
        dto.status ===
        CommitmentStatus.CANCELLED
      ) {
        item.status =
          CommitmentStatus.CANCELLED;

        item.cancelledAt =
          new Date();

        item.fulfilledAt = null;
      }
    }

    return item.save();
  }
}
