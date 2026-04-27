#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")
TARGET = ROOT / "src/sprints/sprints.controller.ts"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")

CONTROLLER_FILE = r'''// src/sprints/sprints.controller.ts
// ═══════════════════════════════════════════════════════════════════════════════
// SPRINTS CONTROLLER
// REST API for project execution cycles.
//
// Safe first-pass purpose:
// - Expose POST /api/sprints for the ProjectHome "Start Your First Sprint" flow.
// - Expose current/active sprint reads for Project Overview.
// - Only call methods that exist in SprintsService.
// - Avoid broad backend behavior until the base sprint lifecycle compiles.
// ═══════════════════════════════════════════════════════════════════════════════

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SprintsService } from './sprints.service';
import { CreateSprintDto, UpdateSprintDto } from './dto/create-sprint.dto';

function getUserIdFromRequest(req: any): string {
  const userId =
    req?.user?.sub ||
    req?.user?.userId ||
    req?.user?.id ||
    req?.user?._id;

  if (!userId) {
    throw new UnauthorizedException('Missing authenticated user');
  }

  return String(userId);
}

@ApiTags('sprints')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sprints')
export class SprintsController {
  constructor(private readonly sprintsService: SprintsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a sprint' })
  async create(@Body() dto: CreateSprintDto, @Req() req: any) {
    const userId = getUserIdFromRequest(req);
    return this.sprintsService.create(dto, userId);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'List sprints for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async findAllForProject(@Param('projectId') projectId: string) {
    return this.sprintsService.findAllForProject(projectId);
  }

  @Get('project/:projectId/current')
  @ApiOperation({ summary: 'Get the current sprint for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async findCurrentForProject(@Param('projectId') projectId: string) {
    return this.sprintsService.findCurrentForProject(projectId);
  }

  @Get('project/:projectId/active')
  @ApiOperation({ summary: 'Get the active sprint for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async findActiveForProject(@Param('projectId') projectId: string) {
    return this.sprintsService.findActiveForProject(projectId);
  }

  @Get(':sprintId')
  @ApiOperation({ summary: 'Get a sprint by ID' })
  @ApiParam({ name: 'sprintId', description: 'Sprint ID' })
  async findById(@Param('sprintId') sprintId: string) {
    return this.sprintsService.findById(sprintId);
  }

  @Patch(':sprintId')
  @ApiOperation({ summary: 'Update a sprint' })
  @ApiParam({ name: 'sprintId', description: 'Sprint ID' })
  async update(
    @Param('sprintId') sprintId: string,
    @Body() dto: UpdateSprintDto,
  ) {
    return this.sprintsService.update(sprintId, dto);
  }

  @Post(':sprintId/complete')
  @ApiOperation({ summary: 'Complete a sprint' })
  @ApiParam({ name: 'sprintId', description: 'Sprint ID' })
  async complete(@Param('sprintId') sprintId: string) {
    return this.sprintsService.complete(sprintId);
  }

  @Post(':sprintId/cancel')
  @ApiOperation({ summary: 'Cancel a sprint' })
  @ApiParam({ name: 'sprintId', description: 'Sprint ID' })
  async cancel(@Param('sprintId') sprintId: string) {
    return this.sprintsService.cancel(sprintId);
  }
}
'''

def fail(message: str):
    print(f"\n[write_sprints_controller] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[write_sprints_controller] starting")

    if not ROOT.exists():
        fail(f"Backend root does not exist: {ROOT}")

    service_path = ROOT / "src/sprints/sprints.service.ts"
    dto_path = ROOT / "src/sprints/dto/create-sprint.dto.ts"

    if not service_path.exists():
        fail("Missing src/sprints/sprints.service.ts. Create the service first.")

    if not dto_path.exists():
        fail("Missing src/sprints/dto/create-sprint.dto.ts. Create the DTO first.")

    TARGET.parent.mkdir(parents=True, exist_ok=True)

    if TARGET.exists():
        backup_path = TARGET.with_name(f"{TARGET.name}.bak-sprints-controller-{STAMP}")
        backup_path.write_text(TARGET.read_text(encoding="utf-8"), encoding="utf-8")
        print(f"[write_sprints_controller] backup created: {backup_path}")

    TARGET.write_text(CONTROLLER_FILE, encoding="utf-8")
    print(f"[write_sprints_controller] wrote: {TARGET}")

    written = TARGET.read_text(encoding="utf-8")

    required = [
        "export class SprintsController",
        "@Controller('sprints')",
        "async create(@Body() dto: CreateSprintDto, @Req() req: any)",
        "this.sprintsService.create(dto, userId)",
        "async findAllForProject(@Param('projectId') projectId: string)",
        "this.sprintsService.findAllForProject(projectId)",
        "async findCurrentForProject(@Param('projectId') projectId: string)",
        "this.sprintsService.findCurrentForProject(projectId)",
        "async findActiveForProject(@Param('projectId') projectId: string)",
        "this.sprintsService.findActiveForProject(projectId)",
        "async findById(@Param('sprintId') sprintId: string)",
        "this.sprintsService.findById(sprintId)",
        "async update(",
        "this.sprintsService.update(sprintId, dto)",
        "async complete(@Param('sprintId') sprintId: string)",
        "this.sprintsService.complete(sprintId)",
        "async cancel(@Param('sprintId') sprintId: string)",
        "this.sprintsService.cancel(sprintId)",
    ]

    for marker in required:
        if marker not in written:
            fail(f"Safety check failed. Missing marker: {marker}")

    forbidden = [
        "findByProject",
        "findActiveSprint",
        "findCurrentOrUpcoming",
        "getProjectVelocity",
        "getBurndownData",
        "startSprint",
        "moveToReview",
        "completeSprint",
        "cancelSprint",
        "addTasks",
        "removeTask",
        "updateGoalProgress",
        "updateRetrospective",
        "sprintsService.delete",
    ]

    for marker in forbidden:
        if marker in written:
            fail(f"Safety check failed. Forbidden old service call still exists: {marker}")

    print("")
    print("[write_sprints_controller] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"SprintsController|@Controller\\('sprints'\\)|findCurrentForProject|findActiveForProject|findAllForProject|complete\\(|cancel\\(\" src/sprints/sprints.controller.ts -C 4")
    print("  git diff -- src/sprints/sprints.controller.ts")

if __name__ == "__main__":
    main()
