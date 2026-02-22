// src/projects/dto/create-project.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// CREATE PROJECT DTO (schema-aligned + backwards compatible)
// - Accepts emoji (preferred) OR icon (legacy). Service will normalize.
// - Accepts privacy (frontend) OR visibility (preferred). Service will normalize.
// - Keeps current fields intact to avoid breaking frontend.
// ═══════════════════════════════════════════════════════════════════════════════

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  MaxLength,
  MinLength,
  Matches,
  ValidateNested,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectVisibility } from '../schemas/project.schema';

// ═══════════════════════════════════════════════════════════════════════════════
// NESTED DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class CreateProjectSettingsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  defaultView?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  enableGamification?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  enableAI?: boolean;

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

  // ✅ ADDED: Support for isPublic/isListed from frontend
  @ApiPropertyOptional({ description: 'Whether project is publicly viewable' })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Whether project appears in Discover/search' })
  @IsBoolean()
  @IsOptional()
  isListed?: boolean;
}

export class CreateProjectGoalDto {
  @ApiProperty({ example: 'Ship MVP v1' })
  @IsString()
  @IsNotEmpty()
  title: string;

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

// ✅ ADDED: Member invite DTO for initial project creation
export class CreateProjectMemberDto {
  @ApiProperty({ description: 'Email address of member to invite' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ description: 'Role for the member', default: 'Member' })
  @IsString()
  @IsOptional()
  role?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class CreateProjectDto {
  // ─────────────────────────────────────────────────────────────────────────────
  // REQUIRED FIELDS
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiProperty({
    description: 'Project name',
    example: 'ShareSync MVP',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  // ─────────────────────────────────────────────────────────────────────────────
  // OPTIONAL FIELDS - CORE
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Project description',
    example: 'Building the best project management tool',
    maxLength: 2000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  // ✅ ADDED: Legacy "title" field (frontend sends both name and title)
  @ApiPropertyOptional({
    description: 'Legacy title field (alias for name)',
    example: 'ShareSync MVP',
  })
  @IsString()
  @IsOptional()
  title?: string;

  // ✅ ADDED: Category field from frontend
  @ApiPropertyOptional({
    description: 'Project category',
    example: 'SaaS',
  })
  @IsString()
  @IsOptional()
  category?: string;

  // ✅ ADDED: Status field from frontend (initial status)
  @ApiPropertyOptional({
    description: 'Initial project status',
    example: 'In Progress',
  })
  @IsString()
  @IsOptional()
  status?: string;

  // ─────────────────────────────────────────────────────────────────────────────
  // OPTIONAL FIELDS - VISUAL
  // ─────────────────────────────────────────────────────────────────────────────

  // Preferred field (schema)
  @ApiPropertyOptional({
    description: 'Project emoji (preferred)',
    example: '🚀',
    default: '📁',
  })
  @IsString()
  @IsOptional()
  emoji?: string;

  // Legacy field (frontend/backward compatibility)
  @ApiPropertyOptional({
    description: 'Legacy project icon (emoji string)',
    example: '🚀',
    default: '📁',
  })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Project color (hex)',
    example: '#7C3AED',
    default: '#7C3AED',
  })
  @IsString()
  @IsOptional()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Color must be a valid hex color code',
  })
  color?: string;

  // ─────────────────────────────────────────────────────────────────────────────
  // OPTIONAL FIELDS - VISIBILITY / PRIVACY
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Project visibility (preferred)',
    enum: ProjectVisibility,
    default: ProjectVisibility.PRIVATE,
  })
  @IsEnum(ProjectVisibility)
  @IsOptional()
  visibility?: ProjectVisibility;

  // ✅ ADDED: "privacy" alias (frontend sends this instead of visibility)
  @ApiPropertyOptional({
    description: 'Project privacy (legacy alias for visibility)',
    example: 'Private',
  })
  @IsString()
  @IsOptional()
  privacy?: string;

  // ✅ ADDED: Direct isPublic flag from frontend
  @ApiPropertyOptional({
    description: 'Whether project is publicly viewable',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  // ─────────────────────────────────────────────────────────────────────────────
  // OPTIONAL FIELDS - ORGANIZATION
  // ─────────────────────────────────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Project tags',
    example: ['startup', 'saas'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ type: CreateProjectSettingsDto })
  @ValidateNested()
  @Type(() => CreateProjectSettingsDto)
  @IsOptional()
  settings?: CreateProjectSettingsDto;

  @ApiPropertyOptional({ type: [CreateProjectGoalDto] })
  @ValidateNested({ each: true })
  @Type(() => CreateProjectGoalDto)
  @IsOptional()
  goals?: CreateProjectGoalDto[];

  // ✅ ADDED: Initial members to invite on project creation
  @ApiPropertyOptional({ 
    type: [CreateProjectMemberDto],
    description: 'Members to invite on project creation'
  })
  @ValidateNested({ each: true })
  @Type(() => CreateProjectMemberDto)
  @IsOptional()
  members?: CreateProjectMemberDto[];
}
