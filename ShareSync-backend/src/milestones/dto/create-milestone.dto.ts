// src/milestones/dto/create-milestone.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// CREATE MILESTONE DTO
// - Validates payload for creating a milestone
// - Keeps changes additive and compatible with current service/controller
// ═══════════════════════════════════════════════════════════════════════════════

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsMongoId,
  IsDateString,
  IsHexColor,
  IsArray,
} from 'class-validator';

export class CreateMilestoneDto {
  @ApiProperty({ description: 'Project ID (Mongo ObjectId)' })
  @IsMongoId()
  projectId: string;

  @ApiProperty({ description: 'Milestone title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Optional milestone description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Target date (ISO string)' })
  @IsDateString()
  targetDate: string;

  @ApiPropertyOptional({
    description: 'Optional color hex for UI (e.g. #8B5CF6)',
    default: '#8B5CF6',
  })
  @IsOptional()
  @IsHexColor()
  color?: string;

  @ApiPropertyOptional({
    description: 'Optional task IDs to pre-link to this milestone',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  taskIds?: string[];

  @ApiPropertyOptional({
    description: 'Optional dependencies (milestone IDs that must be done first)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  dependsOn?: string[];

  @ApiPropertyOptional({
    description: 'Optional blockers (milestone IDs blocking this milestone)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  blockedBy?: string[];
}
