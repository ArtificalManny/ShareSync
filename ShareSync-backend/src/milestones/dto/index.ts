// src/milestones/dto/index.ts
import { IsString, IsOptional, IsDate, IsNumber, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMilestoneDto {
  @ApiProperty({ description: 'Project ID' })
  @IsString()
  projectId: string;

  @ApiProperty({ description: 'Milestone title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Milestone description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Target completion date' })
  @Type(() => Date)
  @IsDate()
  targetDate: Date;

  @ApiPropertyOptional({ description: 'Color for the milestone' })
  @IsOptional()
  @IsString()
  color?: string;
}

export class UpdateMilestoneDto {
  @ApiPropertyOptional({ description: 'Milestone title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Milestone description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Target completion date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  targetDate?: Date;

  @ApiPropertyOptional({ description: 'Progress percentage (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;

  @ApiPropertyOptional({ description: 'Milestone status' })
  @IsOptional()
  @IsString()
  status?: 'planned' | 'in_progress' | 'completed' | 'at_risk';

  @ApiPropertyOptional({ description: 'Color for the milestone' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Milestones this depends on' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dependsOn?: string[];

  @ApiPropertyOptional({ description: 'Milestones blocking this one' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blockedBy?: string[];
}

export class LinkTaskDto {
  @ApiProperty({ description: 'Task ID to link' })
  @IsString()
  taskId: string;
}
