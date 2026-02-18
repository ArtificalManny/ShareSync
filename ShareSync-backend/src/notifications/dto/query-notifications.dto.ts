// src/notifications/dto/query-notifications.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// QUERY NOTIFICATIONS DTO
// Keeps limit/offset as strings to match existing service parsing logic.
// ═══════════════════════════════════════════════════════════════════════════════

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { NotificationType } from '../schemas/notification.schema';

export class NotificationQueryDto {
  @ApiPropertyOptional({ description: 'If true, only return unread notifications', default: false })
  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean;

  @ApiPropertyOptional({ enum: NotificationType, description: 'Filter by type' })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({
    description: 'Max results to return (string, parsed in service)',
    default: '50',
    example: '50',
  })
  @IsOptional()
  @IsString()
  @MaxLength(6)
  limit?: string;

  @ApiPropertyOptional({
    description: 'Offset for pagination (string, parsed in service)',
    default: '0',
    example: '0',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  offset?: string;
}
