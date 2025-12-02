/**
 * cursor-update.dto.ts
 * Data Transfer Objects for cursor updates
 * 
 * Validates all cursor-related WebSocket and HTTP requests
 */

import {
    IsString,
    IsNumber,
    IsEnum,
    IsOptional,
    IsObject,
    IsBoolean,
    Min,
    Max,
    Length,
    IsUrl,
    ValidateNested,
    IsArray,
    IsHexColor,
  } from 'class-validator';
  import { Type } from 'class-transformer';
  import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
  
  /**
   * Cursor Activity Enum
   */
  export enum CursorActivity {
    IDLE = 'idle',
    TYPING = 'typing',
    CLICKING = 'clicking',
    DRAGGING = 'dragging',
    SCROLLING = 'scrolling',
  }
  
  /**
   * Viewport DTO
   */
  export class ViewportDto {
    @ApiProperty({ description: 'Viewport width in pixels', minimum: 0 })
    @IsNumber()
    @Min(0)
    width: number;
  
    @ApiProperty({ description: 'Viewport height in pixels', minimum: 0 })
    @IsNumber()
    @Min(0)
    height: number;
  }
  
  /**
   * Cursor Customization DTO
   */
  export class CursorCustomizationDto {
    @ApiPropertyOptional({ description: 'Cursor size multiplier', minimum: 0.5, maximum: 3 })
    @IsOptional()
    @IsNumber()
    @Min(0.5)
    @Max(3)
    size?: number;
  
    @ApiPropertyOptional({ description: 'Cursor shape', example: 'circle' })
    @IsOptional()
    @IsString()
    shape?: string;
  
    @ApiPropertyOptional({ description: 'Enable trail effect' })
    @IsOptional()
    @IsBoolean()
    trail?: boolean;
  
    @ApiPropertyOptional({ description: 'Active effects', type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    effects?: string[];
  }
  
  /**
   * Main Cursor Update DTO
   */
  export class CursorUpdateDto {
    @ApiProperty({ description: 'User ID' })
    @IsString()
    @Length(24, 24) // MongoDB ObjectId length
    userId: string;
  
    @ApiProperty({ description: 'User display name', maxLength: 100 })
    @IsString()
    @Length(1, 100)
    userName: string;
  
    @ApiProperty({ description: 'Project ID' })
    @IsString()
    @Length(24, 24)
    projectId: string;
  
    @ApiPropertyOptional({ description: 'Room ID for specific context' })
    @IsOptional()
    @IsString()
    @Length(1, 100)
    roomId?: string;
  
    // ============================================
    // POSITION
    // ============================================
  
    @ApiProperty({ description: 'X position as viewport percentage', minimum: 0, maximum: 100 })
    @IsNumber()
    @Min(0)
    @Max(100)
    x: number;
  
    @ApiProperty({ description: 'Y position as viewport percentage', minimum: 0, maximum: 100 })
    @IsNumber()
    @Min(0)
    @Max(100)
    y: number;
  
    // ============================================
    // ACTIVITY
    // ============================================
  
    @ApiProperty({ enum: CursorActivity, description: 'Current cursor activity' })
    @IsEnum(CursorActivity)
    activity: CursorActivity;
  
    @ApiPropertyOptional({ description: 'CSS selector of element under cursor', maxLength: 500 })
    @IsOptional()
    @IsString()
    @Length(0, 500)
    targetElement?: string;
  
    @ApiPropertyOptional({ description: 'Text content under cursor', maxLength: 100 })
    @IsOptional()
    @IsString()
    @Length(0, 100)
    targetText?: string;
  
    // ============================================
    // VISUAL
    // ============================================
  
    @ApiProperty({ description: 'Cursor color (hex)', example: '#8B5CF6' })
    @IsHexColor()
    color: string;
  
    @ApiPropertyOptional({ description: 'User avatar URL' })
    @IsOptional()
    @IsUrl()
    @Length(0, 500)
    avatar?: string;
  
    @ApiPropertyOptional({ type: CursorCustomizationDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => CursorCustomizationDto)
    customization?: CursorCustomizationDto;
  
    // ============================================
    // CONTEXT
    // ============================================
  
    @ApiPropertyOptional({ description: 'Current page URL' })
    @IsOptional()
    @IsUrl()
    @Length(0, 500)
    pageUrl?: string;
  
    @ApiPropertyOptional({ description: 'Current page title', maxLength: 200 })
    @IsOptional()
    @IsString()
    @Length(0, 200)
    pageTitle?: string;
  
    @ApiPropertyOptional({ description: 'Session ID' })
    @IsOptional()
    @IsString()
    @Length(1, 100)
    sessionId?: string;
  
    @ApiPropertyOptional({ type: ViewportDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => ViewportDto)
    viewport?: ViewportDto;
  
    // ============================================
    // METADATA
    // ============================================
  
    @ApiPropertyOptional({ description: 'Event type', example: 'move' })
    @IsOptional()
    @IsString()
    eventType?: string;
  
    @ApiPropertyOptional({ description: 'Additional metadata' })
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
  }
  
  /**
   * Batch Cursor Update DTO
   */
  export class BatchCursorUpdateDto {
    @ApiProperty({ type: [CursorUpdateDto], description: 'Array of cursor updates' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CursorUpdateDto)
    cursors: CursorUpdateDto[];
  }
  
  /**
   * Cursor Query DTO (for fetching history)
   */
  export class CursorQueryDto {
    @ApiPropertyOptional({ description: 'Project ID to filter by' })
    @IsOptional()
    @IsString()
    @Length(24, 24)
    projectId?: string;
  
    @ApiPropertyOptional({ description: 'User ID to filter by' })
    @IsOptional()
    @IsString()
    @Length(24, 24)
    userId?: string;
  
    @ApiPropertyOptional({ description: 'Session ID to filter by' })
    @IsOptional()
    @IsString()
    sessionId?: string;
  
    @ApiPropertyOptional({ description: 'Start time (ISO 8601)', example: '2025-01-01T00:00:00Z' })
    @IsOptional()
    @IsString()
    startTime?: string;
  
    @ApiPropertyOptional({ description: 'End time (ISO 8601)', example: '2025-01-01T23:59:59Z' })
    @IsOptional()
    @IsString()
    endTime?: string;
  
    @ApiPropertyOptional({ description: 'Maximum number of results', minimum: 1, maximum: 1000, default: 100 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(1000)
    limit?: number;
  
    @ApiPropertyOptional({ description: 'Number of results to skip', minimum: 0, default: 0 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    skip?: number;
  }
  
  /**
   * Cursor Event DTO (for WebSocket events)
   */
  export class CursorEventDto {
    @ApiProperty({ description: 'Event type', example: 'cursor:move' })
    @IsString()
    @Length(1, 100)
    event: string;
  
    @ApiProperty({ type: CursorUpdateDto, description: 'Cursor data' })
    @ValidateNested()
    @Type(() => CursorUpdateDto)
    data: CursorUpdateDto;
  
    @ApiPropertyOptional({ description: 'Timestamp (ISO 8601)' })
    @IsOptional()
    @IsString()
    timestamp?: string;
  }
  
  /**
   * Cursor Flash Event DTO
   */
  export class CursorFlashDto {
    @ApiProperty({ description: 'User ID' })
    @IsString()
    @Length(24, 24)
    userId: string;
  
    @ApiProperty({ description: 'Project ID' })
    @IsString()
    @Length(24, 24)
    projectId: string;
  
    @ApiProperty({ description: 'X position', minimum: 0, maximum: 100 })
    @IsNumber()
    @Min(0)
    @Max(100)
    x: number;
  
    @ApiProperty({ description: 'Y position', minimum: 0, maximum: 100 })
    @IsNumber()
    @Min(0)
    @Max(100)
    y: number;
  
    @ApiPropertyOptional({ description: 'Flash type', example: 'ship' })
    @IsOptional()
    @IsString()
    type?: string;
  }
  
  /**
   * Cursor Sync Pulse DTO
   */
  export class CursorSyncDto {
    @ApiProperty({ description: 'User IDs that are in sync', type: [String] })
    @IsArray()
    @IsString({ each: true })
    userIds: string[];
  
    @ApiProperty({ description: 'Project ID' })
    @IsString()
    @Length(24, 24)
    projectId: string;
  
    @ApiPropertyOptional({ description: 'Sync reason', example: 'proximity' })
    @IsOptional()
    @IsString()
    reason?: string;
  }
  
  /**
   * Cursor Response DTO
   */
  export class CursorResponseDto {
    @ApiProperty({ description: 'Success status' })
    success: boolean;
  
    @ApiPropertyOptional({ description: 'Message' })
    message?: string;
  
    @ApiPropertyOptional({ description: 'Cursor data' })
    data?: any;
  
    @ApiPropertyOptional({ description: 'Error details' })
    error?: any;
  }
  
  /**
   * Cursor Stats DTO
   */
  export class CursorStatsDto {
    @ApiProperty({ description: 'Total cursor movements' })
    totalMovements: number;
  
    @ApiProperty({ description: 'Active users' })
    activeUsers: number;
  
    @ApiProperty({ description: 'Activity breakdown' })
    activityBreakdown: Record<CursorActivity, number>;
  
    @ApiProperty({ description: 'Average movements per user' })
    averageMovementsPerUser: number;
  
    @ApiPropertyOptional({ description: 'Peak activity time' })
    peakActivityTime?: string;
  }
  
  // ============================================
  // EXPORT ALL DTOs
  // ============================================
  
  export {
    ViewportDto,
    CursorCustomizationDto,
    BatchCursorUpdateDto,
    CursorQueryDto,
    CursorEventDto,
    CursorFlashDto,
    CursorSyncDto,
    CursorResponseDto,
    CursorStatsDto,
  };