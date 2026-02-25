// src/user-context/dto/user-context.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsMongoId, IsBoolean, IsNumber, IsArray, IsObject, ValidateNested, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class WorkspaceStateDto {
  @ApiPropertyOptional({ type: [String] }) @IsArray() @IsString({ each: true }) @IsOptional() openTabs?: string[];
  @ApiPropertyOptional({ type: Object }) @IsObject() @IsOptional() scrollPositions?: Record<string, number>;
  @ApiPropertyOptional() @IsString() @IsOptional() activePanel?: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() sidebarExpanded?: boolean;
}

export class UnfinishedActionDto {
  @ApiProperty() @IsString() @MaxLength(100) action: string;
  @ApiProperty() @IsString() @MaxLength(500) context: string;
  @ApiPropertyOptional() @IsMongoId() @IsOptional() taskId?: string;
  @ApiPropertyOptional() @IsMongoId() @IsOptional() projectId?: string;
  @ApiPropertyOptional({ minimum: 0, maximum: 10 }) @IsNumber() @Min(0) @Max(10) @IsOptional() priority?: number;
}

export class SaveContextDto {
  @ApiPropertyOptional() @IsString() @IsOptional() currentView?: string;
  @ApiPropertyOptional() @IsMongoId() @IsOptional() currentProjectId?: string;
  @ApiPropertyOptional() @IsMongoId() @IsOptional() currentTaskId?: string;
  @ApiPropertyOptional() @IsMongoId() @IsOptional() currentSprintId?: string;
  @ApiPropertyOptional({ type: WorkspaceStateDto }) @ValidateNested() @Type(() => WorkspaceStateDto) @IsOptional() workspaceState?: WorkspaceStateDto;
  
  // ✅ Added fields to fix the 400 Bad Request validation errors
  @ApiPropertyOptional() @IsString() @IsOptional() lastActiveView?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() lastActiveRoute?: string;
  @ApiPropertyOptional() @IsNumber() @IsOptional() lastScrollPosition?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() sessionDuration?: number;
  @ApiPropertyOptional() @IsObject() @IsOptional() deviceInfo?: any;
}

export class UpdateContextDto extends SaveContextDto {
  @ApiPropertyOptional() @IsString() @IsOptional() densityPreference?: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() soundEnabled?: boolean;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() celebrationsEnabled?: boolean;
}

export class AddUnfinishedActionDto {
  @ApiProperty({ maxLength: 100 }) @IsString() @MaxLength(100) action: string;
  @ApiProperty({ maxLength: 500 }) @IsString() @MaxLength(500) context: string;
  @ApiPropertyOptional() @IsMongoId() @IsOptional() taskId?: string;
  @ApiPropertyOptional() @IsMongoId() @IsOptional() projectId?: string;
  @ApiPropertyOptional({ minimum: 0, maximum: 10, default: 0 }) @IsNumber() @Min(0) @Max(10) @IsOptional() priority?: number;
}

export class CompleteActionDto {
  @ApiProperty() @IsString() @MaxLength(100) action: string;
}

export class StartFocusSessionDto {
  @ApiPropertyOptional() @IsMongoId() @IsOptional() projectId?: string;
  @ApiPropertyOptional() @IsMongoId() @IsOptional() taskId?: string;
}

export class EndFocusSessionDto {
  @ApiPropertyOptional({ minimum: 0 }) @IsNumber() @Min(0) @IsOptional() tasksCompleted?: number;
  @ApiPropertyOptional({ minimum: 0 }) @IsNumber() @Min(0) @IsOptional() xpEarned?: number;
}

export class UpdateCollaboratorDto {
  @ApiProperty() @IsMongoId() userId: string;
}

export class ContextSummaryResponseDto {
  @ApiProperty() hasUnfinishedWork: boolean;
  @ApiProperty() unfinishedActionsCount: number;
  @ApiProperty({ type: [UnfinishedActionDto] }) unfinishedActions: UnfinishedActionDto[];
  @ApiPropertyOptional() currentView?: string;
  @ApiPropertyOptional() currentProjectId?: string;
  @ApiPropertyOptional() currentProjectName?: string;
  @ApiPropertyOptional() currentTaskId?: string;
  @ApiPropertyOptional() currentTaskTitle?: string;
  @ApiProperty() isInFocusMode: boolean;
  @ApiProperty() totalFocusMinutesToday: number;
  @ApiProperty() sessionDurationMinutes: number;
  @ApiProperty() lastActiveAt: Date;
}

export class UserContextResponseDto {
  @ApiProperty() userId: string;
  @ApiPropertyOptional() currentView?: string;
  @ApiPropertyOptional() currentProjectId?: string;
  @ApiPropertyOptional() currentTaskId?: string;
  @ApiPropertyOptional() currentSprintId?: string;
  @ApiProperty({ type: [UnfinishedActionDto] }) unfinishedActions: UnfinishedActionDto[];
  @ApiProperty() isInFocusMode: boolean;
  @ApiProperty() totalFocusMinutesToday: number;
  @ApiProperty() densityPreference: string;
  @ApiProperty() soundEnabled: boolean;
  @ApiProperty() celebrationsEnabled: boolean;
  @ApiProperty() lastActiveAt: Date;
  @ApiProperty() sessionDuration: number;
}
