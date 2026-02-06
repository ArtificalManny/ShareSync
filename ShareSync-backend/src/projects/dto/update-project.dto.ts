// src/projects/dto/update-project.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE PROJECT DTO
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
}
