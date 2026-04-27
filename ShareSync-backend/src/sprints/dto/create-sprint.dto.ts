// src/sprints/dto/create-sprint.dto.ts
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
