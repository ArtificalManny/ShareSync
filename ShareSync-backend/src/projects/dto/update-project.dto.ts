// src/projects/dto/update-project.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE PROJECT DTO (safe extension)
// - Adds optional goals patch payload
// - Keeps existing fields unchanged to avoid breaking current clients
// - Adds project member preference patch DTO for /projects/:id/preferences
// ═══════════════════════════════════════════════════════════════════════════════

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  MaxLength,
  MinLength,
  Matches,
  IsBoolean,
  ValidateNested,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectStatus, ProjectVisibility } from '../schemas/project.schema';

export class UpdateProjectSettingsDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  notificationsEnabled?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  allowMemberInvites?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  requireTaskApproval?: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(7)
  @Max(30)
  @IsOptional()
  defaultSprintDuration?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  taskStatuses?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  taskPriorities?: string[];
}

export class UpdateProjectPreferencesDto {
  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  taskAssigned?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  taskCompleted?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  announcements?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  mentions?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  deadlines?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  weeklyDigest?: boolean;
}

export class UpdateProjectGoalDto {
  @ApiPropertyOptional({ example: 'Ship MVP v1' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Deliver core flows + polish UI' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '2026-03-01T00:00:00.000Z' })
  @IsOptional()
  targetDate?: Date;

  @ApiPropertyOptional({ example: 0, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;

  @ApiPropertyOptional({ enum: ['normal', 'at_risk', 'achieved'], default: 'normal' })
  @IsString()
  @IsOptional()
  status?: 'normal' | 'at_risk' | 'achieved';
}

export class UpdateProjectDto {
  @ApiPropertyOptional({
    description: 'Project name',
    example: 'ShareSync MVP v2',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Project description',
    maxLength: 2000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Project icon (emoji)',
    example: '🚀',
  })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Project emoji (preferred)',
    example: '🚀',
  })
  @IsString()
  @IsOptional()
  emoji?: string;

  @ApiPropertyOptional({
    description: 'Project logo/profile image URL. Relative upload URLs are allowed.',
    example: '/uploads/project-branding-1710000000000-ab12cd34.png',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'Project banner image URL. Relative upload URLs are allowed.',
    example: '/uploads/project-branding-1710000000000-ab12cd34.png',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  bannerUrl?: string;

  @ApiPropertyOptional({
    description: 'Project color (hex)',
    example: '#7C3AED',
  })
  @IsString()
  @IsOptional()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Color must be a valid hex color code',
  })
  color?: string;

  @ApiPropertyOptional({
    enum: ProjectStatus,
  })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiPropertyOptional({
    enum: ProjectVisibility,
  })
  @IsEnum(ProjectVisibility)
  @IsOptional()
  visibility?: ProjectVisibility;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isStarred?: boolean;

  @ApiPropertyOptional({ type: UpdateProjectSettingsDto })
  @ValidateNested()
  @Type(() => UpdateProjectSettingsDto)
  @IsOptional()
  settings?: UpdateProjectSettingsDto;

  // ✅ Optional: allow overwriting goals array (simple + safe)
  @ApiPropertyOptional({ type: [UpdateProjectGoalDto] })
  @ValidateNested({ each: true })
  @Type(() => UpdateProjectGoalDto)
  @IsOptional()
  goals?: UpdateProjectGoalDto[];
}
