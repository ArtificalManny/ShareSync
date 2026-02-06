// src/reports/dto/report.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// REPORT DTOs
// ═══════════════════════════════════════════════════════════════════════════════

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsMongoId,
  IsDate,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

export enum ReportType {
  PROJECT_SUMMARY = 'project_summary',
  SPRINT_REPORT = 'sprint_report',
  TEAM_PRODUCTIVITY = 'team_productivity',
  INDIVIDUAL_PERFORMANCE = 'individual_performance',
  BURNDOWN = 'burndown',
  VELOCITY = 'velocity',
  TIME_TRACKING = 'time_tracking',
  CUSTOM = 'custom',
}

export enum ExportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json',
}

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class GenerateReportDto {
  @ApiProperty({ enum: ReportType })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  sprintId?: string;

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

  @ApiPropertyOptional({ enum: ExportFormat })
  @IsEnum(ExportFormat)
  @IsOptional()
  format?: ExportFormat;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  userIds?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;
}

export class ExportDataDto {
  @ApiProperty({ enum: ExportFormat })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiProperty()
  @IsMongoId()
  projectId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dataType?: 'tasks' | 'users' | 'sprints' | 'all';

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

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class ReportMetadataDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ReportType })
  type: ReportType;

  @ApiProperty()
  title: string;

  @ApiProperty()
  generatedAt: Date;

  @ApiProperty()
  generatedBy: string;

  @ApiProperty()
  projectName?: string;

  @ApiProperty()
  sprintName?: string;

  @ApiProperty()
  dateRange: {
    start: Date;
    end: Date;
  };
}

export class ExportResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  downloadUrl: string;

  @ApiProperty()
  expiresAt: Date;
}
