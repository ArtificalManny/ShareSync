// src/sprints/dto/sprint.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// SPRINT DTOs
// ═══════════════════════════════════════════════════════════════════════════════

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsMongoId,
  IsDate,
  IsNumber,
  MaxLength,
  Min,
  Max,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SprintStatus } from '../schemas/sprint.schema';

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE/UPDATE DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class SprintGoalDto {
  @ApiProperty({ maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isAchieved?: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;
}

export class CreateSprintDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty()
  @IsMongoId()
  projectId: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @ApiPropertyOptional({ type: [SprintGoalDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SprintGoalDto)
  @IsOptional()
  goals?: SprintGoalDto[];

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  capacityHours?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  teamMembers?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  taskIds?: string[];

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  description?: string;
}

export class UpdateSprintDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endDate?: Date;

  @ApiPropertyOptional({ type: [SprintGoalDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SprintGoalDto)
  @IsOptional()
  goals?: SprintGoalDto[];

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  capacityHours?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  teamMembers?: string[];

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  description?: string;
}

export class AddTasksToSprintDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  taskIds: string[];
}

export class RemoveTaskFromSprintDto {
  @ApiProperty()
  @IsMongoId()
  taskId: string;
}

export class UpdateGoalProgressDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  goalIndex: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RETROSPECTIVE DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class SprintRetrospectiveDto {
  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  wentWell?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  needsImprovement?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  actionItems?: string[];

  @ApiPropertyOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  teamMorale?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUERY DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class SprintQueryDto {
  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ enum: SprintStatus })
  @IsEnum(SprintStatus)
  @IsOptional()
  status?: SprintStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  limit?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  offset?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class SprintResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  sprintNumber: number;

  @ApiProperty()
  projectId: string;

  @ApiProperty({ enum: SprintStatus })
  status: SprintStatus;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  progress: number;

  @ApiProperty()
  daysRemaining: number;

  @ApiProperty()
  taskCount: number;

  @ApiProperty()
  metrics: any;
}

export class BurndownResponseDto {
  @ApiProperty()
  sprintId: string;

  @ApiProperty()
  sprintName: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  totalPoints: number;

  @ApiProperty()
  idealBurndown: { date: Date; points: number }[];

  @ApiProperty()
  actualBurndown: { date: Date; points: number }[];

  @ApiProperty()
  projectedCompletion?: Date;
}

export class VelocityResponseDto {
  @ApiProperty()
  projectId: string;

  @ApiProperty()
  averageVelocity: number;

  @ApiProperty()
  sprintVelocities: { sprintId: string; sprintName: string; velocity: number }[];

  @ApiProperty()
  trend: 'improving' | 'stable' | 'declining';
}
