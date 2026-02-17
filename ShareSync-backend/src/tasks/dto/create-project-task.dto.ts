// src/tasks/dto/create-project-task.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// CREATE PROJECT TASK DTO
// Same as CreateTaskDto but WITHOUT projectId (projectId comes from URL param)
// ═══════════════════════════════════════════════════════════════════════════════

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsMongoId,
  IsNumber,
  IsDate,
  IsBoolean,
  MaxLength,
  MinLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TaskStatus, TaskPriority, TaskType } from '../schemas/task.schema';

export class CreateProjectTaskDto {
  @ApiProperty({
    description: 'Task title',
    example: 'Implement user authentication',
    minLength: 1,
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(500)
  title: string;

  @ApiPropertyOptional({
    description: 'Task description (markdown supported)',
    maxLength: 10000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(10000)
  description?: string;

  @ApiPropertyOptional({
    enum: TaskStatus,
    default: TaskStatus.BACKLOG,
  })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({
    enum: TaskType,
    default: TaskType.TASK,
  })
  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

  @ApiPropertyOptional({
    description: 'Assignee user ID',
  })
  @IsMongoId()
  @IsOptional()
  assigneeId?: string;

  @ApiPropertyOptional({
    description: 'Parent task ID (for subtasks)',
  })
  @IsMongoId()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Sprint ID',
  })
  @IsMongoId()
  @IsOptional()
  sprintId?: string;

  @ApiPropertyOptional({
    description: 'Milestone ID',
  })
  @IsMongoId()
  @IsOptional()
  milestoneId?: string;

  @ApiPropertyOptional({
    description: 'Due date',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dueDate?: Date;

  @ApiPropertyOptional({
    description: 'Estimated hours',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedHours?: number;

  @ApiPropertyOptional({
    description: 'Tags',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Is this task blocking others?',
  })
  @IsBoolean()
  @IsOptional()
  isBlocking?: boolean;

  @ApiPropertyOptional({
    description: 'Task IDs that this task depends on',
    type: [String],
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  blockedBy?: string[];
}
