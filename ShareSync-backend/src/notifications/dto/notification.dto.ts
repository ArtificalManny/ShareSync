// src/notifications/dto/notification.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION DTOs
// ═══════════════════════════════════════════════════════════════════════════════

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsMongoId,
  IsBoolean,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
} from '../schemas/notification.schema';

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class NotificationActionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  type?: string;
}

export class NotificationDataDto {
  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  projectName?: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  taskId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  taskTitle?: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  conversationId?: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  messageId?: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  sprintId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sprintName?: string;
}

export class CreateNotificationDto {
  @ApiProperty()
  @IsMongoId()
  userId: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  body: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ enum: NotificationPriority })
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @ApiPropertyOptional({ enum: NotificationChannel, isArray: true })
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  @IsOptional()
  channels?: NotificationChannel[];

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  triggeredBy?: string;

  @ApiPropertyOptional({ type: NotificationDataDto })
  @ValidateNested()
  @Type(() => NotificationDataDto)
  @IsOptional()
  data?: NotificationDataDto;

  @ApiPropertyOptional({ type: [NotificationActionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationActionDto)
  @IsOptional()
  actions?: NotificationActionDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  groupKey?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUERY DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class NotificationQueryDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  unreadOnly?: boolean;

  @ApiPropertyOptional({ enum: NotificationType })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  limit?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  offset?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER PREFERENCES DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class NotificationPreferencesDto {
  @ApiPropertyOptional({ description: 'Enable in-app notifications' })
  @IsBoolean()
  @IsOptional()
  inAppEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable email notifications' })
  @IsBoolean()
  @IsOptional()
  emailEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable push notifications' })
  @IsBoolean()
  @IsOptional()
  pushEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Email digest frequency', enum: ['off', 'instant', 'daily', 'weekly'] })
  @IsString()
  @IsOptional()
  emailDigest?: 'off' | 'instant' | 'daily' | 'weekly';

  @ApiPropertyOptional({ description: 'Quiet hours start time (HH:mm)' })
  @IsString()
  @IsOptional()
  quietHoursStart?: string;

  @ApiPropertyOptional({ description: 'Quiet hours end time (HH:mm)' })
  @IsString()
  @IsOptional()
  quietHoursEnd?: string;

  @ApiPropertyOptional({ description: 'Enable quiet hours' })
  @IsBoolean()
  @IsOptional()
  quietHoursEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Notification types to mute', type: [String] })
  @IsArray()
  @IsEnum(NotificationType, { each: true })
  @IsOptional()
  mutedTypes?: NotificationType[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  @ApiPropertyOptional()
  icon?: string;

  @ApiProperty({ enum: NotificationPriority })
  priority: NotificationPriority;

  @ApiPropertyOptional()
  triggeredBy?: any;

  @ApiPropertyOptional()
  data?: any;

  @ApiProperty()
  isRead: boolean;

  @ApiProperty()
  createdAt: Date;
}

export class NotificationCountResponseDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  unread: number;

  @ApiProperty()
  byType: Record<string, number>;
}
