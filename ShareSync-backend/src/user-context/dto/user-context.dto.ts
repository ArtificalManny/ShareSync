// src/user-context/dto/user-context.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// USER CONTEXT DTOs
// Fixed version - proper class-based DTOs for Swagger compatibility
// ═══════════════════════════════════════════════════════════════════════════════

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsMongoId,
  IsBoolean,
  IsNumber,
  IsArray,
  IsObject,
  ValidateNested,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class WorkspaceStateDto {
  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  openTabs?: string[];

  @ApiPropertyOptional({ type: Object })
  @IsObject()
  @IsOptional()
  scrollPositions?: Record<string, number>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  activePanel?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  sidebarExpanded?: boolean;
}

export class UnfinishedActionDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  action: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  context: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  taskId?: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  priority?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class SaveContextDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  currentView?: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  currentProjectId?: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  currentTaskId?: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  currentSprintId?: string;

  @ApiPropertyOptional({ type: WorkspaceStateDto })
  @ValidateNested()
  @Type(() => WorkspaceStateDto)
  @IsOptional()
  workspaceState?: WorkspaceStateDto;
}

export class UpdateContextDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  currentView?: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  currentProjectId?: string | null;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  currentTaskId?: string | null;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  currentSprintId?: string | null;

  @ApiPropertyOptional({ type: WorkspaceStateDto })
  @ValidateNested()
  @Type(() => WorkspaceStateDto)
  @IsOptional()
  workspaceState?: WorkspaceStateDto;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  densityPreference?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  soundEnabled?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  celebrationsEnabled?: boolean;
}

export class AddUnfinishedActionDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  action: string;

  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MaxLength(500)
  context: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  taskId?: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 10, default: 0 })
  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  priority?: number;
}

export class CompleteActionDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  action: string;
}

export class StartFocusSessionDto {
  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  taskId?: string;
}

export class EndFocusSessionDto {
  @ApiPropertyOptional({ minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  tasksCompleted?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  xpEarned?: number;
}

export class UpdateCollaboratorDto {
  @ApiProperty()
  @IsMongoId()
  userId: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE DTOs (Classes for Swagger)
// ═══════════════════════════════════════════════════════════════════════════════

export class ContextSummaryResponseDto {
  @ApiProperty()
  hasUnfinishedWork: boolean;

  @ApiProperty()
  unfinishedActionsCount: number;

  @ApiProperty({ type: [UnfinishedActionDto] })
  unfinishedActions: UnfinishedActionDto[];

  @ApiPropertyOptional()
  currentView?: string;

  @ApiPropertyOptional()
  currentProjectId?: string;

  @ApiPropertyOptional()
  currentProjectName?: string;

  @ApiPropertyOptional()
  currentTaskId?: string;

  @ApiPropertyOptional()
  currentTaskTitle?: string;

  @ApiProperty()
  isInFocusMode: boolean;

  @ApiProperty()
  totalFocusMinutesToday: number;

  @ApiProperty()
  sessionDurationMinutes: number;

  @ApiProperty()
  lastActiveAt: Date;
}

export class UserContextResponseDto {
  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  currentView?: string;

  @ApiPropertyOptional()
  currentProjectId?: string;

  @ApiPropertyOptional()
  currentTaskId?: string;

  @ApiPropertyOptional()
  currentSprintId?: string;

  @ApiProperty({ type: [UnfinishedActionDto] })
  unfinishedActions: UnfinishedActionDto[];

  @ApiProperty()
  isInFocusMode: boolean;

  @ApiProperty()
  totalFocusMinutesToday: number;

  @ApiProperty()
  densityPreference: string;

  @ApiProperty()
  soundEnabled: boolean;

  @ApiProperty()
  celebrationsEnabled: boolean;

  @ApiProperty()
  lastActiveAt: Date;

  @ApiProperty()
  sessionDuration: number;
}
