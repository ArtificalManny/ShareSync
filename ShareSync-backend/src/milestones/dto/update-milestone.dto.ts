// src/milestones/dto/update-milestone.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE MILESTONE DTO
// - Partial updates for milestone fields
// - Includes status/progress fields used by service auto-status logic
// ═══════════════════════════════════════════════════════════════════════════════

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsDateString,
  IsHexColor,
  IsArray,
  IsMongoId,
  IsInt,
  Min,
  Max,
  IsIn,
} from 'class-validator';

export class UpdateMilestoneDto {
  @ApiPropertyOptional({ description: 'Updated title' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiPropertyOptional({ description: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Updated target date (ISO string)' })
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiPropertyOptional({
    description: 'Manual status override (service may still auto-adjust based on progress)',
    enum: ['planned', 'in_progress', 'completed', 'at_risk'],
  })
  @IsOptional()
  @IsIn(['planned', 'in_progress', 'completed', 'at_risk'])
  status?: string;

  @ApiPropertyOptional({ description: 'Progress percent 0-100' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;

  @ApiPropertyOptional({
    description: 'Color hex for UI (e.g. #8B5CF6)',
  })
  @IsOptional()
  @IsHexColor()
  color?: string;

  @ApiPropertyOptional({
    description: 'Replace the linked task IDs list',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  taskIds?: string[];

  @ApiPropertyOptional({
    description: 'Replace dependencies list',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  dependsOn?: string[];

  @ApiPropertyOptional({
    description: 'Replace blockers list',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  blockedBy?: string[];

  @ApiPropertyOptional({
    description: 'Set completedAt (ISO string) — usually set automatically when progress hits 100',
  })
  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @ApiPropertyOptional({
    description: 'Override totalTasks (usually derived from taskIds length)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalTasks?: number;

  @ApiPropertyOptional({
    description: 'Override completedTasks (used by recalculateProgress)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  completedTasks?: number;
}
