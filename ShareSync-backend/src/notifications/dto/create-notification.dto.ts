// src/notifications/dto/create-notification.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// CREATE NOTIFICATION DTO
// Matches Notification schema + NotificationsService.create() expectations
// ═══════════════════════════════════════════════════════════════════════════════

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationChannel, NotificationPriority, NotificationType } from '../schemas/notification.schema';

export class NotificationActionDto {
  @ApiProperty({ description: 'Button label' })
  @IsString()
  @MaxLength(80)
  label: string;

  @ApiProperty({ description: 'Destination URL (frontend route or full URL)' })
  @IsString()
  @IsUrl({ require_tld: false }, { message: 'url must be a valid URL or relative path' })
  @MaxLength(500)
  url: string;

  @ApiPropertyOptional({ description: 'Optional action type (e.g. primary, secondary)' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  type?: string;
}

export class CreateNotificationDto {
  @ApiProperty({ description: 'Recipient user id' })
  @IsMongoId()
  userId: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: 'Notification body' })
  @IsString()
  @MaxLength(1000)
  body: string;

  @ApiPropertyOptional({ description: 'Optional icon (emoji or icon name)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @ApiPropertyOptional({ description: 'Optional image URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @ApiPropertyOptional({ enum: NotificationPriority, default: NotificationPriority.NORMAL })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional({
    enum: NotificationChannel,
    isArray: true,
    default: [NotificationChannel.IN_APP],
    description: 'Channels to deliver through (in-app, email, push, sms)',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels?: NotificationChannel[];

  @ApiPropertyOptional({ description: 'User id that triggered the notification' })
  @IsOptional()
  @IsMongoId()
  triggeredBy?: string;

  @ApiPropertyOptional({
    description:
      'Arbitrary metadata used by the UI. May include projectId, taskId, etc. Service safely converts known ids to ObjectId.',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({ type: [NotificationActionDto], description: 'Action buttons' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationActionDto)
  actions?: NotificationActionDto[];

  @ApiPropertyOptional({
    description:
      'Group key used to collapse similar notifications (e.g. xp-<userId>-<date>). Service supports incrementing groupCount.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  groupKey?: string;

  // ✅ Phase 4 (optional): digest tracking.
  // This field is used in NotificationsService.create() but may not exist in schema.
  // Leaving it optional is safe; Mongoose ignores unknown fields unless strict is set to throw.
  @ApiPropertyOptional({ description: 'Optional digest timestamp (Phase 4)' })
  @IsOptional()
  digestedAt?: Date;
}
