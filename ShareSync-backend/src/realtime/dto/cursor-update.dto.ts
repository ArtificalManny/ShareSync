/**
 * cursor-update.dto.ts
 * Data Transfer Objects for cursor operations
 */

import { IsString, IsNumber, IsEnum, IsOptional, IsArray, IsBoolean, Min, Max, IsUrl, Matches, ValidateNested, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CursorActivity {
  IDLE = 'idle',
  TYPING = 'typing',
  CLICKING = 'clicking',
  DRAGGING = 'dragging',
  SCROLLING = 'scrolling',
}

export class ViewportDto {
  @ApiProperty({ example: 1920 })
  @IsNumber()
  @Min(0)
  width: number;

  @ApiProperty({ example: 1080 })
  @IsNumber()
  @Min(0)
  height: number;
}

export class CursorCustomizationDto {
  @ApiPropertyOptional({ example: 1.2 })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(3)
  size?: number;

  @ApiPropertyOptional({ example: 'circle' })
  @IsOptional()
  @IsString()
  shape?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  trail?: boolean;

  @ApiPropertyOptional({ example: ['sparkle', 'glow'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  effects?: string[];
}

export class CursorUpdateDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/)
  userId: string;

  @ApiProperty({ example: 'Alice' })
  @IsString()
  userName: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/)
  projectId: string;

  @ApiPropertyOptional({ example: 'room-123' })
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiProperty({ example: 45.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  x: number;

  @ApiProperty({ example: 67.8 })
  @IsNumber()
  @Min(0)
  @Max(100)
  y: number;

  @ApiPropertyOptional({ enum: CursorActivity, example: CursorActivity.TYPING })
  @IsOptional()
  @IsEnum(CursorActivity)
  activity?: CursorActivity;

  @ApiPropertyOptional({ example: 'button.submit' })
  @IsOptional()
  @IsString()
  targetElement?: string;

  @ApiPropertyOptional({ example: 'Click me' })
  @IsOptional()
  @IsString()
  targetText?: string;

  @ApiPropertyOptional({ example: '#8B5CF6' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  color?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => CursorCustomizationDto)
  customization?: CursorCustomizationDto;

  @ApiPropertyOptional({ example: 'https://example.com/page' })
  @IsOptional()
  @IsUrl()
  pageUrl?: string;

  @ApiPropertyOptional({ example: 'Dashboard' })
  @IsOptional()
  @IsString()
  pageTitle?: string;

  @ApiPropertyOptional({ example: 'session-123' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => ViewportDto)
  viewport?: ViewportDto;

  @ApiPropertyOptional({ example: 'move' })
  @IsOptional()
  @IsString()
  eventType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class BatchCursorUpdateDto {
  @ApiProperty({ type: [CursorUpdateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CursorUpdateDto)
  cursors: CursorUpdateDto[];
}

export class CursorQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  endTime?: string;

  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  skip?: number;
}

export class CursorEventDto {
  @ApiProperty({ example: 'cursor:move' })
  @IsString()
  event: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => CursorUpdateDto)
  data: CursorUpdateDto;

  @ApiProperty()
  @IsISO8601()
  timestamp: string;
}

export class CursorFlashDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsString()
  projectId: string;

  @ApiProperty()
  @IsNumber()
  x: number;

  @ApiProperty()
  @IsNumber()
  y: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;
}

export class CursorSyncDto {
  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @ApiProperty()
  @IsString()
  projectId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CursorResponseDto {
  @ApiProperty()
  @IsBoolean()
  success: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  data?: any;

  @ApiPropertyOptional()
  @IsOptional()
  error?: any;
}

export class CursorStatsDto {
  @ApiProperty()
  @IsNumber()
  totalMovements: number;

  @ApiProperty()
  @IsNumber()
  activeUsers: number;

  @ApiProperty()
  activityBreakdown: Record<string, number>;

  @ApiProperty()
  @IsNumber()
  averageMovementsPerUser: number;

  @ApiPropertyOptional()
  @IsOptional()
  peakActivityTime?: string;
}