#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import sys

ROOT = Path("/Users/realmannyrivas/Documents/ShareSync/ShareSync-backend")
TARGET = ROOT / "src/sprints/dto/create-sprint.dto.ts"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")

DTO_FILE = r'''// src/sprints/dto/create-sprint.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// CREATE / UPDATE SPRINT DTOs
// Validation layer for Sprint creation and updates.
//
// Safe first-pass purpose:
// - Accept the ProjectHome "Start Your First Sprint" payload.
// - Keep projectId required for POST /api/sprints.
// - Support both `name` and `title` so the frontend/backend can evolve safely.
// - Keep optional advanced fields available without forcing frontend complexity.
// ═══════════════════════════════════════════════════════════════════════════════

import {
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { SprintStatus } from '../schemas/sprint.schema';

export class CreateSprintGoalDto {
  @ApiPropertyOptional({
    description: 'Short goal title for the sprint',
    example: 'Ship the onboarding flow',
  })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @ApiPropertyOptional({
    description: 'Longer sprint goal description',
    example: 'Complete the first usable version of onboarding and verify it with a test user.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Goal status',
    example: 'active',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;

  @ApiPropertyOptional({
    description: 'Goal progress percentage',
    example: 0,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;
}

export class CreateSprintDto {
  @ApiProperty({
    description: 'Project ID this sprint belongs to',
    example: '69d07c75d874337f5de10f13',
  })
  @IsMongoId()
  projectId: string;

  @ApiPropertyOptional({
    description: 'Sprint name. Preferred backend field.',
    example: 'Sprint 1',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    description: 'Sprint title. Frontend compatibility alias for name.',
    example: 'Sprint 1',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({
    description: 'Plain-English sprint goal. Converted into a goal item if goals are omitted.',
    example: 'Build momentum on this project',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  goal?: string;

  @ApiPropertyOptional({
    description: 'Optional sprint description',
    example: 'A two-week execution cycle focused on shipping the first usable workflow.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    description: 'Sprint start date',
    example: '2026-04-26',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Sprint end date',
    example: '2026-05-10',
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    description: 'Sprint status',
    enum: SprintStatus,
    example: SprintStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(SprintStatus)
  status?: SprintStatus;

  @ApiPropertyOptional({
    description: 'Sprint goals',
    type: [CreateSprintGoalDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSprintGoalDto)
  goals?: CreateSprintGoalDto[];

  @ApiPropertyOptional({
    description: 'Task IDs included in the sprint',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  taskIds?: string[];

  @ApiPropertyOptional({
    description: 'Team member IDs participating in the sprint',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  teamMembers?: string[];

  @ApiPropertyOptional({
    description: 'Estimated team capacity in hours',
    example: 40,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  capacityHours?: number;
}

export class UpdateSprintDto extends PartialType(CreateSprintDto) {}
'''

def fail(message: str):
    print(f"\n[write_create_sprint_dto] ERROR: {message}\n", file=sys.stderr)
    sys.exit(1)

def main():
    print("[write_create_sprint_dto] starting")

    if not ROOT.exists():
        fail(f"Backend root does not exist: {ROOT}")

    schema_path = ROOT / "src/sprints/schemas/sprint.schema.ts"
    if not schema_path.exists():
        fail("Missing sprint schema. Create src/sprints/schemas/sprint.schema.ts before writing the DTO.")

    TARGET.parent.mkdir(parents=True, exist_ok=True)

    if TARGET.exists():
        backup_path = TARGET.with_name(f"{TARGET.name}.bak-create-sprint-dto-{STAMP}")
        backup_path.write_text(TARGET.read_text(encoding="utf-8"), encoding="utf-8")
        print(f"[write_create_sprint_dto] backup created: {backup_path}")

    TARGET.write_text(DTO_FILE, encoding="utf-8")
    print(f"[write_create_sprint_dto] wrote: {TARGET}")

    written = TARGET.read_text(encoding="utf-8")

    required = [
        "export class CreateSprintGoalDto",
        "export class CreateSprintDto",
        "export class UpdateSprintDto",
        "projectId: string;",
        "name?: string;",
        "title?: string;",
        "goal?: string;",
        "startDate: string;",
        "endDate: string;",
        "status?: SprintStatus;",
        "goals?: CreateSprintGoalDto[];",
        "taskIds?: string[];",
        "teamMembers?: string[];",
        "capacityHours?: number;",
    ]

    for marker in required:
        if marker not in written:
            fail(f"Safety check failed. Missing marker: {marker}")

    print("")
    print("[write_create_sprint_dto] done")
    print("")
    print("Next checks:")
    print("  npm run build")
    print("  rg -n \"CreateSprintDto|UpdateSprintDto|CreateSprintGoalDto|projectId|SprintStatus|PartialType\" src/sprints/dto/create-sprint.dto.ts -C 4")
    print("  git diff -- src/sprints/dto/create-sprint.dto.ts")

if __name__ == "__main__":
    main()
