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
  CreateDecisionDto,
} from './dto/create-decision.dto';

import {
  UpdateDecisionDto,
} from './dto/update-decision.dto';

import {
  Decision,
  DecisionDocument,
  DecisionSourceType,
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
  ) {}

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

    return created;
  }

  async update(
    projectId: string,
    decisionId: string,
    userId: string,
    dto: UpdateDecisionDto,
  ) {
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

    return item.save();
  }
}
