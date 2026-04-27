#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")
TARGET = ROOT / "src/sprints/sprints.service.ts"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")

SERVICE_FILE = r'''// src/sprints/sprints.service.ts
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
  ) {}

  async create(dto: CreateSprintDto, userId: string): Promise<any> {
    const projectObjectId = toObjectId(dto.projectId, 'projectId');
    const createdByObjectId = toObjectId(userId, 'userId');

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

    const taskIds = Array.isArray(dto.taskIds)
      ? dto.taskIds.map((taskId) => toObjectId(taskId, 'taskId'))
      : [];

    const teamMembers = Array.isArray(dto.teamMembers)
      ? dto.teamMembers.map((memberId) => toObjectId(memberId, 'teamMemberId'))
      : [];

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

  async findCurrentForProject(projectId: string): Promise<any> {
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

  async findActiveForProject(projectId: string): Promise<any> {
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

  async findAllForProject(projectId: string): Promise<any[]> {
    const projectObjectId = toObjectId(projectId, 'projectId');

    const sprints = await this.sprintModel
      .find({ projectId: projectObjectId })
      .sort({ sprintNumber: -1, startDate: -1 });

    return sprints.map((sprint) => serializeSprint(sprint));
  }

  async findById(sprintId: string): Promise<any> {
    const sprintObjectId = toObjectId(sprintId, 'sprintId');

    const sprint = await this.sprintModel.findById(sprintObjectId);

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    return serializeSprint(sprint);
  }

  async update(sprintId: string, dto: UpdateSprintDto): Promise<any> {
    const sprintObjectId = toObjectId(sprintId, 'sprintId');

    const sprint = await this.sprintModel.findById(sprintObjectId);

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
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

    if (Array.isArray(dto.taskIds)) {
      sprint.taskIds = dto.taskIds.map((taskId) =>
        toObjectId(taskId, 'taskId'),
      ) as any;
      sprint.metrics = {
        ...(sprint.metrics as any),
        plannedTasks: sprint.taskIds.length,
      } as any;
    }

    if (Array.isArray(dto.teamMembers)) {
      sprint.teamMembers = dto.teamMembers.map((memberId) =>
        toObjectId(memberId, 'teamMemberId'),
      ) as any;
    }

    if (Number.isFinite(Number(dto.capacityHours))) {
      sprint.capacityHours = Number(dto.capacityHours);
    }

    await sprint.save();

    return serializeSprint(sprint);
  }

  async complete(sprintId: string): Promise<any> {
    const sprintObjectId = toObjectId(sprintId, 'sprintId');

    const sprint = await this.sprintModel.findById(sprintObjectId);

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    sprint.status = SprintStatus.COMPLETED;
    sprint.actualEndDate = new Date();

    await sprint.save();

    return serializeSprint(sprint);
  }

  async cancel(sprintId: string): Promise<any> {
    const sprintObjectId = toObjectId(sprintId, 'sprintId');

    const sprint = await this.sprintModel.findById(sprintObjectId);

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

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
'''

def fail(message: str):
    print(f"\n[write_sprints_service] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[write_sprints_service] starting")

    if not ROOT.exists():
        fail(f"Backend root does not exist: {ROOT}")

    schema_path = ROOT / "src/sprints/schemas/sprint.schema.ts"
    dto_path = ROOT / "src/sprints/dto/create-sprint.dto.ts"

    if not schema_path.exists():
        fail("Missing src/sprints/schemas/sprint.schema.ts. Create the schema first.")

    if not dto_path.exists():
        fail("Missing src/sprints/dto/create-sprint.dto.ts. Create the DTO first.")

    TARGET.parent.mkdir(parents=True, exist_ok=True)

    if TARGET.exists():
        backup_path = TARGET.with_name(f"{TARGET.name}.bak-sprints-service-{STAMP}")
        backup_path.write_text(TARGET.read_text(encoding="utf-8"), encoding="utf-8")
        print(f"[write_sprints_service] backup created: {backup_path}")

    TARGET.write_text(SERVICE_FILE, encoding="utf-8")
    print(f"[write_sprints_service] wrote: {TARGET}")

    written = TARGET.read_text(encoding="utf-8")

    required = [
        "export class SprintsService",
        "@InjectModel(Sprint.name)",
        "async create(dto: CreateSprintDto, userId: string)",
        "async findCurrentForProject(projectId: string)",
        "async findActiveForProject(projectId: string)",
        "async findAllForProject(projectId: string)",
        "async findById(sprintId: string)",
        "async update(sprintId: string, dto: UpdateSprintDto)",
        "async complete(sprintId: string)",
        "async cancel(sprintId: string)",
        "getNextSprintNumberFallback",
    ]

    for marker in required:
        if marker not in written:
            fail(f"Safety check failed. Missing marker: {marker}")

    print("")
    print("[write_sprints_service] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"SprintsService|@InjectModel|findCurrentForProject|findActiveForProject|create\\(|complete\\(|cancel\\(\" src/sprints/sprints.service.ts -C 4")
    print("  git diff -- src/sprints/sprints.service.ts")

if __name__ == "__main__":
    main()
