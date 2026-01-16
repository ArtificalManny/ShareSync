import { 
  IsString, 
  IsOptional, 
  IsBoolean, 
  IsNumber, 
  IsEnum, 
  IsArray, 
  IsDate,
  IsMongoId,
  ValidateNested,
  ArrayMaxSize,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ViewType, ActionPriority } from '../schemas/user-context.schema';

// ============================================
// BASE DTOs
// ============================================

export class DeviceInfoDto {
  @IsString()
  platform: string;

  @IsString()
  browser: string;

  @IsString()
  version: string;
}

export class OpenTabDto {
  @IsString()
  @MaxLength(500)
  route: string;

  @IsString()
  @MaxLength(200)
  label: string;

  @IsOptional()
  @IsNumber()
  scrollPosition?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  timestamp?: Date;
}

// ============================================
// REQUEST DTOs
// ============================================

export class SaveContextDto {
  @IsOptional()
  @IsEnum(ViewType)
  lastActiveView?: ViewType;

  @IsOptional()
  @IsMongoId()
  lastActiveProjectId?: string;

  @IsOptional()
  @IsMongoId()
  lastActiveTaskId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  lastActiveRoute?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lastScrollPosition?: number;

  @IsOptional()
  @IsBoolean()
  sidebarOpen?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpenTabDto)
  @ArrayMaxSize(10)
  openTabs?: OpenTabDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  deviceInfo?: DeviceInfoDto;
}

export class UpdateContextDto extends PartialType(SaveContextDto) {}

export class AddUnfinishedActionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  action: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  context: string;

  @IsOptional()
  @IsMongoId()
  contextId?: string;

  @IsOptional()
  @IsEnum(ActionPriority)
  priority?: ActionPriority;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(480)
  estimatedCompletion?: number;
}

export class CompleteActionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  action: string;
}

export class StartFocusSessionDto {
  @IsOptional()
  @IsMongoId()
  taskId?: string;

  @IsOptional()
  @IsMongoId()
  projectId?: string;

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(480)
  plannedDuration?: number;
}

export class EndFocusSessionDto {
  @IsBoolean()
  completed: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  interruptions?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateCollaboratorDto {
  @IsMongoId()
  collaboratorUserId: string;

  @IsString()
  @IsEnum(['message', 'task-assignment', 'comment', 'mention'])
  interactionType: 'message' | 'task-assignment' | 'comment' | 'mention';

  @IsOptional()
  @IsMongoId()
  projectId?: string;
}

export class UpdateWorkspaceStateDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpenTabDto)
  @ArrayMaxSize(10)
  openTabs?: OpenTabDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  lastScrollPosition?: number;

  @IsOptional()
  @IsBoolean()
  sidebarOpen?: boolean;
}

// ============================================
// RESPONSE DTOs (Simple types, no decorators)
// ============================================

export interface ContextSummaryResponseDto {
  showWelcomeBack: boolean;
  timeSinceLastActive: number;
  timeSinceLastActiveFormatted: string;
  lastView: ViewType;
  lastProject: any;
  lastTask: any;
  wasInFocus: boolean;
  currentFocusSession: any;
  topUnfinishedActions: any[];
  recentCollaborators: any[];
  hasUnfinishedWork: boolean;
}
