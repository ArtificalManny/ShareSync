// src/tasks/dto/task.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// TASK DTO: Base Task Representation for Swagger and Validation
// ═══════════════════════════════════════════════════════════════════════════════

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsMongoId, IsDate, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { TaskStatus, TaskPriority } from '../schemas/task.schema';

export class TaskDto {
  @ApiProperty()
  @IsMongoId()
  _id: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @ApiProperty({ enum: TaskPriority })
  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @ApiProperty()
  @IsMongoId()
  projectId: string;

  @ApiProperty()
  @IsMongoId()
  reporterId: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  assigneeId?: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  sprintId?: string;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dueDate?: Date;

  @ApiProperty()
  @IsBoolean()
  isBlocking: boolean;

  @ApiProperty()
  @IsNumber()
  xpValue: number;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  completedAt?: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  createdAt: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  updatedAt: Date;
}
