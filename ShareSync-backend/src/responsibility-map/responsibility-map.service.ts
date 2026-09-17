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
  ProjectsService,
} from '../projects/projects.service';

import {
  CreateResponsibilityDto,
} from './dto/create-responsibility.dto';

import {
  UpdateResponsibilityDto,
} from './dto/update-responsibility.dto';

import {
  Responsibility,
  ResponsibilityCriticality,
  ResponsibilityDocument,
  ResponsibilityStatus,
} from './schemas/responsibility.schema';

@Injectable()
export class ResponsibilityMapService {
  constructor(
    @InjectModel(
      Responsibility.name,
    )
    private readonly responsibilityModel:
      Model<ResponsibilityDocument>,

    private readonly projectsService:
      ProjectsService,
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
    if (
      value === null ||
      value === undefined
    ) {
      return '';
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number'
    ) {
      return String(value).trim();
    }

    // openshare-responsibility-map-objectid-normalization-v1
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

  private getProjectOwnerIds(
    project: any,
  ): Set<string> {
    const ids =
      new Set<string>();

    [
      project?.ownerId,
      project?.owner,
      project?.createdById,
      project?.createdBy,
    ].forEach(
      (value) => {
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
      },
    );

    return ids;
  }

  private async assertParticipantAccess(
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
      throw new ForbiddenException(
        'Project participant access required',
      );
    }

    const project =
      await this.projectsService
        .findByIdWithAccess(
          projectId,
          userId,
        );

    const participantIds =
      this.getProjectParticipantIds(
        project,
      );

    if (
      !participantIds.has(userId)
    ) {
      throw new ForbiddenException(
        'Responsibility Map is available to project participants only',
      );
    }

    return project;
  }

  private normalizeAssignedParticipant(
    project: any,
    candidate: any,
    label: string,
  ): string | null {
    if (
      candidate === null ||
      candidate === undefined ||
      candidate === ''
    ) {
      return null;
    }

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

  private validateOwnershipPair(
    ownerId: string | null,
    backupOwnerId: string | null,
  ) {
    if (
      !ownerId &&
      backupOwnerId
    ) {
      throw new BadRequestException(
        'A backup owner cannot be assigned without a primary owner',
      );
    }

    if (
      ownerId &&
      backupOwnerId &&
      ownerId === backupOwnerId
    ) {
      throw new BadRequestException(
        'Primary owner and backup owner must be different people',
      );
    }
  }

  private present(
    item: any,
  ) {
    const raw =
      typeof item?.toObject ===
      'function'
        ? item.toObject()
        : item;

    const ownerId =
      this.normalizeProjectUserId(
        raw?.ownerId,
      );

    const backupOwnerId =
      this.normalizeProjectUserId(
        raw?.backupOwnerId,
      );

    const coverageState =
      !ownerId
        ? 'unowned'
        : !backupOwnerId
          ? 'fragile'
          : 'covered';

    return {
      ...raw,
      coverageState,
      highExposure:
        raw?.criticality ===
          ResponsibilityCriticality.HIGH &&
        coverageState !== 'covered',
    };
  }

  private async findRecord(
    projectId: string,
    responsibilityId: string,
  ) {
    if (
      !Types.ObjectId.isValid(
        responsibilityId,
      )
    ) {
      throw new BadRequestException(
        'Responsibility ID is invalid',
      );
    }

    const item =
      await this.responsibilityModel
        .findOne({
          _id:
            new Types.ObjectId(
              responsibilityId,
            ),
          projectId:
            new Types.ObjectId(
              projectId,
            ),
        })
        .exec();

    if (!item) {
      throw new NotFoundException(
        'Responsibility not found',
      );
    }

    return item;
  }

  async findByProject(
    projectId: string,
    userId: string,
  ) {
    await this.assertParticipantAccess(
      projectId,
      userId,
    );

    const items =
      await this.responsibilityModel
        .find({
          projectId:
            new Types.ObjectId(
              projectId,
            ),
        })
        .sort({
          status: 1,
          createdAt: -1,
        })
        .lean()
        .exec();

    return items.map(
      (item) =>
        this.present(item),
    );
  }

  async findOne(
    projectId: string,
    responsibilityId: string,
    userId: string,
  ) {
    await this.assertParticipantAccess(
      projectId,
      userId,
    );

    const item =
      await this.findRecord(
        projectId,
        responsibilityId,
      );

    return this.present(item);
  }

  async create(
    projectId: string,
    userId: string,
    dto: CreateResponsibilityDto,
  ) {
    const project =
      await this.assertParticipantAccess(
        projectId,
        userId,
      );

    const title =
      this.cleanText(
        dto?.title,
      );

    if (!title) {
      throw new BadRequestException(
        'Responsibility title is required',
      );
    }

    const ownerId =
      this.normalizeAssignedParticipant(
        project,
        dto?.ownerId,
        'Primary owner',
      );

    const backupOwnerId =
      this.normalizeAssignedParticipant(
        project,
        dto?.backupOwnerId,
        'Backup owner',
      );

    this.validateOwnershipPair(
      ownerId,
      backupOwnerId,
    );

    const item =
      await this.responsibilityModel
        .create({
          projectId:
            new Types.ObjectId(
              projectId,
            ),

          title,

          description:
            this.cleanText(
              dto?.description,
            ),

          category:
            this.cleanText(
              dto?.category,
            ),

          criticality:
            dto?.criticality ||
            ResponsibilityCriticality.MEDIUM,

          ownerId:
            ownerId
              ? new Types.ObjectId(
                  ownerId,
                )
              : null,

          backupOwnerId:
            backupOwnerId
              ? new Types.ObjectId(
                  backupOwnerId,
                )
              : null,

          status:
            ResponsibilityStatus.ACTIVE,

          createdBy:
            new Types.ObjectId(
              userId,
            ),

          archivedBy: null,
          archivedAt: null,
        });

    return this.present(item);
  }

  async update(
    projectId: string,
    responsibilityId: string,
    userId: string,
    dto: UpdateResponsibilityDto,
  ) {
    const project =
      await this.assertParticipantAccess(
        projectId,
        userId,
      );

    const item =
      await this.findRecord(
        projectId,
        responsibilityId,
      );

    const createdBy =
      this.normalizeProjectUserId(
        item?.createdBy,
      );

    const currentOwnerId =
      this.normalizeProjectUserId(
        item?.ownerId,
      );

    const isManager =
      createdBy === userId ||
      this.getProjectOwnerIds(
        project,
      ).has(userId);

    const isAssignedOwner =
      currentOwnerId === userId;

    if (
      !isManager &&
      !isAssignedOwner
    ) {
      throw new ForbiddenException(
        'Only the responsibility creator, project owner, or assigned owner can update this responsibility',
      );
    }

    const changesOwnershipOrStatus =
      dto?.ownerId !== undefined ||
      dto?.backupOwnerId !== undefined ||
      dto?.status !== undefined;

    if (
      changesOwnershipOrStatus &&
      !isManager
    ) {
      throw new ForbiddenException(
        'Only the responsibility creator or project owner can reassign or archive this responsibility',
      );
    }

    if (
      dto?.title !== undefined
    ) {
      const title =
        this.cleanText(
          dto.title,
        );

      if (!title) {
        throw new BadRequestException(
          'Responsibility title is required',
        );
      }

      item.title = title;
    }

    if (
      dto?.description !== undefined
    ) {
      item.description =
        this.cleanText(
          dto.description,
        );
    }

    if (
      dto?.category !== undefined
    ) {
      item.category =
        this.cleanText(
          dto.category,
        );
    }

    if (
      dto?.criticality !== undefined
    ) {
      item.criticality =
        dto.criticality;
    }

    let nextOwnerId =
      currentOwnerId || null;

    let nextBackupOwnerId =
      this.normalizeProjectUserId(
        item?.backupOwnerId,
      ) || null;

    if (
      dto?.ownerId !== undefined
    ) {
      nextOwnerId =
        this.normalizeAssignedParticipant(
          project,
          dto.ownerId,
          'Primary owner',
        );

      if (
        !nextOwnerId &&
        dto?.backupOwnerId ===
          undefined
      ) {
        nextBackupOwnerId =
          null;
      }
    }

    if (
      dto?.backupOwnerId !==
      undefined
    ) {
      nextBackupOwnerId =
        this.normalizeAssignedParticipant(
          project,
          dto.backupOwnerId,
          'Backup owner',
        );
    }

    this.validateOwnershipPair(
      nextOwnerId,
      nextBackupOwnerId,
    );

    if (
      dto?.ownerId !== undefined
    ) {
      item.ownerId =
        nextOwnerId
          ? new Types.ObjectId(
              nextOwnerId,
            )
          : null;
    }

    if (
      dto?.backupOwnerId !==
        undefined ||
      (
        dto?.ownerId !== undefined &&
        !nextOwnerId
      )
    ) {
      item.backupOwnerId =
        nextBackupOwnerId
          ? new Types.ObjectId(
              nextBackupOwnerId,
            )
          : null;
    }

    if (
      dto?.status !== undefined
    ) {
      item.status =
        dto.status;

      if (
        dto.status ===
        ResponsibilityStatus.ARCHIVED
      ) {
        item.archivedBy =
          new Types.ObjectId(
            userId,
          );

        item.archivedAt =
          new Date();
      } else {
        item.archivedBy = null;
        item.archivedAt = null;
      }
    }

    const saved =
      await item.save();

    return this.present(saved);
  }
}
