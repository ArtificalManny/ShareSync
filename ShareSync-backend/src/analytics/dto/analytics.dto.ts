// src/analytics/dto/analytics.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS DTOs
// ═══════════════════════════════════════════════════════════════════════════════

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsDate,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventType } from '../schemas/event-log.schema';

// ═══════════════════════════════════════════════════════════════════════════════
// QUERY DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class DateRangeDto {
  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endDate?: Date;
}

export class AnalyticsQueryDto extends DateRangeDto {
  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  granularity?: 'day' | 'week' | 'month';
}

export class EventQueryDto extends DateRangeDto {
  @ApiPropertyOptional({ enum: EventType })
  @IsEnum(EventType)
  @IsOptional()
  type?: EventType;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  @IsOptional()
  limit?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class IntelligenceDto {
  @ApiProperty()
  @IsString()
  peakWindowStart: string;

  @ApiProperty()
  @IsString()
  peakWindowEnd: string;

  @ApiProperty()
  @IsNumber()
  productivity: number;

  @ApiProperty()
  @IsNumber()
  coWorkingMultiplier: number;

  @ApiProperty()
  @IsBoolean()
  isCoWorking: boolean;
}

export class ProductivityMetricsDto {
  @ApiProperty()
  tasksCompleted: number;

  @ApiProperty()
  tasksCreated: number;

  @ApiProperty()
  completionRate: number;

  @ApiProperty()
  avgCompletionTime: number; // hours

  @ApiProperty()
  pointsCompleted: number;

  @ApiProperty()
  xpEarned: number;

  @ApiProperty()
  focusMinutes: number;

  @ApiProperty()
  streakDays: number;
  
  @ApiProperty()
  efficiency?: number; // 📈 ADDED: New field for the Home page
}

export class VelocityDataPointDto {
  @ApiProperty()
  date: Date;

  @ApiProperty()
  planned: number;

  @ApiProperty()
  completed: number;

  @ApiProperty()
  sprintName?: string;
}

export class TeamProductivityDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  tasksCompleted: number;

  @ApiProperty()
  pointsCompleted: number;

  @ApiProperty()
  xpEarned: number;

  @ApiProperty()
  avgCompletionTime: number;
}

export class ProjectHealthDto {
  @ApiProperty()
  projectId: string;

  @ApiProperty()
  healthScore: number; // 0-100

  @ApiProperty()
  velocity: number;

  @ApiProperty()
  velocityTrend: 'improving' | 'stable' | 'declining';

  @ApiProperty()
  blockerCount: number;

  @ApiProperty()
  overdueCount: number;

  @ApiProperty()
  teamMorale: number; // From sprint retrospectives

  @ApiProperty()
  completionForecast: Date;

  @ApiProperty()
  risks: string[];
}

export class DashboardMetricsDto {
  @ApiProperty()
  overview: {
    totalTasks: number;
    completedTasks: number;
    inProgress: number;
    overdue: number;
    completionRate: number;
  };

  @ApiProperty()
  productivity: ProductivityMetricsDto;

  @ApiProperty()
  velocity: VelocityDataPointDto[];

  @ApiProperty()
  teamLeaderboard: TeamProductivityDto[];

  @ApiProperty()
  recentActivity: any[];
}

export class ForecastDto {
  @ApiProperty()
  projectId: string;

  @ApiProperty()
  currentVelocity: number;

  @ApiProperty()
  remainingPoints: number;

  @ApiProperty()
  estimatedCompletionDate: Date;

  @ApiProperty()
  confidence: 'low' | 'medium' | 'high';

  @ApiProperty()
  scenarios: {
    optimistic: Date;
    realistic: Date;
    pessimistic: Date;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📈 NEW PROFILE ANALYTICS DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class GrowthTrendDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  value: number;
}

export class ProfileAnalyticsDto {
  @ApiProperty()
  qualityScore: number;

  @ApiProperty()
  collaborationScore: number;

  @ApiProperty()
  trendVector: string;

  @ApiProperty({ type: [GrowthTrendDto] })
  growthTrends: GrowthTrendDto[];
}
