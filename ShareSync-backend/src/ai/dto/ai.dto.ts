// src/ai/dto/ai.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// AI SUGGESTION DTOs
// ═══════════════════════════════════════════════════════════════════════════════

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsMongoId,
  IsNumber,
  IsEnum,
  IsArray,
  Min,
  Max,
} from 'class-validator';

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

export enum SuggestionType {
  TASK_PRIORITY = 'task_priority',
  TASK_ASSIGNMENT = 'task_assignment',
  SCHEDULE_OPTIMIZATION = 'schedule_optimization',
  WORKLOAD_BALANCE = 'workload_balance',
  RISK_DETECTION = 'risk_detection',
  PROCESS_IMPROVEMENT = 'process_improvement',
  DEADLINE_PREDICTION = 'deadline_prediction',
}

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class GetSuggestionsDto {
  @ApiPropertyOptional({ enum: SuggestionType })
  @IsEnum(SuggestionType)
  @IsOptional()
  type?: SuggestionType;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  @IsOptional()
  limit?: number;
}

export class AnalyzeTaskDto {
  @ApiProperty()
  @IsMongoId()
  taskId: string;
}

export class SmartScheduleDto {
  @ApiProperty()
  @IsMongoId()
  projectId: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  sprintId?: string;
}

export class WorkloadAnalysisDto {
  @ApiProperty()
  @IsMongoId()
  projectId: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  userIds?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class SuggestionDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: SuggestionType })
  type: SuggestionType;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  confidence: number; // 0-100

  @ApiProperty()
  impact: 'low' | 'medium' | 'high';

  @ApiProperty()
  actionable: boolean;

  @ApiPropertyOptional()
  action?: {
    type: string;
    data: any;
  };

  @ApiPropertyOptional()
  reasoning?: string;

  @ApiProperty()
  createdAt: Date;
}

export class TaskAnalysisDto {
  @ApiProperty()
  taskId: string;

  @ApiProperty()
  suggestedPriority: string;

  @ApiProperty()
  priorityConfidence: number;

  @ApiProperty()
  suggestedAssignee?: {
    userId: string;
    name: string;
    reason: string;
  };

  @ApiProperty()
  estimatedDuration: {
    hours: number;
    confidence: number;
  };

  @ApiProperty()
  riskFactors: string[];

  @ApiProperty()
  dependencies: string[];

  @ApiProperty()
  similarTasks: {
    taskId: string;
    title: string;
    similarity: number;
  }[];
}

export class WorkloadSummaryDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  userName: string;

  @ApiProperty()
  currentLoad: number; // 0-100

  @ApiProperty()
  loadStatus: 'underutilized' | 'balanced' | 'overloaded';

  @ApiProperty()
  activeTasks: number;

  @ApiProperty()
  upcomingDeadlines: number;

  @ApiProperty()
  recommendations: string[];
}

export class ScheduleRecommendationDto {
  @ApiProperty()
  taskId: string;

  @ApiProperty()
  taskTitle: string;

  @ApiProperty()
  suggestedStart: Date;

  @ApiProperty()
  suggestedEnd: Date;

  @ApiProperty()
  suggestedAssignee: string;

  @ApiProperty()
  reason: string;
}
