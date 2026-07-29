// src/tasks/dto/update-task.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE TASK DTO
// ═══════════════════════════════════════════════════════════════════════════════

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsMongoId,
  IsNumber,
  IsDate,
  IsBoolean,
  IsNotEmpty,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  TaskStatus,
  TaskPriority,
  TaskType,
  CeremonyTier,
} from '../schemas/task.schema';

export class UpdateTaskDto {
  @ApiPropertyOptional({ maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional({ maxLength: 10000 })
  @IsString()
  @IsOptional()
  @MaxLength(10000)
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ enum: TaskType })
  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  assigneeId?: string | null;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  sprintId?: string | null;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  milestoneId?: string | null;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dueDate?: Date | null;

  @ApiPropertyOptional({ minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedHours?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isBlocking?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  blockedBy?: string[];

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  stackOrder?: number;

  @ApiPropertyOptional({ enum: CeremonyTier })
  @IsEnum(CeremonyTier)
  @IsOptional()
  ceremonyTier?: CeremonyTier;
}

export class WatchTaskDto {
  @ApiPropertyOptional({
    description: 'Whether the current user follows this Move',
  })
  @IsBoolean()
  following: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  comments?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  statusChanges?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  assignmentChanges?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  dueDateChanges?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  completion?: boolean;
}

export class MoveTaskDto {
  @ApiPropertyOptional({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  sprintId?: string | null;
}

export class CompleteTaskDto {
  @ApiPropertyOptional({ description: 'Actual hours spent' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  actualHours?: number;

  @ApiPropertyOptional({ description: 'Completion notes' })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  notes?: string;
}

export class AddCommentDto {
  @ApiPropertyOptional({ description: 'Comment content', maxLength: 5000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({ description: 'Mentioned user IDs', type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  mentions?: string[];
}

export class AddAttachmentDto {
  @ApiPropertyOptional({
    description: 'Stored upload identifier',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  fileId: string;

  @ApiPropertyOptional({
    description: 'Original file name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  fileName: string;

  @ApiPropertyOptional({
    description: 'Stored file URL',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  fileUrl: string;

  @ApiPropertyOptional({
    description: 'MIME type',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  fileType?: string;

  @ApiPropertyOptional({
    description: 'File size in bytes',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  fileSize?: number;
}

export class LogTimeDto {
  @ApiPropertyOptional({ description: 'Minutes spent', minimum: 1 })
  @IsNumber()
  @Min(1)
  minutes: number;

  @ApiPropertyOptional({ description: 'Work description' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;
}
